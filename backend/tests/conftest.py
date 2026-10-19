import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool
from unittest.mock import patch, MagicMock

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.models.admin import Admin
from app.core import security
from app.core.config import settings
from app.core.rate_limit import limiter

# In-memory async SQLite engine with StaticPool for fast, isolated tests
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    """
    Provisions all SQLAlchemy tables in an in-memory SQLite database before each test,
    overrides the get_db FastAPI dependency, resets rate limiters, and cleans up after test.
    """
    # Create all tables in the test database
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Clear rate limiter before each test to prevent cross-test 429s
    limiter.reset()

    # Override get_db to provide sessions from the isolated in-memory test database
    async def override_get_db():
        async with TestingSessionLocal() as session:
            try:
                yield session
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = override_get_db

    # Patch engine in app.main so health check uses the isolated test engine,
    # and mock external SMTP by default to prevent real network calls and email sending during tests
    mock_smtp_inst = MagicMock()
    mock_smtp_inst.__enter__.return_value = mock_smtp_inst
    with patch("app.main.engine", test_engine), patch("smtplib.SMTP", return_value=mock_smtp_inst):
        yield

    # Teardown
    app.dependency_overrides.clear()
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_token():
    # Insert test admin into the isolated test database
    hashed_password = security.get_password_hash(settings.ADMIN_PASSWORD)
    async with TestingSessionLocal() as session:
        admin = Admin(
            email=settings.ADMIN_EMAIL,
            hashed_password=hashed_password,
        )
        session.add(admin)
        await session.commit()

    token = security.create_access_token(settings.ADMIN_EMAIL)
    return token
