import { createHash, createHmac, randomBytes, randomInt, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { pool, hashPassword, verifyPassword } from '../database.ts';
import { dispatchOtpNotifications } from '../services/notificationService.ts';
import { ADMIN_PERMISSIONS, AdminAction, AdminPermission, AdminSection } from '../../../frontend/src/types/index.ts';
import { INITIAL_MENU_ITEMS, INITIAL_SERVICES } from '../../../frontend/src/data/initialMenu.ts';
import { INITIAL_MENU_CATEGORIES } from '../../../frontend/src/data/menuCategories.ts';
import { validateEthiopianPhone, validateFeedbackPhone } from '../../../frontend/src/utils/ethiopianPhone.ts';
import { isValidEmailAddress } from '../../../frontend/src/utils/email.ts';

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 5 * 60 * 1000;
const apiRouter = Router();

if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) {
  throw new Error('AUTH_SECRET must be configured with at least 32 characters.');
}

type UserRole = 'SUPER_ADMIN' | 'ADMIN';
interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
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
  customRoleId?: string;
}

interface AuthenticatedUser extends AdminUser {
  passwordHash: string;
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

const asyncHandler = (handler: AsyncHandler): RequestHandler => (req, res, next) => {
  void handler(req, res, next).catch(next);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const publicUser = (row: Record<string, unknown>, includeProfilePhoto = false): AdminUser => ({
  id: String(row.id),
  name: String(row.name),
  email: String(row.email),
  phone: String(row.phone),
  role: row.role as UserRole,
  isActive: row.is_active === undefined ? true : Boolean(row.is_active),
  mustChangePassword: Boolean(row.must_change_password),
  passwordChangeReason: row.password_change_reason === 'created' || row.password_change_reason === 'reset'
    ? row.password_change_reason
    : undefined,
  createdAt: new Date(String(row.created_at)).toISOString(),
  lastLogin: row.last_login ? new Date(String(row.last_login)).toISOString() : undefined,
  otpEnabled: Boolean(row.otp_enabled),
  profilePhoto: includeProfilePhoto && typeof row.profile_photo === 'string' ? row.profile_photo : undefined,
  assignedRoleId: typeof row.custom_role_id === 'string' ? row.custom_role_id : undefined,
  assignedRoleName: typeof row.assigned_role_name === 'string' ? row.assigned_role_name : undefined,
  permissions: Array.isArray(row.assigned_permissions)
    ? row.assigned_permissions.filter((permission): permission is AdminPermission =>
      ADMIN_PERMISSIONS.includes(permission as AdminPermission))
    : undefined,
});

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const otpHash = (challengeId: string, code: string) =>
  createHmac('sha256', process.env.AUTH_SECRET!).update(`${challengeId}:${code}`).digest('hex');

function setSessionCookie(res: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `guansa_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
}

function clearSessionCookie(res: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader('Set-Cookie', `guansa_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`);
}

async function authenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('guansa_session='));
  const token = cookie?.slice('guansa_session='.length);
  if (!token) return null;

  const result = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.role, u.created_at, u.last_login,
            u.otp_enabled, u.profile_photo, u.password_hash, u.custom_role_id,
            u.must_change_password, u.password_change_reason,
            r.name AS assigned_role_name, r.permissions AS assigned_permissions
     FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
     LEFT JOIN admin_access_roles r ON r.role_id = u.custom_role_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.deleted_at IS NULL
       AND (u.is_active = true OR u.id = 'usr-superadmin')`,
    [tokenHash(token)],
  );
  if (!result.rows[0]) return null;

  const row = result.rows[0] as Record<string, unknown>;
  return { ...publicUser(row, true), passwordHash: String(row.password_hash) };
}

const requireAdmin: RequestHandler = asyncHandler(async (req, res, next) => {
  const user = await authenticatedUser(req);
  if (!user) {
    res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    return;
  }
  res.locals.user = user;
  if (user.mustChangePassword && req.path !== '/auth/change-password' && req.path !== '/auth/logout') {
    res.status(403).json({ success: false, message: 'You must change your password before continuing.' });
    return;
  }
  const permissionByPath: Array<[RegExp, AdminSection]> = [
    [/^\/dashboard\/stats$/, 'dashboard'],
    [/^\/menu(?:\/categories)?(?:\/[^/]+)?$/, 'menu'],
    [/^\/services(?:\/[^/]+)?$/, 'services'],
    [/^\/orders(?:\/[^/]+(?:\/status)?)?$/, 'orders'],
    [/^\/feedback$/, 'feedback'],
    [/^\/news(?:\/[^/]+)?$/, 'news'],
    [/^\/vacancies(?:\/[^/]+(?:\/applications)?)?$/, 'vacancies'],
    [/^\/newsletter\/subscribers\/list$/, 'subscriptions'],
    [/^\/hero-images(?:\/[^/]+)?$/, 'hero'],
    [/^\/reports(?:\/[^/]+)?$/, 'reports'],
  ];
  const section = permissionByPath.find(([pattern]) => pattern.test(req.path))?.[1];
  if (section && user.role !== 'SUPER_ADMIN') {
    const action: AdminAction = req.method === 'GET' || req.method === 'HEAD'
      ? 'view'
      : req.method === 'POST'
        ? 'add'
        : req.method === 'DELETE'
          ? 'delete'
          : 'edit';
    const requiredPermission: AdminPermission = `${section}:${action}`;
    const access = await pool.query<{ permissions: AdminPermission[] }>(
      'SELECT permissions FROM admin_access_roles WHERE role_id = COALESCE($1, $2)',
      [user.assignedRoleId ?? null, 'role-default-admin'],
    );
    if (!access.rows[0]?.permissions?.includes(requiredPermission)) {
      res.status(403).json({ success: false, message: 'Your assigned role does not allow this action.' });
      return;
    }
  }
  next();
});

const requireSuperAdmin: RequestHandler = (req, res, next) => {
  const user = res.locals.user as AuthenticatedUser | undefined;
  if (user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, message: 'Only a Super Admin can perform this action.' });
    return;
  }
  next();
};

const requireUserManagement = (action: AdminAction): RequestHandler => asyncHandler(async (_req, res, next) => {
  const user = res.locals.user as AuthenticatedUser | undefined;
  if (user?.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  const result = await pool.query<{ permissions: AdminPermission[] }>(
    'SELECT permissions FROM admin_access_roles WHERE role_id = COALESCE($1, $2)',
    [user?.assignedRoleId ?? null, 'role-default-admin'],
  );
  if (!result.rows[0]?.permissions?.includes(`userManagement:${action}`)) {
    res.status(403).json({ success: false, message: `Your assigned role does not allow user management ${action}.` });
    return;
  }
  next();
});

const requireRoleManagement = (action: AdminAction): RequestHandler => asyncHandler(async (_req, res, next) => {
  const user = res.locals.user as AuthenticatedUser | undefined;
  if (user?.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  const result = await pool.query<{ permissions: AdminPermission[] }>(
    'SELECT permissions FROM admin_access_roles WHERE role_id = COALESCE($1, $2)',
    [user?.assignedRoleId ?? null, 'role-default-admin'],
  );
  if (!result.rows[0]?.permissions?.includes(`roleManagement:${action}`)) {
    res.status(403).json({ success: false, message: `Your assigned role does not allow role management ${action}.` });
    return;
  }
  next();
});

const requireAccessRoleList: RequestHandler = asyncHandler(async (_req, res, next) => {
  const user = res.locals.user as AuthenticatedUser | undefined;
  if (user?.role === 'SUPER_ADMIN') {
    next();
    return;
  }
  const result = await pool.query<{ permissions: AdminPermission[] }>(
    'SELECT permissions FROM admin_access_roles WHERE role_id = COALESCE($1, $2)',
    [user?.assignedRoleId ?? null, 'role-default-admin'],
  );
  const permissions = result.rows[0]?.permissions ?? [];
  if (!permissions.includes('roleManagement:view') && !permissions.includes('userManagement:view')) {
    res.status(403).json({ success: false, message: 'Your assigned role does not allow viewing access roles.' });
    return;
  }
  next();
});

function validText(value: unknown, maxLength = 500): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength;
}

function parseDataUrl(value: unknown, allowedMimeTypes: string[], maxBytes: number): { mimeType: string; data: Buffer } | null {
  if (typeof value !== 'string') return null;
  const match = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/]+={0,2})$/.exec(value);
  if (!match || !allowedMimeTypes.includes(match[1])) return null;
  const data = Buffer.from(match[2], 'base64');
  if (data.length === 0 || data.length > maxBytes || data.toString('base64') !== match[2]) return null;
  return { mimeType: match[1], data };
}

function isSafeExternalLink(value: unknown): boolean {
  if (value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  try {
    const protocol = new URL(value).protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
}

function isValidHeroImage(value: unknown): value is {
  image: string;
  heading: string;
  label: string;
  orientation: 'landscape' | 'portrait';
  width: number;
  height: number;
  borderRadius: number;
} {
  if (!isRecord(value) || !validText(value.heading, 120) || !validText(value.label, 180) ||
      (value.orientation !== 'landscape' && value.orientation !== 'portrait') ||
      typeof value.width !== 'number' || !Number.isInteger(value.width) || value.width < 100 || value.width > 1600 ||
      typeof value.height !== 'number' || !Number.isInteger(value.height) || value.height < 80 || value.height > 1000 ||
      typeof value.borderRadius !== 'number' || !Number.isInteger(value.borderRadius) ||
      value.borderRadius < 0 || value.borderRadius > 200) return false;
  return parseDataUrl(value.image, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 5 * 1024 * 1024) !== null ||
    (typeof value.image === 'string' && /^\/[a-zA-Z0-9._/-]+$/.test(value.image));
}

function establishSession(userId: string, res: Response): Promise<void> {
  const token = randomBytes(32).toString('hex');
  return pool.query(
    'INSERT INTO admin_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
    [tokenHash(token), userId, new Date(Date.now() + SESSION_TTL_MS)],
  ).then(() => setSessionCookie(res, token));
}

async function finishLogin(userId: string, res: Response): Promise<AdminUser> {
  const result = await pool.query(
    `UPDATE admin_users SET last_login = now() WHERE id = $1 AND deleted_at IS NULL
       AND (is_active = true OR id = 'usr-superadmin')
     RETURNING *, (SELECT name FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_role_name,
       (SELECT permissions FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_permissions`,
    [userId],
  );
  if (!result.rows[0]) throw new Error('This admin account is no longer available.');
  await establishSession(userId, res);
  return publicUser(result.rows[0] as Record<string, unknown>, true);
}

// Public menu and services; only authenticated staff may change them.
apiRouter.get('/menu', asyncHandler(async (_req, res) => {
  const result = await pool.query('SELECT data FROM menu_items WHERE deleted_at IS NULL ORDER BY item_id');
  const categories = await pool.query(
    'SELECT category_id, name, name_amharic, menu_type FROM menu_categories WHERE deleted_at IS NULL',
  );
  const categoryById = new Map(categories.rows.map((category) => [category.category_id, category]));
  res.json({
    success: true,
    items: result.rows.map((row) => {
      const item = row.data as Record<string, unknown>;
      const category = categoryById.get(String(item.category));
      return {
        ...item,
        menuType: category?.menu_type ?? item.menuType ?? 'food',
        categoryName: category?.name ?? item.category,
        categoryNameAmharic: category?.name_amharic ?? '',
      };
    }),
  });
}));

apiRouter.get('/menu/categories', asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT category_id AS id, name, name_amharic AS "nameAmharic", menu_type AS "menuType"
     FROM menu_categories WHERE deleted_at IS NULL ORDER BY menu_type, name`,
  );
  res.json({ success: true, categories: result.rows });
}));

apiRouter.post('/menu/categories', requireAdmin, asyncHandler(async (req, res) => {
  const { name, nameAmharic, menuType } = isRecord(req.body) ? req.body : {};
  if (!validText(name, 80) || (nameAmharic !== undefined && typeof nameAmharic !== 'string') ||
      (menuType !== 'food' && menuType !== 'drink')) {
    res.status(400).json({ success: false, message: 'Provide a category name and select Food Menu or Drink Menu.' });
    return;
  }
  const category = {
    id: `category-${randomUUID()}`,
    name: name.trim(),
    nameAmharic: typeof nameAmharic === 'string' ? nameAmharic.trim().slice(0, 80) : '',
    menuType,
  };
  await pool.query(
    'INSERT INTO menu_categories (category_id, name, name_amharic, menu_type) VALUES ($1, $2, $3, $4)',
    [category.id, category.name, category.nameAmharic, category.menuType],
  );
  res.status(201).json({ success: true, category });
}));

apiRouter.put('/menu/categories/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { name, nameAmharic, menuType } = isRecord(req.body) ? req.body : {};
  if (!validText(name, 80) || (nameAmharic !== undefined && typeof nameAmharic !== 'string') ||
      (menuType !== 'food' && menuType !== 'drink')) {
    res.status(400).json({ success: false, message: 'Provide a category name and select Food Menu or Drink Menu.' });
    return;
  }
  const result = await pool.query(
    `UPDATE menu_categories SET name = $2, name_amharic = $3, menu_type = $4
     WHERE category_id = $1 AND deleted_at IS NULL RETURNING category_id AS id, name, name_amharic AS "nameAmharic",
                                      menu_type AS "menuType"`,
    [req.params.id, name.trim(), typeof nameAmharic === 'string' ? nameAmharic.trim().slice(0, 80) : '', menuType],
  );
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Menu category not found.' });
    return;
  }
  res.json({ success: true, category: result.rows[0] });
}));

apiRouter.delete('/menu/categories/:id', requireAdmin, asyncHandler(async (req, res) => {
  const itemCount = await pool.query(
    `SELECT count(*)::int AS count FROM menu_items
     WHERE data->>'category' = $1 AND deleted_at IS NULL`,
    [req.params.id],
  );
  if (Number(itemCount.rows[0].count) > 0) {
    res.status(409).json({ success: false, message: 'Move or delete the menu items in this category before deleting it.' });
    return;
  }
  const result = await pool.query(
    'UPDATE menu_categories SET deleted_at = now() WHERE category_id = $1 AND deleted_at IS NULL',
    [req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'Menu category not found.' });
    return;
  }
  res.json({ success: true });
}));

async function validMenuItemCategory(categoryId: unknown, menuType: unknown): Promise<boolean> {
  if (typeof categoryId !== 'string' || (menuType !== 'food' && menuType !== 'drink')) return false;
  const result = await pool.query(
    'SELECT 1 FROM menu_categories WHERE category_id = $1 AND menu_type = $2 AND deleted_at IS NULL',
    [categoryId, menuType],
  );
  return result.rowCount === 1;
}

apiRouter.post('/menu', requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || !validText(req.body.name, 120) || !validText(req.body.nameAmharic, 120) ||
      !validText(req.body.description, 3000) || !validText(req.body.image, 1_500_000) ||
      typeof req.body.price !== 'number' || !Number.isFinite(req.body.price) || req.body.price <= 0 ||
      !await validMenuItemCategory(req.body.category, req.body.menuType)) {
    res.status(400).json({ success: false, message: 'Provide valid menu item details, price, menu type, and a category belonging to that menu.' });
    return;
  }
  const id = `gm-dish-${randomUUID()}`;
  const item: Record<string, unknown> = { ...req.body, id, rating: 5, reviewCount: 0, reviews: [] };
  await pool.query('INSERT INTO menu_items (item_id, data) VALUES ($1, $2::jsonb)', [id, JSON.stringify(item)]);
  const category = await pool.query(
    'SELECT name, name_amharic FROM menu_categories WHERE category_id = $1 AND deleted_at IS NULL',
    [item.category],
  );
  res.status(201).json({
    success: true,
    item: {
      ...item,
      categoryName: category.rows[0].name,
      categoryNameAmharic: category.rows[0].name_amharic,
    },
  });
}));

apiRouter.post('/menu/reset', requireAdmin, asyncHandler(async (_req, res) => {
  await pool.query('UPDATE menu_items SET deleted_at = now() WHERE deleted_at IS NULL');
  for (const item of INITIAL_MENU_ITEMS) {
    await pool.query(
      `INSERT INTO menu_items (item_id, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (item_id) DO UPDATE SET data = EXCLUDED.data, deleted_at = NULL, updated_at = now()`,
      [item.id, JSON.stringify(item)],
    );
  }
  for (const category of INITIAL_MENU_CATEGORIES) {
    await pool.query(
      `INSERT INTO menu_categories (category_id, name, name_amharic, menu_type)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (category_id) DO UPDATE SET name = EXCLUDED.name,
         name_amharic = EXCLUDED.name_amharic, menu_type = EXCLUDED.menu_type, deleted_at = NULL`,
      [category.id, category.name, category.nameAmharic, category.menuType],
    );
  }
  await pool.query('UPDATE service_items SET deleted_at = now() WHERE deleted_at IS NULL');
  for (const service of INITIAL_SERVICES) {
    await pool.query(
      `INSERT INTO service_items (service_id, data) VALUES ($1, $2::jsonb)
       ON CONFLICT (service_id) DO UPDATE SET data = EXCLUDED.data, deleted_at = NULL, updated_at = now()`,
      [service.id, JSON.stringify(service)],
    );
  }
  res.json({ success: true });
}));

apiRouter.post('/menu/:id/reviews', asyncHandler(async (req, res) => {
  const { author, rating, comment } = isRecord(req.body) ? req.body : {};
  if (!validText(author, 120) || !validText(comment, 2000) ||
      typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    res.status(400).json({ success: false, message: 'A name, comment, and rating from 1 to 5 are required.' });
    return;
  }
  const current = await pool.query('SELECT data FROM menu_items WHERE item_id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (!current.rows[0]) {
    res.status(404).json({ success: false, message: 'Menu item not found.' });
    return;
  }
  const item = current.rows[0].data as Record<string, unknown>;
  const reviews = Array.isArray(item.reviews) ? item.reviews : [];
  const nextReviews = [{
    id: `rev-${randomUUID()}`,
    author: author.trim(),
    rating,
    date: new Date().toISOString().slice(0, 10),
    comment: comment.trim(),
  }, ...reviews];
  const updated = {
    ...item,
    reviews: nextReviews,
    reviewCount: nextReviews.length,
    rating: Number((nextReviews.reduce((sum, review) => sum + Number((review as { rating: number }).rating), 0) / nextReviews.length).toFixed(1)),
  };
  await pool.query('UPDATE menu_items SET data = $2::jsonb, updated_at = now() WHERE item_id = $1 AND deleted_at IS NULL', [
    req.params.id,
    JSON.stringify(updated),
  ]);
  res.status(201).json({ success: true, item: updated });
}));

apiRouter.put('/menu/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) {
    res.status(400).json({ success: false, message: 'A menu item object is required.' });
    return;
  }
  const existing = await pool.query('SELECT data FROM menu_items WHERE item_id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (!existing.rows[0]) {
    res.status(404).json({ success: false, message: 'Menu item not found.' });
    return;
  }
  const merged = { ...(existing.rows[0].data as Record<string, unknown>), ...req.body };
  if (!await validMenuItemCategory(merged.category, merged.menuType)) {
    res.status(400).json({ success: false, message: 'Choose a category that belongs to the selected menu.' });
    return;
  }
  const result = await pool.query('UPDATE menu_items SET data = data || $2::jsonb, updated_at = now() WHERE item_id = $1 AND deleted_at IS NULL RETURNING data', [
    req.params.id,
    JSON.stringify({ ...req.body, menuType: merged.menuType, id: req.params.id }),
  ]);
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Menu item not found.' });
    return;
  }
  const category = await pool.query(
    'SELECT name, name_amharic FROM menu_categories WHERE category_id = $1 AND deleted_at IS NULL',
    [(result.rows[0].data as Record<string, unknown>).category],
  );
  res.json({
    success: true,
    item: {
      ...(result.rows[0].data as Record<string, unknown>),
      categoryName: category.rows[0].name,
      categoryNameAmharic: category.rows[0].name_amharic,
    },
  });
}));

apiRouter.delete('/menu/:id', requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'UPDATE menu_items SET deleted_at = now() WHERE item_id = $1 AND deleted_at IS NULL',
    [req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'Menu item not found.' });
    return;
  }
  res.json({ success: true });
}));

apiRouter.get('/hero-images', asyncHandler(async (_req, res) => {
  const result = await pool.query('SELECT data FROM hero_images WHERE deleted_at IS NULL ORDER BY display_order, created_at');
  res.json({ success: true, heroImages: result.rows.map((row) => row.data) });
}));

apiRouter.post('/hero-images', requireAdmin, asyncHandler(async (req, res) => {
  if (!isValidHeroImage(req.body)) {
    res.status(400).json({ success: false, message: 'Provide a supported image up to 5 MB, heading, label, orientation, and valid width, height, and corner roundness.' });
    return;
  }
  const id = `hero-image-${randomUUID()}`;
  const heroImage = { ...req.body, image: req.body.image, heading: req.body.heading.trim(), label: req.body.label.trim(), id };
  const result = await pool.query(
    `INSERT INTO hero_images (hero_id, data, display_order)
     VALUES ($1, $2::jsonb, COALESCE((SELECT max(display_order) + 1 FROM hero_images), 0))
     RETURNING data`,
    [id, JSON.stringify(heroImage)],
  );
  res.status(201).json({ success: true, heroImage: result.rows[0].data });
}));

apiRouter.put('/hero-images/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!isValidHeroImage(req.body)) {
    res.status(400).json({ success: false, message: 'Provide a supported image up to 5 MB, heading, label, orientation, and valid width, height, and corner roundness.' });
    return;
  }
  const heroImage = { ...req.body, image: req.body.image, heading: req.body.heading.trim(), label: req.body.label.trim(), id: req.params.id };
  const result = await pool.query('UPDATE hero_images SET data = $2::jsonb WHERE hero_id = $1 AND deleted_at IS NULL RETURNING data', [
    req.params.id,
    JSON.stringify(heroImage),
  ]);
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Hero image not found.' });
    return;
  }
  res.json({ success: true, heroImage: result.rows[0].data });
}));

apiRouter.delete('/hero-images/:id', requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query('UPDATE hero_images SET deleted_at = now() WHERE hero_id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'Hero image not found.' });
    return;
  }
  res.json({ success: true });
}));

apiRouter.get('/services', asyncHandler(async (_req, res) => {
  const result = await pool.query('SELECT data FROM service_items WHERE deleted_at IS NULL ORDER BY service_id');
  res.json({ success: true, services: result.rows.map((row) => row.data) });
}));

apiRouter.post('/services', requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || !validText(req.body.title, 120)) {
    res.status(400).json({ success: false, message: 'A service title is required.' });
    return;
  }
  const id = `srv-${randomUUID()}`;
  const service = { ...req.body, id };
  await pool.query('INSERT INTO service_items (service_id, data) VALUES ($1, $2::jsonb)', [id, JSON.stringify(service)]);
  res.status(201).json({ success: true, service });
}));

apiRouter.put('/services/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body)) {
    res.status(400).json({ success: false, message: 'A service object is required.' });
    return;
  }
  const result = await pool.query('UPDATE service_items SET data = data || $2::jsonb, updated_at = now() WHERE service_id = $1 AND deleted_at IS NULL RETURNING data', [
    req.params.id,
    JSON.stringify({ ...req.body, id: req.params.id }),
  ]);
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Service not found.' });
    return;
  }
  res.json({ success: true, service: result.rows[0].data });
}));

apiRouter.delete('/services/:id', requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query('UPDATE service_items SET deleted_at = now() WHERE service_id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'Service not found.' });
    return;
  }
  res.json({ success: true });
}));

// News and vacancy listings are public; mutations and application records are protected.
apiRouter.get('/news', asyncHandler(async (_req, res) => {
  const [posts, reads] = await Promise.all([
    pool.query('SELECT data FROM news_posts WHERE deleted_at IS NULL ORDER BY created_at DESC'),
    pool.query('SELECT r.post_id FROM news_post_reads r JOIN news_posts p ON p.post_id = r.post_id WHERE p.deleted_at IS NULL'),
  ]);
  res.json({
    success: true,
    posts: posts.rows.map((row) => row.data),
    readPostIds: reads.rows.map((row) => row.post_id),
  });
}));

apiRouter.post('/news/:id/read', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `INSERT INTO news_post_reads (post_id)
     SELECT post_id FROM news_posts WHERE post_id = $1 AND deleted_at IS NULL
     ON CONFLICT (post_id) DO NOTHING
     RETURNING post_id`,
    [req.params.id],
  );
  if (result.rowCount === 0) {
    const existing = await pool.query('SELECT post_id FROM news_post_reads WHERE post_id = $1', [req.params.id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ success: false, message: 'News post not found.' });
      return;
    }
  }
  res.json({ success: true, postId: req.params.id });
}));

const validNewsDraft = (body: unknown): body is Record<string, unknown> => {
  if (!isRecord(body) || !validText(body.title, 120) || !validText(body.description, 3000) ||
      !isSafeExternalLink(body.link)) return false;
  const validDate = (value: unknown) => value === undefined ||
    (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value);
  if (!validDate(body.startDate) || !validDate(body.endDate) ||
      (body.category === 'Discount' && typeof body.startDate !== 'string') ||
      (typeof body.startDate === 'string' && typeof body.endDate === 'string' && body.endDate < body.startDate)) return false;
  if (body.category === 'Discount' &&
      (typeof body.discountPercent !== 'number' || body.discountPercent < 1 ||
       body.discountPercent > 100 || !validText(body.discountItem, 160))) return false;
  return body.imageDataUrl === undefined ||
    parseDataUrl(body.imageDataUrl, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], 2 * 1024 * 1024) !== null;
};

apiRouter.post('/news', requireAdmin, asyncHandler(async (req, res) => {
  if (!validNewsDraft(req.body)) {
    res.status(400).json({ success: false, message: 'Provide valid news details. Discount posts need a percentage and item; images must be supported formats under 2 MB.' });
    return;
  }
  const post = { ...req.body, id: `news-${randomUUID()}`, createdAt: new Date().toISOString() };
  await pool.query('INSERT INTO news_posts (post_id, data, created_at) VALUES ($1, $2::jsonb, now())', [
    post.id,
    JSON.stringify(post),
  ]);
  res.status(201).json({ success: true, post });
}));

apiRouter.put('/news/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!validNewsDraft(req.body)) {
    res.status(400).json({ success: false, message: 'Provide valid news details. Discount posts need a percentage and item; images must be supported formats under 2 MB.' });
    return;
  }
  const result = await pool.query(
    `UPDATE news_posts SET data = jsonb_set($2::jsonb, '{createdAt}',
     COALESCE($2::jsonb->'createdAt', data->'createdAt'))
     WHERE post_id = $1 AND deleted_at IS NULL RETURNING data`,
    [
    req.params.id,
    JSON.stringify({ ...req.body, id: req.params.id }),
    ],
  );
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'News post not found.' });
    return;
  }
  res.json({ success: true, post: result.rows[0].data });
}));

apiRouter.delete('/news/:id', requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query('UPDATE news_posts SET deleted_at = now() WHERE post_id = $1 AND deleted_at IS NULL', [req.params.id]);
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'News post not found.' });
    return;
  }
  res.json({ success: true });
}));

apiRouter.get('/dashboard/stats', requireAdmin, asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT
      (SELECT count(*)::int FROM admin_users WHERE deleted_at IS NULL) AS "adminUsers",
      (SELECT count(*)::int FROM service_items WHERE deleted_at IS NULL) AS services,
      (SELECT count(DISTINCT data->>'category')::int FROM menu_items WHERE deleted_at IS NULL) AS categories,
      (SELECT count(*)::int FROM menu_items WHERE deleted_at IS NULL) AS products,
      (SELECT count(*)::int FROM vacancies WHERE deleted_at IS NULL AND (expires_at IS NULL OR expires_at >= now())) AS "activeVacancies",
      (SELECT count(*)::int FROM news_posts WHERE deleted_at IS NULL) AS news,
      (SELECT count(*)::int FROM customer_orders) AS orders,
      (SELECT count(*)::int FROM newsletter_subscribers) AS subscribers,
      (SELECT count(*)::int FROM customer_feedback) AS feedback`,
  );
  res.json({ success: true, stats: result.rows[0] });
}));

apiRouter.get('/reports', requireAdmin, asyncHandler(async (req, res) => {
  const types = ['overview', 'orders', 'feedback', 'news', 'users', 'menu', 'vacancies', 'subscriptions', 'services', 'hero'];
  const type = req.query.type === undefined ? 'overview' : req.query.type;
  if (typeof type !== 'string' || !types.includes(type)) {
    res.status(400).json({ success: false, message: 'Choose a supported report type.' });
    return;
  }
  const dateValue = (value: unknown) => {
    if (value === undefined) return null;
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        Number.isNaN(Date.parse(`${value}T00:00:00Z`)) ||
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value) return undefined;
    return value;
  };
  const from = dateValue(req.query.from);
  const to = dateValue(req.query.to);
  if (from === undefined || to === undefined || (from && to && from > to)) {
    res.status(400).json({ success: false, message: 'Choose a valid report date range.' });
    return;
  }
  if (req.query.search !== undefined && typeof req.query.search !== 'string') {
    res.status(400).json({ success: false, message: 'Search must be a single text value.' });
    return;
  }
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 120) : '';
  const inRange = (column: string) =>
    `${column} >= COALESCE($1::date, '0001-01-01'::date) AND ${column} < COALESCE($2::date + interval '1 day', '9999-12-31'::date)`;
  const records: Record<string, unknown>[] = [];

  if (type === 'orders' || type === 'overview') {
    const result = await pool.query(
      `SELECT order_id AS "orderId", customer_name AS "customerName", phone, email,
              status, dining_option AS "diningOption", total_amount AS "totalAmount", created_at AS "createdAt"
       FROM customer_orders WHERE ${inRange('created_at')}
         AND ($3 = '' OR customer_name ILIKE '%' || $3 || '%' OR phone ILIKE '%' || $3 || '%')
       ORDER BY created_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...(type === 'overview' ? result.rows.map((row) => ({ type: 'order', ...row })) : result.rows));
  }
  if (type === 'feedback' || type === 'overview') {
    const result = await pool.query(
      `SELECT feedback_id AS id, full_name AS "fullName", phone, email, description, created_at AS "createdAt"
       FROM customer_feedback WHERE ${inRange('created_at')}
         AND ($3 = '' OR full_name ILIKE '%' || $3 || '%' OR description ILIKE '%' || $3 || '%')
       ORDER BY created_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...(type === 'overview' ? result.rows.map((row) => ({ type: 'feedback', ...row })) : result.rows));
  }
  if (type === 'news' || type === 'overview') {
    const result = await pool.query(
      `SELECT post_id AS id, data->>'title' AS title, data->>'category' AS category, created_at AS "createdAt"
       FROM news_posts WHERE deleted_at IS NULL AND ${inRange('created_at')}
         AND ($3 = '' OR data->>'title' ILIKE '%' || $3 || '%' OR data->>'category' ILIKE '%' || $3 || '%')
       ORDER BY created_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...(type === 'overview' ? result.rows.map((row) => ({ type: 'news', ...row })) : result.rows));
  }
  if (type === 'users') {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, r.name AS "assignedRole",
              u.created_at AS "createdAt", u.last_login AS "lastLogin"
       FROM admin_users u LEFT JOIN admin_access_roles r ON r.role_id = u.custom_role_id
       WHERE u.deleted_at IS NULL AND ${inRange('u.created_at')}
         AND ($3 = '' OR u.name ILIKE '%' || $3 || '%' OR u.email ILIKE '%' || $3 || '%')
       ORDER BY u.created_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...result.rows);
  }
  if (type === 'menu') {
    const result = await pool.query(
      `SELECT item_id AS id, data->>'name' AS name, data->>'category' AS category,
              data->>'price' AS price, updated_at AS "updatedAt"
       FROM menu_items WHERE deleted_at IS NULL AND ${inRange('updated_at')}
         AND ($3 = '' OR data->>'name' ILIKE '%' || $3 || '%' OR data->>'category' ILIKE '%' || $3 || '%')
       ORDER BY updated_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...result.rows);
  }
  if (type === 'vacancies') {
    const result = await pool.query(
      `SELECT vacancy_id AS id, data->>'position' AS position, posted_at AS "postedAt", expires_at AS "expiresAt"
       FROM vacancies WHERE deleted_at IS NULL AND ${inRange('posted_at')}
         AND ($3 = '' OR data->>'position' ILIKE '%' || $3 || '%')
       ORDER BY posted_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...result.rows);
  }
  if (type === 'subscriptions') {
    const result = await pool.query(
      `SELECT email, subscribed_at AS "subscribedAt" FROM newsletter_subscribers
       WHERE ${inRange('subscribed_at')} AND ($3 = '' OR email ILIKE '%' || $3 || '%')
       ORDER BY subscribed_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...result.rows);
  }
  if (type === 'services' || type === 'overview') {
    const result = await pool.query(
      `SELECT service_id AS id, data->>'title' AS title, data->>'description' AS description, updated_at AS "updatedAt"
       FROM service_items WHERE deleted_at IS NULL AND ${inRange('updated_at')}
         AND ($3 = '' OR data->>'title' ILIKE '%' || $3 || '%')
       ORDER BY updated_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...(type === 'overview' ? result.rows.map((row) => ({ type: 'service', ...row })) : result.rows));
  }
  if (type === 'hero' || type === 'overview') {
    const result = await pool.query(
      `SELECT hero_id AS id, data->>'heading' AS heading, data->>'label' AS label, created_at AS "createdAt"
       FROM hero_images WHERE deleted_at IS NULL AND ${inRange('created_at')}
         AND ($3 = '' OR data->>'heading' ILIKE '%' || $3 || '%' OR data->>'label' ILIKE '%' || $3 || '%')
       ORDER BY created_at DESC LIMIT 5000`,
      [from, to, search],
    );
    records.push(...(type === 'overview' ? result.rows.map((row) => ({ type: 'hero', ...row })) : result.rows));
  }
  if (type === 'overview') {
    const [menu, vacancies, subscriptions, users] = await Promise.all([
      pool.query(
        `SELECT item_id AS id, data->>'name' AS name, data->>'category' AS category, updated_at AS "updatedAt"
         FROM menu_items WHERE deleted_at IS NULL AND ${inRange('updated_at')}
           AND ($3 = '' OR data->>'name' ILIKE '%' || $3 || '%' OR data->>'category' ILIKE '%' || $3 || '%')
         ORDER BY updated_at DESC LIMIT 5000`,
        [from, to, search],
      ),
      pool.query(
        `SELECT vacancy_id AS id, data->>'position' AS position, posted_at AS "postedAt", expires_at AS "expiresAt"
         FROM vacancies WHERE deleted_at IS NULL AND ${inRange('posted_at')}
           AND ($3 = '' OR data->>'position' ILIKE '%' || $3 || '%')
         ORDER BY posted_at DESC LIMIT 5000`,
        [from, to, search],
      ),
      pool.query(
        `SELECT email, subscribed_at AS "subscribedAt" FROM newsletter_subscribers
         WHERE ${inRange('subscribed_at')} AND ($3 = '' OR email ILIKE '%' || $3 || '%')
         ORDER BY subscribed_at DESC LIMIT 5000`,
        [from, to, search],
      ),
      pool.query(
        `SELECT u.id, u.name, u.email, u.role, r.name AS "assignedRole", u.created_at AS "createdAt"
         FROM admin_users u LEFT JOIN admin_access_roles r ON r.role_id = u.custom_role_id
         WHERE u.deleted_at IS NULL AND ${inRange('u.created_at')}
           AND ($3 = '' OR u.name ILIKE '%' || $3 || '%' OR u.email ILIKE '%' || $3 || '%')
         ORDER BY u.created_at DESC LIMIT 5000`,
        [from, to, search],
      ),
    ]);
    records.push(...menu.rows.map((row) => ({ type: 'menu', ...row })));
    records.push(...vacancies.rows.map((row) => ({ type: 'vacancy', ...row })));
    records.push(...subscriptions.rows.map((row) => ({ type: 'subscription', ...row })));
    records.push(...users.rows.map((row) => ({ type: 'user', ...row })));
  }
  res.json({ success: true, type, from, to, records, generatedAt: new Date().toISOString() });
}));

apiRouter.get('/vacancies', asyncHandler(async (_req, res) => {
  const [vacancies, reads] = await Promise.all([
    pool.query('SELECT data FROM vacancies WHERE deleted_at IS NULL ORDER BY posted_at DESC'),
    pool.query('SELECT r.vacancy_id FROM vacancy_reads r JOIN vacancies v ON v.vacancy_id = r.vacancy_id WHERE v.deleted_at IS NULL'),
  ]);
  res.json({
    success: true,
    vacancies: vacancies.rows.map((row) => row.data),
    readVacancyIds: reads.rows.map((row) => row.vacancy_id),
  });
}));

apiRouter.post('/vacancies/:id/read', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `INSERT INTO vacancy_reads (vacancy_id)
     SELECT vacancy_id FROM vacancies WHERE vacancy_id = $1 AND deleted_at IS NULL
     ON CONFLICT (vacancy_id) DO NOTHING
     RETURNING vacancy_id`,
    [req.params.id],
  );
  if (result.rowCount === 0) {
    const existing = await pool.query('SELECT vacancy_id FROM vacancy_reads WHERE vacancy_id = $1', [req.params.id]);
    if (existing.rowCount === 0) {
      res.status(404).json({ success: false, message: 'Vacancy not found.' });
      return;
    }
  }
  res.json({ success: true, vacancyId: req.params.id });
}));

apiRouter.get('/content/read-state', asyncHandler(async (_req, res) => {
  const [newsReads, vacancyReads] = await Promise.all([
    pool.query('SELECT r.post_id FROM news_post_reads r JOIN news_posts p ON p.post_id = r.post_id WHERE p.deleted_at IS NULL'),
    pool.query('SELECT r.vacancy_id FROM vacancy_reads r JOIN vacancies v ON v.vacancy_id = r.vacancy_id WHERE v.deleted_at IS NULL'),
  ]);
  res.json({
    success: true,
    readPostIds: newsReads.rows.map((row) => row.post_id),
    readVacancyIds: vacancyReads.rows.map((row) => row.vacancy_id),
  });
}));

apiRouter.post('/vacancies', requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || !validText(req.body.position, 120) ||
      !isSafeExternalLink(req.body.applicationLink)) {
    res.status(400).json({ success: false, message: 'A vacancy position is required.' });
    return;
  }
  const vacancy = { ...req.body, id: `vacancy-${randomUUID()}`, createdAt: new Date().toISOString() };
  const expiresAt = validText(req.body.expiresAt, 80) ? req.body.expiresAt : null;
  await pool.query(
    'INSERT INTO vacancies (vacancy_id, data, posted_at, expires_at) VALUES ($1, $2::jsonb, now(), $3)',
    [vacancy.id, JSON.stringify(vacancy), expiresAt],
  );
  res.status(201).json({ success: true, vacancy });
}));

apiRouter.put('/vacancies/:id', requireAdmin, asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || !validText(req.body.position, 120) ||
      !isSafeExternalLink(req.body.applicationLink)) {
    res.status(400).json({ success: false, message: 'A vacancy position is required.' });
    return;
  }
  const vacancy = { ...req.body, id: req.params.id };
  const expiresAt = validText(req.body.expiresAt, 80) ? req.body.expiresAt : null;
  const result = await pool.query(
    `UPDATE vacancies SET data = jsonb_set($2::jsonb, '{createdAt}',
     COALESCE($2::jsonb->'createdAt', data->'createdAt')),
     expires_at = $3 WHERE vacancy_id = $1 AND deleted_at IS NULL RETURNING data`,
    [req.params.id, JSON.stringify(vacancy), expiresAt],
  );
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Vacancy not found.' });
    return;
  }
  res.json({ success: true, vacancy: result.rows[0].data });
}));

apiRouter.delete('/vacancies/:id', requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query(
    'UPDATE vacancies SET deleted_at = now() WHERE vacancy_id = $1 AND deleted_at IS NULL',
    [req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'Vacancy not found.' });
    return;
  }
  res.json({ success: true, message: 'Vacancy hidden. Applicant records have been retained.' });
}));

apiRouter.get('/vacancies/:id/applications', requireAdmin, asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT application.application_id AS id, application.vacancy_id AS "vacancyId",
           application.full_name AS "fullName", application.email, application.phone,
           application.cgpa::float8 AS cgpa, application.attachment_name AS "attachmentName",
           application.attachment_mime_type AS "attachmentMimeType",
           encode(application.attachment_data, 'base64') AS "attachmentBase64",
           application.accepted_terms AS "acceptedTerms", application.applied_at AS "appliedAt"
     FROM vacancy_applications application
     JOIN vacancies vacancy ON vacancy.vacancy_id = application.vacancy_id
     WHERE application.vacancy_id = $1 AND vacancy.deleted_at IS NULL
     ORDER BY application.applied_at DESC`,
    [req.params.id],
  );
  res.json({
    success: true,
    applications: result.rows.map((application) => ({
      ...application,
      attachmentDataUrl: application.attachmentBase64
        ? `data:${application.attachmentMimeType};base64,${application.attachmentBase64}`
        : undefined,
      attachmentBase64: undefined,
    })),
  });
}));

apiRouter.post('/vacancies/:id/applications', asyncHandler(async (req, res) => {
  const { fullName, email, phone, cgpa, attachmentName, attachmentDataUrl, acceptedTerms } = isRecord(req.body) ? req.body : {};
  const file = parseDataUrl(attachmentDataUrl, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif'], 4 * 1024 * 1024);
  const phoneCheck = typeof phone === 'string' ? validateEthiopianPhone(phone) : { isValid: false };
  if (!validText(fullName, 180) || !validText(phone, 40) || !phoneCheck.isValid ||
      typeof cgpa !== 'number' || !Number.isFinite(cgpa) || cgpa < 0 || cgpa > 4 ||
      (email !== undefined && email !== '' &&
        (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
      !validText(attachmentName, 180) || !file || acceptedTerms !== true) {
    res.status(400).json({ success: false, message: 'Provide your name, a valid Ethiopian phone, a CGPA from 0.00 to 4.00, a PDF or image under 4 MB, and accept the terms. Email is optional.' });
    return;
  }
  const vacancy = await pool.query(
    `SELECT expires_at, data->>'applicationMethod' AS application_method
     FROM vacancies WHERE vacancy_id = $1 AND deleted_at IS NULL`,
    [req.params.id],
  );
  if (!vacancy.rows[0] || vacancy.rows[0].application_method !== 'online' ||
      (vacancy.rows[0].expires_at && new Date(vacancy.rows[0].expires_at) < new Date())) {
    res.status(404).json({ success: false, message: 'This vacancy is no longer accepting applications.' });
    return;
  }
  const result = await pool.query(
    `WITH allocated AS (
       UPDATE vacancy_application_id_counter
       SET next_value = next_value + 1
       WHERE counter_name = 'APP/EN1'
       RETURNING next_value - 1 AS value
     )
     INSERT INTO vacancy_applications
       (application_id, vacancy_id, full_name, email, phone, cgpa, attachment_name, attachment_mime_type, attachment_data, accepted_terms)
     SELECT 'APP/EN1/' || lpad(allocated.value::text, 6, '0'),
            $1, $2, $3, $4, $5, $6, $7, $8, true
     FROM allocated
     RETURNING application_id AS id, vacancy_id AS "vacancyId", full_name AS "fullName",
               email, phone, cgpa::float8 AS cgpa, attachment_name AS "attachmentName",
               attachment_mime_type AS "attachmentMimeType", accepted_terms AS "acceptedTerms",
               applied_at AS "appliedAt"`,
    [req.params.id, fullName.trim(), typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null,
      phoneCheck.normalized, cgpa, attachmentName.trim(), file.mimeType, file.data],
  );
  res.status(201).json({ success: true, application: result.rows[0] });
}));

apiRouter.get('/feedback', requireAdmin, asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT feedback_id AS id, full_name AS "fullName", phone, email,
            description, created_at AS "createdAt"
     FROM customer_feedback ORDER BY created_at DESC`,
  );
  res.json({ success: true, feedback: result.rows });
}));

apiRouter.post('/feedback', asyncHandler(async (req, res) => {
  const { fullName, phone, email, description } = isRecord(req.body) ? req.body : {};
  const phoneCheck = typeof phone === 'string' ? validateFeedbackPhone(phone) : { isValid: false };
  if (!validText(fullName, 180) || !validText(description, 3000) || !validText(phone, 40) ||
      !phoneCheck.isValid ||
      (email !== undefined && email !== '' &&
        (typeof email !== 'string' || !isValidEmailAddress(email)))) {
    res.status(400).json({ success: false, message: 'Provide your full name, a valid Ethiopian mobile number (09 or +251 9), and a description. If provided, the email address must be valid.' });
    return;
  }
  const result = await pool.query(
    `INSERT INTO customer_feedback (feedback_id, full_name, phone, email, description)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING feedback_id AS id, full_name AS "fullName", phone, email,
               description, created_at AS "createdAt"`,
    [`feedback-${randomUUID()}`, fullName.trim(), phoneCheck.normalized,
      typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null, description.trim()],
  );
  res.status(201).json({ success: true, feedback: result.rows[0] });
}));

// Orders and newsletter subscribers are durable Neon records.
apiRouter.get('/orders', requireAdmin, asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT order_id AS "orderId", customer_name AS "customerName", phone, email,
            description, dining_option AS "diningOption", delivery_address AS "deliveryAddress",
            items, total_amount AS "totalAmount", status, created_at AS "createdAt"
     FROM customer_orders ORDER BY created_at DESC`,
  );
  res.json({ success: true, count: result.rowCount, orders: result.rows });
}));

apiRouter.post('/orders', asyncHandler(async (req, res) => {
  if (!isRecord(req.body) || !validText(req.body.customerName, 180) ||
      !validText(req.body.phone, 40) || !Array.isArray(req.body.items) || req.body.items.length === 0) {
    res.status(400).json({ success: false, message: 'Customer name, phone number, and at least one order item are required.' });
    return;
  }

  const requestedItems = req.body.items.filter((item): item is Record<string, unknown> => isRecord(item) && isRecord(item.item));
  if (requestedItems.length !== req.body.items.length) {
    res.status(400).json({ success: false, message: 'The order contains an invalid item.' });
    return;
  }
  const ids = requestedItems.map((entry) => String((entry.item as Record<string, unknown>).id || ''));
  const menuResult = await pool.query('SELECT item_id, data FROM menu_items WHERE item_id = ANY($1::text[]) AND deleted_at IS NULL', [ids]);
  const menuById = new Map(menuResult.rows.map((row) => [row.item_id as string, row.data as Record<string, unknown>]));
  if (ids.some((id) => !menuById.has(id)) || requestedItems.some((entry) => {
    const quantity = Number(entry.quantity);
    return !Number.isInteger(quantity) || quantity < 1 || quantity > 99;
  })) {
    res.status(400).json({ success: false, message: 'An order item is unavailable or has an invalid quantity.' });
    return;
  }
  let totalAmount = 0;
  const items = requestedItems.map((entry) => {
    const itemId = String((entry.item as Record<string, unknown>).id || '');
    const item = menuById.get(itemId);
    const quantity = Number(entry.quantity);
    if (!item) throw new Error('Menu item disappeared during order creation.');
    const price = Number(item.price);
    totalAmount += price * quantity;
    return { item, quantity };
  });

  const orderId = validText(req.body.orderId, 80) ? req.body.orderId : `order-${randomUUID()}`;
  const diningOption = ['dine_in', 'pickup', 'delivery'].includes(String(req.body.diningOption))
    ? String(req.body.diningOption)
    : 'dine_in';
  const result = await pool.query(
    `INSERT INTO customer_orders
     (order_id, customer_name, phone, email, description, dining_option, delivery_address, items, total_amount)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
     RETURNING order_id AS "orderId", customer_name AS "customerName", phone, email,
               description, dining_option AS "diningOption", delivery_address AS "deliveryAddress",
               items, total_amount AS "totalAmount", status, created_at AS "createdAt"`,
    [
      orderId,
      req.body.customerName.trim(),
      req.body.phone.trim(),
      validText(req.body.email, 254) ? req.body.email.trim().toLowerCase() : null,
      typeof req.body.description === 'string' ? req.body.description.slice(0, 2000) : '',
      diningOption,
      typeof req.body.deliveryAddress === 'string' ? req.body.deliveryAddress.slice(0, 500) : null,
      JSON.stringify(items),
      totalAmount,
    ],
  );
  res.status(201).json({ success: true, order: result.rows[0] });
}));

apiRouter.patch('/orders/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const validStatuses = ['pending', 'confirmed', 'preparing', 'completed', 'cancelled'];
  if (!validStatuses.includes(String(req.body?.status))) {
    res.status(400).json({ success: false, message: 'An allowed order status is required.' });
    return;
  }
  const result = await pool.query(
    'UPDATE customer_orders SET status = $2 WHERE order_id = $1 RETURNING order_id',
    [req.params.id, req.body.status],
  );
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Order not found.' });
    return;
  }
  res.json({ success: true });
}));

apiRouter.get('/newsletter/subscribers', asyncHandler(async (_req, res) => {
  const result = await pool.query('SELECT count(*)::int AS count FROM newsletter_subscribers');
  res.json({ success: true, count: result.rows[0].count });
}));

apiRouter.get('/newsletter/subscribers/list', requireAdmin, asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT email, subscribed_at AS "subscribedAt"
     FROM newsletter_subscribers ORDER BY subscribed_at DESC`,
  );
  res.json({ success: true, subscribers: result.rows });
}));

apiRouter.post('/newsletter/subscribe', asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    return;
  }
  const result = await pool.query(
    'INSERT INTO newsletter_subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING email',
    [email],
  );
  if (!result.rows[0]) {
    const count = await pool.query('SELECT count(*)::int AS count FROM newsletter_subscribers');
    res.status(409).json({ success: false, isDuplicate: true, message: 'This email is already subscribed.', count: count.rows[0].count });
    return;
  }
  const count = await pool.query('SELECT count(*)::int AS count FROM newsletter_subscribers');
  res.status(201).json({ success: true, message: 'Thank you for subscribing!', count: count.rows[0].count });
}));

// Administrative authentication. OTP codes and sessions never reach browser storage.
apiRouter.post('/auth/login', asyncHandler(async (req, res) => {
  const { identifier, password } = isRecord(req.body) ? req.body : {};
  if (!validText(identifier, 254) || !validText(password, 500)) {
    res.status(400).json({ success: false, message: 'Username and password are required.' });
    return;
  }
  const trimmed = identifier.trim().toLowerCase();
  const rawDigits = trimmed.includes('@') ? '' : trimmed.replace(/\D/g, '');
  const digits = rawDigits.startsWith('00251')
    ? rawDigits.slice(5)
    : rawDigits.startsWith('251')
      ? rawDigits.slice(3)
      : rawDigits;
  let result = await pool.query(
    `SELECT u.*, r.name AS assigned_role_name, r.permissions AS assigned_permissions
     FROM admin_users u LEFT JOIN admin_access_roles r ON r.role_id = u.custom_role_id
     WHERE (lower(u.email) = $1 OR u.id = 'usr-superadmin' AND $1 = 'superadmin@guansamaed.et')
       AND u.deleted_at IS NULL
     LIMIT 1`,
    [trimmed],
  );
  if (!result.rows[0] && digits) {
    result = await pool.query(
      `SELECT u.*, r.name AS assigned_role_name, r.permissions AS assigned_permissions
       FROM admin_users u LEFT JOIN admin_access_roles r ON r.role_id = u.custom_role_id
       WHERE ($1 <> '' AND (
         regexp_replace(u.phone, '[^0-9]', '', 'g') = $2
         OR length($2) IN (9, 10) AND right(regexp_replace(u.phone, '[^0-9]', '', 'g'), 9) = right($2, 9)
       )) AND u.deleted_at IS NULL
       ORDER BY u.created_at
       LIMIT 2`,
      [trimmed, digits],
    );
    if (result.rows.length > 1) {
      res.status(401).json({ success: false, message: 'These credentials match multiple accounts. Sign in using your email address.' });
      return;
    }
  }
  const account = result.rows[0] as Record<string, unknown> | undefined;
  if (!account) {
    res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    return;
  }
  const lockedAccountMessage = 'Too Many Attempts. Contact Your System Administrator.';
  if (account.id !== 'usr-superadmin' && !Boolean(account.is_active)) {
    res.status(403).json({ success: false, message: lockedAccountMessage });
    return;
  }
  if (!(await verifyPassword(password, String(account.password_hash)))) {
    if (account.id !== 'usr-superadmin') {
      const attempts = await pool.query<{ failed_login_attempts: number; is_active: boolean }>(
        `UPDATE admin_users
         SET failed_login_attempts = failed_login_attempts + 1,
             is_active = CASE WHEN failed_login_attempts + 1 >= 3 THEN false ELSE is_active END
         WHERE id = $1 AND is_active = true AND deleted_at IS NULL
         RETURNING failed_login_attempts, is_active`,
        [account.id],
      );
      if (!attempts.rows[0] || !attempts.rows[0].is_active || Number(attempts.rows[0].failed_login_attempts) >= 3) {
        await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [account.id]);
        await pool.query('DELETE FROM admin_otp_challenges WHERE user_id = $1', [account.id]);
        res.status(429).json({ success: false, message: lockedAccountMessage });
        return;
      }
    }
    res.status(401).json({ success: false, message: 'Invalid administrative credentials.' });
    return;
  }
  if (account.id !== 'usr-superadmin') {
    const activeAccount = await pool.query(
      `UPDATE admin_users SET failed_login_attempts = 0
       WHERE id = $1 AND is_active = true AND deleted_at IS NULL
       RETURNING id`,
      [account.id],
    );
    if (!activeAccount.rows[0]) {
      res.status(403).json({ success: false, message: lockedAccountMessage });
      return;
    }
  }

  if (!Boolean(account.otp_enabled)) {
    const user = await finishLogin(String(account.id), res);
    res.json({ success: true, user, otpRequired: false });
    return;
  }

  const challengeId = randomUUID();
  const code = String(randomInt(100000, 1000000));
  await pool.query(
    'INSERT INTO admin_otp_challenges (challenge_id, user_id, code_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [challengeId, account.id, otpHash(challengeId, code), new Date(Date.now() + OTP_TTL_MS)],
  );
  const delivery = await dispatchOtpNotifications({
    phone: String(account.phone),
    email: String(account.email),
    name: String(account.name),
    code,
  });
  if (!delivery.emailSent) {
    await pool.query('DELETE FROM admin_otp_challenges WHERE challenge_id = $1', [challengeId]);
    res.status(502).json({
      success: false,
      message: delivery.emailError || delivery.error || 'OTP email delivery failed.',
    });
    return;
  }
  res.json({
    success: true,
    otpRequired: true,
    challenge: {
      challengeId,
      user: publicUser(account),
      sentPhone: account.phone,
      sentEmail: account.email,
      expiresAt: Date.now() + OTP_TTL_MS,
    },
  });
}));

apiRouter.post('/auth/verify-otp', asyncHandler(async (req, res) => {
  const { challengeId, code } = isRecord(req.body) ? req.body : {};
  if (!validText(challengeId, 80) || typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    res.status(400).json({ success: false, message: 'Enter the six-digit verification code.' });
    return;
  }
  const result = await pool.query(
    `SELECT c.user_id, c.code_hash, c.attempts, c.expires_at, u.is_active
     FROM admin_otp_challenges c
     JOIN admin_users u ON u.id = c.user_id AND u.deleted_at IS NULL
       AND (u.is_active = true OR u.id = 'usr-superadmin')
     WHERE c.challenge_id = $1`,
    [challengeId],
  );
  const challenge = result.rows[0];
  if (!challenge || new Date(challenge.expires_at) <= new Date()) {
    await pool.query('DELETE FROM admin_otp_challenges WHERE challenge_id = $1', [challengeId]);
    res.status(401).json({ success: false, message: 'OTP has expired. Please sign in again.' });
    return;
  }
  if (String(challenge.user_id) !== 'usr-superadmin' && !Boolean(challenge.is_active)) {
    await pool.query('DELETE FROM admin_otp_challenges WHERE challenge_id = $1', [challengeId]);
    res.status(403).json({ success: false, message: 'Too Many Attempts. Contact Your System Administrator.' });
    return;
  }
  if (Number(challenge.attempts) >= 3) {
    await pool.query('DELETE FROM admin_otp_challenges WHERE challenge_id = $1', [challengeId]);
    res.status(429).json({ success: false, message: 'Too Many Attempts. Contact Your System Administrator.' });
    return;
  }
  const suppliedHash = Buffer.from(otpHash(challengeId, code), 'hex');
  const expectedHash = Buffer.from(String(challenge.code_hash), 'hex');
  if (!timingSafeEqual(suppliedHash, expectedHash)) {
    const updatedChallenge = await pool.query<{ attempts: number }>(
      'UPDATE admin_otp_challenges SET attempts = attempts + 1 WHERE challenge_id = $1 RETURNING attempts',
      [challengeId],
    );
    if (Number(updatedChallenge.rows[0]?.attempts) >= 3) {
      if (String(challenge.user_id) !== 'usr-superadmin') {
        await pool.query('UPDATE admin_users SET is_active = false WHERE id = $1 AND is_active = true', [challenge.user_id]);
        await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [challenge.user_id]);
      }
      await pool.query('DELETE FROM admin_otp_challenges WHERE user_id = $1', [challenge.user_id]);
      res.status(429).json({ success: false, message: 'Too Many Attempts. Contact Your System Administrator.' });
      return;
    }
    res.status(401).json({ success: false, message: 'Incorrect verification code.' });
    return;
  }
  await pool.query('DELETE FROM admin_otp_challenges WHERE challenge_id = $1', [challengeId]);
  const user = await finishLogin(String(challenge.user_id), res);
  res.json({ success: true, user });
}));

apiRouter.post('/auth/resend-otp', asyncHandler(async (req, res) => {
  const challengeId = typeof req.body?.challengeId === 'string' ? req.body.challengeId : '';
  const result = await pool.query(
    `SELECT c.user_id, u.email, u.phone, u.name FROM admin_otp_challenges c
     JOIN admin_users u ON u.id = c.user_id AND u.deleted_at IS NULL
     WHERE c.challenge_id = $1 AND c.expires_at > now()`,
    [challengeId],
  );
  const account = result.rows[0];
  if (!account) {
    res.status(404).json({ success: false, message: 'OTP session has expired. Please sign in again.' });
    return;
  }
  const resendCount = await pool.query<{ resends: number }>(
    'SELECT resends FROM admin_otp_challenges WHERE challenge_id = $1',
    [challengeId],
  );
  if (Number(resendCount.rows[0]?.resends) >= 3) {
    res.status(429).json({ success: false, message: 'OTP resend limit reached. Please sign in again.' });
    return;
  }
  const code = String(randomInt(100000, 1000000));
  await pool.query(
    'UPDATE admin_otp_challenges SET code_hash = $2, attempts = 0, resends = resends + 1, expires_at = $3 WHERE challenge_id = $1',
    [challengeId, otpHash(challengeId, code), new Date(Date.now() + OTP_TTL_MS)],
  );
  const delivery = await dispatchOtpNotifications({
    phone: String(account.phone),
    email: String(account.email),
    name: String(account.name),
    code,
  });
  if (!delivery.emailSent) {
    res.status(502).json({ success: false, message: delivery.emailError || delivery.error || 'OTP email delivery failed.' });
    return;
  }
  res.json({ success: true, expiresAt: Date.now() + OTP_TTL_MS });
}));

apiRouter.delete('/auth/otp/:id', asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM admin_otp_challenges WHERE challenge_id = $1', [req.params.id]);
  res.json({ success: true });
}));

apiRouter.get('/auth/me', asyncHandler(async (req, res) => {
  const user = await authenticatedUser(req);
  if (!user) {
    clearSessionCookie(res);
    res.status(401).json({ success: false, message: 'Not signed in.' });
    return;
  }
  const { passwordHash: _passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
}));

apiRouter.post('/auth/logout', requireAdmin, asyncHandler(async (req, res) => {
  const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('guansa_session='));
  const token = cookie?.slice('guansa_session='.length);
  if (token) await pool.query('DELETE FROM admin_sessions WHERE token_hash = $1', [tokenHash(token)]);
  clearSessionCookie(res);
  res.json({ success: true });
}));

apiRouter.post('/auth/change-password', requireAdmin, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = isRecord(req.body) ? req.body : {};
  const user = res.locals.user as AuthenticatedUser;
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' ||
      newPassword.length < 8 || newPassword !== confirmPassword) {
    res.status(400).json({ success: false, message: 'Use a new password with at least 8 characters and confirm it correctly.' });
    return;
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    res.status(401).json({ success: false, message: 'Current password does not match our records.' });
    return;
  }
  await pool.query(
    `UPDATE admin_users SET password_hash = $2, must_change_password = false,
       password_change_reason = NULL WHERE id = $1`,
    [user.id, await hashPassword(newPassword)],
  );
  res.json({ success: true, message: 'Your password was changed successfully.' });
}));

apiRouter.put('/auth/profile-photo', requireAdmin, asyncHandler(async (req, res) => {
  const { profilePhoto } = isRecord(req.body) ? req.body : {};
  const image = parseDataUrl(profilePhoto, ['image/jpeg', 'image/png', 'image/webp'], 2 * 1024 * 1024);
  if (!image || typeof profilePhoto !== 'string') {
    res.status(400).json({ success: false, message: 'Choose a JPG, PNG, or WebP profile image under 2 MB.' });
    return;
  }
  const user = res.locals.user as AuthenticatedUser;
  await pool.query('UPDATE admin_users SET profile_photo = $2 WHERE id = $1', [user.id, profilePhoto]);
  const result = await pool.query('SELECT * FROM admin_users WHERE id = $1', [user.id]);
  res.json({ success: true, user: publicUser(result.rows[0] as Record<string, unknown>, true) });
}));

const validPermissionList = (value: unknown): value is AdminPermission[] =>
  Array.isArray(value) && value.every((permission) => ADMIN_PERMISSIONS.includes(permission as AdminPermission));

apiRouter.get('/auth/roles', requireAdmin, requireAccessRoleList, asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT role_id AS id, name, description, permissions, created_at AS "createdAt"
     FROM admin_access_roles ORDER BY name`,
  );
  res.json({ success: true, roles: result.rows });
}));

apiRouter.post('/auth/roles', requireAdmin, requireRoleManagement('add'), asyncHandler(async (req, res) => {
  const { name, description, permissions } = isRecord(req.body) ? req.body : {};
  if (!validText(name, 80) || (description !== undefined && typeof description !== 'string') ||
      (typeof description === 'string' && description.length > 500) || !validPermissionList(permissions)) {
    res.status(400).json({ success: false, message: 'Provide a role name, description up to 500 characters, and valid permissions.' });
    return;
  }
  const id = `role-${randomUUID()}`;
  try {
    const result = await pool.query(
      `INSERT INTO admin_access_roles (role_id, name, description, permissions)
       VALUES ($1, $2, $3, $4::jsonb)
       RETURNING role_id AS id, name, description, permissions, created_at AS "createdAt"`,
      [id, name.trim(), typeof description === 'string' ? description.trim() : '', JSON.stringify(permissions)],
    );
    res.status(201).json({ success: true, role: result.rows[0] });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, message: 'A role with that name already exists.' });
      return;
    }
    throw error;
  }
}));

apiRouter.patch('/auth/roles/:id', requireAdmin, requireRoleManagement('edit'), asyncHandler(async (req, res) => {
  const { name, description, permissions } = isRecord(req.body) ? req.body : {};
  if (!validText(name, 80) || (description !== undefined && typeof description !== 'string') ||
      (typeof description === 'string' && description.length > 500) || !validPermissionList(permissions)) {
    res.status(400).json({ success: false, message: 'Provide a role name, description up to 500 characters, and valid permissions.' });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE admin_access_roles SET name = $2, description = $3, permissions = $4::jsonb
       WHERE role_id = $1
       RETURNING role_id AS id, name, description, permissions, created_at AS "createdAt"`,
      [req.params.id, name.trim(), typeof description === 'string' ? description.trim() : '', JSON.stringify(permissions)],
    );
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'Role not found.' });
      return;
    }
    res.json({ success: true, role: result.rows[0] });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      res.status(409).json({ success: false, message: 'A role with that name already exists.' });
      return;
    }
    throw error;
  }
}));

apiRouter.delete('/auth/roles/:id', requireAdmin, requireRoleManagement('delete'), asyncHandler(async (req, res) => {
  if (req.params.id === 'role-default-admin') {
    res.status(400).json({ success: false, message: 'Default Admin Access cannot be deleted.' });
    return;
  }
  const assigned = await pool.query('SELECT 1 FROM admin_users WHERE custom_role_id = $1 AND deleted_at IS NULL LIMIT 1', [req.params.id]);
  if (assigned.rowCount) {
    res.status(409).json({ success: false, message: 'Reassign users before deleting this role.' });
    return;
  }
  const result = await pool.query('DELETE FROM admin_access_roles WHERE role_id = $1 RETURNING role_id', [req.params.id]);
  if (!result.rowCount) {
    res.status(404).json({ success: false, message: 'Role not found.' });
    return;
  }
  res.json({ success: true });
}));

apiRouter.get('/auth/admins', requireAdmin, requireUserManagement('view'), asyncHandler(async (_req, res) => {
  const currentUser = res.locals.user as AuthenticatedUser;
  const result = await pool.query(
    `SELECT u.*, r.name AS assigned_role_name, r.permissions AS assigned_permissions
     FROM admin_users u LEFT JOIN admin_access_roles r ON r.role_id = u.custom_role_id
     WHERE u.deleted_at IS NULL AND ($1 = 'usr-superadmin' OR u.id <> 'usr-superadmin')
     ORDER BY u.created_at`,
    [currentUser.id],
  );
  res.json({ success: true, users: result.rows.map((row) => publicUser(row as Record<string, unknown>)) });
}));

apiRouter.post('/auth/admins', requireAdmin, requireUserManagement('add'), asyncHandler(async (req, res) => {
  const { name, email, phone, initialPassword, otpEnabled, assignedRoleId } = isRecord(req.body) ? req.body : {};
  const phoneCheck = typeof phone === 'string' ? validateEthiopianPhone(phone) : null;
  if (!validText(name, 180) || !validText(email, 254) || !validText(phone, 40) ||
      typeof initialPassword !== 'string' || initialPassword.length < 8 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !phoneCheck?.isValid ||
      (assignedRoleId !== undefined && typeof assignedRoleId !== 'string')) {
    res.status(400).json({ success: false, message: 'Provide a valid name, email, phone number, and password of at least 8 characters.' });
    return;
  }
  const effectiveRoleId = typeof assignedRoleId === 'string' ? assignedRoleId : 'role-default-admin';
  if (!(await pool.query('SELECT 1 FROM admin_access_roles WHERE role_id = $1', [effectiveRoleId])).rowCount) {
    res.status(400).json({ success: false, message: 'Choose an existing access role.' });
    return;
  }
  const duplicate = await pool.query<{ duplicate_email: boolean; duplicate_phone: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM admin_users WHERE lower(email) = lower($1)) AS duplicate_email,
            EXISTS (
              SELECT 1 FROM admin_users
              WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) =
                    right(regexp_replace($2, '[^0-9]', '', 'g'), 9)
            ) AS duplicate_phone`,
    [email.trim(), phoneCheck.normalized || phone.trim()],
  );
  if (duplicate.rows[0]?.duplicate_email || duplicate.rows[0]?.duplicate_phone) {
    res.status(409).json({
      success: false,
      message: duplicate.rows[0].duplicate_email
        ? 'This email address is already assigned to a user.'
        : 'This phone number is already assigned to a user.',
    });
    return;
  }
  const id = `usr-admin-${randomUUID()}`;
  try {
    const result = await pool.query(
      `INSERT INTO admin_users (id, name, email, phone, role, password_hash, otp_enabled, custom_role_id, must_change_password, password_change_reason)
       VALUES ($1, $2, lower($3), $4, 'ADMIN', $5, $6, $7, true, 'created')
       RETURNING *, (SELECT name FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_role_name,
         (SELECT permissions FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_permissions`,
      [id, name.trim(), email.trim(), phoneCheck.normalized || phone.trim(), await hashPassword(initialPassword), otpEnabled !== false, effectiveRoleId],
    );
    res.status(201).json({ success: true, user: publicUser(result.rows[0] as Record<string, unknown>) });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      const constraint = (error as { constraint?: string }).constraint;
      res.status(409).json({
        success: false,
        message: constraint === 'admin_users_phone_digits_uidx'
          ? 'This phone number is already assigned to a user.'
          : 'This email address is already assigned to a user.',
      });
      return;
    }
    throw error;
  }
}));

apiRouter.post('/auth/admins/:id/activate', requireAdmin, requireSuperAdmin, asyncHandler(async (req, res) => {
  if (req.params.id === 'usr-superadmin') {
    res.status(400).json({ success: false, message: 'The built-in Super Admin account does not use account activation status.' });
    return;
  }
  const result = await pool.query(
    `UPDATE admin_users
     SET is_active = true, failed_login_attempts = 0
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *, (SELECT name FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_role_name,
       (SELECT permissions FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_permissions`,
    [req.params.id],
  );
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Admin account not found.' });
    return;
  }
  await pool.query('DELETE FROM admin_otp_challenges WHERE user_id = $1', [req.params.id]);
  await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [req.params.id]);
  res.json({ success: true, user: publicUser(result.rows[0] as Record<string, unknown>) });
}));

apiRouter.patch('/auth/admins/:id', requireAdmin, requireUserManagement('edit'), asyncHandler(async (req, res) => {
  if (req.params.id === 'usr-superadmin') {
    res.status(403).json({ success: false, message: 'The built-in Super Admin account cannot be edited through User Management.' });
    return;
  }
  const { name, email, phone, otpEnabled, assignedRoleId } = isRecord(req.body) ? req.body : {};
  const phoneCheck = typeof phone === 'string' ? validateEthiopianPhone(phone) : null;
  if (!validText(name, 180) || !validText(email, 254) || !validText(phone, 40) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof otpEnabled !== 'boolean' || !phoneCheck?.isValid ||
      (assignedRoleId !== undefined && typeof assignedRoleId !== 'string')) {
    res.status(400).json({ success: false, message: 'Provide valid account details, role, and OTP setting.' });
    return;
  }
  const effectiveRoleId = typeof assignedRoleId === 'string' ? assignedRoleId : 'role-default-admin';
  if (!(await pool.query('SELECT 1 FROM admin_access_roles WHERE role_id = $1', [effectiveRoleId])).rowCount) {
    res.status(400).json({ success: false, message: 'Choose an existing access role.' });
    return;
  }
  const duplicate = await pool.query<{ duplicate_email: boolean; duplicate_phone: boolean }>(
    `SELECT EXISTS (
              SELECT 1 FROM admin_users WHERE lower(email) = lower($1) AND id <> $3
            ) AS duplicate_email,
            EXISTS (
              SELECT 1 FROM admin_users
              WHERE right(regexp_replace(phone, '[^0-9]', '', 'g'), 9) =
                    right(regexp_replace($2, '[^0-9]', '', 'g'), 9)
                AND id <> $3
            ) AS duplicate_phone`,
    [email.trim(), phoneCheck.normalized || phone.trim(), req.params.id],
  );
  if (duplicate.rows[0]?.duplicate_email || duplicate.rows[0]?.duplicate_phone) {
    res.status(409).json({
      success: false,
      message: duplicate.rows[0].duplicate_email
        ? 'This email address is already assigned to another user.'
        : 'This phone number is already assigned to another user.',
    });
    return;
  }
  try {
    const result = await pool.query(
      `UPDATE admin_users SET name = $2, email = lower($3), phone = $4,
       otp_enabled = $5, custom_role_id = $6
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *, (SELECT name FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_role_name,
         (SELECT permissions FROM admin_access_roles WHERE role_id = custom_role_id) AS assigned_permissions`,
      [req.params.id, name.trim(), email.trim(), phoneCheck.normalized || phone.trim(), otpEnabled, effectiveRoleId],
    );
    if (!result.rows[0]) {
      res.status(404).json({ success: false, message: 'Admin account not found.' });
      return;
    }
    res.json({ success: true, user: publicUser(result.rows[0] as Record<string, unknown>) });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      const constraint = (error as { constraint?: string }).constraint;
      res.status(409).json({
        success: false,
        message: constraint === 'admin_users_phone_digits_uidx'
          ? 'This phone number is already assigned to another user.'
          : 'This email address is already assigned to another user.',
      });
      return;
    }
    throw error;
  }
}));

apiRouter.delete('/auth/admins/:id', requireAdmin, requireUserManagement('delete'), asyncHandler(async (req, res) => {
  const currentUser = res.locals.user as AuthenticatedUser;
  if (req.params.id === 'usr-superadmin' || req.params.id === currentUser.id) {
    res.status(400).json({ success: false, message: 'The primary Super Admin account cannot be deleted.' });
    return;
  }
  const result = await pool.query(
    'UPDATE admin_users SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL',
    [req.params.id],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ success: false, message: 'Admin account not found.' });
    return;
  }
  await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [req.params.id]);
  await pool.query('DELETE FROM admin_otp_challenges WHERE user_id = $1', [req.params.id]);
  res.json({ success: true });
}));

apiRouter.post('/auth/admins/:id/reset-password', requireAdmin, requireUserManagement('edit'), asyncHandler(async (req, res) => {
  if (req.params.id === 'usr-superadmin') {
    res.status(403).json({ success: false, message: 'The built-in Super Admin account cannot be managed through User Management.' });
    return;
  }
  const password = req.body?.newPassword;
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ success: false, message: 'The new password must contain at least 8 characters.' });
    return;
  }
  const result = await pool.query(
    `UPDATE admin_users SET password_hash = $2, must_change_password = true,
       password_change_reason = 'reset' WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
    [req.params.id, await hashPassword(password)],
  );
  if (!result.rows[0]) {
    res.status(404).json({ success: false, message: 'Admin account not found.' });
    return;
  }
  await pool.query('DELETE FROM admin_sessions WHERE user_id = $1', [req.params.id]);
  res.json({ success: true, message: 'Admin password was reset successfully.' });
}));

apiRouter.get('/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({
    status: 'ok',
    restaurant: "Guansa Ma'ed ጓንሳ ማዕድ",
    database: 'connected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}));

export { apiRouter };
