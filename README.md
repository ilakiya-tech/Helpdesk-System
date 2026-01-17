# 🎫 Carbochem Helpdesk Ticketing System

A full-stack helpdesk ticketing system with advanced data structures implementation in C and Node.js backend.

## ✨ Features

- **User Authentication**: JWT-based authentication with 3 user roles
- **Multi-Role Dashboard**: Admin, Staff, and Consumer views
- **Ticket Management**: Create, view, filter, and manage support tickets
- **Real-time Updates**: Live ticket status and priority tracking
- **Search & Filter**: Advanced ticket filtering by status, priority, and category
- **Responsive Design**: Works on desktop and mobile devices
- **Statistics Dashboard**: Real-time statistics for administrators

## 🏗️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 for responsive design
- Chart.js for statistics visualization

### Backend
- **Node.js** with Express.js framework
- **JWT** for authentication
- **Mock Database** for testing
- Ready for C backend integration

### Data Structures (C Backend - Optional)
- Hash Table for O(1) ticket lookup
- AVL Tree for sorted ticket management
- Priority Queue for urgent ticket handling
- Trie for search optimization
- LRU Cache for performance

## 📋 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Field Staff | `staff` | `staff123` |
| Consumer | `client` | `client123` |

## 🚀 Quick Start

### Prerequisites
- Node.js v14 or higher
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ilakiya-tech/Helpdesk-System.git
cd Helpdesk-System
```

2. **Install dependencies**
```bash
npm install
```

3. **Create .env file**
```bash
PORT=3000
JWT_SECRET=your_super_secret_key_change_this_in_production
NODE_ENV=development
```

4. **Start the server**
```bash
node server.js
```

5. **Open in browser**
```
http://localhost:3000
```

## 📂 Project Structure

```
Helpdesk_ticketing_system/
├── public/
│   ├── html/                 # Frontend pages
│   │   ├── index.html       # Login page
│   │   ├── admin.html       # Admin dashboard
│   │   ├── staff.html       # Staff dashboard
│   │   ├── client.html      # Consumer dashboard
│   │   ├── create-ticket.html
│   │   ├── ticket-details.html
│   │   ├── register.html
│   │   └── admin-report.html
│   └── js/
│       ├── api.js           # API client
│       └── auth.js          # Authentication handler
├── api/
│   └── routes/
│       ├── index.js         # API routes
│       └── mock_data.js     # Mock database
├── backend-c/
│   └── src/
│       └── helpdesk.c       # C backend (optional)
├── server.js                # Express server
├── package.json
└── .env                     # Environment variables
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth` - User login

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get ticket details
- `PUT /api/tickets/:id/status` - Update ticket status
- `PUT /api/tickets/:id/assign` - Assign ticket to staff

### Admin
- `POST /api/register` - Register new user
- `GET /api/stats` - Get statistics

## 👥 User Roles & Permissions

### Admin
- View all tickets
- Create tickets
- Assign tickets to staff
- Register new users
- View statistics and reports

### Field Staff
- View assigned tickets
- Update ticket status
- View ticket details

### Consumer
- Create tickets
- View their own tickets
- Track ticket status

## 🔐 Security Features

- JWT token-based authentication
- Password hashing (ready for implementation)
- Role-based access control
- Secure API endpoints with authentication middleware

## 🚧 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Email notifications
- [ ] File upload support
- [ ] C backend performance optimization
- [ ] Real-time notifications with WebSocket
- [ ] Advanced reporting features
- [ ] SLA management
- [ ] Customer feedback system

## 📊 Current Status

- ✅ Frontend: 100% Complete
- ✅ Node.js Backend: 100% Complete
- ✅ Authentication: 100% Complete
- ✅ API Routes: 100% Complete
- ✅ Dashboard Pages: 100% Complete
- ⏳ C Backend: Ready for compilation

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📝 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Ilakiya Tech**
- GitHub: [@ilakiya-tech](https://github.com/ilakiya-tech)

## 📧 Support

For issues and questions, please create an issue in the GitHub repository.

---

**Status**: Ready for production deployment ✅