# ✈ Airline Overbooking Manager
Django + SQLite backend (REST API) and React + Bootstrap + Chart.js frontend.

## Run locally
**Backend** (http://localhost:8000)
```
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py makemigrations flights
python manage.py migrate
python manage.py seed          # demo data: 5 aircraft, 10 flights, 80 passengers, 400+ bookings
python manage.py runserver
```
**Frontend** (http://localhost:5173)
```
cd frontend
cp .env.example .env
npm install
npm run dev
```
Demo logins: `management / admin123` (full access) and `staff / staff123` (no flight/aircraft/buffer/report changes).
Change these passwords after first login. Historical no-show records can be edited at `/admin` (log in as management).

## How the maths works (see `backend/flights/models.py → flight_stats`)
- No-show rate = past no-shows ÷ past passengers × 100 (seed data: 80 ÷ 1000 = 8%)
- Expected no-shows = bookings × rate ÷ 100 · Expected show-ups = bookings − expected no-shows
- **Safe booking limit = seats + expected no-shows − safety buffer** (new bookings are blocked at this limit)
- Risk: SAFE → MODERATE (show-ups within 3 seats of capacity, or bookings above limit) → HIGH (show-ups > seats) → CRITICAL (show-ups ≥ 110% of seats)
- These are estimates, not guaranteed predictions. Demo aircraft have small seat counts so the sample data shows every risk level.

## "Real-time" behaviour
Pages call the API after every action and re-poll every 8–15 s (`useLoad` in `services/api.js`). No WebSockets.

## Deploy
**Backend on Render (Web Service, root dir `backend`)**
- Build: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start: `python manage.py makemigrations flights && python manage.py migrate && python manage.py seed && gunicorn project.wsgi`
- Env: `SECRET_KEY=<random>`, `DEBUG=0`. Free-tier SQLite resets on redeploy (the seed re-creates demo data). Then set `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` in `settings.py` to your real domains.
- Commit the `flights/migrations/` folder after running `makemigrations` locally for a cleaner deploy.

**Frontend on Vercel or Netlify (root dir `frontend`)**
- Build: `npm run build`, output: `dist`, env var `VITE_API_URL=https://<your-backend>/api`
- `vercel.json` and `public/_redirects` already handle React Router refreshes.

## Structure note
All Django models/APIs live in one app, `flights`, to keep the code easy to follow (`models.py`, `views.py`, `urls.py`).
