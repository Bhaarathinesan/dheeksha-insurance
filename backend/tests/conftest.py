import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from mongomock_motor import AsyncMongoMockClient
from unittest.mock import patch
from app.main import app
from app.db.mongodb import db as mongo_db
from app.core import security
from app.core.config import settings
from app.core.rate_limit import limiter

@pytest_asyncio.fixture(autouse=True)
async def mock_db():
    mock_client = AsyncMongoMockClient()
    mongo_db.client = mock_client
    mongo_db.db = mock_client[settings.DATABASE_NAME]
    
    # Patch connect_to_mongo to prevent overwriting our mock during lifespan
    with patch("app.main.connect_to_mongo", return_value=None):
        with patch("app.main.close_mongo_connection", return_value=None):
            # Clear rate limiter before each test to prevent cross-test 429s
            limiter.reset()
            yield

@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def admin_token():
    # Insert admin into mock db
    hashed_password = security.get_password_hash(settings.ADMIN_PASSWORD)
    await mongo_db.db["admins"].insert_one({
        "email": settings.ADMIN_EMAIL,
        "hashed_password": hashed_password
    })
    
    token = security.create_access_token(settings.ADMIN_EMAIL)
    return token
