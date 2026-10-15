from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Request, status
from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_admin
from app.core.rate_limit import limiter
from app.db.session import get_db
from app.models.enquiry import Enquiry, EnquiryNote
from app.schemas.admin import Admin
from app.schemas.enquiry import (
    EnquiryCreate,
    EnquiryResponse,
    EnquiryStatus,
    EnquiryUpdate,
)
from app.services.email import send_enquiry_notification

router = APIRouter()


@router.post("", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_enquiry(
    request: Request,
    enquiry_in: EnquiryCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    enquiry_data = enquiry_in.model_dump()
    vehicle_type_val = (
        enquiry_data["vehicle_type"].value
        if hasattr(enquiry_data["vehicle_type"], "value")
        else str(enquiry_data["vehicle_type"])
    )
    requirement_val = (
        enquiry_data["requirement"].value
        if hasattr(enquiry_data["requirement"], "value")
        else str(enquiry_data["requirement"])
    )

    enquiry = Enquiry(
        full_name=enquiry_data["full_name"],
        mobile_number=enquiry_data["mobile_number"],
        whatsapp_number=enquiry_data.get("whatsapp_number"),
        vehicle_type=vehicle_type_val,
        vehicle_registration_number=enquiry_data.get("vehicle_registration_number"),
        requirement=requirement_val,
        message=enquiry_data.get("message"),
        status=EnquiryStatus.NEW.value,
    )

    try:
        db.add(enquiry)
        await db.commit()
        await db.refresh(enquiry)
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while processing your request",
        )

    # Dispatch email notification in background after database transaction succeeds
    notification_data = {
        "id": enquiry.id,
        "full_name": enquiry.full_name,
        "mobile_number": enquiry.mobile_number,
        "whatsapp_number": enquiry.whatsapp_number,
        "vehicle_type": enquiry.vehicle_type,
        "vehicle_registration_number": enquiry.vehicle_registration_number,
        "requirement": enquiry.requirement,
        "message": enquiry.message,
        "created_at": enquiry.created_at,
    }
    background_tasks.add_task(send_enquiry_notification, notification_data)

    return enquiry


@router.get("", response_model=List[EnquiryResponse])
async def list_enquiries(
    status: Optional[EnquiryStatus] = None,
    search: Optional[str] = None,
    sort_by: str = Query("newest", pattern="^(newest|oldest)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Enquiry).options(selectinload(Enquiry.notes))

    if status:
        stmt = stmt.where(Enquiry.status == status.value)

    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.where(
            or_(
                Enquiry.full_name.ilike(search_pattern),
                Enquiry.mobile_number.ilike(search_pattern),
                Enquiry.whatsapp_number.ilike(search_pattern),
                Enquiry.vehicle_registration_number.ilike(search_pattern),
            )
        )

    if sort_by == "newest":
        stmt = stmt.order_by(Enquiry.created_at.desc())
    else:
        stmt = stmt.order_by(Enquiry.created_at.asc())

    stmt = stmt.offset(skip).limit(limit)

    result = await db.execute(stmt)
    enquiries = result.scalars().all()
    return enquiries


@router.get("/{id}", response_model=EnquiryResponse)
async def get_enquiry(
    id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Enquiry).options(selectinload(Enquiry.notes)).where(Enquiry.id == id)
    result = await db.execute(stmt)
    enquiry = result.scalar_one_or_none()

    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    return enquiry


@router.patch("/{id}", response_model=EnquiryResponse)
async def update_enquiry(
    id: str,
    enquiry_in: EnquiryUpdate,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    update_data = enquiry_in.model_dump(exclude_unset=True)
    new_note_text = update_data.pop("new_note", None)

    if not update_data and not new_note_text:
        raise HTTPException(status_code=400, detail="No data provided to update")

    stmt = select(Enquiry).options(selectinload(Enquiry.notes)).where(Enquiry.id == id)
    result = await db.execute(stmt)
    enquiry = result.scalar_one_or_none()

    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    try:
        if "status" in update_data and update_data["status"] is not None:
            new_status = update_data["status"]
            enquiry.status = (
                new_status.value if hasattr(new_status, "value") else str(new_status)
            )
            enquiry.updated_at = datetime.now(timezone.utc)

        if new_note_text:
            note = EnquiryNote(
                enquiry_id=enquiry.id,
                text=new_note_text,
                created_at=datetime.now(timezone.utc),
            )
            db.add(note)
            enquiry.updated_at = datetime.now(timezone.utc)

        await db.commit()
        await db.refresh(enquiry)
        return enquiry
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while updating the enquiry",
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enquiry(
    id: str,
    current_admin: Admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Enquiry).where(Enquiry.id == id)
    result = await db.execute(stmt)
    enquiry = result.scalar_one_or_none()

    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    try:
        await db.delete(enquiry)
        await db.commit()
    except SQLAlchemyError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred while deleting the enquiry",
        )
