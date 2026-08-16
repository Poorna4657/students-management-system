# Student Management System - MongoDB Edition

This is a Student Management System built with **React + TypeScript + Vite** frontend and **Node.js + Express + MongoDB** backend.

## 🎯 Project Structure

```
├── src/                      # React Frontend
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts (Auth, Theme)
│   ├── lib/                 # Utilities (API client, formatting)
│   ├── pages/               # Page components
│   ├── types/               # TypeScript type definitions
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/                  # Node.js + Express Backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── routes/         # API endpoints
│   │   ├── server.ts       # Express server
│   ├── .env                # Server environment variables
│   └── package.json
├── supabase/               # Database migrations (reference only)
├── .env                    # Frontend environment variables
├── index.html
└── package.json
```

## 🗄️ Database Schema (MongoDB)

The application uses MongoDB with the following collections:

### Users Collection
```javascript
{
  _id: ObjectId,
  email: string (unique),
  password: string (hashed),
  name: string,
  created_at: Date,
  updated_at: Date
}
```

### Students Collection
```javascript
{
  _id: ObjectId,
  first_name: string,
  last_name: string,
  email: string (unique),
  phone: string | null,
  date_of_birth: string | null (ISO 8601 format),
  gender: 'male' | 'female' | 'other' | null,
  address: string | null,
  enrollment_date: string (ISO 8601 format),
  status: 'active' | 'inactive' | 'graduated' | 'suspended',
  user_id: string,
  created_at: Date,
  updated_at: Date
}
```

### Courses Collection
```javascript
{
  _id: ObjectId,
  code: string (unique),
  title: string,
  description: string | null,
  credits: number,
  instructor: string | null,
  capacity: number,
  status: 'active' | 'archived',
  user_id: string,
  created_at: Date,
  updated_at: Date
}
```

### Enrollments Collection
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (reference to Students),
  course_id: ObjectId (reference to Courses),
  enrollment_date: string (ISO 8601 format),
  grade: string | null,
  status: 'enrolled' | 'completed' | 'dropped',
  user_id: string,
  created_at: Date
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  student_id: ObjectId (reference to Students),
  course_id: ObjectId (reference to Courses),
  date: string (ISO 8601 format),
  status: 'present' | 'absent' | 'late' | 'excused',
  notes: string | null,
  user_id: string,
  created_at: Date
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd students-management-system
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Configure environment variables**

   Create `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

   Create `server/.env` file:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017
   DB_NAME=student_management
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

   **For MongoDB Atlas:**
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
   DB_NAME=student_management
   PORT=5000
   NODE_ENV=development
   ```

### Running the Application

#### Option 1: Run Frontend and Backend Separately (Recommended for Development)

**Terminal 1 - Start the Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start the Frontend:**
```bash
npm run dev
```

#### Option 2: Run Both Simultaneously
```bash
npm run dev:all
```

The application will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000/api

## 📡 API Endpoints

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `GET /api/enrollments` - Get all enrollments
- `GET /api/enrollments/course/:courseId` - Get enrollments for a course
- `POST /api/enrollments` - Create new enrollment
- `PUT /api/enrollments/:id` - Update enrollment
- `DELETE /api/enrollments/:id` - Delete enrollment

### Attendance
- `GET /api/attendance` - Get all attendance records
- `GET /api/attendance/course/:courseId/date/:date` - Get attendance for a specific date
- `POST /api/attendance` - Create or update attendance
- `DELETE /api/attendance/:id` - Delete attendance record

## 🔄 Migration from Supabase

The following changes were made to migrate from Supabase to MongoDB:

1. **Replaced `supabase.ts`** with MongoDB API client in `src/lib/supabase.ts`
2. **Created Express backend** with RESTful API endpoints
3. **Updated all pages** to use the new API instead of direct database calls:
   - `StudentsPage.tsx`
   - `CoursesPage.tsx`
   - `AttendancePage.tsx`
4. **Created MongoDB collections** with proper indexes and relationships
5. **Added environment configuration** for API URL

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run typecheck    # Type check with TypeScript
npm run preview      # Preview production build
```

**Backend:**
```bash
cd server
npm run dev          # Start development server with TypeScript
npm run build        # Build TypeScript to JavaScript
npm start            # Run production build
```

### Building for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd server
npm run build
```

Deploy the `dist` folder from both frontend and backend to your hosting provider.

## 📝 Features

- ✅ **Student Management** - Add, edit, delete, and view students
- ✅ **Course Management** - Manage courses with codes, titles, and capacity
- ✅ **Student Enrollment** - Enroll students in courses with status tracking
- ✅ **Attendance Tracking** - Mark attendance with different statuses
- ✅ **Search & Filter** - Search and filter records by various criteria
- ✅ **Dark Mode** - Theme switcher for light/dark mode
- ✅ **Responsive Design** - Mobile-friendly interface
- ✅ **Type Safety** - Full TypeScript support

## 🗄️ Database Setup

### Using Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service
3. Use the connection string in `.env`: `mongodb://localhost:27017`

### Using MongoDB Atlas (Cloud)

1. Create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and database
3. Generate connection string with credentials
4. Update `MONGODB_URI` in `server/.env`

## 🔐 Authentication

Currently, authentication is implemented as a placeholder in the backend (`server/src/routes/auth.ts`). For production use, implement:

- Password hashing (bcrypt)
- JWT token generation
- Token verification middleware
- Session management

## 📚 Technology Stack

**Frontend:**
- React 18
- TypeScript 5
- Vite
- TailwindCSS
- Lucide Icons
- React Router

**Backend:**
- Node.js
- Express.js
- MongoDB
- TypeScript

**Development Tools:**
- ESLint
- Concurrently
- Vite

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ❓ Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running locally or check MongoDB Atlas connection string
- Verify `MONGODB_URI` in `server/.env`
- Check network connectivity for MongoDB Atlas

### API Not Responding
- Ensure backend server is running on port 5000
- Check if `VITE_API_URL` is correctly set to `http://localhost:5000/api`
- Look at server console for error messages

### Port Already in Use
- Frontend: Change Vite port in `vite.config.ts`
- Backend: Change port in `server/.env`

## 📞 Support

For issues or questions, please open an issue on the repository.
