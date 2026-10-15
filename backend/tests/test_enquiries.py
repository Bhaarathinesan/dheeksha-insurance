import pytest
from httpx import AsyncClient
from unittest.mock import patch
from sqlalchemy.exc import SQLAlchemyError
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
    # Simulate a database error on commit
    with patch("sqlalchemy.ext.asyncio.AsyncSession.commit", side_effect=SQLAlchemyError("DB down")):
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


async def test_enquiry_status_transitions_and_persistence(async_client: AsyncClient, admin_token: str):
    # 1. Create initial enquiry with NEW status
    payload = {
        "full_name": "Transition Tester",
        "mobile_number": "9876543210",
        "vehicle_type": "private-car",
        "requirement": "renewal"
    }
    create_res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert create_res.status_code == 201
    enquiry_data = create_res.json()
    enquiry_id = enquiry_data["id"]
    assert enquiry_data["status"] == "NEW"
    initial_updated_at = enquiry_data["updated_at"]

    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Transition NEW -> IN_PROGRESS
    res_in_progress = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "IN_PROGRESS"},
        headers=headers
    )
    assert res_in_progress.status_code == 200
    data_in_progress = res_in_progress.json()
    assert data_in_progress["status"] == "IN_PROGRESS"
    assert data_in_progress["updated_at"] >= initial_updated_at

    # Verify persisted in database via GET
    get_res = await async_client.get(f"{settings.API_V1_STR}/enquiries/{enquiry_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "IN_PROGRESS"

    # 3. Transition IN_PROGRESS -> COMPLETED
    res_completed = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "COMPLETED"},
        headers=headers
    )
    assert res_completed.status_code == 200
    data_completed = res_completed.json()
    assert data_completed["status"] == "COMPLETED"

    # Verify persisted
    get_res = await async_client.get(f"{settings.API_V1_STR}/enquiries/{enquiry_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "COMPLETED"

    # 4. Transition COMPLETED -> INCOMPLETE
    res_incomplete = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "INCOMPLETE"},
        headers=headers
    )
    assert res_incomplete.status_code == 200
    data_incomplete = res_incomplete.json()
    assert data_incomplete["status"] == "INCOMPLETE"

    # Verify persisted
    get_res = await async_client.get(f"{settings.API_V1_STR}/enquiries/{enquiry_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "INCOMPLETE"

    # 5. Transition INCOMPLETE -> COMPLETED
    res_completed_again = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "COMPLETED"},
        headers=headers
    )
    assert res_completed_again.status_code == 200
    data_completed_again = res_completed_again.json()
    assert data_completed_again["status"] == "COMPLETED"

    # Verify persisted
    get_res = await async_client.get(f"{settings.API_V1_STR}/enquiries/{enquiry_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "COMPLETED"


async def test_update_enquiry_invalid_status_rejected(async_client: AsyncClient, admin_token: str):
    # Create enquiry
    payload = {
        "full_name": "Invalid Status Tester",
        "mobile_number": "9876543210",
        "vehicle_type": "commercial",
        "requirement": "claim"
    }
    create_res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert create_res.status_code == 201
    enquiry_id = create_res.json()["id"]

    headers = {"Authorization": f"Bearer {admin_token}"}

    # Attempt to update with invalid status
    invalid_patch = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "INVALID_STATUS"},
        headers=headers
    )
    assert invalid_patch.status_code == 422


async def test_filter_enquiries_by_incomplete_status(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create enquiry and transition to INCOMPLETE
    payload = {
        "full_name": "Incomplete Filter Tester",
        "mobile_number": "9123456780",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }
    create_res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
    assert create_res.status_code == 201
    enquiry_id = create_res.json()["id"]

    patch_res = await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
        json={"status": "INCOMPLETE"},
        headers=headers
    )
    assert patch_res.status_code == 200

    # Query with filter status=INCOMPLETE
    filter_res = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?status=INCOMPLETE",
        headers=headers
    )
    assert filter_res.status_code == 200
    results = filter_res.json()
    assert any(e["id"] == enquiry_id for e in results)
    assert all(e["status"] == "INCOMPLETE" for e in results)

    # Query with invalid status filter returns 422
    invalid_filter_res = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?status=NOT_A_REAL_STATUS",
        headers=headers
    )
    assert invalid_filter_res.status_code == 422


async def test_search_enquiries_by_name_and_phone(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create distinct test enquiries
    e1 = await async_client.post(f"{settings.API_V1_STR}/enquiries", json={
        "full_name": "Bhaarathinesan Kumar",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    })
    assert e1.status_code == 201
    id1 = e1.json()["id"]

    e2 = await async_client.post(f"{settings.API_V1_STR}/enquiries", json={
        "full_name": "Ramesh Sharma",
        "mobile_number": "9123456789",
        "vehicle_type": "private-car",
        "requirement": "renewal"
    })
    assert e2.status_code == 201
    id2 = e2.json()["id"]

    e3 = await async_client.post(f"{settings.API_V1_STR}/enquiries", json={
        "full_name": "Priya Patel",
        "mobile_number": "9876500000",
        "vehicle_type": "commercial",
        "requirement": "claim"
    })
    assert e3.status_code == 201
    id3 = e3.json()["id"]

    # 1. Search using full customer name
    res_full_name = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=Bhaarathinesan%20Kumar",
        headers=headers
    )
    assert res_full_name.status_code == 200
    ids = [e["id"] for e in res_full_name.json()]
    assert id1 in ids
    assert id2 not in ids

    # 2. Search using partial customer name (case-insensitive)
    res_part_name = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=sharma",
        headers=headers
    )
    assert res_part_name.status_code == 200
    ids = [e["id"] for e in res_part_name.json()]
    assert id2 in ids
    assert id1 not in ids

    # 3. Search using exact mobile number
    res_phone = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=9123456789",
        headers=headers
    )
    assert res_phone.status_code == 200
    ids = [e["id"] for e in res_phone.json()]
    assert id2 in ids
    assert id1 not in ids

    # 4. Search using partial mobile number matching multiple records
    res_partial_phone = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=98765",
        headers=headers
    )
    assert res_partial_phone.status_code == 200
    ids = [e["id"] for e in res_partial_phone.json()]
    assert id1 in ids
    assert id3 in ids
    assert id2 not in ids

    # 5. Non-matching search returns empty list (not error)
    res_no_match = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=NonExistentCustomerXYZ",
        headers=headers
    )
    assert res_no_match.status_code == 200
    assert len(res_no_match.json()) == 0


async def test_search_and_status_filter_combination(async_client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create enquiry A and mark COMPLETED
    e_a = await async_client.post(f"{settings.API_V1_STR}/enquiries", json={
        "full_name": "Combo Test Alice",
        "mobile_number": "9988776655",
        "vehicle_type": "private-car",
        "requirement": "renewal"
    })
    id_a = e_a.json()["id"]
    await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{id_a}",
        json={"status": "COMPLETED"},
        headers=headers
    )

    # Create enquiry B and mark INCOMPLETE
    e_b = await async_client.post(f"{settings.API_V1_STR}/enquiries", json={
        "full_name": "Combo Test Bob",
        "mobile_number": "9988776656",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    })
    id_b = e_b.json()["id"]
    await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{id_b}",
        json={"status": "INCOMPLETE"},
        headers=headers
    )

    # Create enquiry C and mark CANCELLED
    e_c = await async_client.post(f"{settings.API_V1_STR}/enquiries", json={
        "full_name": "Combo Test Charlie",
        "mobile_number": "9988776657",
        "vehicle_type": "commercial",
        "requirement": "claim"
    })
    id_c = e_c.json()["id"]
    await async_client.patch(
        f"{settings.API_V1_STR}/enquiries/{id_c}",
        json={"status": "CANCELLED"},
        headers=headers
    )

    # 1. Search name + COMPLETED status filter (both match)
    res_combo_match = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=Combo%20Test%20Alice&status=COMPLETED",
        headers=headers
    )
    assert res_combo_match.status_code == 200
    results = res_combo_match.json()
    assert len(results) == 1
    assert results[0]["id"] == id_a
    assert results[0]["status"] == "COMPLETED"

    # 2. Search name + conflicting status filter (name matches Alice, but status is INCOMPLETE)
    res_combo_mismatch = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=Combo%20Test%20Alice&status=INCOMPLETE",
        headers=headers
    )
    assert res_combo_mismatch.status_code == 200
    assert len(res_combo_mismatch.json()) == 0

    # 3. Search mobile number + INCOMPLETE status filter
    res_phone_incomplete = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?search=9988776656&status=INCOMPLETE",
        headers=headers
    )
    assert res_phone_incomplete.status_code == 200
    results = res_phone_incomplete.json()
    assert len(results) == 1
    assert results[0]["id"] == id_b
    assert results[0]["status"] == "INCOMPLETE"

    # 4. Filter by CANCELLED
    res_cancelled = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?status=CANCELLED",
        headers=headers
    )
    assert res_cancelled.status_code == 200
    assert any(e["id"] == id_c for e in res_cancelled.json())
    assert all(e["status"] == "CANCELLED" for e in res_cancelled.json())

    # 5. Clear search while keeping status filter (only status=COMPLETED)
    res_status_only = await async_client.get(
        f"{settings.API_V1_STR}/enquiries?status=COMPLETED",
        headers=headers
    )
    assert res_status_only.status_code == 200
    assert any(e["id"] == id_a for e in res_status_only.json())
    assert all(e["status"] == "COMPLETED" for e in res_status_only.json())

    # 6. Select All Statuses (unfiltered) restores all records
    res_all = await async_client.get(
        f"{settings.API_V1_STR}/enquiries",
        headers=headers
    )
    assert res_all.status_code == 200
    all_ids = [e["id"] for e in res_all.json()]
    assert id_a in all_ids
    assert id_b in all_ids
    assert id_c in all_ids


