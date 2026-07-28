# Leave Management Portal

A full-stack, containerized employee leave management system built with **React**, **Node.js/Express**, and **MySQL**. Designed with modern DevOps practices (Docker, CI/CD) and secure authentication, this portal allows managers to streamline leave requests and employees to track their personal leave histories.

## 🚀 Features

### Authentication & Security
- **JWT-based authentication** with **HttpOnly cross-origin cookies** (SameSite=None) to prevent XSS and CSRF attacks.
- **Role-based access control (RBAC)** — distinct routing and API guards for **Employee** and **Manager** roles.
- **First-login enforcement** — new users must change their auto-generated password before accessing the system.
- **IDOR protection** — users can only view and modify their own personal leave data.

### 🏢 Manager Dashboard
- **Analytics Overview:** Visual breakdown of leave statuses using Recharts.
- **Request Management:** Approve or reject pending requests (automatically deducts and refunds leave balances).
- **Server-Side Pagination:** Efficiently browse through hundreds of company leave requests.
- **System Activity Log (Audit Trail):** Real-time chronological feed of all administrative actions.
- **Employee Directory:** Searchable, paginated table of all company employees and their leave balances.
- **User Creation:** Provision new employee or manager accounts.

### 👨‍💻 Employee Dashboard
- **Leave Balance:** View remaining total leave balance at a glance.
- **Apply for Leave:** Submit requests for Sick, Casual, or Annual leave.
- **Manage Requests:** Edit or cancel pending requests before they are reviewed.
- **Personal History:** Paginated table of all past and current leave requests.

### 🛠 DevOps & Infrastructure
- **Dockerized:** Fully containerized using `Dockerfile`s for both frontend (Vite+Nginx) and backend (Node.js).
- **Docker Compose:** Spin up the entire application and database with a single `docker-compose up` command.
- **CI/CD Pipeline:** Automated integration testing (Jest & Supertest) via **GitHub Actions** on every push.
- **Cloud Ready:** Configured for seamless deployment on Vercel (Frontend), Render (Backend), and Aiven (MySQL).

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router, Axios, Recharts, SCSS, React Hot Toast |
| **Backend** | Node.js (v20), Express 5, JWT, bcrypt, cookie-parser |
| **Database** | MySQL2 (Promise-based) |
| **DevOps** | Docker, Docker Compose, GitHub Actions, Jest, Supertest |

---

## ⚙️ Getting Started (Local Development)

### Prerequisites
- **Node.js** (v20 or later)
- **MySQL** (v8 or later) OR **Docker Desktop**

### Option A: Using Docker (Recommended)
The easiest way to run the project without installing MySQL locally.

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nura-Alam-Naim/Leave-Management-Portal.git
   cd Leave-Management-Portal
   ```
2. **Start the containers**
   ```bash
   docker-compose up --build
   ```
   *The frontend will be available at `http://localhost:80` and the API at `http://localhost:8800`. The MySQL database will initialize automatically.*

### Option B: Manual Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Nura-Alam-Naim/Leave-Management-Portal.git
   cd Leave-Management-Portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   cd frontend && npm install && cd ..
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=leave_management_db
   JWT_SECRET=supersecretkey123
   PORT=8800
   ```

4. **Run the application**
   ```bash
   npm run dev
   ```
   *This starts both the backend and frontend concurrently. The database tables will be created and seeded automatically!*

---

## 🧪 Testing

The backend includes a comprehensive suite of integration tests using **Jest** and **Supertest** to verify API endpoints, authentication flows, and database interactions.

To run the tests locally:
```bash
cd backend
npm test
```
*Note: Ensure your local MySQL database is running, or rely on the GitHub Actions CI pipeline which spins up a transient MySQL instance automatically.*

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | Authenticate and set HttpOnly cookie |
| POST | `/logout` | Clear auth cookie |
| PUT | `/change-password` | Update user password |
| GET | `/me` | Verify session and get user data |

### Employee (`/api/user/leaves`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get own profile & leave stats |
| GET | `/my-requests` | Get paginated leave history |
| POST | `/apply` | Submit a leave request |
| PUT | `/edit/:request_id` | Edit a pending request |
| PUT | `/cancel/:request_id` | Cancel a pending request |

### Manager (`/api/admin/leaves`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics` | Get leave statistics for charts |
| GET | `/all-requests` | Get all paginated leave requests |
| PUT | `/update-status/:request_id` | Approve or reject a request |
| GET | `/users` | Get all paginated users |
| GET | `/users/:user_id` | Get a specific user's history |
| POST | `/create-user` | Provision a new account |
| GET | `/logs` | Get system activity logs |

---

## 🔐 Default Test Accounts

The database automatically seeds with test users on the first run.

| Email | Role | Password |
|-------|------|----------|
| alice@company.com | Manager | 12345 |
| charlie@company.com | Manager | 12345 |
| bob@company.com | Employee | 12345 |
| diana@company.com | Employee | 12345 |
| ethan@company.com | Employee | 12345 |
| fiona@company.com | Employee | 12345 |
| george@company.com | Employee | 12345 |
| hannah@company.com | Employee | 12345 |

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).
