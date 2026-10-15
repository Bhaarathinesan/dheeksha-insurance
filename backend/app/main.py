import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from slowapi.middleware import SlowAPIMiddleware
from sqlalchemy import select, text

from app.core.config import settings
from app.db.session import engine, AsyncSessionLocal
from app.models.admin import Admin
from app.api.api import api_router
from app.core import security
from app.core.rate_limit import limiter

logger = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Verify database connection
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1;"))
        logger.info("Successfully established connection to MariaDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MariaDB during startup: {type(e).__name__}")
        raise e

    try:
        # Create initial admin account if not present
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Admin).where(Admin.email == settings.ADMIN_EMAIL)
            )
            admin = result.scalar_one_or_none()
            if not admin:
                hashed_password = security.get_password_hash(settings.ADMIN_PASSWORD)
                new_admin = Admin(
                    email=settings.ADMIN_EMAIL,
                    hashed_password=hashed_password,
                )
                session.add(new_admin)
                await session.commit()
                logger.info("Initial administrator account verified.")
    except Exception as e:
        logger.error(f"Error during database initialization: {type(e).__name__}")
        raise e

    yield

    # Shutdown: Cleanly dispose connection pool
    try:
        await engine.dispose()
        logger.info("Disposed MariaDB connection pool.")
    except Exception as e:
        logger.error(f"Error disposing database connections: {type(e).__name__}")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/api/health")
async def health_check():
    # Verify MariaDB connectivity via SELECT 1
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1;"))
        return {
            "status": "success",
            "message": "Dheeksha Insurance API is running.",
            "database": "connected",
            "version": settings.VERSION,
        }
    except Exception as e:
        logger.error(f"Health check failed database connectivity verification: {type(e).__name__}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "message": "Database is unavailable.",
                "database": "disconnected",
            },
        )
