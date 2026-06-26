# Carbochem Helpdesk Ticketing System

A full-stack helpdesk ticketing system built for Carbochem, featuring a high-performance **C backend** powered by advanced data structures, a **Node.js** static file server, and a clean multi-role HTML/JS frontend.

---

## Features

- **Multi-role authentication** — Admin, Field Staff, and Consumer dashboards
- **JWT-based auth** — Secure login with role-based access control
- **Ticket lifecycle management** — Create, view, update status, and assign tickets
- **Priority queue** — Critical tickets surface first using a max-heap
- **Admin analytics** — Stats on total, open, and critical tickets
- **User registration** — New users can self-register
- **LRU Cache** — Fast repeated ticket lookups
- **Trie-based autocomplete** — Username search in O(k) time

---

## Tech Stack

| Layer | Technology |
|---|---|
| C Backend API | C (GCC via MSYS2/MinGW), raw sockets, port 9090 |
| Frontend Server | Node.js + Express, port 3000 |
| Frontend UI | Vanilla HTML, CSS, JavaScript |
| Auth | JWT (jsonwebtoken) |
| API Client | Fetch API (`public/js/api.js`) |

---

## Data Structures (C Backend)

The backend is built entirely in C and uses five core data structures — all implemented from scratch:

| Structure | Complexity | Used For |
|---|---|---|
| Hash Table | O(1) avg | User store — fast login lookup |
| AVL Tree | O(log n) | Ticket store — balanced BST for ordered access |
| Max-Heap (Priority Queue) | O(log n) | Priority queue — critical tickets first |
| Trie | O(k) | Username autocomplete |
| LRU Cache | O(1) | Cache frequent ticket GET requests |

---

## Project Structure

```
Helpdesk-System/
├── backend-c/
│   ├── src/
│   │   ├── helpdesk.c        # Entire C backend (single file)
│   │   ├── helpdesk.exe      # Compiled binary (Windows)
│   │   ├── full_test.sh      # 22-test suite
│   │   ├── test_server.sh    # Server test runner
│   │   └── compile_log.txt
│   └── build.bat             # Windows build script
├── public/
│   ├── html/
│   │   ├── index.html        # Login page
│   │   ├── admin.html        # Admin dashboard
│   │   ├── admin-report.html # Admin analytics/reports
│   │   ├── staff.html        # Field staff dashboard
│   │   ├── client.html       # Consumer dashboard
│   │   ├── create-ticket.html
│   │   ├── ticket-details.html
│   │   └── register.html
│   └── js/
│       ├── api.js            # API client (points to C backend)
│       └── auth.js           # Auth helpers / JWT handling
├── api/
│   └── routes/
│       ├── index.js          # Legacy Node.js routes (reference)
│       └── mock_data.js      # Seed data reference
├── frontend/
│   └── src/js/
│       └── api_client.js     # Frontend API client (alt)
├── server.js                 # Node.js static file server (port 3000)
├── package.json
├── .env
└── README.md
```

---

## API Endpoints (C Backend — Port 9090)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth` | Login — returns JWT | No |
| POST | `/api/register` | Register new user | No |
| GET | `/api/tickets` | Get all tickets | Yes |
| POST | `/api/tickets` | Create a new ticket | Yes |
| GET | `/api/tickets/:id` | Get ticket by ID | Yes |
| PUT | `/api/tickets/:id/status` | Update ticket status | Yes |
| PUT | `/api/tickets/:id/assign` | Assign ticket to staff | Yes |
| GET | `/api/mytickets` | Get tickets for logged-in client | Yes |
| GET | `/api/assigned` | Get tickets assigned to logged-in staff | Yes |
| GET | `/api/stats` | Get dashboard stats | Yes |
| GET | `/api/queue` | Get priority queue (sorted by severity) | Yes |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [MSYS2 / MinGW GCC](https://www.msys2.org/) (for compiling the C backend on Windows)

### 1. Clone the Repository

```bash
git clone https://github.com/ilakiya-tech/Helpdesk-System.git
cd Helpdesk-System
```

### 2. Install Node.js Dependencies

```bash
npm install
```

### 3. Compile the C Backend (Windows)

```bash
cd backend-c/src
C:\msys64\mingw64\bin\gcc.exe -v -o helpdesk.exe helpdesk.c -lws2_32 2>&1
```

Or run the build script:

```bash
cd backend-c
build.bat
```

### 4. Start the C Backend (Port 9090)

```bash
C:\msys64\usr\bin\bash.exe -l -c "cd /c/Users/Dell/Helpdesk-System/backend-c/src && ./helpdesk.exe"
```

You should see:

```
Carbochem Helpdesk System  –  C Backend
==========================================
Data structures:
  Hash Table   O(1)      : 3 users
  AVL Tree     O(log n)  : 4 tickets
  Priority Q   O(log n)  : max-heap
  Trie         O(k)      : username autocomplete
  LRU Cache    O(1)      : cap=50
API routes on http://localhost:9090
Listening on port 9090 ...
```

### 5. Start the Frontend Server (Port 3000)

Open a **new terminal**:

```bash
node server.js
```

### 6. Open the App

Visit: [http://localhost:3000](http://localhost:3000)

---

## Default Login Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Field Staff | `staff` | `staff123` |
| Consumer | `client` | `client123` |

---

## Running Tests

The backend comes with a comprehensive 22-test suite:

```bash
C:\msys64\usr\bin\bash.exe -l "/c/Users/Dell/Helpdesk-System/backend-c/src/full_test.sh"
```

Expected output:

```
=== AUTH ===       5 tests
=== TICKETS ===    9 tests
=== FILTERS ===    2 tests
=== STATS ===      3 tests
=== QUEUE ===      1 test
=== REGISTER ===   1 test

RESULTS: 22 passed, 0 failed
```

---

## Role Capabilities

### Admin
- View all tickets and their statuses
- Assign tickets to field staff
- View analytics and reports (open, critical, total counts)
- Access priority queue

### Field Staff
- View tickets assigned to them
- Update ticket status (open → in-progress → resolved)

### Consumer
- Create new support tickets
- View their own ticket history and status

---

## Architecture Overview

```
Browser (port 3000)
      │
      ▼
Node.js Express Server     ← serves static HTML/CSS/JS files
      │
      ▼
public/js/api.js           ← makes fetch() calls to port 9090
      │
      ▼
C Backend (port 9090)      ← handles all API logic
      │
      ├── Hash Table        ← user auth
      ├── AVL Tree          ← ticket storage
      ├── Max-Heap          ← priority queue
      ├── Trie              ← username autocomplete
      └── LRU Cache         ← ticket GET caching
```

---

## License

MIT