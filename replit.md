# Rest Express Full-Stack Application

## Overview

This is a full-stack web application built with React, Express, and JavaScript (no TypeScript). The project uses a modern tech stack including Vite for frontend bundling and shadcn/ui components for the user interface. The application follows a monorepo structure with shared schemas between frontend and backend using in-memory storage.

## System Architecture

The application follows a three-tier architecture:

1. **Frontend (Client)**: React-based SPA with TypeScript
2. **Backend (Server)**: Express.js REST API with TypeScript
3. **Database**: PostgreSQL with Drizzle ORM
4. **Shared**: Common types and schemas shared between frontend and backend

### Directory Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared schemas and types
├── migrations/      # Database migration files
└── dist/           # Production build output
```

## Key Components

### Frontend Architecture
- **Framework**: React 18 with JavaScript (no TypeScript)
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library with custom JavaScript implementations
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with JavaScript (no TypeScript)
- **Storage**: In-memory storage using Map data structure
- **API Pattern**: RESTful API design
- **Development**: Hot reloading with Node.js

### Database Schema
The application uses a simple user schema defined in `shared/schema.ts`:
- Users table with id, username, and password fields
- Zod validation schemas for type safety
- Drizzle ORM for type-safe database operations

### UI System
- **Design System**: shadcn/ui "new-york" style
- **Component Library**: Comprehensive set of accessible components
- **Theming**: CSS variables with light/dark mode support
- **Icons**: Lucide React icons
- **Responsive**: Mobile-first responsive design

## Data Flow

1. **Client Requests**: React components make API calls using TanStack Query
2. **API Layer**: Express routes handle HTTP requests and responses
3. **Business Logic**: Route handlers process requests and interact with storage
4. **Data Access**: Storage interface abstracts database operations
5. **Database**: Drizzle ORM executes type-safe SQL queries against PostgreSQL

### Storage Pattern
The application implements a storage interface pattern:
- `IStorage` interface defines CRUD operations
- `MemStorage` class provides in-memory implementation for development
- Production can use Drizzle-based storage implementation
- Allows easy testing and development without database dependency

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client
- **drizzle-orm**: Type-safe ORM with PostgreSQL support
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight React router

### Development Tools
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration and introspection tool
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development
- Frontend: Vite dev server with HMR
- Backend: tsx with hot reloading
- Database: Connected to Neon serverless PostgreSQL

### Production Build
1. Frontend built with `vite build` to `dist/public`
2. Backend bundled with `esbuild` to `dist/index.js`
3. Static files served by Express in production
4. Single deployment artifact containing both frontend and backend

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required)
- `NODE_ENV`: Environment mode (development/production)
- `FRONTEND_URL`: CORS origin configuration

### Database Migrations
- Drizzle Kit manages schema migrations
- `db:push` command pushes schema changes to database
- Migration files stored in `./migrations` directory

## Comprehensive Authentication System

The application features a complete enterprise-grade authentication system with advanced security features:

### Enhanced Backend Authentication
- **JWT Dual Token System**: 15-minute access tokens + 7-day refresh tokens
- **Password Security**: bcrypt with 12 salt rounds
- **MongoDB Collections**: `auth_users`, `refresh_tokens`, `password_resets`
- **Role-Based Access Control**: Support for 'attendee' and 'organizer' roles
- **Advanced Middleware**: Token authentication, role verification, rate limiting

### 2-Step Authentication & OTP Verification
- **Email OTP**: Mailtrap integration for development/testing
- **SMS OTP**: Twilio integration for phone verification
- **OTP Features**: 6-digit codes, 10-minute expiry, 3-attempt limit
- **Verification Triggers**: Registration, password reset, phone number changes

### Google OAuth Integration
- **Social Login**: Complete Google OAuth 2.0 implementation
- **Account Linking**: Automatic linking of existing email accounts
- **Profile Data**: Auto-population from Google profile information
- **Frontend Integration**: Google login buttons on login/signup pages

### Email Notification System
- **Mailtrap Integration**: Professional email templates
- **Email Types**: Registration confirmation, password reset, OTP verification, account activity alerts
- **Security Notifications**: Login alerts, profile changes, phone number updates

### Comprehensive API Endpoints
**Authentication**
- `POST /api/auth/register` - User registration with email/SMS OTP
- `POST /api/auth/login` - User login with activity notifications
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback
- `POST /api/auth/refresh` - Access token refresh

**OTP & Verification**
- `POST /api/auth/verify-otp` - OTP verification (email/phone)
- `POST /api/auth/resend-otp` - Resend OTP codes

**Password Management**
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset execution

**Profile & Security**
- `GET /api/auth/profile` - Protected profile retrieval
- `PUT /api/auth/profile` - Profile updates with notifications
- `POST /api/auth/logout` - Secure logout with token revocation

**Role-Based Routes**
- `GET /api/organizer/dashboard` - Organizer-only access
- `GET /api/attendee/dashboard` - Attendee dashboard

### Security Features
- **HTTP-Only Cookies**: Secure token storage option
- **Rate Limiting**: IP-based protection for sensitive endpoints
- **Token Blacklisting**: Refresh token revocation system
- **Session Management**: Automatic token cleanup and expiry
- **Verification Requirements**: Email/phone verification enforcement

### Frontend Integration
- **Redux Store**: Complete authentication state management
- **Google Login UI**: Integrated social login buttons
- **Token Handling**: Automatic token refresh and storage
- **Role-Based Navigation**: Dynamic routing based on user roles

## Comprehensive Organizer Dashboard Backend

### Complete Backend Implementation
The system now includes a full-featured organizer dashboard backend covering all navigation items:

**Core Infrastructure:**
- Complete MongoDB schemas for all organizer functionality
- Comprehensive storage service with CRUD operations  
- Secure API routes with authentication and role-based access
- Sample data generation for realistic testing

**Dashboard Features Implemented:**
1. **Home Dashboard** - Overview with statistics and quick actions
2. **My Events** - Complete event management (create, read, update, delete)
3. **Marketing** - Campaign management for email, SMS, social, and discount campaigns
4. **Audience** - Contact management with segmentation and analytics
5. **Payouts** - Financial payout requests and tracking
6. **Disputes** - Dispute management with messaging system
7. **Finances** - Financial summary, reporting, and transaction tracking
8. **My Team** - Team member management with role-based permissions
9. **Analytics** - Comprehensive analytics with traffic, sales, and engagement metrics
10. **Support Center** - Support ticket system with messaging

**Database Collections:**
- `organizations` - Organization management
- `events` - Complete event lifecycle management
- `attendees` - Attendee registration and check-in
- `marketing_campaigns` - Multi-channel marketing campaigns
- `audience` - Contact and audience segmentation
- `payouts` - Financial payout processing
- `disputes` - Dispute resolution system
- `team_members` - Team collaboration management
- `analytics` - Performance metrics and reporting
- `support_tickets` - Customer support system

**API Endpoints:**
- `/api/organizer/dashboard` - Overview statistics
- `/api/organizer/organizations/*` - Organization CRUD
- `/api/organizer/events/*` - Event management
- `/api/organizer/attendees/*` - Attendee management  
- `/api/organizer/marketing/*` - Marketing campaigns
- `/api/organizer/audience/*` - Audience management
- `/api/organizer/finances/*` - Financial operations
- `/api/organizer/disputes/*` - Dispute handling
- `/api/organizer/team/*` - Team management
- `/api/organizer/analytics/*` - Analytics and reporting
- `/api/organizer/support/*` - Support ticket system
- `/api/organizer/sample-data/*` - Sample data generation

**Security Features:**
- JWT authentication with role-based access control
- Email and phone verification requirements
- Rate limiting and request validation
- Secure data access patterns

## Complete Frontend Integration

### Comprehensive Organizer Dashboard Frontend
Complete frontend integration with all 60+ backend APIs across all dashboard sections:

**1. Events Management (`/organizer/events`)**
- Complete event CRUD operations with real-time API integration
- Event creation, editing, publishing/unpublishing functionality
- Event stats and analytics integration
- Status management (draft, published, completed, cancelled)

**2. Marketing Campaigns (`/organizer/marketing`)**
- Multi-channel campaign management (email, SMS, social, discount)
- Campaign creation, launch, pause, and analytics
- Real-time campaign performance metrics
- Target audience management and segmentation

**3. Audience Management (`/organizer/audience`)**
- Contact management with full CRUD operations
- Audience segmentation with custom criteria
- Bulk operations and contact import/export
- Subscription status management and analytics

**4. Financial Management (`/organizer/finances`)**
- Revenue tracking and financial overview
- Payout request and management system
- Transaction history and detailed reporting
- Financial analytics with date range filtering

**5. Analytics Dashboard (`/organizer/analytics`)**
- Comprehensive event performance analytics
- Traffic, sales, and engagement metrics
- Geographic distribution and demographic insights
- Exportable reports and data visualization

**6. Support Center (`/organizer/support`)**
- Complete ticket management system
- Real-time messaging and communication
- Priority and status management
- Customer support workflow optimization

**Core Frontend Infrastructure:**
- Complete API service layer (`organizerApi.js`) with all backend endpoints
- Real-time data fetching and state management
- Error handling and loading states
- Responsive design with consistent UI/UX
- Form validation and user feedback systems

**Integration Features:**
- JWT token authentication with automatic refresh
- Real-time API communication with all backend services
- Comprehensive error handling and user notifications
- Dynamic data loading and filtering
- Export functionality for analytics and reports

## Changelog
- July 03, 2025. Initial setup with TypeScript
- July 03, 2025. Converted to JavaScript-only setup with simple Express server
- July 03, 2025. Successfully integrated MongoDB Atlas database with sample data
- July 03, 2025. Complete application verified working: Frontend + Backend + Database
- July 03, 2025. Implemented complete JWT authentication system with MongoDB
- July 03, 2025. Implemented comprehensive enterprise-grade authentication system
- July 03, 2025. Added Google OAuth, OTP verification, email notifications, and security features
- July 03, 2025. Configured deployment URLs for Replit hosting
- July 04, 2025. Implemented complete organizer dashboard backend with all features
- July 04, 2025. Complete frontend integration with all organizer dashboard APIs
- July 04, 2025. Fixed CreateEvent page: removed hidden tickets, added proper image handling, implemented form submission
- July 04, 2025. Fixed authentication token issues and implemented complete event management (view, edit, delete, publish)
- July 04, 2025. Made HomePage completely dynamic: integrated backend APIs, replaced static data with real events from database
- July 04, 2025. Replaced window.location with navigate() and alert() with toast notifications throughout frontend
- July 09, 2025. Implemented comprehensive responsive design across all pages and components for mobile, tablet, and desktop compatibility
- July 09, 2025. Added responsive breakpoints (sm:, md:, lg:, xl:) to ensure perfect display on all device sizes
- July 09, 2025. Completed full rebranding from "Flite" to "Event Tribe" throughout the entire application
- July 27, 2025. Successfully migrated project from Replit Agent to standard Replit environment
- July 27, 2025. Fixed authentication configuration to handle missing environment variables gracefully
- July 27, 2025. Fixed payment integration to handle missing Stripe API keys without errors
- July 27, 2025. Resolved critical cart removal bug by fixing ObjectId conversion in MongoDB operations
- July 27, 2025. Enhanced frontend cart removal logic with improved error handling and state management
- July 27, 2025. Resolved critical cart removal bug by fixing ObjectId conversion in MongoDB operations
- July 27, 2025. Enhanced frontend cart removal logic with improved error handling and state management

## Current Setup

The project uses a complete full-stack architecture:
- **Server**: Express.js with TypeScript, JWT authentication, MongoDB integration
- **Frontend**: React with Vite, Redux state management, complete UI components
- **Database**: MongoDB Atlas with authentication and user data collections
- **Authentication**: JWT tokens, bcrypt password hashing, role-based access control
- **API**: Comprehensive RESTful endpoints for authentication and data management
- **Responsive Design**: Complete mobile-first responsive design with Tailwind CSS breakpoints
- **Branding**: Full "Event Tribe" branding across all pages and components
- **Environment**: Successfully migrated to standard Replit environment with proper configuration handling
- **Cart System**: Fixed and fully functional cart management with proper MongoDB ObjectId handling

## User Preferences

Preferred communication style: Simple, everyday language.
Technology preference: JavaScript only (no TypeScript) for both frontend and backend.