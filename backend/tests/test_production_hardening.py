import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock, MagicMock
from app.core.config import Settings, settings

@pytest.mark.asyncio
async def test_health_check_success(async_client: AsyncClient):
    """Verify health endpoint succeeds (200) when database is available and ping passes."""
    response = await async_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["database"] == "connected"
    assert "version" in data

@pytest.mark.asyncio
async def test_health_check_database_failure(async_client: AsyncClient):
    """Verify health endpoint returns 503 when database is unreachable/unavailable."""
    mock_conn = AsyncMock()
    mock_conn.__aenter__.side_effect = Exception("Database unreachable")
    mock_engine = MagicMock()
    mock_engine.connect.return_value = mock_conn
    with patch("app.main.engine", mock_engine):
        response = await async_client.get("/api/health")
        assert response.status_code == 503
        data = response.json()
        assert data["status"] == "error"
        assert data["database"] == "disconnected"
        assert data["message"] == "Database is unavailable."
        # Verify internal exception details or credentials are not leaked
        assert "Database unreachable" not in str(data)

def test_cors_multiple_origins_parsing():
    """Verify multiple comma-separated origins are parsed and trimmed correctly."""
    s = Settings(
        FRONTEND_URL="https://dheekshainsurance.com, https://www.dheekshainsurance.com , http://localhost:5173",
        SECRET_KEY="a" * 32
    )
    assert s.frontend_origins == [
        "https://dheekshainsurance.com",
        "https://www.dheekshainsurance.com",
        "http://localhost:5173"
    ]

def test_cors_single_origin_parsing():
    """Verify single origin works as expected."""
    s = Settings(
        FRONTEND_URL="http://localhost:5173",
        SECRET_KEY="a" * 32
    )
    assert s.frontend_origins == ["http://localhost:5173"]

def test_jwt_weak_secret_rejection():
    """Verify weak secret keys (< 32 characters) are rejected with validation error."""
    with pytest.raises(ValueError, match="SECRET_KEY must be a cryptographically secure string with at least 32 characters"):
        Settings(SECRET_KEY="short-secret-key")

def test_jwt_valid_secret_accepted():
    """Verify secrets with >= 32 characters are accepted."""
    s = Settings(SECRET_KEY="a" * 32)
    assert s.SECRET_KEY == "a" * 32
