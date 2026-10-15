import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

class Enquiry(Base):
    __tablename__ = "enquiries"

    # String primary key to maintain full compatibility with frontend enquiry.id (UUID)
    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    full_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    mobile_number: Mapped[str] = mapped_column(
        String(20),
        index=True,
        nullable=False
    )
    whatsapp_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    vehicle_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )
    vehicle_registration_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    requirement: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )
    message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20),
        index=True,
        default="NEW",
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # 1-to-many relationship with notes, ordered chronologically, eager-loaded to avoid N+1 queries
    notes: Mapped[List["EnquiryNote"]] = relationship(
        "EnquiryNote",
        back_populates="enquiry",
        cascade="all, delete-orphan",
        order_by="EnquiryNote.created_at.asc()",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Enquiry(id='{self.id}', name='{self.full_name}', status='{self.status}')>"


class EnquiryNote(Base):
    __tablename__ = "enquiry_notes"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    enquiry_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("enquiries.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )
    text: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    enquiry: Mapped["Enquiry"] = relationship(
        "Enquiry",
        back_populates="notes"
    )

    def __repr__(self) -> str:
        return f"<EnquiryNote(id='{self.id}', enquiry_id='{self.enquiry_id}')>"
