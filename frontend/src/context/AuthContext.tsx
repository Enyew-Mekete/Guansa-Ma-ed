import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AdminAccessRole, AdminUser, OtpChallenge } from '../types';
import { apiRequest, ApiError } from '../utils/api';

interface AuthContextType {
  currentUser: AdminUser | null;
  adminUsers: AdminUser[];
  accessRoles: AdminAccessRole[];
  activeOtpChallenge: OtpChallenge | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  requestLogin: (identifier: string, password: string) => Promise<{ success: boolean; challenge?: OtpChallenge; message?: string }>;
  verifyOtp: (code: string) => Promise<boolean>;
  resendOtp: () => Promise<OtpChallenge | null>;
  cancelOtp: () => void;
  logout: () => void;
  createAdminUser: (data: { name: string; email: string; phone: string; initialPassword: string; otpEnabled: boolean; assignedRoleId?: string }) => Promise<{ success: boolean; message: string }>;
  updateAdminUser: (userId: string, data: { name: string; email: string; phone: string; otpEnabled: boolean; assignedRoleId: string }) => Promise<{ success: boolean; message: string }>;
  activateAdminUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  deleteAdminUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  resetAdminPasswordBySuperAdmin: (targetUserId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  changeOwnPassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<{ success: boolean; message: string }>;
  updateProfilePhoto: (profilePhoto: string) => Promise<{ success: boolean; message: string }>;
  refreshAccessRoles: () => Promise<void>;
  saveAccessRole: (role: Pick<AdminAccessRole, 'name' | 'description' | 'permissions'>, id?: string) => Promise<{ success: boolean; message: string }>;
  deleteAccessRole: (id: string) => Promise<{ success: boolean; message: string }>;
}

interface AuthResponse {
  success: boolean;
  otpRequired?: boolean;
  user?: AdminUser;
  challenge?: OtpChallenge;
}

interface AdminUsersResponse {
  users: AdminUser[];
}

interface AccessRolesResponse {
  roles: AdminAccessRole[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const canLoadAccessData = (user: AdminUser): boolean =>
  user.role === 'SUPER_ADMIN' ||
  Boolean(user.permissions?.includes('userManagement:view') || user.permissions?.includes('roleManagement:view'));

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [accessRoles, setAccessRoles] = useState<AdminAccessRole[]>([]);
  const [activeOtpChallenge, setActiveOtpChallenge] = useState<OtpChallenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminUsers = useCallback(async () => {
    const result = await apiRequest<AdminUsersResponse>('/api/auth/admins');
    setAdminUsers(result.users);
  }, []);

  const refreshAccessRoles = useCallback(async () => {
    const result = await apiRequest<AccessRolesResponse>('/api/auth/roles');
    setAccessRoles(result.roles);
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiRequest<{ user: AdminUser }>('/api/auth/me')
      .then(async ({ user }) => {
        if (!isMounted) return;
        setCurrentUser(user);
        if (!user.mustChangePassword && canLoadAccessData(user)) {
          const [result, roleResult] = await Promise.all([
            apiRequest<AdminUsersResponse>('/api/auth/admins'),
            apiRequest<AccessRolesResponse>('/api/auth/roles'),
          ]);
          if (isMounted) {
            setAdminUsers(result.users);
            setAccessRoles(roleResult.roles);
          }
        } else if (isMounted) {
          setAdminUsers([]);
          setAccessRoles([]);
        }
      })
      .catch((requestError: unknown) => {
        if (!(requestError instanceof ApiError && requestError.status === 401)) {
          console.error('[Authentication] Unable to restore the admin session.', requestError);
          if (isMounted) setError(requestError instanceof Error ? requestError.message : 'Unable to restore the admin session.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  const clearError = () => setError(null);

  const requestLogin: AuthContextType['requestLogin'] = async (identifier, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await apiRequest<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });
      if (result.otpRequired && result.challenge) {
        setActiveOtpChallenge(result.challenge);
        return { success: true, challenge: result.challenge };
      }
      if (!result.user) throw new Error('The login service returned no authenticated account.');
      setCurrentUser(result.user);
      setActiveOtpChallenge(null);
      if (!result.user.mustChangePassword && canLoadAccessData(result.user)) {
        await Promise.all([loadAdminUsers(), refreshAccessRoles()]);
      } else {
        setAdminUsers([]);
        setAccessRoles([]);
      }
      return { success: true };
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Unable to sign in.';
      setError(message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (code: string): Promise<boolean> => {
    if (!activeOtpChallenge) {
      setError('No pending OTP verification session found.');
      return false;
    }
    try {
      const result = await apiRequest<{ user: AdminUser }>('/api/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ challengeId: activeOtpChallenge.challengeId, code }),
      });
      setCurrentUser(result.user);
      setActiveOtpChallenge(null);
      setError(null);
      if (!result.user.mustChangePassword && canLoadAccessData(result.user)) {
        await Promise.all([loadAdminUsers(), refreshAccessRoles()]);
      } else {
        setAdminUsers([]);
        setAccessRoles([]);
      }
      return true;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'OTP verification failed.');
      return false;
    }
  };

  const resendOtp = async (): Promise<OtpChallenge | null> => {
    if (!activeOtpChallenge) return null;
    try {
      const result = await apiRequest<{ expiresAt: number }>('/api/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify({ challengeId: activeOtpChallenge.challengeId }),
      });
      const updated = { ...activeOtpChallenge, expiresAt: result.expiresAt };
      setActiveOtpChallenge(updated);
      setError(null);
      return updated;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'OTP delivery failed.');
      return null;
    }
  };

  const cancelOtp = () => {
    if (activeOtpChallenge) {
      void apiRequest(`/api/auth/otp/${encodeURIComponent(activeOtpChallenge.challengeId)}`, { method: 'DELETE' })
        .catch((requestError) => console.error('[Authentication] Unable to cancel OTP challenge.', requestError));
    }
    setActiveOtpChallenge(null);
    setError(null);
  };

  const logout = () => {
    void apiRequest('/api/auth/logout', { method: 'POST' })
      .catch((requestError) => console.error('[Authentication] Unable to end the server session.', requestError));
    setCurrentUser(null);
    setAdminUsers([]);
    setAccessRoles([]);
    setActiveOtpChallenge(null);
  };

  const createAdminUser: AuthContextType['createAdminUser'] = async (data) => {
    try {
      const result = await apiRequest<{ user: AdminUser }>('/api/auth/admins', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setAdminUsers((users) => [...users, result.user]);
      return { success: true, message: `Admin account for ${result.user.name} created successfully.` };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to create admin account.' };
    }
  };

  const saveAccessRole: AuthContextType['saveAccessRole'] = async (role, id) => {
    try {
      const result = await apiRequest<{ role: AdminAccessRole }>(
        id ? `/api/auth/roles/${encodeURIComponent(id)}` : '/api/auth/roles',
        {
          method: id ? 'PATCH' : 'POST',
          body: JSON.stringify(role),
        },
      );
      setAccessRoles((current) => id
        ? current.map((entry) => entry.id === id ? result.role : entry)
        : [...current, result.role].sort((first, second) => first.name.localeCompare(second.name)));
      return { success: true, message: id ? 'Role updated successfully.' : 'Role created successfully.' };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to save role.' };
    }
  };

  const deleteAccessRole: AuthContextType['deleteAccessRole'] = async (id) => {
    try {
      await apiRequest(`/api/auth/roles/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setAccessRoles((current) => current.filter((role) => role.id !== id));
      return { success: true, message: 'Role deleted successfully.' };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to delete role.' };
    }
  };

  const updateAdminUser: AuthContextType['updateAdminUser'] = async (userId, data) => {
    try {
      const result = await apiRequest<{ user: AdminUser }>(`/api/auth/admins/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setAdminUsers((users) => users.map((user) => user.id === userId ? result.user : user));
      if (currentUser?.id === userId) setCurrentUser(result.user);
      return { success: true, message: `Admin account for ${result.user.name} updated successfully.` };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to update admin account.' };
    }
  };

  const deleteAdminUser: AuthContextType['deleteAdminUser'] = async (userId) => {
    try {
      await apiRequest(`/api/auth/admins/${encodeURIComponent(userId)}`, { method: 'DELETE' });
      setAdminUsers((users) => users.filter((user) => user.id !== userId));
      return { success: true, message: 'Admin account deleted successfully.' };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to delete admin account.' };
    }
  };

  const activateAdminUser: AuthContextType['activateAdminUser'] = async (userId) => {
    try {
      const result = await apiRequest<{ user: AdminUser }>(`/api/auth/admins/${encodeURIComponent(userId)}/activate`, {
        method: 'POST',
      });
      setAdminUsers((users) => users.map((user) => user.id === userId ? result.user : user));
      return { success: true, message: `${result.user.name}'s account is active again.` };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to activate admin account.' };
    }
  };

  const resetAdminPasswordBySuperAdmin: AuthContextType['resetAdminPasswordBySuperAdmin'] = async (targetUserId, newPassword) => {
    try {
      const result = await apiRequest<{ message: string }>(
        `/api/auth/admins/${encodeURIComponent(targetUserId)}/reset-password`,
        { method: 'POST', body: JSON.stringify({ newPassword }) },
      );
      return { success: true, message: result.message };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to reset admin password.' };
    }
  };

  const changeOwnPassword: AuthContextType['changeOwnPassword'] = async (oldPassword, newPassword, confirmPassword) => {
    try {
      const result = await apiRequest<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: oldPassword, newPassword, confirmPassword }),
      });
      setCurrentUser((user) => user ? { ...user, mustChangePassword: false, passwordChangeReason: undefined } : user);
      setAdminUsers((users) => users.map((user) =>
        user.id === currentUser?.id
          ? { ...user, mustChangePassword: false, passwordChangeReason: undefined }
          : user,
      ));
      if (currentUser && canLoadAccessData(currentUser)) {
        await Promise.all([loadAdminUsers(), refreshAccessRoles()]);
      }
      return { success: true, message: result.message };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to change password.' };
    }
  };

  const updateProfilePhoto: AuthContextType['updateProfilePhoto'] = async (profilePhoto) => {
    try {
      const result = await apiRequest<{ user: AdminUser }>('/api/auth/profile-photo', {
        method: 'PUT',
        body: JSON.stringify({ profilePhoto }),
      });
      setCurrentUser(result.user);
      setAdminUsers((users) => users.map((user) => user.id === result.user.id ? result.user : user));
      return { success: true, message: 'Your profile photo was updated.' };
    } catch (requestError) {
      return { success: false, message: requestError instanceof Error ? requestError.message : 'Unable to update your profile photo.' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        adminUsers,
        accessRoles,
        activeOtpChallenge,
        isLoading,
        error,
        clearError,
        requestLogin,
        verifyOtp,
        resendOtp,
        cancelOtp,
        logout,
        createAdminUser,
        updateAdminUser,
        activateAdminUser,
        deleteAdminUser,
        resetAdminPasswordBySuperAdmin,
        changeOwnPassword,
        updateProfilePhoto,
        refreshAccessRoles,
        saveAccessRole,
        deleteAccessRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
