# DevDesk — IT Service Management System

A full-stack portfolio project for managing IT support tickets and hardware assets.

## Tech stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: JWT + bcrypt
- API validation: express-validator

## Features
- Register and login with JWT authentication
- Role-aware users (`admin`, `technician`, `user`)
- Ticket CRUD, status/priority updates, search and filtering
- Asset CRUD
- Dashboard summary metrics
- PostgreSQL schema and demo seed
- Health endpoint and centralized error handling

## Requirements
- Node.js 20+
- PostgreSQL 14+
- npm

## Quick start

### 1. Database
Create a PostgreSQL database, then run:

```bash
psql -U postgres -d devdesk -f server/src/db/schema.sql
```

Optional demo data:
```bash
psql -U postgres -d devdesk -f server/src/db/seed.sql
```

The seed uses a demo password hash; to create your own account, use the registration endpoint or UI.

### 2. Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Edit `.env` with your PostgreSQL credentials and a long random `JWT_SECRET`.
Backend runs at `http://localhost:5000`.

### 3. Frontend
In another terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL printed by Vite (usually `http://localhost:5173`).

## Environment variables
See `server/.env.example`. Never commit `.env` or real credentials.

## API overview
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | No | API/database health |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/dashboard/summary` | Yes | Dashboard metrics |
| GET/POST | `/api/tickets` | Yes | List/create tickets |
| GET/PATCH/DELETE | `/api/tickets/:id` | Yes | Read/update/delete ticket |
| GET/POST | `/api/assets` | Yes | List/create assets |
| PATCH/DELETE | `/api/assets/:id` | Yes | Update/delete asset |

## Suggested next improvements
- Add automated tests with Vitest/Supertest
- Add pagination and audit logs
- Add file uploads for ticket attachments
- Add email notifications
- Deploy API and database, then deploy the frontend
- Add screenshots/GIFs to this README

## GitHub publishing
```bash
git init
git add .
git commit -m "feat: initial DevDesk full-stack application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/devdesk-fullstack.git
git push -u origin main
```
Create an empty repository on GitHub first. Do not commit `.env`, passwords, or tokens.
