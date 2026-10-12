import pytest
from httpx import AsyncClient
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
