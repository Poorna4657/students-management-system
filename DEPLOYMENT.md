# Deployment & Hosting Guide — Student Management System

This guide explains how to connect and host the **Student Management System** frontend, Express backend, and MongoDB database across various hosting environments.

---

## 🏗️ Architecture Overview

- **Frontend**: React 18 + Vite + Tailwind CSS (Build output: static files in `/dist`)
- **Backend**: Express.js + Node.js (TypeScript) running on Port `5000`
- **Database**: MongoDB (Local or MongoDB Atlas Cluster)

---

## 🔑 Environment Variables Setup

### 1. Backend Environment Variables (`server/.env`)

```env
# MongoDB Connection String
# Local: mongodb://localhost:27017
# Atlas Cloud: mongodb+srv://<db_user>:<password>@cluster0.mongodb.net
MONGODB_URI=mongodb+srv://admin:securepassword@cluster0.mongodb.net

# Database Name
DB_NAME=student_management

# Port & Node Environment
PORT=5000
NODE_ENV=production

# Allowed CORS Origins (comma separated)
CORS_ORIGIN=https://your-frontend-domain.vercel.app,http://localhost:5173
```

### 2. Frontend Environment Variables (`.env`)

```env
# URL pointing to your deployed Express backend API
VITE_API_URL=https://your-backend-api.onrender.com/api
```

---

## 🚀 Option 1: Docker & Docker Compose (Recommended for VPS / DigitalOcean / EC2)

The project includes `Dockerfile` for both frontend & backend and `docker-compose.yml`.

### Step 1: Configure `.env` in root
Create a `.env` file in the root project folder:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net
DB_NAME=student_management
```

### Step 2: Build & Launch Container Services
```bash
docker compose up -d --build
```

- **Frontend**: Accessible at `http://<your-server-ip>` (Port 80)
- **Backend API**: Accessible at `http://<your-server-ip>:5000/api`

---

## ☁️ Option 2: Hosting on Render / Railway + MongoDB Atlas

### 1. Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
2. Under **Database Access**, create a database user and password.
3. Under **Network Access**, add `0.0.0.0/0` (Allow Access from Anywhere).
4. Click **Connect** -> **Drivers** -> Copy the connection string (`mongodb+srv://...`).

### 2. Backend (Render / Railway)
1. Connect your GitHub repository to [Render.com](https://render.com) or [Railway.app](https://railway.app).
2. Create a new **Web Service**.
3. Set **Root Directory**: `server`
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `npm run start`
6. Add Environment Variables:
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `DB_NAME`: `student_management`
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: `https://<your-frontend-app>.vercel.app`

### 3. Frontend (Vercel / Netlify / Render)
1. Connect your GitHub repository to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
2. Set **Root Directory**: `./` (Project Root)
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-backend-service>.onrender.com/api`

---

## 🧪 Local Testing & Verification

To run both frontend and backend co-currently in development:

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Start both frontend and backend concurrently
npm run dev:all
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`
