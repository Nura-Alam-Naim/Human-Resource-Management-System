# Leave Management Portal

A full-stack employee leave management system built with **React** and **Node.js/Express**. Managers can approve or reject leave requests, create new employee accounts, and view company-wide employee data. Employees can apply for leave, track their history, and manage their profiles.

## Features

### Authentication & Security
- JWT-based authentication with **HttpOnly cookies** (no tokens exposed to client-side JavaScript)
- Role-based access control — **Employee** and **Manager** roles
- First-login password enforcement — new users must change their temporary password before accessing the system
- IDOR (Insecure Direct Object Reference) protection — users can only modify their own leave requests

### Employee Dashboard
- View remaining leave balance at a glance
- Apply for **Sick**, **Casual**, or **Annual** leave with date range and reason
- Edit or cancel pending requests
- View complete personal leave history with statuses

### Manager Dashboard
- View all company leave requests in one table
- Approve or reject pending requests (auto-deducts leave balance on approval)
- Click any employee name to view their full profile and leave history
- Create new user accounts (employees or managers) with temporary passwords

### All Employees Directory (Manager Only)
- Searchable table of all employees in the system
- Shows name, email, role, leave balance, total leaves taken, and join date
- Click any employee to view their detailed profile

### User Profile
- View personal info, company tenure, and leave statistics
- Change password from a dedicated security section

### UI/UX
- Light and dark mode toggle
- Responsive design
- Clean, minimalist aesthetic with SCSS theming
- Reusable component architecture (Modal, StatusBadge, LeaveForm, DateRange, PageHeader)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, Axios, SCSS, Lucide Icons |
| Backend | Node.js, Express 5, JWT, bcrypt, cookie-parser |
| Database | MySQL |
| Dev Tools | Vite, Nodemon, Concurrently |

## Project Structure

```
Leave_Management_Portal/
├── backend/
│   ├── controllers/
│   │   ├── adminController.js    # Manager endpoints (requests, users, create user)
│   │   ├── authController.js     # Login, logout, change password
│   │   └── userController.js     # Employee endpoints (profile, apply, edit, cancel)
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification & role-based guards
│   ├── routes/
│   │   ├── adminRoute.js         # /api/admin/leaves/*
│   │   ├── authRoute.js          # /api/auth/*
│   │   └── userRoute.js          # /api/user/leaves/*
│   ├── cron/
│   │   └── jobs.js               # Scheduled tasks (auto-reject, annual reset)
│   ├── db.js                     # MySQL connection, schema, seed data
│   └── index.js                  # Express server entry point
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Modal.jsx             # Reusable modal overlay
│       │   ├── StatusBadge.jsx       # Leave status badge
│       │   ├── LeaveForm.jsx         # Shared leave request form
│       │   ├── DateRange.jsx         # Calendar icon + date range
│       │   ├── PageHeader.jsx        # Page title + action button
│       │   ├── CreateUserForm.jsx    # New user creation form
│       │   ├── EmployeeProfileView.jsx # Employee profile + history view
│       │   └── Navbar.jsx            # Navigation bar with role-based links
│       ├── pages/
│       │   ├── Login.jsx             # Login page
│       │   ├── SetPassword.jsx       # First-login password setup
│       │   ├── EmployeeDashboard.jsx # Employee's main dashboard
│       │   ├── ManagerDashboard.jsx  # Manager's leave request management
│       │   ├── AllEmployees.jsx      # All employees directory
│       │   └── UserProfile.jsx       # User profile & password change
│       ├── context/
│       │   ├── AuthContext.jsx       # Authentication state management
│       │   └── ThemeContext.jsx       # Dark/light mode state
│       └── App.jsx                   # Router configuration & auth flow
└── package.json                      # Root scripts (concurrently runs both)
```

## Getting Started

### Prerequisites
- **Node.js** (v18 or later)
- **MySQL** (v8 or later)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nura-Alam-Naim/Leave-Management-Portal.git
   cd Leave-Management-Portal
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies (concurrently)
   npm install

   # Backend dependencies
   cd backend && npm install && cd ..

   # Frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Configure environment variables**

   Create a `.env` file in the `backend/` directory:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=leave_management_db
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```
   This starts both the backend (port 3000) and frontend (port 5173) concurrently.

### Default Accounts

The database automatically seeds with test users on first run:

| Email | Role | Password |
|-------|------|----------|
| alice@company.com | Manager | 12345 |
| bob@company.com | Employee | 12345 |
| charlie@company.com | Manager | 12345 |
| diana@company.com | Employee | 12345 |
| ethan@company.com | Employee | 12345 |
| fiona@company.com | Employee | 12345 |
| george@company.com | Employee | 12345 |
| hannah@company.com | Employee | 12345 |

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Login with email & password |
| POST | `/logout` | Clear auth cookie |
| PUT | `/change-password` | Change password |
| GET | `/me` | Get current user from cookie |

### Employee (`/api/user/leaves`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get own profile & leave stats |
| GET | `/my-requests` | Get own leave history |
| POST | `/apply` | Submit a leave request |
| PUT | `/edit/:request_id` | Edit a pending request |
| PUT | `/cancel/:request_id` | Cancel a pending request |

### Manager (`/api/admin/leaves`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/all-requests` | Get all leave requests |
| PUT | `/update-status/:request_id` | Approve or reject a request |
| GET | `/users` | Get all users with leave stats |
| GET | `/users/:user_id` | Get a user's profile & history |
| POST | `/create-user` | Create a new employee or manager |

## License

This project is open source and available under the [ISC License](LICENSE).
