import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { INITIAL_MENU_ITEMS, INITIAL_SERVICES } from '../../frontend/src/data/initialMenu.ts';
import { INITIAL_MENU_CATEGORIES } from '../../frontend/src/data/menuCategories.ts';
import { ADMIN_ACTIONS, ADMIN_PERMISSIONS, ADMIN_SECTIONS } from '../../frontend/src/types/index.ts';

const scrypt = promisify(scryptCallback);

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required. Configure the Neon PostgreSQL connection string before starting the server.');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHex] = storedHash.split(':');
  if (!salt || !expectedHex) return false;

  const expected = Buffer.from(expectedHex, 'hex');
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function initializeDatabase(): Promise<void> {
  const schema = [
    `CREATE TABLE IF NOT EXISTS admin_users (
      id text PRIMARY KEY,
      name text NOT NULL,
      email text NOT NULL UNIQUE,
      phone text NOT NULL,
      role text NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN')),
      password_hash text NOT NULL,
      otp_enabled boolean NOT NULL DEFAULT true,
      is_active boolean NOT NULL DEFAULT true,
      failed_login_attempts integer NOT NULL DEFAULT 0,
      must_change_password boolean NOT NULL DEFAULT false,
      password_change_reason text,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_login timestamptz,
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS admin_access_roles (
      role_id text PRIMARY KEY,
      name text NOT NULL UNIQUE,
      description text NOT NULL DEFAULT '',
      permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash text PRIMARY KEY,
      user_id text NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admin_otp_challenges (
      challenge_id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      code_hash text NOT NULL,
      attempts integer NOT NULL DEFAULT 0,
      resends integer NOT NULL DEFAULT 0,
      expires_at timestamptz NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS menu_items (
      item_id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS menu_categories (
      category_id text PRIMARY KEY,
      name text NOT NULL,
      name_amharic text NOT NULL DEFAULT '',
      menu_type text NOT NULL CHECK (menu_type IN ('food', 'drink')),
      created_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS service_items (
      service_id text PRIMARY KEY,
      data jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS hero_images (
      hero_id text PRIMARY KEY,
      data jsonb NOT NULL,
      display_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS news_posts (
      post_id text PRIMARY KEY,
      data jsonb NOT NULL,
      created_at timestamptz NOT NULL,
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS news_post_reads (
      post_id text PRIMARY KEY REFERENCES news_posts(post_id) ON DELETE CASCADE,
      read_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS vacancies (
      vacancy_id text PRIMARY KEY,
      data jsonb NOT NULL,
      posted_at timestamptz NOT NULL,
      expires_at timestamptz,
      deleted_at timestamptz
    )`,
    `CREATE TABLE IF NOT EXISTS vacancy_reads (
      vacancy_id text PRIMARY KEY REFERENCES vacancies(vacancy_id) ON DELETE CASCADE,
      read_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS vacancy_applications (
      application_id text PRIMARY KEY,
      vacancy_id text NOT NULL REFERENCES vacancies(vacancy_id) ON DELETE RESTRICT,
      full_name text NOT NULL,
      email text,
      phone text NOT NULL,
      attachment_name text NOT NULL,
      attachment_mime_type text NOT NULL,
      attachment_data bytea NOT NULL,
      accepted_terms boolean NOT NULL DEFAULT false,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS vacancy_application_id_counter (
      counter_name text PRIMARY KEY,
      next_value bigint NOT NULL CHECK (next_value >= 0)
    )`,
    `CREATE TABLE IF NOT EXISTS customer_feedback (
      feedback_id text PRIMARY KEY,
      full_name text NOT NULL,
      phone text NOT NULL,
      email text,
      description text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS customer_orders (
      order_id text PRIMARY KEY,
      customer_name text NOT NULL,
      phone text NOT NULL,
      email text,
      description text NOT NULL DEFAULT '',
      dining_option text NOT NULL,
      delivery_address text,
      items jsonb NOT NULL,
      total_amount numeric(12, 2) NOT NULL,
      status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')),
      created_at timestamptz NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      email text PRIMARY KEY,
      subscribed_at timestamptz NOT NULL DEFAULT now()
    )`,
  ];

  for (const statement of schema) {
    await pool.query(statement);
  }
  for (const table of ['admin_users', 'menu_items', 'menu_categories', 'service_items', 'hero_images', 'news_posts', 'vacancies']) {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS deleted_at timestamptz`);
  }
  const heroCount = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM hero_images');
  if (Number(heroCount.rows[0].count) === 0) {
    const defaultHeroImages = [
      {
        id: 'hero-image-1',
        image: '/GMHero1.png',
        heading: 'Traditional Ethiopian Food & Drinks',
        label: "Guansa Ma'ed · Authentic Ethiopian cuisine",
        orientation: 'landscape',
        width: 600,
        height: 288,
        borderRadius: 16,
      },
      {
        id: 'hero-image-2',
        image: '/GMHero2.png',
        heading: 'Our Menu',
        label: 'Food, coffee, and traditional drinks',
        orientation: 'landscape',
        width: 600,
        height: 288,
        borderRadius: 16,
      },
    ];
    for (const [displayOrder, heroImage] of defaultHeroImages.entries()) {
      await pool.query(
        'INSERT INTO hero_images (hero_id, data, display_order) VALUES ($1, $2::jsonb, $3) ON CONFLICT (hero_id) DO NOTHING',
        [heroImage.id, JSON.stringify(heroImage), displayOrder],
      );
    }
  }
  for (const category of INITIAL_MENU_CATEGORIES) {
    await pool.query(
      `INSERT INTO menu_categories (category_id, name, name_amharic, menu_type)
       VALUES ($1, $2, $3, $4) ON CONFLICT (category_id) DO NOTHING`,
      [category.id, category.name, category.nameAmharic, category.menuType],
    );
  }
  await pool.query(
    `UPDATE menu_items item SET data = jsonb_set(
       COALESCE(item.data, '{}'::jsonb), '{menuType}',
       to_jsonb(category.menu_type), true)
     FROM menu_categories category
     WHERE item.data->>'category' = category.category_id
       AND item.data->>'menuType' IS DISTINCT FROM category.menu_type`,
  );
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS profile_photo text');
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS custom_role_id text');
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true');
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0');
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false');
  await pool.query('ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_change_reason text');
  await pool.query(
    `UPDATE admin_users SET password_change_reason = 'created'
     WHERE must_change_password = true AND password_change_reason IS NULL`,
  );
  const duplicateAccounts = await pool.query(
    `SELECT EXISTS (
       SELECT 1 FROM admin_users GROUP BY lower(email) HAVING count(*) > 1
     ) AS duplicate_email,
     EXISTS (
       SELECT 1 FROM admin_users
       GROUP BY right(regexp_replace(phone, '[^0-9]', '', 'g'), 9)
       HAVING count(*) > 1
     ) AS duplicate_phone`,
  );
  const hasDuplicateEmail = Boolean(duplicateAccounts.rows[0]?.duplicate_email);
  const hasDuplicatePhone = Boolean(duplicateAccounts.rows[0]?.duplicate_phone);
  if (hasDuplicateEmail) {
    console.error('[Database] Cannot enforce case-insensitive admin email uniqueness until existing duplicate email addresses are resolved.');
  } else {
    await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS admin_users_email_lower_uidx ON admin_users (lower(email))');
  }
  if (hasDuplicatePhone) {
    console.error('[Database] Cannot enforce normalized admin phone uniqueness until existing duplicate phone numbers are resolved.');
  } else {
    await pool.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS admin_users_phone_digits_uidx
       ON admin_users (right(regexp_replace(phone, '[^0-9]', '', 'g'), 9))`,
    );
  }
  const defaultAdminPermissions = ADMIN_PERMISSIONS.filter((permission) =>
    !permission.startsWith('roleManagement:') &&
    !permission.startsWith('userManagement:') &&
    !permission.startsWith('deployment:') &&
    !permission.startsWith('reports:'),
  );
  await pool.query(
    `INSERT INTO admin_access_roles (role_id, name, description, permissions)
     VALUES ('role-default-admin', 'Default Admin Access', 'Standard administrative access for staff accounts.', $1::jsonb)
     ON CONFLICT (role_id) DO NOTHING`,
    [JSON.stringify(defaultAdminPermissions)],
  );
  await pool.query(
    `UPDATE admin_users SET custom_role_id = 'role-default-admin'
     WHERE role = 'ADMIN' AND custom_role_id IS NULL AND deleted_at IS NULL`,
  );
  const savedRoles = await pool.query<{ role_id: string; permissions: unknown }>(
    'SELECT role_id, permissions FROM admin_access_roles',
  );
  for (const role of savedRoles.rows) {
    if (!Array.isArray(role.permissions)) continue;
    const previousSections = role.permissions.filter(
      (permission): permission is string => typeof permission === 'string' && ADMIN_SECTIONS.includes(permission as typeof ADMIN_SECTIONS[number]),
    );
    if (!previousSections.length) continue;
    const permissions = [...new Set([
      ...role.permissions.filter((permission): permission is string =>
        typeof permission === 'string' && ADMIN_PERMISSIONS.includes(permission as typeof ADMIN_PERMISSIONS[number])),
      ...previousSections.flatMap((section) => ADMIN_ACTIONS.map((action) => `${section}:${action}`)),
    ])];
    await pool.query('UPDATE admin_access_roles SET permissions = $2::jsonb WHERE role_id = $1', [
      role.role_id,
      JSON.stringify(permissions),
    ]);
  }
  await pool.query('ALTER TABLE vacancy_applications ALTER COLUMN email DROP NOT NULL');
  await pool.query('ALTER TABLE vacancy_applications ADD COLUMN IF NOT EXISTS attachment_name text');
  await pool.query('ALTER TABLE vacancy_applications ADD COLUMN IF NOT EXISTS attachment_mime_type text');
  await pool.query('ALTER TABLE vacancy_applications ADD COLUMN IF NOT EXISTS attachment_data bytea');
  await pool.query('ALTER TABLE vacancy_applications ADD COLUMN IF NOT EXISTS accepted_terms boolean NOT NULL DEFAULT false');
  await pool.query('ALTER TABLE vacancy_applications ADD COLUMN IF NOT EXISTS cgpa numeric(5, 2)');
  await pool.query(
    `INSERT INTO vacancy_application_id_counter (counter_name, next_value)
     SELECT 'APP/EN1', COALESCE(MAX(substring(application_id FROM '^APP/EN1/([0-9]+)$')::bigint), -1) + 1
     FROM vacancy_applications
     ON CONFLICT (counter_name) DO NOTHING`,
  );
  await pool.query('ALTER TABLE admin_otp_challenges ADD COLUMN IF NOT EXISTS resends integer NOT NULL DEFAULT 0');
  await pool.query('DELETE FROM admin_sessions WHERE expires_at <= now()');
  await pool.query('DELETE FROM admin_otp_challenges WHERE expires_at <= now()');

  await seedInitialMenu();
  await seedInitialAdmins();
}

async function seedInitialMenu(): Promise<void> {
  const menuCount = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM menu_items');
  if (Number(menuCount.rows[0]?.count) === 0) {
    for (const item of INITIAL_MENU_ITEMS) {
      await pool.query('INSERT INTO menu_items (item_id, data) VALUES ($1, $2::jsonb) ON CONFLICT (item_id) DO NOTHING', [
        item.id,
        JSON.stringify(item),
      ]);
    }
  }

  const serviceCount = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM service_items');
  if (Number(serviceCount.rows[0]?.count) === 0) {
    for (const item of INITIAL_SERVICES) {
      await pool.query('INSERT INTO service_items (service_id, data) VALUES ($1, $2::jsonb) ON CONFLICT (service_id) DO NOTHING', [
        item.id,
        JSON.stringify(item),
      ]);
    }
  }
}

async function seedInitialAdmins(): Promise<void> {
  const users = await pool.query<{ count: string }>('SELECT count(*)::text AS count FROM admin_users');
  if (Number(users.rows[0]?.count) > 0) return;

  const superAdminPassword = process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!superAdminPassword || !adminPassword) {
    console.warn('[Database] Admin accounts were not seeded. Set BOOTSTRAP_SUPER_ADMIN_PASSWORD and BOOTSTRAP_ADMIN_PASSWORD before first login.');
    return;
  }
  if (superAdminPassword.length < 8 || adminPassword.length < 8 || superAdminPassword === adminPassword) {
    throw new Error('Bootstrap passwords must each be at least 8 characters and must be different.');
  }

  const initialAdmins = [
    {
      id: 'usr-superadmin',
      name: process.env.BOOTSTRAP_SUPER_ADMIN_NAME || "Enyew M. (CEO & Founder of En-Tech S.C)",
      email: process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || 'enyewmekete65@gmail.com',
      phone: process.env.BOOTSTRAP_SUPER_ADMIN_PHONE || '0943305937',
      role: 'SUPER_ADMIN',
      password: superAdminPassword,
    },
    {
      id: 'usr-admin-tsedey',
      name: process.env.BOOTSTRAP_ADMIN_NAME || 'Tsedey Alemu (Operations Admin)',
      email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@guansamaed.et',
      phone: process.env.BOOTSTRAP_ADMIN_PHONE || '0115502331',
      role: 'ADMIN',
      password: adminPassword,
    },
  ];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const admin of initialAdmins) {
      await client.query(
        `INSERT INTO admin_users (id, name, email, phone, role, password_hash, otp_enabled, custom_role_id, must_change_password, password_change_reason)
         VALUES ($1, $2, lower($3), $4, $5, $6, true,
           CASE WHEN $5 = 'ADMIN' THEN 'role-default-admin' ELSE NULL END, true, 'created')
         ON CONFLICT (id) DO NOTHING`,
        [admin.id, admin.name, admin.email, admin.phone, admin.role, await hashPassword(admin.password)],
      );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
