# Dheeksha Insurance

## Project Overview
Dheeksha Insurance is a modern web application designed for a local insurance agency in Peravurani, Thanjavur. It provides an intuitive interface for clients to request quotes for vehicle insurance, policy renewals, and claim assistance. It also features a secure admin dashboard to manage and track enquiries efficiently.

## Architecture
The system follows a standard Client-Server architecture:
- **Client**: A single-page application (SPA) built with React.
- **API**: A RESTful backend service built with FastAPI.
- **Database**: A NoSQL document store (MongoDB) to handle dynamic enquiry data.

## Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, React Router, Lucide React (Icons).
- **Backend**: Python 3, FastAPI, Motor (Async MongoDB), Pydantic, Passlib (Bcrypt), PyJWT.
- **Database**: MongoDB.

## Local Setup

### Database Setup
1. Install MongoDB locally or set up a free MongoDB Atlas cluster.
2. The application will automatically create the required database `deeksha_insurance` and the collections (`enquiries`, `admins`) upon startup.
3. Indexes are automatically built during the FastAPI app startup lifecycle.

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in the values.
5. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

### Backend (`backend/.env`)
- `PROJECT_NAME`: Name of the API (e.g., "Dheeksha Insurance API")
- `VERSION`: API Version (e.g., "1.0.0")
- `FRONTEND_URL`: URL of the frontend for CORS (e.g., "http://localhost:5173")
- `MONGODB_URL`: Full connection string for MongoDB.
- `DATABASE_NAME`: Database name.
- `SECRET_KEY`: **CRITICAL**. Cryptographically secure string for JWT generation.
- `ALGORITHM`: JWT algorithm (e.g., "HS256").
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiry for auth tokens.
- `ADMIN_EMAIL`: Initial admin account email.
- `ADMIN_PASSWORD`: Initial admin account password.

### Frontend (`frontend/.env`)
- `VITE_API_BASE_URL`: Base URL for the FastAPI backend (e.g., "http://localhost:8000/api/v1")

## Admin Setup
The initial admin account is created automatically when the FastAPI backend starts for the first time. It uses the `ADMIN_EMAIL` and `ADMIN_PASSWORD` defined in the backend `.env` file. Log in at `/admin/login` using these credentials.

## Frontend Deployment
1. Ensure `VITE_API_BASE_URL` in `.env` is set to the production backend URL.
2. Run the production build:
   ```bash
   npm run build
   ```
3. The resulting static files will be in the `dist` directory. Serve this directory using any static hosting provider (Vercel, Netlify, Nginx, AWS S3 + CloudFront).
4. Configure the web server to rewrite all requests to `index.html` (to support React Router).

## Backend Deployment
1. Set up a Python environment (Python 3.9+) on your VPS or PaaS (Render, Heroku, AWS Elastic Beanstalk, etc.).
2. Set all production environment variables securely in your hosting provider's dashboard. **Do not hardcode or commit them**.
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server using a production-grade ASGI server like Uvicorn with Gunicorn:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

## Production Considerations
- **Secrets Management**: Never commit `.env` files to version control. Generate a strong, random `SECRET_KEY` using `openssl rand -hex 32`.
- **Database Security**: Do not run MongoDB without authentication (`--auth`). Restrict IP access to your backend server only.
- **CORS**: Ensure `FRONTEND_URL` is exactly the domain of your production frontend (no trailing slashes, e.g. `https://dheekshainsurance.com`) to prevent unauthorized cross-origin requests.
- **HTTPS**: Use SSL/TLS for both the frontend and backend to protect credentials and JWT tokens in transit.
