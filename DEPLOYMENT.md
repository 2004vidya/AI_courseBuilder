# Deployment Guide

## Prerequisites
- GitHub account
- Vercel account (for frontend)
- Render account (for backend)
- MongoDB Atlas account (for database)

## 1. Push to GitHub

```bash
git add .
git commit -m "Prepare for deployment: Add environment configs and CORS setup"
git push origin main
```

## 2. Deploy Backend on Render

1. Go to [Render.com](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `ai-coursebuilder-backend` (or your preferred name)
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add Environment Variables in Render:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_jwt_secret_here
   NODE_ENV=production
   FRONTEND_URL=https://your-app-name.vercel.app
   ```

6. Deploy and note your Render URL (e.g., `https://your-app-name.onrender.com`)

## 3. Deploy Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables in Vercel:
   ```
   VITE_API_URL=https://your-render-app-name.onrender.com/api
   ```

6. Deploy

## 4. Update CORS Configuration

After getting your Vercel URL, update the backend CORS configuration:

1. In your Render dashboard, go to Environment Variables
2. Update `FRONTEND_URL` to your actual Vercel URL
3. Redeploy the backend service

## 5. Test the Deployment

1. Visit your Vercel URL
2. Try generating a course
3. Check that all API calls work correctly

## Troubleshooting

- **CORS errors**: Make sure FRONTEND_URL in Render matches your Vercel URL exactly
- **API not found**: Verify VITE_API_URL in Vercel points to your Render backend
- **Database connection**: Check MONGO_URI is correct in Render environment variables
- **AI API errors**: Verify GEMINI_API_KEY is set correctly in Render

## Environment Variables Summary

### Frontend (Vercel)
- `VITE_API_URL`: Your Render backend URL + `/api`

### Backend (Render)
- `MONGO_URI`: MongoDB connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `JWT_SECRET`: Random secret string for JWT
- `NODE_ENV`: `production`
- `FRONTEND_URL`: Your Vercel frontend URL
