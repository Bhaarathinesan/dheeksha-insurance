import asyncio
from datetime import datetime, timezone
from email.message import EmailMessage
import html
import logging
import smtplib
import ssl
from typing import Any, Dict, Optional

from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

VEHICLE_TYPE_LABELS = {
    "two-wheeler": "Two-Wheeler",
    "private-car": "Private Car",
    "commercial": "Commercial Vehicle",
    "heavy": "Heavy Vehicle",
    "other": "Other",
}

REQUIREMENT_LABELS = {
    "new-insurance": "New Insurance",
    "renewal": "Insurance Renewal",
    "claim": "Claim Assistance",
    "policy": "Policy Assistance",
    "other": "Other",
}


def format_vehicle_type(vehicle_type: Optional[str]) -> str:
    if not vehicle_type:
        return "Not specified"
    key = str(vehicle_type).lower().strip()
    return VEHICLE_TYPE_LABELS.get(key, vehicle_type.replace("-", " ").title())


def format_requirement(requirement: Optional[str]) -> str:
    if not requirement:
        return "Not specified"
    key = str(requirement).lower().strip()
    return REQUIREMENT_LABELS.get(key, requirement.replace("-", " ").title())


def format_submission_time(created_at: Any) -> str:
    if isinstance(created_at, datetime):
        return created_at.strftime("%d %b %Y, %I:%M %p UTC")
    if isinstance(created_at, str) and created_at.strip():
        try:
            dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            return dt.strftime("%d %b %Y, %I:%M %p UTC")
        except Exception:
            return created_at
    return datetime.now(timezone.utc).strftime("%d %b %Y, %I:%M %p UTC")


def build_enquiry_notification_message(enquiry_data: Dict[str, Any]) -> EmailMessage:
    """
    Constructs a multipart EmailMessage containing both plain text
    and safe HTML bodies with escaped dynamic values.
    """
    recipient = settings.ENQUIRY_NOTIFICATION_EMAIL or "neelkanthbpvi@gmail.com"
    sender = settings.SMTP_EMAIL or "notifications@dheekshainsurance.com"

    raw_name = str(enquiry_data.get("full_name") or "Valued Customer")
    raw_mobile = str(enquiry_data.get("mobile_number") or "Not provided")
    raw_whatsapp = str(enquiry_data.get("whatsapp_number") or "Not provided")
    raw_vehicle = format_vehicle_type(enquiry_data.get("vehicle_type"))
    raw_reg_no = str(enquiry_data.get("vehicle_registration_number") or "Not provided")
    raw_requirement = format_requirement(enquiry_data.get("requirement"))
    raw_message = str(enquiry_data.get("message") or "Not provided")
    raw_submitted_at = format_submission_time(enquiry_data.get("created_at"))
    raw_id = str(enquiry_data.get("id") or "N/A")

    # Plain text body
    text_content = (
        "New Vehicle Insurance Enquiry - Dheeksha Insurance\n"
        "==================================================\n\n"
        "A customer has submitted a new enquiry through the website:\n\n"
        f"Customer Name:              {raw_name}\n"
        f"Mobile Number:              {raw_mobile}\n"
        f"WhatsApp Number:            {raw_whatsapp}\n"
        f"Vehicle Type:               {raw_vehicle}\n"
        f"Vehicle Registration No:    {raw_reg_no}\n"
        f"Requirement:                {raw_requirement}\n"
        f"Message:                    {raw_message}\n\n"
        f"Submission Time:            {raw_submitted_at}\n"
        f"Enquiry Reference ID:       {raw_id}\n\n"
        "---\n"
        "Dheeksha Insurance Notification System\n"
        "Peravurani, Thanjavur\n"
    )

    # HTML body with full escaping of all customer inputs
    safe_name = html.escape(raw_name)
    safe_mobile = html.escape(raw_mobile)
    safe_whatsapp = html.escape(raw_whatsapp)
    safe_vehicle = html.escape(raw_vehicle)
    safe_reg_no = html.escape(raw_reg_no)
    safe_requirement = html.escape(raw_requirement)
    safe_message = html.escape(raw_message).replace("\n", "<br>")
    safe_submitted_at = html.escape(raw_submitted_at)
    safe_id = html.escape(raw_id)

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Vehicle Insurance Enquiry</title>
</head>
<body style="margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F0FAFD; color: #102A43;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(16, 42, 67, 0.08); border: 1px solid #D9EEF4;">
    <tr>
      <td style="background-color: #102A43; padding: 28px 32px; text-align: left;">
        <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
          Dheeksha Insurance
        </h1>
        <p style="margin: 6px 0 0 0; color: #5CC8E8; font-size: 14px; font-weight: 500;">
          New Website Enquiry Notification
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #526777;">
          A customer has submitted a new vehicle insurance enquiry. The details are provided below:
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size: 14px; line-height: 1.6;">
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #102A43; width: 40%;">Customer Name</td>
            <td style="padding: 10px 0; color: #102A43; font-weight: 600;">{safe_name}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">Mobile Number</td>
            <td style="padding: 10px 0; color: #102A43;">
              <a href="tel:{safe_mobile}" style="color: #249FC2; text-decoration: none; font-weight: 600;">{safe_mobile}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">WhatsApp Number</td>
            <td style="padding: 10px 0; color: #102A43;">{safe_whatsapp}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">Vehicle Type</td>
            <td style="padding: 10px 0; color: #102A43;">{safe_vehicle}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">Registration Number</td>
            <td style="padding: 10px 0; color: #102A43;">{safe_reg_no}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">Requirement</td>
            <td style="padding: 10px 0; color: #102A43;">{safe_requirement}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777; vertical-align: top;">Message</td>
            <td style="padding: 10px 0; color: #102A43;">{safe_message}</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">Submission Time</td>
            <td style="padding: 10px 0; color: #526777;">{safe_submitted_at}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #526777;">Reference ID</td>
            <td style="padding: 10px 0; font-family: monospace; font-size: 13px; color: #526777;">{safe_id}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="background-color: #F8FAFC; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
        <p style="margin: 0; font-size: 12px; color: #94A3B8;">
          This is an automated notification from the Dheeksha Insurance website.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>"""

    msg = EmailMessage()
    msg["Subject"] = "New Vehicle Insurance Enquiry - Dheeksha Insurance"
    msg["From"] = f"Dheeksha Insurance <{sender}>"
    msg["To"] = recipient

    msg.set_content(text_content)
    msg.add_alternative(html_content, subtype="html")

    return msg


def send_email_sync(msg: EmailMessage) -> bool:
    """
    Connects to Gmail SMTP via STARTTLS, authenticates, and sends the email.
    Returns True if sent successfully, False otherwise.
    Safe: handles timeouts and network exceptions without crashing.
    """
    if not settings.SMTP_EMAIL or not settings.SMTP_APP_PASSWORD:
        logger.warning(
            "SMTP_EMAIL or SMTP_APP_PASSWORD not configured. Enquiry email notification skipped."
        )
        return False

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT,
        ) as server:
            server.ehlo()
            if settings.SMTP_USE_TLS:
                server.starttls(context=context)
                server.ehlo()
            server.login(settings.SMTP_EMAIL, settings.SMTP_APP_PASSWORD)
            server.send_message(msg)
            logger.info("Enquiry notification email successfully sent to %s", msg["To"])
            return True
    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed. Verify SMTP_EMAIL and SMTP_APP_PASSWORD."
        )
        return False
    except smtplib.SMTPException as e:
        logger.error(
            "SMTP exception occurred while sending email: %s",
            type(e).__name__,
        )
        return False
    except (TimeoutError, OSError) as e:
        logger.error(
            "Network timeout or socket error connecting to SMTP server: %s",
            type(e).__name__,
        )
        return False
    except Exception as e:
        logger.error(
            "Unexpected error sending email notification: %s",
            type(e).__name__,
        )
        return False


def send_enquiry_notification(enquiry_data: Dict[str, Any]) -> bool:
    """
    Builds and sends an enquiry notification synchronously.
    Safe for execution inside FastAPI BackgroundTasks.
    """
    try:
        msg = build_enquiry_notification_message(enquiry_data)
        return send_email_sync(msg)
    except Exception as e:
        logger.error("Failed to build or send enquiry notification: %s", type(e).__name__)
        return False


async def send_enquiry_notification_async(enquiry_data: Dict[str, Any]) -> bool:
    """
    Asynchronously builds and sends an enquiry notification without blocking the event loop.
    """
    return await asyncio.to_thread(send_enquiry_notification, enquiry_data)
