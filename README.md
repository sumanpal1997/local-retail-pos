# RetailPOS Cloud SaaS — Full-Stack Production & Deployment Guide

A multi-tenant Cloud Point-of-Sale (POS), Inventory, Khata Ledger, and AI Distributor Bill OCR SaaS platform built with React (Vite), Express.js, Node.js, MongoDB, and Tailwind CSS.

---

## 🌐 Deployment Options

This application is architected for zero-friction cloud deployment across multiple hosting providers:

### Option A: 1-Click Render.com Fullstack Deployment (Recommended)
Deploy both the React frontend SPA and Node Express backend as a single unified service:

1. Push this repository to your **GitHub / GitLab** account:
   ```bash
   git add .
   git commit -m "feat: complete production SaaS platform with AI bill scanner"
   git remote add origin https://github.com/<your-username>/retail-pos-saas.git
   git branch -M main
   git push -u origin main
   ```
2. Log into [Render.com](https://render.com) and click **"New +" -> "Blueprint"**.
3. Select your repository. Render will automatically read [`render.yaml`](./render.yaml).
4. Set the `MONGODB_URI` environment variable to your free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/retailpos?retryWrites=true&w=majority
   ```
5. Click **"Apply"** — Render builds the client bundle and starts the Node server with SSL enabled!

---

### Option B: Docker & Docker Compose (Self-Hosted VPS / Droplet)
Run on any Ubuntu, Debian, AWS EC2, or DigitalOcean Droplet:

1. Clone repo onto your server.
2. Run Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. Your application is live on port `5000` with an attached MongoDB 7.0 database and persistent volume!

---

### Option C: Split Deployment (Vercel Frontend + Render/Railway Backend)

#### 1. Backend on Render / Railway:
- Root directory: `server`
- Build command: `npm install`
- Start command: `node src/index.js`
- Set `MONGODB_URI` and `JWT_SECRET`.
- Note your live API URL (e.g. `https://retailpos-api.onrender.com`).

#### 2. Frontend on Vercel:
- Root directory: `client`
- Framework Preset: `Vite`
- Environment Variables:
  - `VITE_API_BASE_URL`: `https://retailpos-api.onrender.com`
- Click **Deploy**!

---

## 🔑 Default Production Seed Credentials

| Role | Email | Password | Scope |
|---|---|---|---|
| **Super Admin (Product Owner)** | `admin@retailpos.com` | `admin123` | Global Platform HQ, Organizations, MRR Analytics |
| **Demo Merchant Store** | `apnasupermart@localpos.com` | `store123` | Store POS, Catalog, AI Bill Restock, Khata |

---

## 🛠️ Local Production Preview

To test the exact production bundle locally:

```bash
# 1. Build the frontend
npm run build

# 2. Start the production server (serves frontend + API on port 5000)
npm start
```

Visit: `http://localhost:5000`
