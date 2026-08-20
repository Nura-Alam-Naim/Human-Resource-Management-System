# 🚀 Step-by-Step Deployment Guide (Free & Auto-Updating)

This guide will walk you through deploying your **Node.js/MySQL Backend on Render** and your **React Frontend on Vercel**. Both platforms are free, incredibly popular, and will automatically redeploy your app whenever you push code to GitHub.

---

## Step 1: Push Your Code to GitHub
Ensure all your latest code (including the `package.json` updates and Docker files we made) is pushed to your GitHub repository.

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

---

## Step 2: Deploy the Database & Backend on Render
Render is fantastic because it can host both your MySQL database and your Node.js backend.

### A. Set Up the Database
1. Go to [Render.com](https://render.com) and create a free account.
2. Click **New** -> **MySQL** (or PostgreSQL if you prefer, but your code is written for MySQL). Note: Render's native free tier is PostgreSQL. For a free MySQL database, you can use a service like [Aiven](https://aiven.io/mysql) or [Railway](https://railway.app). Assuming you use Railway for MySQL:
   - Go to [Railway.app](https://railway.app), create a project, and add a **MySQL** plugin.
   - Click on the MySQL database to view the credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`). Save these!

### B. Deploy the Node.js Backend
1. Go to your Render Dashboard and click **New** -> **Web Service**.
2. Connect your GitHub account and select your repository.
3. Scroll down and fill out the following settings:
   - **Name:** `leave-portal-backend`
   - **Root Directory:** `backend` (This tells Render your backend code is inside this folder).
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm run start` (We added this script earlier!)
4. **Environment Variables:** Scroll down to the Advanced section and add all your secrets from Railway:
   - `DB_HOST` (Paste from Railway)
   - `DB_USER` (Paste from Railway)
   - `DB_PASSWORD` (Paste from Railway)
   - `DB_NAME` (Paste from Railway)
   - `JWT_SECRET` (Enter any random long string, e.g., `supersecretproductionkey123`)
5. Click **Create Web Service**. 
   > **Note:** Render will take a few minutes to build. Once it's done, it will give you a public URL (e.g., `https://leave-portal-backend.onrender.com`). **Copy this URL!**

---

## Step 3: Prepare the Frontend for Deployment
Right now, your frontend assumes the backend is at `http://localhost:8800`. We need to tell it to use the new Render URL when in production.

1. Open your code editor and go to `frontend/vite.config.js`. You'll likely see a proxy configuration. We don't need to change `vite.config.js` for production, but we need to configure `axios` to point to the live server.
2. The best way to do this is to open `frontend/src/context/AuthContext.jsx` (where we set `axios.defaults`) and add this line right below the imports:
   ```javascript
   axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
   ```
3. Push this change to GitHub!

---

## Step 4: Deploy the Frontend on Vercel
Vercel is the creator of Next.js and is arguably the best platform for hosting React apps.

1. Go to [Vercel.com](https://vercel.com) and create a free account using your GitHub.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. **Configure the Project:**
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click Edit and select `frontend`.
5. **Environment Variables:**
   - Expand the Environment Variables section.
   - Name: `VITE_API_URL`
   - Value: The URL you copied from Render in Step 2 (e.g., `https://leave-portal-backend.onrender.com`). **Make sure you do NOT include a trailing slash!**
6. Click **Deploy**.

## 🎉 You're Done!
Vercel will build your React app and give you a beautiful, live URL (e.g., `https://leave-portal-frontend.vercel.app`).

### Testing the Automation
To prove the CI/CD pipeline works:
1. Make a small text change in your frontend (e.g., changing "Leave Management Portal" to "My Leave Portal").
2. Commit and push it to GitHub.
3. Watch Vercel's dashboard automatically detect the push, rebuild the app, and update the live site within a minute! 

*(Render will do the exact same thing automatically for your backend!)*
