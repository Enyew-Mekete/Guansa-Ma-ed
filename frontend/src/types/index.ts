export type MenuType = 'food' | 'drink';

export interface MenuCategory {
  id: string;
  name: string;
  nameAmharic: string;
  menuType: MenuType;
}

export type StockStatus = 
  | 'in_stock' 
  | 'chefs_special' 
  | 'fresh_today' 
  | 'limited_batch' 
  | 'out_of_stock';

export interface Review {
  id: string;
  author: string;
  rating: number; // 1 to 5
  date: string;
  comment: string;
  verifiedCustomer?: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  nameAmharic: string;
  category: string;
  categoryName?: string;
  categoryNameAmharic?: string;
  menuType: MenuType;
  price: number; // in ETB
  description: string;
  image: string;
  stockStatus: StockStatus;
  ingredients: string[];
  spiceLevel: 'Mild' | 'Medium' | 'Hot' | 'Very Hot' | 'None';
  prepTimeMinutes?: number;
  calories?: number;
  dietaryTags?: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  isFeatured?: boolean;
}

export interface ServiceItem {
  id: string;
  title: string;
  titleAmharic: string;
  description: string;
  tagline: string;
  features: string[];
  badge?: string;
  iconName: string;
}

export interface HeroImage {
  id: string;
  image: string;
  heading: string;
  label: string;
  orientation: 'landscape' | 'portrait';
  width: number;
  height: number;
  borderRadius: number;
}

export type NewsCategory =
  | 'Food Menu'
  | 'Discount'
  | 'Location Change'
  | 'New Branch'
  | 'Gallery'
  | 'Directives / Rules'
  | 'General Update';

export interface NewsPost {
  id: string;
  title: string;
  category: NewsCategory;
  description: string;
  imageDataUrl?: string;
  discountPercent?: number;
  discountItem?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  link?: string;
  createdAt: string;
}

export interface Vacancy {
  id: string;
  position: string;
  experience: string;
  gradeValue?: string;
  salaryAmount?: number;
  salaryAsPerScale: boolean;
  workingLocation: string;
  backgroundEducation: string;
  skills: string;
  shortDescription: string;
  jobDescription?: string;
  dutiesResponsibilities?: string;
  applicationMethod: 'in_person' | 'online';
  applicationLink?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface VacancyApplication {
  id: string;
  vacancyId: string;
  fullName: string;
  email?: string;
  phone: string;
  cgpa?: number;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentDataUrl?: string;
  acceptedTerms?: boolean;
  appliedAt: string;
}

export interface CustomerFeedback {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  description: string;
  createdAt: string;
}

export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

export const ADMIN_SECTIONS = [
  'dashboard',
  'menu',
  'services',
  'orders',
  'feedback',
  'news',
  'vacancies',
  'subscriptions',
  'hero',
  'roleManagement',
  'userManagement',
  'deployment',
  'reports',
] as const;

export const ADMIN_ACTIONS = ['view', 'add', 'edit', 'delete'] as const;

export type AdminSection = typeof ADMIN_SECTIONS[number];
export type AdminAction = typeof ADMIN_ACTIONS[number];
export type AdminPermission = `${AdminSection}:${AdminAction}`;

export const ADMIN_PERMISSIONS: AdminPermission[] = ADMIN_SECTIONS.flatMap((section) =>
  ADMIN_ACTIONS.map((action) => `${section}:${action}` as AdminPermission),
);

export interface AdminAccessRole {
  id: string;
  name: string;
  description: string;
  permissions: AdminPermission[];
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string; // Valid Ethiopian phone (+251...)
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  passwordChangeReason?: 'created' | 'reset';
  createdAt: string;
  lastLogin?: string;
  otpEnabled: boolean;
  profilePhoto?: string;
  assignedRoleId?: string;
  assignedRoleName?: string;
  permissions?: AdminPermission[];
}

export const hasAdminPermission = (
  user: AdminUser | null,
  section: AdminSection,
  action: AdminAction,
): boolean => user?.role === 'SUPER_ADMIN' || Boolean(user?.permissions?.includes(`${section}:${action}`));

export interface OrderItem {
  item: MenuItem;
  quantity: number;
}

export interface Order {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  description: string;
  diningOption: 'dine_in' | 'pickup' | 'delivery';
  deliveryAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface OtpChallenge {
  challengeId: string;
  user: AdminUser;
  sentPhone: string;
  sentEmail: string;
  createdAt: number;
  expiresAt: number;
}
