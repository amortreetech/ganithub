# 🧮 GanitHub - Complete EdTech Platform for Mathematics Learning

**GanitHub** is a comprehensive, modern EdTech web application designed specifically for kids (ages 7-14) to learn mathematics online. Built with React.js and Node.js, it features live classes, interactive tests, gamification, and a powerful admin dashboard.

## 🌟 Key Features

### 🎓 **Student Experience**
- **Interactive Dashboard** with personalized learning statistics
- **Live Video Classes** with Jitsi Meet integration
- **Recorded Video Library** with progress tracking
- **Interactive MCQ Tests** with real-time scoring
- **Gamification System** with coins, badges, and leaderboards
- **Rewards Store** for spending earned coins
- **Progress Tracking** across all learning activities

### 👨‍🏫 **Educator Tools**
- **Class Management** with scheduling and attendance tracking
- **Content Creation** for videos and assessments
- **Student Progress Monitoring**
- **Test Creation** with multiple difficulty levels

### 🛠️ **Admin Dashboard**
- **User Management** with role-based access control
- **Content Management System** for all platform content
- **Analytics & Reporting** with detailed platform statistics
- **Real-time Activity Monitoring**
- **System Configuration** and settings management

## 🚀 Tech Stack

### Frontend
- **React.js 18** with modern hooks and functional components
- **Tailwind CSS** for responsive, utility-first styling
- **shadcn/ui** for professional UI components
- **Lucide React** for consistent iconography
- **Jitsi Meet SDK** for live video conferencing

### Backend
- **Node.js** with Express.js framework
- **MySQL** database with comprehensive schema
- **JWT Authentication** with role-based access control
- **RESTful API** design with proper error handling
- **File Upload** support for videos and images

### Development Tools
- **Vite** for fast development and building
- **ESLint** for code quality
- **Nodemon** for backend development
- **CORS** enabled for frontend-backend communication

## 📁 Project Structure

```
ganithub/
├── frontend/                 # React.js frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── VideoComponents.jsx    # Live classes & video player
│   │   │   ├── TestComponents.jsx     # Testing & gamification
│   │   │   └── AdminComponents.jsx    # Admin dashboard
│   │   ├── App.jsx          # Main application component
│   │   └── App.css          # Global styles with Tailwind
│   ├── index.html           # HTML template
│   └── package.json         # Frontend dependencies
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   │   ├── User.js      # User management
│   │   │   ├── LiveClass.js # Class management
│   │   │   ├── Test.js      # Testing system
│   │   │   └── Gamification.js # Coins & badges
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Authentication & validation
│   │   ├── config/          # Database configuration
│   │   └── server.js        # Main server file
│   ├── uploads/             # File storage
│   ├── .env                 # Environment variables
│   └── package.json         # Backend dependencies
├── database_schema.sql      # Complete MySQL schema
├── todo.md                  # Development progress tracker
└── README.md               # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn** package manager

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ganithub
```

### 2. Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE ganithub;
USE ganithub;

# Import the schema
mysql -u root -p ganithub < database_schema.sql
```

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start the backend server
npm start
# Server will run on http://localhost:5000
```

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# Frontend will run on http://localhost:5173
```

## 🎮 Demo Accounts

The application includes three demo accounts for easy testing:

### Student Demo
- **Email:** `demo@ganithub.com`
- **Password:** `demo`
- **Features:** Full student experience with dashboard, classes, tests, and gamification

### Admin Demo
- **Email:** `admin@ganithub.com`
- **Password:** `admin`
- **Features:** Complete admin dashboard with user management and analytics

### Tutor Demo
- **Email:** `tutor@ganithub.com`
- **Password:** `tutor`
- **Features:** Educator tools for class and content management

## 🎯 Core Functionality

### Authentication System
- **Multi-role Support:** Student, Tutor, Parent, Admin
- **JWT-based Security** with token validation
- **Role-based Access Control** for different user types
- **Password Reset** and profile management

### Live Classes
- **Jitsi Meet Integration** for high-quality video conferencing
- **Class Scheduling** with calendar integration
- **Automatic Attendance** tracking on class join
- **Class Management** tools for educators

### Interactive Testing
- **MCQ Question System** with multiple difficulty levels
- **Real-time Timer** and progress tracking
- **Automatic Scoring** with detailed results
- **Performance Analytics** by topic and difficulty

### Gamification Engine
- **Coin System** with rewards for activities
- **Badge Collection** with 6+ achievement types
- **Competitive Leaderboard** with weekly rankings
- **Rewards Store** with purchasable items

### Admin Dashboard
- **User Management** with search and filtering
- **Content Management** for videos and tests
- **Real-time Analytics** with key performance indicators
- **Activity Monitoring** with live platform updates

## 🎨 UI/UX Design

### Student Interface
- **Kid-friendly Design** with bright colors and engaging visuals
- **Intuitive Navigation** with clear icons and labels
- **Responsive Layout** that works on all devices
- **Interactive Elements** with hover effects and animations

### Admin Interface
- **Professional Design** with clean, minimal aesthetics
- **Data-rich Dashboards** with charts and statistics
- **Efficient Workflows** for content and user management
- **Comprehensive Reporting** tools

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Classes
- `GET /api/classes` - Get all classes
- `POST /api/classes` - Create new class (tutor/admin)
- `PUT /api/classes/:id` - Update class
- `POST /api/classes/:id/join` - Join class (student)

### Tests
- `GET /api/tests` - Get available tests
- `POST /api/tests` - Create new test (admin)
- `POST /api/tests/:id/attempt` - Submit test attempt
- `GET /api/tests/:id/results` - Get test results

## 🎯 Key Achievements

### Technical Excellence
- **Modular Architecture** with reusable components
- **Scalable Database Design** with proper relationships
- **Professional UI/UX** with modern design principles
- **Real-time Features** with live updates and notifications

### Educational Features
- **Comprehensive Learning Path** from basic to advanced topics
- **Engaging Gamification** that motivates continued learning
- **Progress Tracking** with detailed analytics
- **Multi-modal Learning** with videos, tests, and live interaction

### Administrative Power
- **Complete User Management** with role-based permissions
- **Content Management System** for easy updates
- **Detailed Analytics** for platform optimization
- **Scalable Architecture** ready for growth

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
# Set production environment variables
NODE_ENV=production
# Deploy to your server with PM2 or similar process manager
```

### Database Migration
```bash
# Run the database schema on your production MySQL instance
mysql -u username -p production_db < database_schema.sql
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Jitsi Meet** for excellent video conferencing capabilities
- **Tailwind CSS** for the utility-first CSS framework
- **shadcn/ui** for beautiful, accessible UI components
- **Lucide** for the comprehensive icon library

## 📞 Support

For support, email support@ganithub.com or create an issue in the repository.

---

**Built with ❤️ for young mathematicians everywhere!**

