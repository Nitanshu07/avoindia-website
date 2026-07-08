# 🥑 AvoIndia Website

A full-stack avocado farming & blog platform for **AvoIndia** — featuring a public website, blog with comments & likes, live avocado prices, visitor lead capture, and a powerful admin panel.

---

## 🌐 Live Links

| Service | URL |
|---------|-----|
| **Frontend (Website)** | [avoindia-website-mzp9.vercel.app](https://avoindia-website-mzp9.vercel.app) |
| **Backend API** | [avoindia-website.vercel.app/api](https://avoindia-website.vercel.app/api) |
| **Admin Panel** | [avoindia-website-mzp9.vercel.app/admin](https://avoindia-website-mzp9.vercel.app/admin) |

---

## ✨ Features

### Public Website (`index.html`)
- **Blog Posts** — Read farming articles with like & comment support
- **Live Avocado Prices** — Real-time price display by variety & grade
- **Lead Capture** — Visitor sign-up form saved to MongoDB
- **User Auth** — Local login/signup, persistent sessions
- **Comments System** — Comments synced to backend MongoDB (visible to all users)
- **Likes System** — Like tracking synced to backend, persistent across sessions
- **Responsive Design** — 3D glassmorphism UI with animations

### Admin Panel (`/admin`)
- **Dashboard** — Visitor stats, mini charts, real-time overview
- **Live Prices** — Edit avocado prices per variety/grade directly
- **Blog Posts** — Create, edit, publish/unpublish posts with rich editor
- **Visitor Leads** — CRM table with search, filter, export
- **Sales Reports** — Publish and view sales analytics
- **Engagement** — View all comments (with delete) + likes-per-post table
- **JWT Auth** — Secure login with session tokens

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS — single-file SPA |
| Backend | Node.js serverless functions (Vercel) |
| Database | MongoDB Atlas |
| Auth | JWT (jsonwebtoken) |
| Hosting | Vercel (frontend + backend, separate projects) |

---

## 📁 Project Structure

```
avoindia-website/
├── index.html          # Public website (SPA)
├── admin.html          # Admin panel
├── vercel.json         # Frontend Vercel config
│
└── backend/
    ├── api/
    │   ├── auth.js     # POST /api/auth — admin login, returns JWT
    │   ├── posts.js    # GET/POST/PUT/DELETE /api/posts
    │   ├── prices.js   # GET/POST /api/prices
    │   ├── visitors.js # GET/POST /api/visitors — lead capture & CRM
    │   ├── comments.js # GET/POST/DELETE /api/comments
    │   └── likes.js    # GET/POST /api/likes
    ├── lib/
    │   └── mongodb.js  # MongoDB Atlas connection (singleton)
    ├── package.json
    └── vercel.json     # Backend Vercel config (routes + CORS)
```

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth` | Admin login → returns `{ token }` |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | List all published posts |
| GET | `/api/posts?admin=1` | All posts (admin, JWT required) |
| POST | `/api/posts` | Create post (JWT) |
| PUT | `/api/posts?id=<id>` | Update post (JWT) |
| DELETE | `/api/posts?id=<id>` | Delete post (JWT) |

### Prices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prices` | Get all prices |
| POST | `/api/prices` | Update prices (JWT) |

### Visitors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/visitors` | All visitors (JWT) |
| POST | `/api/visitors` | Submit visitor lead |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments?slug=<slug>` | Comments for a post (public) |
| GET | `/api/comments?all=1` | All comments across posts (JWT) |
| POST | `/api/comments` | Add comment `{ slug, name, email, text }` |
| DELETE | `/api/comments?id=<id>` | Delete comment (JWT) |

### Likes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/likes` | Likes per post + recent likes (JWT) |
| POST | `/api/likes` | Record a like `{ slug, name, email }` |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas cluster (free tier works)
- Vercel CLI (`npm i -g vercel`)

### 1. Clone the repo
```bash
git clone https://github.com/Nitanshu07/avoindia-website.git
cd avoindia-website
```

### 2. Set up backend environment
```bash
cd backend
cp .env.example .env
# Edit .env — add your MongoDB URI, JWT secret, and admin password
npm install
```

### 3. Run backend locally
```bash
cd backend
vercel dev --listen 3001
# API available at http://localhost:3001/api
```

### 4. Run frontend locally
Open `index.html` in a browser, or use Live Server.

> The frontend `API` constant in `index.html` points to the production backend by default.  
> For local dev, change it to `http://localhost:3001`.

---

## 🔐 Environment Variables

Create `backend/.env` based on `backend/.env.example`:

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/avoindia
JWT_SECRET=your_super_secret_key
ADMIN_PASSWORD=your_admin_password
```

---

## 🚀 Deploy to Vercel

### Frontend
```bash
# From repo root
vercel --prod
```

### Backend
```bash
cd backend
vercel --prod
# Set environment variables in Vercel dashboard:
# MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
```

After deploying the backend, update the `API` constant in `index.html` and `admin.html` to point to your backend URL.

---

## 📊 Database Collections (MongoDB)

| Collection | Purpose |
|-----------|---------|
| `posts` | Blog posts with title, content, slug, likes count, comments count |
| `prices` | Avocado prices by variety and grade |
| `visitors` | Visitor leads (name, phone, email, interest) |
| `comments` | Post comments with slug reference, author, text, timestamp |
| `likes` | Like events with slug, user info, timestamp |

---

## 👤 Author

**Nitanshu S. Chauhan** — [@Nitanshu07](https://github.com/Nitanshu07)

---

## 📄 License

MIT
