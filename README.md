# Carbochem Helpdesk System

A full-stack helpdesk ticketing system built with Node.js, MongoDB, and a C backend for high-performance data structures.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Community Server (local) **or** MongoDB Atlas (cloud)
- MSYS2 + GCC (for C backend)

### 1. Clone & Install
```bash
git clone https://github.com/ilakiya-tech/Helpdesk-System.git
cd Helpdesk-System
npm install
```

### 2. Configure Environment
Edit `.env`:
```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/helpdesk
JWT_SECRET=carbochem_helpdesk_jwt_secret_2025

# Optional: Email OTP (leave blank to get OTPs in console)
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_gmail_app_password
```

### 3. Start MongoDB
```bash
# Windows (run as Administrator once)
net start MongoDB
# OR
mongod --dbpath C:\data\db
```

### 4. Seed Database
```bash
node api/seed.js
```

### 5. Start Server
```bash
node server.js
# OR
npm start
```

Open: **http://localhost:3000**

---

## 🔐 Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Admin | `manager` | `admin123` |
| Staff (Network) | `ravi` | `staff123` |
| Staff (Hardware) | `priya` | `staff123` |
| Staff (Software) | `amit` | `staff123` |
| Staff (Quality) | `sunita` | `staff123` |
| Staff (Inspection) | `deepak` | `staff123` |
| Client | `client` | `client123` |
| Client | `staff` | `staff123` |

---

## 🏗️ Architecture

```
Browser (port 3000)
├── /                    → index.html (login)
├── /admin.html          → Admin dashboard
├── /staff.html          → Staff dashboard
├── /client.html         → Client ticket viewer
├── /create-ticket.html  → Create ticket form
├── /ticket-details.html → Ticket detail view
├── /admin-report.html   → Charts & reports
└── /register.html       → Admin: add users

Node.js API (port 3000/api/*)
├── POST /api/auth              → Login
├── POST /api/register          → Register user
├── POST /api/forgot-password   → Send reset OTP
├── POST /api/verify-otp        → Verify OTP
├── POST /api/reset-password    → Reset password
├── GET  /api/tickets           → All tickets
├── POST /api/tickets           → Create + auto-assign ticket
├── GET  /api/tickets/:id       → Get ticket
├── PUT  /api/tickets/:id/status → Update status
├── PUT  /api/tickets/:id/assign → Assign to staff
├── POST /api/tickets/:id/comment → Add comment
├── POST /api/tickets/:id/proof   → Upload photo proof
├── GET  /api/mytickets         → Client's own tickets
├── GET  /api/assigned          → Staff's assigned tickets
├── GET  /api/stats             → Statistics
├── GET  /api/admin/staff       → Staff list with workload
├── GET  /api/admin/staff/available?category=X → Available staff
├── POST /api/admin/staff       → Add staff
├── PUT  /api/admin/staff/:id   → Update staff
├── GET  /api/admin/workload    → Workload report
├── GET  /api/admin/holidays    → Holiday list
├── POST /api/admin/holidays    → Add holiday
└── DELETE /api/admin/holidays/:id → Remove holiday

C Backend (port 9090) — Data Structures Demo
├── Hash Table   O(1)    → User authentication
├── AVL Tree     O(logn) → Ticket search by ID
├── Priority Queue O(logn) → Urgent ticket queue
├── Trie         O(k)    → Username autocomplete
└── LRU Cache    O(1)    → Ticket caching
```

---

## ✨ Features

### Authentication
- Login with username or email
- Register with OTP email verification (optional)
- Forgot password with OTP reset
- JWT-based session management

### Ticket System
- Create ticket with category (Quality, Delivery, Network, Software, Hardware, Inspection, etc.)
- **Auto-assignment**: tickets auto-assigned to staff matching the category
- Assignment rules:
  - No assignments on weekends
  - No assignments on Indian public holidays
  - Staff cannot exceed `maxTicketsPerDay` (default: 5)
  - No more than 2 tickets in the same 1-hour slot
- Priority levels: Critical, High, Medium, Low

### Staff Features
- View only assigned tickets
- Update work progress: Started → In Progress → Completed → Needs Parts
- Add comments/notes to tickets
- Upload photo proof of completion
- Category specialization per staff member

### Admin Features
- View all tickets with filters (status, priority, category, date, staff)
- Assign/reassign tickets with real-time availability check
- Staff workload dashboard
- Reports: tickets by category, status distribution, resolution time
- Manage staff (add, edit, deactivate, set daily limits)
- Holiday management (add/remove Indian public holidays)

### Database (MongoDB)
- **Users**: name, email, password(hashed), role, category, maxTicketsPerDay
- **Tickets**: title, description, status, priority, category, assignedTo, comments, photoProof
- **Holidays**: Indian public holiday calendar 2025
- **OTP**: email verification and password reset tokens

---

## 🧱 C Backend (Port 9090)

The C backend demonstrates 5 data structures with real HTTP endpoints:

```bash
# Compile (MSYS2 MINGW64)
cd backend-c/src
gcc -O2 -o helpdesk.exe helpdesk.c -lws2_32

# Run
./helpdesk.exe
```

---

## 📁 Project Structure
```
Helpdesk-System/
├── api/
│   ├── models/          # MongoDB schemas
│   │   ├── User.js
│   │   ├── Ticket.js
│   │   ├── Holiday.js
│   │   └── OTP.js
│   ├── routes/          # Express route handlers
│   │   ├── auth.js      # Login, register, OTP
│   │   ├── tickets.js   # Ticket CRUD + auto-assign
│   │   ├── admin.js     # Admin endpoints
│   │   └── index.js
│   ├── services/        # Business logic
│   │   ├── autoAssign.js    # Auto-assignment engine
│   │   ├── emailService.js  # Nodemailer OTP
│   │   └── indianHolidays.js
│   ├── middleware/
│   │   └── auth.js      # JWT middleware
│   └── seed.js          # Database seeder
├── backend-c/src/
│   └── helpdesk.c       # C backend (5 data structures)
├── public/
│   ├── html/            # 8 HTML pages (unchanged)
│   └── js/
│       ├── api.js       # Frontend API client
│       └── auth.js      # Auth helpers
├── uploads/             # Photo proofs
├── server.js            # Express entry point
├── .env                 # Configuration
└── package.json
```

---

## 🧪 Testing

```bash
# Test login
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test create ticket (use token from above)
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"title":"Test","description":"Test issue","priority":"High","category":"Network"}'
```

---

## 🌐 GitHub
[https://github.com/ilakiya-tech/Helpdesk-System](https://github.com/ilakiya-tech/Helpdesk-System)