# Doctor Shift Management System

A production-ready responsive web application for doctors to manage shifts, track earnings, and find free time properly, powered by Gemini AI.

## Features

- **Authentication**: Secured with Google OAuth 2.0 and a whitelist system.
- **Shift Management**: Interactive calendar to add, edit, and view shifts.
- **Financial Dashboard**: Track daily, monthly, and yearly earnings.
- **Gemini AI Assistant**: Chat with an AI that knows your schedule and earnings context.
- **Admin Panel**: Manage authorized users.
- **Reports**: Export your data to CSV.

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, Vite, TypeScript, TailwindCSS
- **AI**: Google Gemini API
- **Database**: PostgreSQL (with automatic schema migration)
- **Deployment**: Ready for Vercel (Frontend) and Render/Railway (Backend)

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Google Cloud Project (for OAuth Client ID and Gemini API Key)

### 1. Database Setup
Execute the SQL script located at `database/schema.sql` in your PostgreSQL instance to create the necessary tables.

### 2. Backend Setup
1. Navigate to the backend folder: `cd backend`
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   DATABASE_URL=postgres://user:pass@localhost:5432/dbname
   GOOGLE_CLIENT_ID=your_client_id
   GEMINI_API_KEY=your_api_key
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `npm run dev`

### 3. Frontend Setup
1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`

## Deployment Guide

### Database
Use a cloud provider like **Neon**, **Supabase**, or **Railway** to host your PostgreSQL database.

### Backend (Render/Railway)
1. Push this repository to GitHub.
2. Connect your repo to Render/Railway.
3. Set the Root Directory to `backend`.
4. Set the Build Command to `npm install && npm run build`.
5. Set the Start Command to `npm start`.
6. Add your Environment Variables.

### Frontend (Vercel)
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Set the Root Directory to `frontend`.
4. Vercel automatically detects Vite.
5. Add `VITE_API_URL` environment variable pointing to your deployed backend URL.

## Admin Setup
The first admin must be added manually to the database:
```sql
INSERT INTO whitelist (email, role) VALUES ('your_email@gmail.com', 'admin');
```

## AI Configuration
The AI prompts are located in `backend/src/services/ai.service.ts`. You can customize the system prompt to change the assistant's personality or capabilities.
