# Guansa Ma'ed Restaurant Website

**Guansa Ma'ed (ጓንሳ ማዕድ)** is a full-stack restaurant website and management system designed to showcase restaurant services, manage menus, and provide a secure administrative dashboard for configuring restaurant operations and website content.

The platform is built with **React.js, Node.js, Express.js, and PostgreSQL**, with a focus on security, flexibility, usability, and maintainability.

## Key Features

### 1. Restaurant Website
- Responsive and user-friendly interface.
- Restaurant information, branding, and contact details.
- Food and drinks menus with categories, descriptions, images, and prices.
- Restaurant services and service-area information.
- Configurable website sections and content.
- Support for future features and integrations.

### 2. Secure Authentication
- Secure user login and logout.
- Password hashing and secure credential storage.
- Protected routes and authenticated sessions.
- Role-based access control.
- Input validation and authentication error handling.
- Secure password reset functionality, when configured.

### 3. User Management
- Create, view, update, and deactivate user accounts.
- Assign roles and permissions to users.
- Manage user profile information.
- Control access to administrative features.
- Track important administrative activities where configured.

### 4. Role and Permission Management
- Create and manage user roles.
- Define permissions for different system modules.
- Assign roles to users.
- Restrict administrative actions according to permissions.
- Support roles such as Administrator, Manager, Editor, and Staff.

### 5. Menu Management
- Create and manage food and drink categories.
- Add, edit, and remove menu items.
- Configure item names, descriptions, prices, and images.
- Set menu item availability.
- Organize menus into sections such as breakfast, lunch, dinner, food, and drinks.
- Allow authorized users to maintain menu content without modifying source code.

### 6. Restaurant Services and Service Areas
- Create and manage restaurant services.
- Configure service areas and service descriptions.
- Publish, update, or deactivate services.
- Manage service availability and related information.
- Allow authorized users to configure service details through the dashboard.

### 7. Dynamic Website Configuration
- Manage restaurant information and contact details.
- Configure website sections and content.
- Update menu categories, services, and service areas.
- Manage selected display settings and other configurable information.
- Extend the system with additional modules as the restaurant's needs evolve.

### 8. Administrative Dashboard
- Centralized management interface.
- Access controlled by user roles and permissions.
- Manage users, menus, services, and website content.
- Provide a foundation for reporting, activity logs, and future management tools.

## Technology Stack

**Frontend**
- React.js
- JavaScript or TypeScript
- HTML5 and CSS3
- Responsive UI components

**Backend**
- Node.js
- Express.js
- RESTful API architecture
- Authentication and authorization middleware

**Database**
- PostgreSQL
- Relational data modeling
- Database constraints and migrations

**Security**
- Password hashing
- Role-based access control (RBAC)
- Server-side validation
- Parameterized database queries
- Secure session or token management
- Environment-based configuration

## System Architecture

The application follows a three-layer architecture:

1. **Frontend:** React.js provides the restaurant website and administrative dashboard.
2. **Backend:** Node.js and Express.js handle business logic, authentication, permissions, and API requests.
3. **Database:** PostgreSQL stores users, roles, permissions, menu items, restaurant services, service areas, and configurable website content.

## User Roles

Example roles can include:

- **Administrator:** Full access to system configuration and management.
- **Manager:** Manage restaurant menus, services, and permitted operational information.
- **Editor:** Update authorized website content and menu information.
- **Staff:** Access only the features permitted by assigned permissions.

Roles and permissions should be configurable by an authorized administrator.

## Installation and Setup

### Prerequisites
- Node.js and npm
- PostgreSQL
- Git
