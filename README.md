# 🎫 Carbochem Helpdesk Ticketing System

A full-stack helpdesk ticketing system with advanced data structures implementation in C.

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                       │
│       HTML/CSS/JS + Bootstrap + JWT Authentication      │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS/REST API
                     ↓
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY LAYER                      │
│    Node.js + Express + Rate Limiting + Validation       │
│    - JWT Authentication                                  │
│    - Request validation                                  │
│    - CORS handling                                       │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP (Internal)
                     ↓
┌─────────────────────────────────────────────────────────┐
│                  CORE BUSINESS LOGIC                     │
│           C Server (Multi-threaded HTTP Server)         │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         ADVANCED DATA STRUCTURES                  │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ • Hash Table (O(1) user lookup)                  │  │
│  │ • AVL Tree (O(log n) ticket search by ID)        │  │
│  │ • Priority Queue (urgent tickets first)          │  │
│  │ • Trie (autocomplete for usernames)              │  │
│  │ • LRU Cache (frequently accessed tickets)        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Features

- **Multi-role Authentication**: Admin, Staff, and Consumer roles with JWT
- **Real-time Ticket Management**: Create, assign, update, and track tickets
- **Priority-based Routing**: Automatic prioritization using Priority Queue
- **Fast Search**: O(log n) ticket search using AVL Tree
- **Username Autocomplete**: Trie-based instant search
- **Performance Optimization**: LRU Cache for frequently accessed data
- **Responsive UI**: Modern dashboard with Bootstrap 5

## 💻 Tech Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Bootstrap 5
- Chart.js for reports

### Backend
- **API Gateway**: Node.js, Express.js
- **Core Logic**: C (GCC compiler)
- **Authentication**: JWT tokens
- **Storage**: In-memory (C structures)

### Data Structures (C Implementation)
1. **Hash Table**: O(1) user authentication
2. **AVL Tree**: O(log n) balanced ticket search
3. **Priority Queue**: O(log n) urgent ticket retrieval
4. **Trie**: O(m) username autocomplete (m = length)
5. **LRU Cache**: O(1) recently accessed tickets

## 📦 Installation

### Prerequisites
- Node.js (v14+)
- GCC Compiler (MinGW for Windows)

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Helpdesk_ticketing_system
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
PORT=3000
JWT_SECRET=your_secret_key_here
```

4. **Compile C Backend** (Windows)
```bash
cd backend-c
build.bat
```

5. **Start the servers**

Terminal 1 - Node.js Gateway:
```bash
npm start
```

Terminal 2 - C Backend:
```bash
cd backend-c/src
helpdesk.exe -a
```

6. **Access the application**
```
http://localhost:3000
```

## 👤 Default Credentials

| Role     | Username | Password    |
|----------|----------|-------------|
| Admin    | admin    | admin123    |
| Staff    | staff    | staff123    |
| Consumer | client   | client123   |

## 📁 Project Structure
```
Helpdesk_ticketing_system/
├── api/
│   └── routes/
│       ├── index.js        # API routes
│       └── mock_data.js    # Mock data (for testing)
├── backend-c/
│   └── src/
│       └── helpdesk.c      # C backend with data structures
├── public/
│   ├── html/               # All HTML pages
│   └── js/                 # Frontend JavaScript
├── server.js               # Node.js Express server
├── package.json
└── .env
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth` - Login
- `POST /api/register` - Register user (admin only)

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create ticket
- `GET /api/mytickets` - Get user's tickets
- `GET /api/tickets/:id` - Get specific ticket
- `PUT /api/tickets/:id/status` - Update status
- `PUT /api/tickets/:id/assign` - Assign to staff

### Statistics
- `GET /api/stats` - Get dashboard stats (admin only)

## 🔐 Security Features

- JWT-based authentication
- Role-based access control
- Password hashing (production ready)
- CORS protection
- SQL injection prevention

## 📊 Performance

| Operation | Complexity | Data Structure |
|-----------|------------|----------------|
| User Login | O(1) | Hash Table |
| Ticket Search | O(log n) | AVL Tree |
| Get Urgent Ticket | O(log n) | Priority Queue |
| Username Autocomplete | O(m) | Trie |
| Recent Tickets | O(1) | LRU Cache |

## 🧪 Testing
```bash
npm test
```

## 🚀 Deployment

(To be added - instructions for deploying to cloud platforms)

## 📝 License

MIT License

## 👨‍💻 Author

Your Name - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- Built as part of advanced data structures learning
- Inspired by real-world helpdesk systems