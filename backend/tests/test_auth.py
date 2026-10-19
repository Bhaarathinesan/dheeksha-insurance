from datetime import timedelta
import pytest
from httpx import AsyncClient
from app.core import security
from app.core.config import settings

pytestmark = pytest.mark.asyncio

async def test_admin_login_success(async_client: AsyncClient, admin_token: str):
    # admin_token fixture implicitly creates the admin in the mock db
    # we just need to authenticate with the credentials from settings
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": settings.ADMIN_EMAIL,
            "password": settings.ADMIN_PASSWORD
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

async def test_admin_login_invalid_password(async_client: AsyncClient, admin_token: str):
    response = await async_client.post(
        f"{settings.API_V1_STR}/auth/login",
        data={
            "username": settings.ADMIN_EMAIL,
            "password": "wrongpassword123"
        }
    )
    assert response.status_code == 400

async def test_admin_login_missing_credentials(async_client: AsyncClient):
    response = await async_client.post(f"{settings.API_V1_STR}/auth/login", data={})
    assert response.status_code == 422

async def test_protected_endpoint_missing_token(async_client: AsyncClient):
    response = await async_client.get(f"{settings.API_V1_STR}/enquiries")
    assert response.status_code == 401

async def test_protected_endpoint_invalid_token(async_client: AsyncClient):
    response = await async_client.get(
        f"{settings.API_V1_STR}/enquiries",
        headers={"Authorization": "Bearer invalid.token.here"}
    )
    assert response.status_code == 401

async def test_protected_endpoint_expired_token(async_client: AsyncClient):
    """Verify that an expired JWT token is rejected with 401 Unauthorized."""
    expired_token = security.create_access_token(
        settings.ADMIN_EMAIL,
        expires_delta=timedelta(minutes=-10)
    )
    response = await async_client.get(
        f"{settings.API_V1_STR}/enquiries",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

async def test_admin_login_rate_limiting(async_client: AsyncClient):
    """Verify that admin login is rate limited to 5 requests per minute per client."""
    login_data = {
        "username": settings.ADMIN_EMAIL,
        "password": "wrongpassword123"
    }

    # First 5 requests should reach authentication logic (returns 400 for bad password)
    for _ in range(5):
        res = await async_client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
        assert res.status_code == 400

    # 6th request from same client must be throttled with HTTP 429 Too Many Requests
    rate_limited_res = await async_client.post(f"{settings.API_V1_STR}/auth/login", data=login_data)
    assert rate_limited_res.status_code == 429
    assert "error" in rate_limited_res.json()
