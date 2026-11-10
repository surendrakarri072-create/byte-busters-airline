# ✈ Airline Overbooking Manager

A full-stack web application that helps an airline **safely overbook flights** without bumping too many passengers. It manages flights, passengers and bookings, estimates no-shows from past data, calculates a safe booking limit, and shows management a live risk status for every flight.

## Problem Statement
Airlines lose money on empty seats because some passengers never show up. Overbooking fixes this, but overbooking too much leads to bumped passengers. This system finds a safe balance.

## Features
- **Management login** with dashboard, charts and reports
- **Flight and aircraft management** (add, edit, cancel, search)
- **No-show estimation** from historical passenger records
- **Safe overbooking limit** with an adjustable safety buffer
- **Risk status** for each flight: SAFE, MODERATE, HIGH or CRITICAL
- **Staff section** to add passengers, create and cancel bookings, and check in passengers
- **Occupancy updates** automatically after each booking or check-in
- **Reports** with Chart.js graphs
- **Role-based access** with secure, hashed passwords (Django auth)

## How It Works
```
No-show rate      = past no-shows / past passengers × 100
Expected no-shows = bookings × no-show rate / 100
Expected show-ups = bookings − expected no-shows
Safe booking limit = seat capacity + expected no-shows − safety buffer
```
Example: 180 seats + 15 expected no-shows − 3 buffer = **192**.
*These numbers are estimates, not guaranteed predictions.*

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Bootstrap, JavaScript, React.js, React Router |
| Backend | Python, Django, Django REST Framework |
| Database | SQLite |
| Charts | Chart.js |

## Project Structure
```
airline-overbooking-manager/
├── frontend/   React app (components, pages, services)
├── backend/    Django project (models, views, APIs)
└── README.md
```

## Getting Started

**Backend**
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations flights
python manage.py migrate
python manage.py seed
python manage.py runserver
```

**Frontend**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:5173

## Demo Logins
| Role | Username | Password |
|---|---|---|
| Management | management | admin123 |
| Staff | staff | staff123 |

## Screenshots
*(Add screenshots of the Dashboard, Flight Details and Reports pages here.)*

## Deployment
- **Frontend:** Vercel or Netlify (set `VITE_API_URL` to your backend URL)
- **Backend:** Render or a similar Django host

## Author
[TEAM BYTE BUSTERS] – [KIET/ CAI] – [GitHub profile link]
