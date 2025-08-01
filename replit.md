# Rest Express Full-Stack Application

## Overview
This is a full-stack web application, "Event Tribe," built with React, Express, and JavaScript, utilizing Vite for frontend bundling and shadcn/ui components for the UI. It features a monorepo structure with shared schemas. The application includes a comprehensive enterprise-grade authentication system, a complete organizer dashboard backend, and full frontend integration for event management, marketing, audience management, finances, analytics, and support.

## User Preferences
Preferred communication style: Simple, everyday language.
Technology preference: JavaScript only (no TypeScript) for both frontend and backend.

## System Architecture
The application follows a three-tier architecture: Frontend (React SPA), Backend (Express.js REST API), and Database (PostgreSQL with Drizzle ORM, though in-memory storage is currently used for development). Shared schemas facilitate communication between layers.

### Frontend Architecture
- **Framework**: React 18 with JavaScript
- **Routing**: Wouter
- **State Management**: TanStack React Query (for server state), Redux (for authentication state)
- **UI Components**: shadcn/ui with custom JavaScript implementations
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite
- **Design System**: shadcn/ui "new-york" style, accessible components, light/dark mode support, Lucide React icons, mobile-first responsive design.

### Backend Architecture
- **Framework**: Express.js with JavaScript
- **Storage**: In-memory storage using Map data structure (development), designed for Drizzle-based storage (production)
- **API Pattern**: RESTful API design
- **Authentication**: JWT Dual Token System (access and refresh tokens), bcrypt password hashing (12 salt rounds), Role-Based Access Control ('attendee', 'organizer'), advanced middleware (token authentication, role verification, rate limiting).
- **Two-Step Authentication**: Email OTP (Mailtrap), SMS OTP (Twilio) with verification triggers.
- **Google OAuth**: Complete Google OAuth 2.0 integration for social login and account linking.
- **Email Notifications**: Mailtrap integration for various notifications (registration, password reset, OTP, security alerts).
- **Organizer Dashboard Backend**: Comprehensive MongoDB schemas and API routes for: Home, My Events, Marketing, Audience, Payouts, Disputes, Finances, My Team, Analytics, Support Center.

### System Design Choices
- **Monorepo Structure**: `client/`, `server/`, `shared/` directories.
- **Storage Interface Pattern**: `IStorage` interface with `MemStorage` for flexibility.
- **Deployment Strategy**: Frontend built with Vite, backend bundled with esbuild; static files served by Express.
- **Security Features**: HTTP-Only Cookies, Rate Limiting, Token Blacklisting, Session Management, Verification Requirements.
- **Branding**: Full "Event Tribe" branding.

## External Dependencies

- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT implementation
- **nodemailer**: Email sending (Mailtrap integration)
- **twilio**: SMS sending
- **passport**: Authentication middleware (Google OAuth)
- **mongoose**: MongoDB object modeling (for Organizer Dashboard features)
- **vite**: Frontend build tool
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration tool
- **esbuild**: JavaScript bundler