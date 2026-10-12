import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.core.config import settings
from app.db.mongodb import connect_to_mongo, close_mongo_connection, db
from app.api.api import api_router
from app.core import security
from app.core.rate_limit import limiter

logger = logging.getLogger("uvicorn.error")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await connect_to_mongo()
        logger.info("Successfully established connection to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB during startup: {type(e).__name__}")
        raise e

    try:
        # Create indexes for enquiries collection
        await db.db["enquiries"].create_index("mobile_number")
        await db.db["enquiries"].create_index("created_at")
        await db.db["enquiries"].create_index("status")
        logger.info("Verified MongoDB indexes for enquiries collection.")

        # Create initial admin account if not present
        admin = await db.db["admins"].find_one({"email": settings.ADMIN_EMAIL})
        if not admin:
            hashed_password = security.get_password_hash(settings.ADMIN_PASSWORD)
            await db.db["admins"].insert_one({
                "email": settings.ADMIN_EMAIL,
                "hashed_password": hashed_password
            })
            logger.info("Initial administrator account verified.")
    except Exception as e:
        logger.error(f"Error during database initialization: {type(e).__name__}")
        raise e

    yield

    # Shutdown
    try:
        await close_mongo_connection()
        logger.info("Closed MongoDB connection.")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {type(e).__name__}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
    # Verify MongoDB connectivity via ping command
    try:
        if db.db is None:
            raise RuntimeError("Database client is not initialized")
        await db.db.command("ping")
        return {
            "status": "success",
            "message": "Dheeksha Insurance API is running.",
            "database": "connected",
            "version": settings.VERSION
        }
    except Exception as e:
        logger.error(f"Health check failed database connectivity verification: {type(e).__name__}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "error",
                "message": "Database is unavailable.",
                "database": "disconnected"
            }
        )
