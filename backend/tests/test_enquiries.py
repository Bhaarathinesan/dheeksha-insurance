import pytest
from httpx import AsyncClient
from unittest.mock import patch
from pymongo.errors import PyMongoError
from app.core.config import settings

pytestmark = pytest.mark.asyncio

async def test_create_enquiry_success(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["full_name"] == payload["full_name"]
    assert data["status"] == "NEW"
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

async def test_create_enquiry_missing_fields(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        # missing mobile_number, vehicle_type, requirement
    }
    response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert response.status_code == 422

async def test_create_enquiry_invalid_phone(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        "mobile_number": "123", # Invalid
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert response.status_code == 422

async def test_create_enquiry_invalid_vehicle_type(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        "mobile_number": "9876543210",
        "vehicle_type": "invalid-type", # Invalid
        "requirement": "new-insurance"
    }
    response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert response.status_code == 422

async def test_create_enquiry_invalid_length(async_client: AsyncClient):
    payload = {
        "full_name": "A", # Too short
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert response.status_code == 422

async def test_create_enquiry_malformed_json(async_client: AsyncClient):
    response = await async_client.post(
        f"{settings.API_V1_STR}/enquiries",
        content=b"this is not json",
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422

async def test_rate_limiting_enquiries(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    # Limit is 5/minute
    for _ in range(5):
        res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
        assert res.status_code == 201

    # 6th request should be rate limited
    res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert res.status_code == 429
    assert "error" in res.json()

async def test_database_error_handling(async_client: AsyncClient):
    payload = {
        "full_name": "Test User",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    # We patch insert_one to simulate a db error
    with patch("mongomock_motor.AsyncMongoMockCollection.insert_one", side_effect=PyMongoError("DB down")):
        response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
        assert response.status_code == 500
        assert response.json()["detail"] == "A database error occurred while processing your request"

# Management Endpoints
async def test_list_enquiries_unauthorized(async_client: AsyncClient):
    response = await async_client.get(f"{settings.API_V1_STR}/enquiries")
    assert response.status_code == 401

async def test_list_enquiries_authorized(async_client: AsyncClient, admin_token: str):
    response = await async_client.get(
        f"{settings.API_V1_STR}/enquiries",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)

async def test_update_enquiry(async_client: AsyncClient, admin_token: str):
    # Create first
    payload = {
        "full_name": "Update Me",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert res.status_code == 201
    enquiry_id = res.json()["id"]

    # Update
    headers = {"Authorization": f"Bearer {admin_token}"}
    patch_res = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "IN_PROGRESS", "new_note": "Called customer"},
        headers=headers
    )
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert updated_data["status"] == "IN_PROGRESS"
    assert len(updated_data["notes"]) == 1
    assert updated_data["notes"][0]["text"] == "Called customer"
    
async def test_delete_enquiry(async_client: AsyncClient, admin_token: str):
    # Create first
    payload = {
        "full_name": "Delete Me",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    enquiry_id = res.json()["id"]

    # Delete
    headers = {"Authorization": f"Bearer {admin_token}"}
    del_res = await async_client.delete(f"{settings.API_V1_STR}/enquiries/{enquiry_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify deleted
    get_res = await async_client.get(f"{settings.API_V1_STR}/enquiries/{enquiry_id}", headers=headers)
    assert get_res.status_code == 404
