# Carbochem Helpdesk System

A full-stack helpdesk ticketing system built with Node.js, Express, MongoDB, and Bootstrap 5.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Community Server (local) **or** MongoDB Atlas (cloud)

### Install & Run
```bash
git clone https://github.com/ilakiya-tech/Helpdesk-System.git
cd HelpDesk-System
npm install
cp .env.example .env
node api/seed.js   # seed local MongoDB (optional if using in-memory fallback)
node server.js
```

Open **http://localhost:3000**

If MongoDB is not running, the server automatically falls back to an in-memory database and auto-seeds.

---

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Admin | `manager` | `admin123` |
| Staff | `ravi`, `priya`, `amit`, `sunita`, `deepak`, `staff` | `staff123` |
| Consumer | `client`, `jane`, `bob` | `client123` |

**Admin Sign Up:** Use the "Admin Sign Up" tab on the login page with secret key `CARBOCHEM2024`.

**Forgot Password:** Click "Forgot Password?" on login — enter username, then set a new password (no OTP required).

---

## Features

### Authentication
- Login with username (Admin / Field Staff / Consumer tabs)
- Admin self-registration with secret key validation
- Simple username-based password reset
- Legacy email OTP flow still supported via `/api/forgot-password` with email
- JWT session management

### Admin Dashboard (`/admin.html`)
- Summary cards: Total Users, Total Staff, Open Tickets, Holidays This Month
- Unassigned ticket notification badge
- Quick links to User, Staff, Holiday, and Report management
- Ticket table with staff assignment dropdown
- Upcoming holidays widget

### User Management (`/admin-users.html`)
- Create Staff or Consumer accounts
- View all users in a table
- Activate/deactivate accounts
- Reset user passwords

### Staff Management (`/admin-staff.html`)
- View all field staff with availability and workload
- Set availability: Available, On Leave, Busy
- View tickets per staff member
- Reassign tickets between staff

### Holiday Management (`/admin-holidays.html`)
- Add/edit/delete holidays (Public Holiday / Company Holiday)
- Table and calendar views
- Holiday warning on tickets with due dates on holidays

### Ticket System
- Consumers raise tickets (appear as **Unassigned** until admin assigns)
- Admin assigns tickets to available staff
- Full ticket detail: ID, title, description, category, priority, status, raised by, assigned to, dates
- Audit trail for every status change and assignment
- Comments/notes by staff, admin, and consumers
- Estimated resolution: High/Critical 1 day, Medium 3 days, Low 7 days

### Staff Dashboard (`/staff.html`)
- Only assigned tickets shown
- Update ticket status (Open → In Progress → Resolved → Closed)
- Availability self-service
- Upcoming holidays widget

### Consumer Dashboard (`/client.html`)
- Ticket history with status timeline
- Add comments on own tickets
- Estimated resolution time by priority
- Upcoming holidays notice

---

## API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth` | Login |
| POST | `/api/register-admin` | Register admin (secret key required) |
| POST | `/api/register` | Register user (admin) |
| POST | `/api/forgot-password` | Reset by username or email OTP |
| POST | `/api/verify-otp` | Verify OTP |
| POST | `/api/reset-password` | Reset with OTP |

### Users & Staff
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/users` | Admin creates user |
| GET | `/api/users` | List all users (admin) |
| PUT | `/api/users/:id/status` | Activate/deactivate |
| PUT | `/api/users/:id/password` | Reset password |
| GET | `/api/staff` | List staff with workload |
| PUT | `/api/staff/:id/availability` | Update availability |

### Holidays
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/holidays` | List holidays |
| POST | `/api/holidays` | Add holiday (admin) |
| PUT | `/api/holidays/:id` | Edit holiday (admin) |
| DELETE | `/api/holidays/:id` | Delete holiday (admin) |

### Tickets
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tickets` | List tickets (role-filtered) |
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets/:id` | Get ticket |
| PUT | `/api/tickets/:id/status` | Update status |
| PUT | `/api/tickets/:id/assign` | Assign to staff (admin) |
| GET | `/api/tickets/:id/history` | Audit trail |
| GET | `/api/tickets/:id/comments` | Get comments |
| POST | `/api/tickets/:id/comments` | Add comment |
| GET | `/api/mytickets` | Client's tickets |
| GET | `/api/assigned` | Staff's assigned tickets |
| GET | `/api/dashboard/summary` | Admin dashboard stats |

Legacy routes (`/api/admin/*`, `/api/tickets/:id/comment`) remain available.

---

## Screenshots (Description)

1. **Login Page** — Role tabs (Admin/Staff/Consumer), Login/Admin Sign Up toggle, Forgot Password flow
2. **Admin Dashboard** — Summary cards, ticket table with assignment, sidebar navigation
3. **User Management** — Create user form and user table with status actions
4. **Staff Management** — Staff availability, ticket reassignment
5. **Holiday Management** — Calendar + table views
6. **Ticket Details** — Full metadata, audit trail, comments section
7. **Staff Dashboard** — Assigned tickets, availability selector, holidays widget
8. **Consumer Dashboard** — Ticket cards with timeline and inline comments

---

## Deployment (Render.com)

1. Push repo to GitHub
2. Create a **MongoDB Atlas** free cluster and copy the connection string
3. On [Render.com](https://render.com), create a **Web Service** from repo
4. Use the included `render.yaml` or set:
   - **Build:** `npm install`
   - **Start:** `npm start`
   - **Env vars:** `MONGO_URI`, `JWT_SECRET`, `ADMIN_SECRET_KEY`
5. Deploy — Render assigns a public URL

---

## Project Structure

```
Helpdesk-System/
├── api/
│   ├── models/          User, Ticket, Holiday, OTP
│   ├── routes/          auth, tickets, admin, features, mock_data
│   ├── services/        autoAssign, emailService, ticketHistory
│   └── middleware/      JWT auth
├── public/
│   ├── html/            All dashboard pages
│   └── js/              api.js, auth.js, sidebar.js
├── server.js
├── render.yaml
├── .env.example
└── package.json
```

---

## Testing

```bash
node server.js &
node test_api.js
```

---

## GitHub
[https://github.com/ilakiya-tech/Helpdesk-System](https://github.com/ilakiya-tech/Helpdesk-System)
