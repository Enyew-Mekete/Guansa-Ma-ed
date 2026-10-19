## Frontend and backend

The app is split into `frontend/` (React, Vite, static assets) and `backend/` (Express API and database). The shared npm manifest and lockfile stay at the repository root so both deployment providers install from the same commit.

### Local development

1. Copy `.env.example` to `.env` and configure the required values below.
2. Run `npm ci`.
3. Run `npm run dev`. It starts the backend on port 3000 and the Vite frontend (usually port 5173) together; Vite proxies `/api` to the backend. To run either side independently, use `npm run dev:backend` or `npm run dev:frontend`.

### Deploy frontend to Vercel and backend to Render

1. Create a Neon PostgreSQL database named **`Guansa_Ma'ed`**. The backend creates and upgrades its tables at startup; it does not create the database or fall back to in-memory storage.
2. Deploy this repository to Render using the included `render.yaml`. Set `DATABASE_URL`, `AUTH_SECRET`, both bootstrap passwords, and bootstrap profile details in Render's environment. The passwords must be different and at least 8 characters. Set `SMTP_USER` and `SMTP_PASS` if email OTP delivery is required; Render supplies `PORT`.
3. Deploy the repository to Vercel with the repository root as the project root. The included `vercel.json` builds the frontend and proxies `/api` requests through Vercel so session cookies stay same-origin. Replace `YOUR-RENDER-SERVICE` in `vercel.json` with the actual Render service hostname before deploying.
4. Keep `.env` and production secrets out of source control. Replace bootstrap credentials before the first deployment; example values are placeholders only.

The initial menu and service data are seeded once if their database tables are empty. Render checks `/health`. Run `npm run build` to build the frontend locally, or `npm run preview` to preview its static build.

## Neon PostgreSQL setup

The application stores business records in Neon PostgreSQL. Configure `DATABASE_URL` with the connection string for `Guansa_Ma'ed`. URL-encode special characters in the database name or password if required by the connection URI. Set `AUTH_SECRET` to a newly generated random secret of at least 32 characters.

Before the first startup, set different `BOOTSTRAP_SUPER_ADMIN_PASSWORD` and `BOOTSTRAP_ADMIN_PASSWORD` values (at least 8 characters). On an empty database, the Super Admin and Admin profiles are created with those passwords, stored as salted hashes. Configure SMTP credentials to enable email OTP delivery.

Admin accounts created later, password hashes, OTP settings, sessions, custom access roles, menu categories and menu item pricing, news, vacancies, applicant contact details and application timestamps, customer orders, and newsletter subscriptions are stored in the database. Administrative account email addresses (case-insensitive) and normalized phone numbers are unique across the system. If legacy duplicate account details exist, startup logs which uniqueness index could not be installed but continues serving the API; resolve the duplicates to enable the corresponding database constraint. Newly created accounts and accounts given a Super Admin password reset must change that password at first sign-in; access to protected admin actions remains blocked until the current password is changed and the new password is confirmed. The forced password screen identifies whether the change is due to a new account or an administrator reset. Roles use per-section View, Add, Edit, and Delete privileges, including Role Management, Reports, and the Deployment Guide; a role's granted privileges control both navigation and protected API actions. Super Admins can always manage roles, while other users need the corresponding Role Management privileges. User Management permission grants access to current admin-user records and displays the Admin Users dashboard count; the built-in Super Admin account is hidden from other accounts and cannot be managed through User Management. Admins can manage separate Food and Drink menus, including custom categories and item prices. The restaurant location is 4 Kilo, Nib International Bank Building, 3rd Floor. The Admin Settings action changes the signed-in user's password; Super Admins can set or edit each Admin's OTP requirement.

Admin create/edit forms use dialogs, and destructive actions require confirmation. Deleting menu items or categories, services, hero images, news posts, vacancies, or admin accounts records a `deleted_at` timestamp instead of removing the record; deleted content is omitted from normal listings, and deleting an admin account revokes its sessions. The admin sidebar remains fixed while scrolling, and the public-site footer is hidden while the admin portal is open.

Online vacancy applications include an optional email, validated Ethiopian mobile number, accepted privacy terms, and a PDF or image attachment (up to 4 MB); the application and file are stored in PostgreSQL. News posts support image uploads and item-specific discount percentages with required start dates and optional end dates. The admin portal provides searchable management lists, plus filtered reports that can be exported as CSV. News/vacancy read notifications are shared across visitors and admin roles. Reservation and catering feedback is saved in `customer_feedback` and is available in the admin portal; contact phone numbers are validated as Ethiopian mobile numbers, with optional email format validation. Subscriber records can be searched by email and subscription date.

├── frontend/                 # React/Vite app, assets and Vercel build
├── backend/                  # Express entry point, API and database
├── render.yaml               # Render API service blueprint
├── vercel.json               # Vercel build and API proxy
├── package.json              # Shared scripts and dependencies
└── .env.example              # Local environment variable template