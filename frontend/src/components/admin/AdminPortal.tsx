import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { ADMIN_SECTIONS, AdminSection, hasAdminPermission, MenuItem, MenuType, ServiceItem, AdminUser, Order } from '../../types';
import { BRAND_CONFIG, BRAND_ASSETS } from '../../config/branding';
import { EditMenuItemModal } from './EditMenuItemModal';
import { EditServiceModal } from './EditServiceModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { ResetAdminPasswordModal } from './ResetAdminPasswordModal';
import { CreateAdminUserModal } from './CreateAdminUserModal';
import { EditAdminUserModal } from './EditAdminUserModal';
import { NewsManagement, VacancyManagement } from './NewsAndVacancyManagement';
import { NewsletterSubscribersManagement } from './NewsletterSubscribersManagement';
import { CustomerFeedbackManagement } from './CustomerFeedbackManagement';
import { HeroImagesManagement } from './HeroImagesManagement';
import { RoleManagement } from './RoleManagement';
import { ReportsManagement } from './ReportsManagement';
import { apiRequest } from '../../utils/api';
import { AdminFeedbackProvider, useAdminFeedback } from './AdminFeedback';
import { AdminModal } from './AdminModal';
import {
  ShieldCheck,
  User,
  Users,
  Utensils,
  Plus,
  Edit2,
  Trash2,
  KeyRound,
  Lock,
  LogOut,
  ShoppingBag,
  CheckCircle,
  FileCode,
  Terminal,
  FolderTree,
  AlertCircle,
  Clock,
  Sparkles,
  Mail,
  Smartphone,
  Newspaper,
  BriefcaseBusiness,
  Settings,
  LayoutDashboard,
  MessageSquareText,
  ImagePlus,
  ChevronDown,
  FileBarChart,
  Search,
} from 'lucide-react';
import { useNews } from '../../context/NewsContext';

const AdminPortalContent: React.FC = () => {
  const { confirm, notify } = useAdminFeedback();
  const { currentUser, adminUsers, accessRoles, requestLogin, logout, error, clearError, deleteAdminUser, activateAdminUser, isLoading, updateProfilePhoto } = useAuth();
  const { error: contentError } = useNews();
  const {
    menuItems,
    menuCategories,
    services,
    orders,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    addService,
    updateService,
    deleteService,
    updateOrderStatus,
    error: menuError,
  } = useMenu();

  // Active Admin Sub-Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'menu' | 'services' | 'news' | 'vacancies' | 'hero' | 'userManagement' | 'roleManagement' | 'reports' | 'orders' | 'subscriptions' | 'feedback' | 'deployment' | 'security'>('dashboard');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<Order['status']>('pending');
  const [dashboardStats, setDashboardStats] = useState<Record<string, number> | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [profilePhotoError, setProfilePhotoError] = useState<string | null>(null);
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState<string | null>(null);
  const [isSavingProfilePhoto, setIsSavingProfilePhoto] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const profilePhotoInput = useRef<HTMLInputElement>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [adminMenuType, setAdminMenuType] = useState<MenuType>('food');
  const [isMenuSubnavOpen, setIsMenuSubnavOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryNameAmharic, setCategoryNameAmharic] = useState('');
  const [categoryMenuType, setCategoryMenuType] = useState<MenuType>('food');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [editTargetUser, setEditTargetUser] = useState<AdminUser | null>(null);
  const [isEditAdminOpen, setIsEditAdminOpen] = useState(false);

  // Login Form states (when logged out)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const canAccess = (section: AdminSection) => {
    if (isSuperAdmin) return true;
    if (section === 'userManagement') return currentUser?.permissions?.includes('userManagement:view') ?? false;
    if (currentUser?.assignedRoleId) return currentUser.permissions?.includes(`${section}:view`) ?? false;
    return section !== 'reports';
  };
  const canPerform = (section: AdminSection, action: 'add' | 'edit' | 'delete') =>
    hasAdminPermission(currentUser, section, action);
  const hasTabPermission = (tab: string) => {
    const permissionByTab: Record<string, AdminSection> = {
      dashboard: 'dashboard', menu: 'menu', services: 'services', news: 'news', vacancies: 'vacancies',
      hero: 'hero', userManagement: 'userManagement', roleManagement: 'roleManagement', reports: 'reports',
      orders: 'orders', subscriptions: 'subscriptions', feedback: 'feedback', deployment: 'deployment',
    };
    return !permissionByTab[tab] || canAccess(permissionByTab[tab]);
  };
  const roleLabel = isSuperAdmin
    ? 'Super Admin'
    : currentUser?.assignedRoleName ||
      accessRoles.find((role) => role.id === currentUser?.assignedRoleId)?.name ||
      'Admin';

  useEffect(() => {
    if (!currentUser?.assignedRoleId || isSuperAdmin || hasTabPermission(activeTab)) return;
    const firstAllowed = ADMIN_SECTIONS.find((section) => canAccess(section));
    if (firstAllowed) setActiveTab(firstAllowed);
  }, [activeTab, currentUser, isSuperAdmin]);

  useEffect(() => {
    if (!currentUser || activeTab !== 'dashboard' || !canAccess('dashboard')) return;
    let mounted = true;
    setDashboardError(null);
    apiRequest<{ stats: Record<string, number> }>('/api/dashboard/stats')
      .then(({ stats }) => {
        if (mounted) setDashboardStats(stats);
      })
      .catch((statsError: unknown) => {
        console.error('[Dashboard] Unable to load dashboard statistics.', statsError);
        if (mounted) setDashboardError(statsError instanceof Error ? statsError.message : 'Unable to load dashboard statistics.');
      });
    return () => { mounted = false; };
  }, [currentUser, activeTab]);

  const handleProfilePhoto = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setProfilePhotoError('Choose a JPG, PNG, or WebP image smaller than 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setPendingProfilePhoto(reader.result);
      setProfilePhotoError(null);
    };
    reader.onerror = () => setProfilePhotoError('Unable to read the selected profile photo.');
    reader.readAsDataURL(file);
  };

  const saveProfilePhoto = async () => {
    if (!pendingProfilePhoto) return;
    setIsSavingProfilePhoto(true);
    const result = await updateProfilePhoto(pendingProfilePhoto);
    setIsSavingProfilePhoto(false);
    if (result.success) setPendingProfilePhoto(null);
    else setProfilePhotoError(result.message);
  };

  const dashboardCards: { label: string; value: number; Icon: React.ElementType }[] = [
    ...(canAccess('userManagement') ? [{ label: 'Admin Users', value: dashboardStats?.adminUsers ?? adminUsers.length, Icon: Users }] : []),
    { label: 'Services', value: dashboardStats?.services ?? services.length, Icon: Sparkles },
    { label: 'Menu Categories', value: dashboardStats?.categories ?? new Set(menuItems.map((item) => item.category)).size, Icon: FolderTree },
    { label: 'Food & Drinks', value: dashboardStats?.products ?? menuItems.length, Icon: Utensils },
    { label: 'Active Vacancies', value: dashboardStats?.activeVacancies ?? 0, Icon: BriefcaseBusiness },
    { label: 'Customer Orders', value: dashboardStats?.orders ?? orders.length, Icon: ShoppingBag },
    { label: 'News & Updates', value: dashboardStats?.news ?? 0, Icon: Newspaper },
    { label: 'Feedback', value: dashboardStats?.feedback ?? 0, Icon: MessageSquareText },
  ];
  const orderStatuses: { value: Order['status']; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'completed', label: 'Completed / Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];
  const filteredMenuItems = menuItems.filter((item) =>
    item.menuType === adminMenuType &&
    `${item.name} ${item.nameAmharic} ${item.categoryName ?? item.category} ${item.description}`
      .toLocaleLowerCase().includes(menuSearch.trim().toLocaleLowerCase()),
  );
  const filteredMenuCategories = menuCategories.filter((category) =>
    category.menuType === adminMenuType &&
    `${category.name} ${category.nameAmharic}`.toLocaleLowerCase().includes(menuSearch.trim().toLocaleLowerCase()),
  );
  const filteredServices = services.filter((service) =>
    `${service.title} ${service.titleAmharic} ${service.description} ${service.tagline}`
      .toLocaleLowerCase().includes(serviceSearch.trim().toLocaleLowerCase()),
  );
  const filteredAdminUsers = adminUsers.filter((user) => {
    const search = userSearch.trim().toLocaleLowerCase();
    if (!search) return true;
    const createdDate = new Date(user.createdAt);
    const lastLoginDate = user.lastLogin ? new Date(user.lastLogin) : null;
    const dateTerms = [
      user.createdAt,
      createdDate.toLocaleDateString(),
      createdDate.toLocaleString(),
      user.lastLogin ?? '',
      lastLoginDate?.toLocaleDateString() ?? '',
      lastLoginDate?.toLocaleString() ?? '',
    ];
    const searchableText = [
      user.name,
      user.email,
      user.phone,
      user.phone.replace(/\D/g, ''),
      user.role.replace('_', ' '),
      user.assignedRoleName ?? '',
      user.isActive ? 'active' : 'inactive',
      user.otpEnabled ? 'otp enabled' : 'otp disabled',
      ...dateTerms,
    ].join(' ').toLocaleLowerCase();
    return searchableText.includes(search);
  });

  // Handle Login submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingLogin(true);
    try {
      await requestLogin(loginIdentifier, loginPassword);
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // -------------------------------------------------------------
  // VIEW A: If not logged in, render Secure Login with OTP entry
  // -------------------------------------------------------------
  if (!currentUser) {
    if (isLoading) {
      return <div className="mx-auto max-w-xl py-20 text-center text-sm font-semibold text-[#344BC2]">Checking secure admin session…</div>;
    }
    return (
      <div className="mx-auto mt-6 flex min-h-[min(720px,calc(100dvh-7rem))] w-full max-w-md flex-col justify-start space-y-4 rounded-[2rem] border border-[#159E37]/25 bg-gradient-to-b from-white via-white to-emerald-50/50 px-5 pb-4 pt-1 text-[#344BC2] shadow-[0_24px_80px_-32px_rgba(52,75,194,0.35)] animate-in fade-in sm:min-h-[min(720px,calc(100dvh-8rem))] sm:px-8 sm:pb-5 sm:pt-2">
        <div className="text-center space-y-2">
          <img src="/Guansa_Logo.png" alt="Guansa Ma'ed logo" className="mx-auto h-24 w-24 object-contain drop-shadow-sm" />
          <h2 className="text-2xl font-extrabold text-[#344BC2] font-serif">
            Guansa Ma'ed Admin Portal · የሰራተኞች መግቢያ
          </h2>
          <p className="text-xs text-[#344BC2]/75 max-w-sm mx-auto leading-relaxed">
            Authorized Super Admin & Admin management. Email OTP is required only when it is enabled for your account.
          </p>
        </div>

        {(menuError || contentError) && (
          <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{menuError || contentError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="rounded-2xl border border-[#159E37]/40 bg-white/90 p-5 shadow-lg shadow-[#344BC2]/5 space-y-5 text-xs text-[#344BC2] sm:p-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Username, email, or phone</label>
            <input
              type="text"
              required
              autoComplete="username"
              placeholder="Enter your username, email, or phone"
              value={loginIdentifier}
              onChange={(e) => {
                setLoginIdentifier(e.target.value);
                clearError();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          <div>
            <label className="block text-[#344BC2] font-semibold mb-1">Password</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter account password"
              value={loginPassword}
              onChange={(e) => {
                setLoginPassword(e.target.value);
                clearError();
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-[#159E37] text-[#344BC2] placeholder-[#344BC2]/40 focus:outline-none focus:border-[#159E37]"
            />
          </div>

          {/* Reverse Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full py-3 px-4 rounded-xl bg-[#344BC2] hover:bg-[#2C40AE] text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>{isSubmittingLogin ? 'Signing in…' : 'Login Securely'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (currentUser.mustChangePassword) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#faf8f5] p-4">
        <ChangePasswordModal isOpen onClose={() => undefined} />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: Logged in Dashboard (Super Admin or Admin)
  // -------------------------------------------------------------
  return (
    <div className="flex min-h-screen w-full animate-in fade-in flex-row bg-[#faf8f5] text-[#344BC2]">
      <aside className="sticky top-20 flex h-[calc(100dvh-5rem)] w-16 shrink-0 flex-col bg-[#344BC2] text-[#f9eee0] sm:top-24 sm:h-[calc(100dvh-6rem)] sm:w-56 lg:w-64">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-amber-400 bg-white text-amber-700"><ShieldCheck className="h-6 w-6" /></div>
          <div className="hidden min-w-0 sm:block"><p className="text-sm font-bold text-amber-300">Guansa Ma'ed</p><p className="text-[11px] text-white/70">{roleLabel}</p></div>
        </div>
        <nav aria-label="Admin navigation" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-1.5 sm:p-3">
          {canAccess('dashboard') && <button type="button" onClick={() => setActiveTab('dashboard')} aria-current={activeTab === 'dashboard' ? 'page' : undefined}
            title="Dashboard" className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors sm:justify-start sm:px-3 lg:text-sm ${activeTab === 'dashboard' ? 'bg-[#bb8507] font-bold text-white shadow' : 'text-white/85 hover:bg-white/10'}`}>
            <LayoutDashboard className="h-4 w-4 shrink-0" /><span className="hidden truncate sm:inline">Dashboard</span>
          </button>}
          {canAccess('menu') && <div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('menu');
                setIsMenuSubnavOpen((open) => !open);
              }}
              aria-expanded={isMenuSubnavOpen}
              aria-current={activeTab === 'menu' ? 'page' : undefined}
              title="Menu" className={`flex w-full min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors sm:justify-start sm:px-3 lg:text-sm ${activeTab === 'menu' ? 'bg-[#bb8507] font-bold text-white shadow' : 'text-white/85 hover:bg-white/10'}`}
            >
              <Utensils className="h-4 w-4 shrink-0" /><span className="hidden flex-1 truncate sm:inline">Menu</span>
              <ChevronDown className={`hidden h-4 w-4 transition-transform sm:block ${isMenuSubnavOpen ? 'rotate-180' : ''}`} />
            </button>
            {isMenuSubnavOpen && (
              <div className="ml-1 mt-1 flex flex-col gap-1 border-l border-white/20 pl-1 sm:ml-5 sm:pl-2">
                {(['food', 'drink'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setActiveTab('menu');
                      setAdminMenuType(type);
                    }}
                    aria-current={activeTab === 'menu' && adminMenuType === type ? 'page' : undefined}
                    className={`rounded-md px-1 py-2 text-center text-[10px] transition-colors sm:px-3 sm:text-left sm:text-xs ${activeTab === 'menu' && adminMenuType === type ? 'bg-white/15 font-bold text-amber-300' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}
                  >
                    <span className="sm:hidden">{type === 'food' ? 'Food' : 'Drink'}</span><span className="hidden sm:inline">{type === 'food' ? 'Food Menu' : 'Drink Menu'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>}
          {([
            ['services', 'Services Management', Sparkles],
            ['orders', 'Customer Orders', ShoppingBag],
            ['feedback', 'Customer Feedback', MessageSquareText],
            ['news', 'News & Updates', Newspaper],
            ['vacancies', 'Vacancies', BriefcaseBusiness],
            ['subscriptions', 'Subscriptions', Mail],
            ['hero', 'Hero Section', ImagePlus],
            ...(canAccess('roleManagement') ? [['roleManagement', 'Role Management', ShieldCheck] as const] : []),
            ...(canAccess('userManagement') ? [['userManagement', 'User Management', Users] as const] : []),
            ...(canAccess('reports') ? [['reports', 'Reports', FileBarChart] as const] : []),
            ...(canAccess('deployment') ? [['deployment', 'Deployment Guide', FolderTree] as const] : []),
          ] as const).filter(([tab, label]) =>
            hasTabPermission(tab) && (!pageSearch.trim() ||
              `${label} ${tab}`.toLocaleLowerCase().includes(pageSearch.trim().toLocaleLowerCase())),
          ).map(([tab, label, Icon]) => (
            <button key={tab} type="button" onClick={() => setActiveTab(tab)} aria-current={activeTab === tab ? 'page' : undefined} title={label}
              className={`flex min-w-0 items-center justify-center gap-2 rounded-md px-2 py-2 text-left text-xs transition-colors sm:justify-start sm:px-3 lg:text-sm ${activeTab === tab ? 'bg-[#bb8507] font-bold text-white shadow' : 'text-white/85 hover:bg-white/10'}`}>
              <Icon className="h-4 w-4 shrink-0" /><span className="hidden truncate sm:inline">{label}</span>
            </button>
          ))}
        </nav>
        <div className="relative mt-auto shrink-0 border-t border-white/10 bg-[#344BC2] p-1.5 sm:p-3">
          <input ref={profilePhotoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => {
            handleProfilePhoto(event.target.files?.[0]);
            event.currentTarget.value = '';
          }} />
          {isAccountMenuOpen && (
            <div className="absolute bottom-2 left-[calc(100%+0.5rem)] z-30 w-56 overflow-hidden rounded-md border border-[#159E37] bg-white text-[#344BC2] shadow-xl sm:bottom-[calc(100%-0.5rem)] sm:left-3 sm:right-3 sm:w-auto" role="menu" aria-label="Account menu">
              <p className="border-b border-[#159E37] px-3 py-3 text-sm font-bold">My Account</p>
              <button type="button" role="menuitem" onClick={() => profilePhotoInput.current?.click()} className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-[#faf8f5]">
                <User className="h-4 w-4" /> Profile
              </button>
              {pendingProfilePhoto && (
                <div className="border-t border-[#159E37] p-3">
                  <div className="flex items-center gap-2">
                    <img src={pendingProfilePhoto} alt="Profile photo preview" className="h-10 w-10 rounded-full object-cover" />
                    <span className="text-xs">Preview new photo</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button type="button" disabled={isSavingProfilePhoto} onClick={() => void saveProfilePhoto()} className="rounded bg-[#344BC2] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50">{isSavingProfilePhoto ? 'Saving…' : 'Save changes'}</button>
                    <button type="button" disabled={isSavingProfilePhoto} onClick={() => setPendingProfilePhoto(null)} className="rounded border border-[#159E37] px-2.5 py-1.5 text-xs">Cancel</button>
                  </div>
                </div>
              )}
              {profilePhotoError && <p role="alert" className="px-3 py-2 text-xs text-red-700">{profilePhotoError}</p>}
              <button type="button" role="menuitem" onClick={() => { setIsAccountMenuOpen(false); setIsChangePasswordOpen(true); }} className="flex w-full items-center gap-3 border-t border-[#159E37] px-3 py-2.5 text-sm hover:bg-[#faf8f5]">
                <Settings className="h-4 w-4" /> Settings
              </button>
              <button type="button" role="menuitem" onClick={logout} className="flex w-full items-center gap-3 border-t border-[#159E37] px-3 py-2.5 text-sm hover:bg-[#faf8f5]">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
          <button type="button" aria-haspopup="menu" aria-expanded={isAccountMenuOpen} onClick={() => setIsAccountMenuOpen((open) => !open)} title="My Account" className="flex w-full flex-col items-center justify-center gap-1 rounded-md p-1 text-left hover:bg-white/10 sm:flex-row sm:gap-3 sm:justify-start">
            {currentUser.profilePhoto
              ? <img src={currentUser.profilePhoto} alt={`${currentUser.name} profile`} className="h-10 w-10 shrink-0 rounded-full bg-[#f3eadb] object-cover" />
              : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f3eadb] text-xs font-bold text-[#344BC2]">{currentUser.name.slice(0, 2).toUpperCase()}</div>}
            <span className="hidden min-w-0 flex-1 sm:block"><span className="block truncate text-xs font-bold">{currentUser.name}</span><span className="block truncate text-[10px] text-white/65">{currentUser.email}</span></span>
            <span className="text-[9px] leading-none sm:hidden">Account</span>
            <Settings className="hidden h-4 w-4 shrink-0 text-white/75 sm:block" />
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 p-3 sm:p-7 lg:px-10">
        <div className="mb-7 flex flex-col justify-between gap-3 border-b border-[#159E37] pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-extrabold">{activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'userManagement' ? 'User Management' : activeTab === 'roleManagement' ? 'Role Management' : activeTab === 'reports' ? 'Reports' : activeTab === 'hero' ? 'Hero Section' : activeTab === 'services' ? 'Services Management' : activeTab === 'news' ? 'News & Updates' : activeTab === 'deployment' ? 'Deployment Guide' : activeTab === 'menu' ? `${adminMenuType === 'food' ? 'Food' : 'Drink'} Menu` : activeTab[0].toUpperCase() + activeTab.slice(1)}</h2>
            <p className="mt-1 text-xs text-[#344BC2]">{currentUser.name} · {roleLabel}</p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={pageSearch} onChange={(event) => setPageSearch(event.target.value)} placeholder="Search admin pages" aria-label="Search admin pages" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#159E37]/30" />
          </label>
        </div>

      {!isSuperAdmin && currentUser.assignedRoleId && !ADMIN_SECTIONS.some((section) => canAccess(section)) && (
        <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          No privileges are currently assigned to your role. Ask a Super Admin to grant access.
        </p>
      )}

      {activeTab === 'dashboard' && canAccess('dashboard') && (
        <section className="space-y-6">
          {dashboardError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{dashboardError}</p>}
          <div className="rounded-xl border border-[#159E37] bg-white p-5 shadow-sm">
            <label className="grid max-w-xs gap-1 text-xs font-semibold text-[#344BC2]">Overview
              <select className="rounded-lg border border-[#159E37] bg-[#faf8f5] px-3 py-2 text-sm font-normal"><option>All services and locations</option></select>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map(({ label, value, Icon }) => (
              <article key={label} className="rounded-xl border border-[#159E37] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-center justify-between text-xs text-[#344BC2]"><span>{label}</span><Icon className="h-4 w-4 text-amber-500" /></div>
                <p className="mt-5 text-3xl font-extrabold text-[#159E37]">{value}</p>
                <p className="mt-1 text-[11px] text-[#344BC2]">Current records in the system.</p>
              </article>
            ))}
          </div>
          <section className="rounded-xl border border-[#159E37] bg-white p-5 shadow-sm">
            <h3 className="font-bold">Messages</h3>
            <p className="mt-2 text-sm text-[#344BC2]">Customer reservations and catering inquiries are saved in the Feedback section.</p>
            {canAccess('feedback') && <button type="button" onClick={() => setActiveTab('feedback')} className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-[#344BC2]">View feedback</button>}
          </section>
        </section>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 1: MENU MANAGEMENT (Super Admin & Admin)                      */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'menu' && canAccess('menu') && (
        <div className="space-y-6">
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search menu items or categories" aria-label="Search menu items and categories" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm" />
          </label>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select menu to manage">
            {(['food', 'drink'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setAdminMenuType(type);
                  setCategoryMenuType(type);
                }}
                aria-pressed={adminMenuType === type}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${adminMenuType === type ? 'bg-[#344BC2] text-white' : 'border border-[#159E37] bg-white text-[#344BC2]'}`}
              >
                {type === 'food' ? 'Food Menu' : 'Drink Menu'}
              </button>
            ))}
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-[#344BC2] font-serif">
                {adminMenuType === 'food' ? 'Food Menu' : 'Drink Menu'} Categories ({menuCategories.filter((category) => category.menuType === adminMenuType).length})
              </h3>
              {canPerform('menu', 'add') && <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryName('');
                  setCategoryNameAmharic('');
                  setCategoryMenuType(adminMenuType);
                  setCategoryMessage(null);
                  setIsCategoryFormOpen((open) => !open);
                }}
                className={`rounded-lg px-4 py-2 text-xs font-bold text-white ${isCategoryFormOpen && !editingCategoryId ? 'bg-[#344BC2]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`}
              >
                {isCategoryFormOpen && !editingCategoryId ? 'Close' : 'Add New Category'}
              </button>}
            </div>
            {categoryMessage && <p role="status" className="rounded-lg bg-blue-50 p-2 text-xs text-[#344BC2]">{categoryMessage}</p>}
            <AdminModal
              isOpen={isCategoryFormOpen}
              title={editingCategoryId ? 'Edit menu category' : 'Add menu category'}
              onClose={() => {
                setIsCategoryFormOpen(false);
                setEditingCategoryId(null);
              }}
              maxWidthClass="max-w-xl"
            >
            {isCategoryFormOpen && <form
              className="grid gap-3 sm:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                setIsSavingCategory(true);
                setCategoryMessage(null);
                const categoryData = { name: categoryName.trim(), nameAmharic: categoryNameAmharic.trim(), menuType: categoryMenuType };
                const saved = editingCategoryId
                  ? await updateMenuCategory(editingCategoryId, categoryData)
                  : await addMenuCategory(categoryData);
                setIsSavingCategory(false);
                if (saved) {
                  const wasEditing = Boolean(editingCategoryId);
                  setCategoryName('');
                  setCategoryNameAmharic('');
                  setEditingCategoryId(null);
                  setIsCategoryFormOpen(false);
                  setCategoryMessage(wasEditing ? 'Category updated.' : 'Category added.');
                  notify('success', wasEditing ? 'Category updated.' : 'Category added.');
                } else {
                  notify('error', menuError || 'Unable to save the category.');
                }
              }}
            >
              <input required maxLength={80} value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Category name" aria-label="Category name" className="rounded-lg border border-[#159E37] px-3 py-2 text-sm text-[#344BC2]" />
              <input maxLength={80} value={categoryNameAmharic} onChange={(event) => setCategoryNameAmharic(event.target.value)} placeholder="Amharic name (optional)" aria-label="Amharic category name" className="rounded-lg border border-[#159E37] px-3 py-2 text-sm text-[#344BC2]" />
              <select value={categoryMenuType} onChange={(event) => setCategoryMenuType(event.target.value as MenuType)} aria-label="Category menu" className="rounded-lg border border-[#159E37] bg-white px-3 py-2 text-sm text-[#344BC2]">
                <option value="food">Food Menu</option>
                <option value="drink">Drink Menu</option>
              </select>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => { setIsCategoryFormOpen(false); setEditingCategoryId(null); }} className="rounded-lg border border-[#159E37] px-3 py-2 text-xs font-semibold text-[#344BC2]">Cancel</button>
                <button disabled={isSavingCategory} type="submit" className={`rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${editingCategoryId ? 'bg-[#344BC2]' : 'bg-[#159E37] hover:bg-[#107d2b]'}`}>{isSavingCategory ? 'Saving…' : editingCategoryId ? 'Save' : 'Add'}</button>
              </div>
            </form>}
            </AdminModal>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {filteredMenuCategories.map((category) => (
                <div key={category.id} className="flex min-h-20 flex-col justify-between gap-2 rounded-lg border border-[#159E37] bg-white p-3 text-[#344BC2] shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold">{category.name}</h4>
                    {category.nameAmharic && <p className="mt-0.5 text-xs text-[#344BC2]/65">{category.nameAmharic}</p>}
                  </div>
                  <div className="flex gap-3 border-t border-[#159E37] pt-2 text-[11px]">
                    {canPerform('menu', 'edit') && <button type="button" onClick={() => {
                      setEditingCategoryId(category.id);
                      setCategoryName(category.name);
                      setCategoryNameAmharic(category.nameAmharic);
                      setCategoryMenuType(category.menuType);
                      setIsCategoryFormOpen(true);
                    }} aria-label={`Edit ${category.name}`} className="font-bold underline">Edit</button>}
                    {canPerform('menu', 'delete') && <button type="button" onClick={async () => {
                      const approved = await confirm('Delete menu category?', `Move "${category.name}" to deleted records? The category will be hidden from the menu. It must not contain active menu items.`);
                      if (!approved) return;
                      const deleted = await deleteMenuCategory(category.id);
                      if (deleted) {
                        setCategoryMessage('Category moved to deleted records.');
                        notify('success', 'Category moved to deleted records.');
                      } else {
                        const message = menuError || 'Category could not be deleted. Move or delete its menu items first.';
                        setCategoryMessage(message);
                        notify('error', message);
                      }
                    }} aria-label={`Delete ${category.name}`} className="font-bold text-red-700 underline">Delete</button>}
                  </div>
                </div>
              ))}
              {filteredMenuCategories.length === 0 && <p className="col-span-full rounded-lg border border-dashed border-[#159E37] bg-white p-4 text-xs text-[#344BC2]/60">{menuCategories.some((category) => category.menuType === adminMenuType) ? 'No categories match your search.' : 'No categories yet. Add one above.'}</p>}
            </div>
          </section>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#344BC2] font-serif">{adminMenuType === 'food' ? 'Food Menu Items & Pricing' : 'Drink Menu Items & Pricing'}</h3>
              <p className="text-xs text-[#344BC2]/70">
                Add, edit, or delete items and update their prices, descriptions, categories, photos, and stock status.
              </p>
            </div>

            {/* Reverse Action Button */}
            {canPerform('menu', 'add') && <button
              onClick={() => {
                setEditingItem(null);
                setIsItemModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#159E37] hover:bg-[#107d2b] text-white font-bold text-xs flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add New {adminMenuType === 'food' ? 'Food Item' : 'Drink'}</span>
            </button>}
          </div>
          {menuError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{menuError}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((dish) => (
              <div
                key={dish.id}
                className="p-4 rounded-2xl bg-white border-2 border-[#159E37] space-y-3 flex flex-col justify-between shadow-md text-[#344BC2]"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#159E37]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#b45309]">
                        {dish.categoryName ?? dish.category}
                      </span>
                      <h4 className="font-bold text-xs text-[#344BC2] truncate">{dish.name}</h4>
                      <p className="text-[11px] font-ethiopic text-[#159E37] truncate">
                        {dish.nameAmharic}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#344BC2]/75 line-clamp-2">{dish.description}</p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-[#159E37]">
                    <span className="font-bold text-[#344BC2] font-mono text-sm">
                      {dish.price.toLocaleString()} ETB
                    </span>
                    <span className="text-[11px] bg-slate-100 border border-[#159E37] px-2 py-0.5 rounded text-[#344BC2] font-medium">
                      {dish.stockStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#159E37]">
                  {canPerform('menu', 'edit') && <button
                    onClick={() => {
                      setEditingItem(dish);
                      setIsItemModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] border border-[#159E37] font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#344BC2]" />
                    <span>Edit</span>
                  </button>}

                  {canPerform('menu', 'delete') && <button
                    onClick={() => {
                      void (async () => {
                        if (!await confirm('Delete menu item?', `Move "${dish.name}" to deleted records? It will no longer appear on the public menu.`)) return;
                        const deleted = await deleteMenuItem(dish.id);
                        notify(deleted ? 'success' : 'error', deleted ? 'Menu item moved to deleted records.' : menuError || 'Unable to delete menu item.');
                      })();
                    }}
                    className="py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>}
                </div>
              </div>
            ))}
            {filteredMenuItems.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-[#159E37] bg-white p-5 text-center text-xs text-[#344BC2]/60">No menu items match your search.</p>}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 2: CUSTOMER ORDERS (Super Admin & Admin)                     */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'orders' && canAccess('orders') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-[#344BC2] font-serif">Customer Order History</h3>
              <p className="text-xs text-[#344BC2]/70">
                Customer orders submitted through the Apply to Order form.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-50 border-2 border-[#159E37] text-[#344BC2]/60 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#344BC2]/40" />
              <p className="text-sm font-semibold text-[#344BC2]">No orders placed yet</p>
              <p className="text-xs">
                Orders submitted by customers will appear here with their Order IDs and status.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="relative block max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
                <input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search orders, customers, or phone" aria-label="Search customer orders" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm" />
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5" role="tablist" aria-label="Filter customer orders by status">
                {orderStatuses.map(({ value, label }) => {
                  const count = orders.filter((order) => order.status === value).length;
                  const selected = selectedOrderStatus === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setSelectedOrderStatus(value)}
                      className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors ${
                        selected
                          ? 'border-[#159E37] bg-[#344BC2] text-white'
                          : 'border-[#159E37] bg-white text-[#344BC2] hover:bg-[#344BC2]/5'
                      }`}
                    >
                      <span>{label}</span>
                      <span className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-1 text-xs ${selected ? 'bg-white text-[#344BC2]' : 'bg-[#344BC2]/10 text-[#344BC2]'}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              {(() => {
                const status = orderStatuses.find(({ value }) => value === selectedOrderStatus);
                const query = orderSearch.trim().toLocaleLowerCase();
                const statusOrders = orders.filter((order) =>
                  order.status === selectedOrderStatus &&
                  `${order.orderId} ${order.customerName} ${order.phone} ${order.email ?? ''} ${order.description}`
                    .toLocaleLowerCase().includes(query),
                );
                return (
                <section role="tabpanel" className="space-y-3">
                  <header className="flex items-center gap-2 border-b border-[#159E37] pb-2">
                    <h4 className="text-base font-bold">{status?.label}</h4>
                    <span className="rounded-full border border-[#159E37] bg-white px-2 py-0.5 text-xs font-bold text-[#344BC2]">{statusOrders.length}</span>
                  </header>
                  {statusOrders.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[#159E37] p-4 text-sm text-[#344BC2]/60">No {status?.label.toLowerCase()} orders.</p>
                  ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {statusOrders.map((ord) => (
                <article
                  key={ord.orderId}
                  className="flex flex-col justify-between rounded-2xl border-2 border-[#159E37] bg-white p-4 text-xs text-[#344BC2] shadow-md"
                >
                  <div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#159E37] pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm bg-[#344BC2] text-white px-2 py-0.5 rounded">
                        #{ord.orderId}
                      </span>
                      <span className="text-[#344BC2] font-bold text-xs">
                        {ord.customerName}
                      </span>
                      <span className="font-mono text-[#344BC2] font-semibold text-xs">
                        {ord.phone}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#344BC2]/60">
                        {new Date(ord.createdAt).toLocaleTimeString()}
                      </span>
                      {canPerform('orders', 'edit') ? (
                        <select
                          value={ord.status}
                          onChange={(e) => void updateOrderStatus(ord.orderId, e.target.value as Order['status'])}
                          className="bg-slate-50 border border-[#159E37] text-[#344BC2] font-medium px-2 py-1 rounded text-xs focus:outline-none focus:border-[#159E37]"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing in Kitchen</option>
                          <option value="completed">Completed / Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      ) : <span className="rounded bg-slate-50 px-2 py-1 text-xs font-semibold">{ord.status}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[#344BC2]/60 font-semibold">Items:</p>
                      <ul className="list-disc list-inside text-[#344BC2]/85 space-y-0.5">
                        {ord.items.map((it, idx) => (
                          <li key={idx}>
                            {it.item.name} x{it.quantity} ({(it.item.price * it.quantity).toLocaleString()} ETB)
                          </li>
                        ))}
                      </ul>
                      {ord.description && (
                        <p className="text-[11px] text-[#b45309] pt-1">
                          Special notes: {ord.description}
                        </p>
                      )}
                    </div>

                    <div className="text-right sm:self-end">
                      <span className="text-[#344BC2]/60 block text-[11px]">Total:</span>
                      <span className="text-lg font-bold font-mono text-[#344BC2]">
                        {ord.totalAmount.toLocaleString()} ETB
                      </span>
                    </div>
                  </div>
                  </div>
                </article>
              ))}
                  </div>
                  )}
                </section>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 3: SERVICES MANAGEMENT (Super Admin & Admin)                  */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'services' && canAccess('services') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#344BC2] font-serif">Cultural Services</h3>
              <p className="text-xs text-[#344BC2]/70">
                Add, edit details, and manage hospitality services.
              </p>
            </div>

            {canPerform('services', 'add') && <button
              onClick={() => {
                setEditingService(null);
                setIsServiceModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#159E37] hover:bg-[#107d2b] text-white font-bold text-xs flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>Add Service</span>
            </button>}
          </div>
          <label className="relative block max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
            <input value={serviceSearch} onChange={(event) => setServiceSearch(event.target.value)} placeholder="Search services" aria-label="Search services" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm" />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((srv) => (
              <div
                key={srv.id}
                className="p-5 rounded-2xl bg-white border-2 border-[#159E37] space-y-3 flex flex-col justify-between shadow-md text-[#344BC2]"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#344BC2]">{srv.title}</h4>
                    {srv.badge && (
                      <span className="text-[10px] bg-[#344BC2] text-white px-2 py-0.5 rounded font-bold">
                        {srv.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-ethiopic text-[#159E37] font-semibold">{srv.titleAmharic}</p>
                  <p className="text-xs text-[#344BC2]/80">{srv.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#159E37]">
                  {canPerform('services', 'edit') && <button
                    onClick={() => {
                      setEditingService(srv);
                      setIsServiceModalOpen(true);
                    }}
                    className="py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] border border-[#159E37] font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#344BC2]" />
                    <span>Edit</span>
                  </button>}

                  {canPerform('services', 'delete') && <button
                    onClick={() => {
                      void (async () => {
                        if (!await confirm('Delete service?', `Move "${srv.title}" to deleted records? It will no longer be shown on the website.`)) return;
                        const deleted = await deleteService(srv.id);
                        notify(deleted ? 'success' : 'error', deleted ? 'Service moved to deleted records.' : menuError || 'Unable to delete service.');
                      })();
                    }}
                    className="py-1.5 px-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>}
                </div>
              </div>
            ))}
            {filteredServices.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-[#159E37] bg-white p-5 text-center text-xs text-[#344BC2]/60">No services match your search.</p>}
          </div>
        </div>
      )}

      {activeTab === 'news' && canAccess('news') && <NewsManagement />}

      {activeTab === 'vacancies' && canAccess('vacancies') && <VacancyManagement />}
      {activeTab === 'hero' && canAccess('hero') && <HeroImagesManagement />}
      {activeTab === 'subscriptions' && canAccess('subscriptions') && <NewsletterSubscribersManagement />}
      {activeTab === 'feedback' && canAccess('feedback') && <CustomerFeedbackManagement />}
      {activeTab === 'roleManagement' && canAccess('roleManagement') && <RoleManagement />}
      {activeTab === 'reports' && canAccess('reports') && <ReportsManagement />}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 4: ADMIN USERS (permission-gated user management)             */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'userManagement' && canAccess('userManagement') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#344BC2] font-serif">User Management</h3>
              <p className="text-xs text-[#344BC2]/70">
                Search, assign access roles, edit account details, and manage administrative users.
              </p>
            </div>

            <label className="relative block max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#344BC2]/50" />
              <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search by name, email, phone, role, status, or date" aria-label="Search users by name, email, phone number, role, status, or date" className="w-full rounded-xl border border-[#159E37] bg-white py-2.5 pl-9 pr-3 text-sm" />
            </label>

            {canPerform('userManagement', 'add') && (
              <button
                onClick={() => setIsCreateAdminOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#159E37] hover:bg-[#107d2b] text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Add New User</span>
              </button>
            )}
          </div>

          {!canPerform('userManagement', 'add') && !canPerform('userManagement', 'edit') && !canPerform('userManagement', 'delete') && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-[#344BC2] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#b45309]" />
              <span>Your assigned role allows viewing users but does not include user creation, editing, or deletion.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filteredAdminUsers.map((usr) => (
              <div
                key={usr.id}
                className="p-5 rounded-2xl bg-white border-2 border-[#159E37] space-y-3 shadow-md text-[#344BC2] flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-[#344BC2] rounded-lg text-amber-300">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#344BC2]">{usr.name}</h4>
                        <p className="text-xs text-[#344BC2]/70">{usr.email}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${usr.role === 'SUPER_ADMIN' ? 'bg-[#344BC2] text-white' : 'bg-slate-200 text-[#344BC2]'}`}>
                      {usr.assignedRoleName || usr.role.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-[#344BC2]/80 space-y-1 pt-1 border-t border-[#159E37]">
                    <div className="flex justify-between">
                      <span className="text-[#344BC2]/60">Ethiopian Phone:</span>
                      <span className="font-mono text-[#344BC2] font-bold">{usr.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#344BC2]/60">Login OTP:</span>
                      <span className={`font-semibold ${usr.otpEnabled ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {usr.otpEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {usr.id !== 'usr-superadmin' && (
                      <div className="flex justify-between">
                        <span className="text-[#344BC2]/60">Status:</span>
                        <span className={`font-semibold ${usr.isActive ? 'text-emerald-700' : 'text-red-700'}`}>
                          {usr.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#344BC2]/60">Created Date:</span>
                      <span className="text-[#344BC2]">{usr.createdAt}</span>
                    </div>
                  </div>
                </div>

                {/* Available user-management actions */}
                {(canPerform('userManagement', 'edit') || canPerform('userManagement', 'delete') || (isSuperAdmin && usr.id !== 'usr-superadmin' && !usr.isActive)) && (
                  <div className="pt-3 border-t border-[#159E37] flex flex-wrap items-center justify-end gap-2">
                    {isSuperAdmin && usr.id !== 'usr-superadmin' && !usr.isActive && (
                      <button
                        onClick={() => {
                          void (async () => {
                            const result = await activateAdminUser(usr.id);
                            notify(result.success ? 'success' : 'error', result.message);
                          })();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-200 cursor-pointer"
                        title="Activate this account and reset its failed sign-in attempts"
                      >
                        <span>Activate</span>
                      </button>
                    )}
                    {/* 1. Edit User Details */}
                    {canPerform('userManagement', 'edit') && usr.id !== 'usr-superadmin' && <button
                      onClick={() => {
                        setEditTargetUser(usr);
                        setIsEditAdminOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#344BC2]/10 text-[#344BC2] text-xs font-bold flex items-center gap-1.5 transition-all border border-[#159E37] cursor-pointer"
                      title="Edit admin account details"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#344BC2]" />
                      <span>Edit</span>
                    </button>}

                    {/* 2. Reset Password (Default Password Only) */}
                    {canPerform('userManagement', 'edit') && usr.id !== currentUser.id && (
                      <button
                        onClick={() => {
                          setResetTargetUser(usr);
                          setIsResetPasswordOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        title="Reset password to default password"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Pass</span>
                      </button>
                    )}

                    {/* 3. Delete Admin User (Primary Super Admin protected) */}
                    {canPerform('userManagement', 'delete') && usr.id !== currentUser.id && usr.id !== 'usr-superadmin' && (
                      <button
                        onClick={() => {
                          void (async () => {
                            if (!await confirm('Delete admin account?', `Move "${usr.name}" (${usr.email}) to deleted records? This will immediately revoke their admin sessions.`)) return;
                            const result = await deleteAdminUser(usr.id);
                            notify(result.success ? 'success' : 'error', result.success ? 'Admin account moved to deleted records.' : result.message);
                          })();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-all border border-red-200 cursor-pointer"
                        title="Delete administrative account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* TAB 5: VS CODE & DEPLOYMENT GUIDE (Developer & Admin reference)   */}
      {/* ----------------------------------------------------------------- */}
      {activeTab === 'deployment' && canAccess('deployment') && (
        <div className="space-y-6 text-xs text-[#344BC2] leading-relaxed">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-[#344BC2] font-serif">
              Full-Stack Architecture & VS Code Deployment Guide
            </h3>
            <p className="text-xs text-[#344BC2]/70">
              Clear folder structure with dedicated frontend & backend architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How to Change Logo & Photos */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#159E37] space-y-4 shadow-md text-[#344BC2]">
              <div className="flex items-center gap-2 text-[#344BC2] font-bold text-sm">
                <FileCode className="w-5 h-5 text-[#b45309]" />
                <span>1. How to Change Logo & Images from Code</span>
              </div>
              <p>
                All brand identity, photos, phone numbers, and Telegram redirects are centralized in a single configuration file:
              </p>
              <div className="p-3 rounded-xl bg-[#344BC2] font-mono text-[11px] text-amber-300">
                src/config/branding.ts
              </div>
              <ul className="space-y-1.5 list-disc list-inside text-[#344BC2]/85">
                <li><strong className="text-[#344BC2]">To change the logo:</strong> Update <code className="text-[#344BC2] font-bold bg-slate-100 px-1 rounded">BRAND_ASSETS.logo</code> or customize the vector in <code className="text-[#344BC2] font-bold bg-slate-100 px-1 rounded">src/components/common/BrandLogo.tsx</code>.</li>
                <li><strong className="text-[#344BC2]">To upload menu photos:</strong> Choose an image in the Add/Edit Menu Item form. Resized photos and menu items are saved to the database.</li>
                <li><strong className="text-[#344BC2]">To change Telegram/Email:</strong> Edit <code className="text-[#344BC2] font-bold bg-slate-100 px-1 rounded">BRAND_CONFIG.telegramUsername</code> and <code className="text-[#344BC2] font-bold bg-slate-100 px-1 rounded">BRAND_CONFIG.orderEmail</code>.</li>
              </ul>
            </div>

            {/* Run in VS Code & Deployment */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#159E37] space-y-4 shadow-md text-[#344BC2]">
              <div className="flex items-center gap-2 text-[#344BC2] font-bold text-sm">
                <Terminal className="w-5 h-5 text-[#b45309]" />
                <span>2. Run Full-Stack in VS Code Terminal</span>
              </div>
              <p>Node.js Express backend and Vite frontend run together on port 3000:</p>
              <div className="p-3 rounded-xl bg-[#344BC2] font-mono text-[11px] text-white space-y-1">
                <p className="text-amber-300"># 1. Install dependencies</p>
                <p>npm install</p>
                <p className="text-amber-300 pt-1"># 2. Start full-stack server (Port 3000)</p>
                <p>npm run dev</p>
                <p className="text-amber-300 pt-1"># 3. Build for production</p>
                <p>npm run build</p>
              </div>
              <p className="text-[#344BC2]/80">
                Ready for one-click deployment to Vercel, Netlify, or Google Cloud Run!
              </p>
            </div>

            {/* Real Email & SMS Verification Security Overview */}
            <div className="p-6 rounded-2xl bg-white border-2 border-[#159E37] space-y-4 shadow-md text-[#344BC2] lg:col-span-2">
              <div className="flex items-center gap-2 text-[#344BC2] font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-[#b45309]" />
                <span>3. Two-Factor Authentication via Email & SMS Inbox</span>
              </div>
              <p className="text-xs text-[#344BC2]/85 leading-relaxed">
                For administrative security, 2-Factor Authentication passcodes are dispatched strictly to the administrator's registered mobile phone SMS (<strong className="text-[#344BC2]">0943305937</strong> via Ethio Telecom) and registered email address (<strong className="text-[#344BC2]">enyewmekete65@gmail.com</strong>).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-[#159E37] space-y-2">
                  <p className="font-bold text-[#344BC2] flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-amber-500" />
                    <span>Email Inbox Retrieval</span>
                  </p>
                  <p className="text-[11px] text-[#344BC2]/80 leading-relaxed">
                    Access the registered email inbox at <strong className="text-[#344BC2]">{currentUser.email}</strong> to read the 6-digit verification code. The code is never displayed on the public screen or console.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-[#159E37] space-y-2">
                  <p className="font-bold text-[#344BC2] flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Phone SMS Retrieval</span>
                  </p>
                  <p className="text-[11px] text-[#344BC2]/80 leading-relaxed">
                    Check the registered phone at <strong className="text-[#344BC2]">{currentUser.phone}</strong> if SMS delivery is configured. Enter the emailed code in the verification modal to authenticate.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Folder Structure Map with Frontend & Backend */}
          <div className="p-6 rounded-2xl bg-white border-2 border-[#159E37] space-y-3 shadow-md text-[#344BC2]">
            <h4 className="font-bold text-sm text-[#344BC2] flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#344BC2]" /> Full-Stack Frontend & Backend Folder Structure
            </h4>
            <pre className="p-4 rounded-xl bg-[#344BC2] font-mono text-[11px] text-amber-200 overflow-x-auto leading-relaxed">
{`├── frontend/
│   ├── public/                 # Static images and logo
│   ├── src/                    # React app, components, data and styles
│   ├── index.html
│   └── vite.config.ts
├── backend/
│   ├── server/
│   │   ├── routes/api.ts       # Database-backed API and authentication
│   │   ├── database.ts         # Neon schema, migrations and bootstrap data
│   │   └── app.ts              # Express routes and middleware
│   └── index.ts                # API server entry point
├── render.yaml                 # Render backend deployment
├── vercel.json                 # Vercel frontend build and API proxy
└── package.json                # Shared scripts and dependencies`}
            </pre>
          </div>
        </div>
      )}

      {/* Item Modal (Add or Edit) */}
      <EditMenuItemModal
        item={editingItem}
        categories={menuCategories}
        defaultMenuType={adminMenuType}
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={async (data) => {
          if (editingItem) {
            return updateMenuItem(editingItem.id, data);
          }
          return addMenuItem(data);
        }}
      />

      {/* Service Modal (Add or Edit) */}
      <EditServiceModal
        service={editingService}
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={async (data) => {
          if (editingService) {
            return updateService(editingService.id, data);
          }
          return addService(data);
        }}
      />

      {/* Change Own Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />

      {/* Super Admin: Reset Admin Password Modal */}
      <ResetAdminPasswordModal
        targetUser={resetTargetUser}
        isOpen={isResetPasswordOpen}
        onClose={() => {
          setIsResetPasswordOpen(false);
          setResetTargetUser(null);
        }}
      />

      {/* Super Admin: Create Admin User Modal */}
      <CreateAdminUserModal
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
      />

      {/* Super Admin: Edit Admin User Modal */}
      <EditAdminUserModal
        isOpen={isEditAdminOpen}
        user={editTargetUser}
        onClose={() => {
          setIsEditAdminOpen(false);
          setEditTargetUser(null);
        }}
      />
      </div>
    </div>
  );
};

export const AdminPortal: React.FC = () => (
  <AdminFeedbackProvider>
    <AdminPortalContent />
  </AdminFeedbackProvider>
);
