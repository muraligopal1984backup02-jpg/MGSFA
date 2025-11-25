# Sales Force Management System

A comprehensive sales force automation system built with React, TypeScript, Vite, and Supabase. This application helps manage customers, products, orders, routes, telecalling, and collections for sales teams.

## Features

### Core Modules

- **Customer Management**: Add, edit, and manage customers with geolocation tagging and image uploads (up to 3 images per customer)
- **Product Management**: Manage product catalog with bulk upload support
- **Order Management**: Create and track orders with real-time reporting
- **Route Management**: Define routes and beat plans for field sales teams
- **Telecalling**: Log calls, schedule follow-ups, and track customer interactions
- **Collections**: Record payments and track outstanding amounts
- **Lead Management**: Capture and convert leads to customers
- **User Management**: Role-based access control (Admin, Manager, Sales User, Tele User)
- **Location Tracking**: Real-time GPS tracking for field staff

### Advanced Features

- **Bulk Upload**: CSV-based bulk upload for customers, products, and prices
- **Customer Media**:
  - GPS location capture with Google Maps integration
  - Upload up to 3 images per customer
  - Automatic image compression
- **Beat Plan Management**: Schedule customer visits and track completion
- **Customer Assignment**: Assign customers to specific sales users
- **Reporting**: Order reports and collection reports with filters

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Icons**: Lucide React
- **Authentication**: Custom authentication system

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for initialization to complete

#### Get Your Credentials

1. Go to Project Settings → API
2. Copy your Project URL
3. Copy your anon/public key

#### Create Environment File

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

Go to your Supabase dashboard → SQL Editor and run each migration file in order:

1. `supabase/migrations/20251124060514_create_sales_force_management_schema.sql`
2. `supabase/migrations/20251124061512_fix_user_login_rls_policy.sql`
3. `supabase/migrations/20251124061539_update_rls_policies_for_custom_auth.sql`
4. `supabase/migrations/20251124143504_fix_call_log_followup_constraints.sql`
5. `supabase/migrations/20251125020348_create_customer_user_assignments.sql`
6. `supabase/migrations/20251125020932_update_customer_user_assignments_policies.sql`
7. `supabase/migrations/20251125032158_create_beat_plan_infrastructure.sql`
8. `supabase/migrations/20251125055404_create_customer_media_table.sql`

Copy the entire content of each file and execute in the SQL Editor.

### 5. Set Up Storage

In Supabase dashboard → Storage, create a bucket:

**Option A: Using UI**
- Click "New bucket"
- Name: `customer-images`
- Public bucket: Yes

**Option B: Using SQL**
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-images', 'customer-images', true)
ON CONFLICT (id) DO NOTHING;
```

### 6. Create Initial Admin User

Run this SQL in the SQL Editor:

```sql
INSERT INTO user_master_tbl (username, password, full_name, role, email, is_active)
VALUES ('admin', 'admin123', 'System Administrator', 'admin', 'admin@example.com', true);
```

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 8. Login

- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change the admin password immediately after first login!

## Build for Production

```bash
npm run build
```

The build output will be in the `dist` folder.

## Database Schema

### Main Tables

- `user_master_tbl`: User accounts and authentication
- `customer_master_tbl`: Customer information
- `customer_media_tbl`: Customer images and GPS locations
- `customer_user_assignments_tbl`: Customer-to-user assignments
- `product_master_tbl`: Product catalog
- `price_setup_tbl`: Product pricing
- `order_header_tbl` & `order_details_tbl`: Order management
- `route_master_tbl`: Route definitions
- `beat_plan_tbl`: Scheduled customer visits
- `call_log_tbl`: Telecalling records
- `followup_tbl`: Follow-up schedules
- `collection_tbl`: Payment collections
- `lead_master_tbl`: Lead tracking

## User Roles

- **Admin**: Full system access
- **Manager**: Manage teams and view reports
- **Sales User**: Field sales operations
- **Tele User**: Telecalling operations

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin modules
│   │   ├── collections/    # Collection management
│   │   ├── crm/           # Customer & lead management
│   │   ├── orders/        # Order management
│   │   ├── products/      # Product management
│   │   ├── reports/       # Reporting modules
│   │   ├── routes/        # Route & beat plan management
│   │   └── telecalling/   # Telecalling module
│   ├── context/           # React context (Auth)
│   ├── lib/              # Utilities and Supabase client
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── supabase/
│   └── migrations/       # Database migrations
└── public/              # Static assets
```

## Features Guide

### Customer Management

- Add customers with complete details
- Assign customers to sales users
- Capture GPS location
- Upload up to 3 images per customer
- Bulk upload via CSV

### Image Upload

- Supports JPG, JPEG, PNG formats
- Maximum file size: 10MB
- Automatic compression to ~1MB
- Three dedicated image slots per customer

### GPS Location

- Real-time location capture using browser geolocation API
- Displays latitude, longitude, and accuracy
- Google Maps integration for viewing location
- Update location functionality

### Beat Plan

- Create weekly beat plans
- Assign customers to specific days
- Track visit completion status
- Beat plan reports

## Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Secure password storage (change default passwords!)
- Public storage with restricted upload access

## Support

For issues or questions, contact the system administrator.

## License

Proprietary - All rights reserved
