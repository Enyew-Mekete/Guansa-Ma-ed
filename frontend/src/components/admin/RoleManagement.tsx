import React, { FormEvent, useMemo, useState } from 'react';
import { Edit2, Plus, Search, Shield, Trash2, X } from 'lucide-react';
import { ADMIN_ACTIONS, ADMIN_PERMISSIONS, ADMIN_SECTIONS, AdminAccessRole, AdminPermission, AdminSection, hasAdminPermission } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useAdminFeedback } from './AdminFeedback';
import { AdminModal } from './AdminModal';

const sectionLabels: Record<AdminSection, string> = {
  dashboard: 'Dashboard',
  menu: 'Menu',
  services: 'Service Management',
  orders: 'Customer Order',
  feedback: 'Customer Feedback',
  news: 'News & Updates',
  vacancies: 'Vacancy',
  subscriptions: 'Subscriptions',
  hero: 'Hero Section',
  roleManagement: 'Role Management',
  userManagement: 'User Management',
  deployment: 'Deployment Guide',
  reports: 'Reports',
};

const emptyRole = { name: '', description: '', permissions: [] as AdminPermission[] };

export const RoleManagement: React.FC = () => {
  const { currentUser, accessRoles, saveAccessRole, deleteAccessRole } = useAuth();
  const { confirm, notify } = useAdminFeedback();
  const [query, setQuery] = useState('');
  const [editingRole, setEditingRole] = useState<AdminAccessRole | null>(null);
  const [draft, setDraft] = useState(emptyRole);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const canAddRole = hasAdminPermission(currentUser, 'roleManagement', 'add');
  const canEditRole = hasAdminPermission(currentUser, 'roleManagement', 'edit');
  const canDeleteRole = hasAdminPermission(currentUser, 'roleManagement', 'delete');

  const filteredRoles = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    return accessRoles.filter((role) =>
      `${role.name} ${role.description} ${role.permissions.join(' ')}`
        .toLocaleLowerCase()
        .includes(search),
    );
  }, [accessRoles, query]);

  const openNewRole = () => {
    setEditingRole(null);
    setDraft(emptyRole);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditRole = (role: AdminAccessRole) => {
    setEditingRole(role);
    setDraft({ name: role.name, description: role.description, permissions: [...role.permissions] });
    setError(null);
    setIsModalOpen(true);
  };

  const togglePermission = (permission: AdminPermission) => {
    setDraft((current) => ({
      ...current,
      permissions: current.permissions.includes(permission)
        ? current.permissions.filter((item) => item !== permission)
        : [...current.permissions, permission],
    }));
  };

  const toggleSectionPermission = (section: AdminSection, action: typeof ADMIN_ACTIONS[number]) => {
    togglePermission(`${section}:${action}`);
  };

  const toggleSectionAll = (section: AdminSection) => {
    const sectionPermissions = ADMIN_ACTIONS.map((action) => `${section}:${action}` as AdminPermission);
    const hasAllPermissions = sectionPermissions.every((permission) => draft.permissions.includes(permission));
    setDraft((current) => ({
      ...current,
      permissions: hasAllPermissions
        ? current.permissions.filter((permission) => !sectionPermissions.includes(permission))
        : [...new Set([...current.permissions, ...sectionPermissions])],
    }));
  };

  const toggleAllPermissions = () => {
    const hasAllPermissions = ADMIN_PERMISSIONS.every((permission) => draft.permissions.includes(permission));
    setDraft((current) => ({
      ...current,
      permissions: hasAllPermissions ? [] : [...ADMIN_PERMISSIONS],
    }));
  };

  const submitRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    const result = await saveAccessRole({
      name: draft.name.trim(),
      description: draft.description.trim(),
      permissions: ADMIN_PERMISSIONS.filter((permission) => draft.permissions.includes(permission)),
    }, editingRole?.id);
    setIsSaving(false);
    if (!result.success) {
      setError(result.message);
      return;
    }
    notify('success', result.message);
    setIsModalOpen(false);
  };

  const removeRole = async (role: AdminAccessRole) => {
    if (!await confirm('Delete role?', `Delete "${role.name}"? Any users using it must be reassigned first.`)) return;
    const result = await deleteAccessRole(role.id);
    notify(result.success ? 'success' : 'error', result.message);
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h3 className="font-serif text-xl font-bold">Role Management</h3>
          <p className="mt-1 text-xs text-[#344BC2]/70">Define reusable roles and choose which parts of the system each role can access.</p>
        </div>
        {canAddRole && <button type="button" onClick={openNewRole} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#159E37] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#107d2b]">
          <Plus className="h-4 w-4" /> Define New Role
        </button>}
      </header>

      <label className="relative block max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, descriptions, or privileges" aria-label="Search roles" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#159E37]/30" />
      </label>

      {filteredRoles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#159E37] bg-white p-8 text-center text-sm text-[#344BC2]/70">
          {accessRoles.length ? 'No roles match your search.' : 'No custom roles yet. Define a role to assign a tailored set of privileges.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredRoles.map((role) => (
            <article key={role.id} className="flex flex-col gap-4 rounded-2xl border border-[#159E37] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="rounded-lg bg-[#344BC2] p-2 text-amber-300"><Shield className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <h4 className="font-bold">{role.name}</h4>
                    <p className="mt-1 text-xs text-[#344BC2]/70">{role.description || 'No description provided.'}</p>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{role.permissions.length} privileges</span>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {role.permissions.map((permission) => <li key={permission} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800">{sectionLabels[permission.split(':')[0] as AdminSection]}: {permission.split(':')[1]}</li>)}
                {role.permissions.length === 0 && <li className="text-xs text-[#344BC2]/60">No privileges granted</li>}
              </ul>
              <div className="mt-auto flex justify-end gap-2 border-t border-slate-100 pt-3">
                {canEditRole && <button type="button" onClick={() => openEditRole(role)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#159E37] px-3 py-1.5 text-xs font-bold hover:bg-slate-50"><Edit2 className="h-3.5 w-3.5" /> Edit</button>}
                {canDeleteRole && role.id !== 'role-default-admin' && <button type="button" onClick={() => void removeRole(role)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminModal isOpen={isModalOpen} title={editingRole ? 'Edit Role' : 'Define New Role'} onClose={() => setIsModalOpen(false)} maxWidthClass="max-w-3xl">
        <form onSubmit={(event) => void submitRole(event)} className="space-y-4">
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <label className="block space-y-1.5 text-xs font-semibold">
            Role Name
            <input required maxLength={80} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl border border-[#159E37] px-3 py-2.5 text-sm" />
          </label>
          <label className="block space-y-1.5 text-xs font-semibold">
            Description of the Role
            <textarea maxLength={500} rows={3} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-xl border border-[#159E37] px-3 py-2.5 text-sm" />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-xs font-bold">Privileges</legend>
            <p className="text-xs text-[#344BC2]/65">Turn each permission on or off for this role.</p>
            <button
              type="button"
              onClick={toggleAllPermissions}
              aria-pressed={ADMIN_PERMISSIONS.every((permission) => draft.permissions.includes(permission))}
              className="rounded-lg border border-[#159E37] px-3 py-2 text-xs font-bold hover:bg-emerald-50"
            >
              {ADMIN_PERMISSIONS.every((permission) => draft.permissions.includes(permission)) ? 'Clear all privileges' : 'Select all privileges'}
            </button>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[580px] text-left text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2.5 font-bold">Section</th>
                    {ADMIN_ACTIONS.map((action) => <th key={action} className="px-3 py-2.5 text-center font-bold capitalize">{action}</th>)}
                    <th className="px-3 py-2.5 text-center font-bold">All</th>
                  </tr>
                </thead>
                <tbody>
                  {ADMIN_SECTIONS.map((section) => (
                    <tr key={section} className="border-t border-slate-100">
                      <th className="px-3 py-2.5 font-semibold">{sectionLabels[section]}</th>
                      {ADMIN_ACTIONS.map((action) => {
                        const permission = `${section}:${action}` as AdminPermission;
                        const enabled = draft.permissions.includes(permission);
                        return (
                          <td key={action} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => toggleSectionPermission(section, action)}
                              aria-label={`${action} ${sectionLabels[section]}`}
                              className="h-4 w-4 accent-[#159E37]"
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={ADMIN_ACTIONS.every((action) => draft.permissions.includes(`${section}:${action}` as AdminPermission))}
                        onChange={() => toggleSectionAll(section)}
                        aria-label={`All privileges for ${sectionLabels[section]}`}
                        className="h-4 w-4 accent-[#159E37]"
                      />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-[#159E37] px-4 py-2.5 text-xs font-bold"><X className="h-4 w-4" /> Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-xl bg-[#159E37] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60">{isSaving ? 'Saving…' : editingRole ? 'Save Changes' : 'Create Role'}</button>
          </div>
        </form>
      </AdminModal>
    </section>
  );
};
