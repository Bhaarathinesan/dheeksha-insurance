import uuid
from enum import Enum
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, field_validator


class Note(BaseModel):
    id: Optional[str] = None
    text: str = Field(..., max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(from_attributes=True)


class EnquiryStatus(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    INCOMPLETE = "INCOMPLETE"
    CANCELLED = "CANCELLED"


class VehicleType(str, Enum):
    TWO_WHEELER = "two-wheeler"
    PRIVATE_CAR = "private-car"
    COMMERCIAL = "commercial"
    HEAVY = "heavy"
    OTHER = "other"


class RequirementType(str, Enum):
    NEW_INSURANCE = "new-insurance"
    RENEWAL = "renewal"
    CLAIM = "claim"
    POLICY = "policy"
    OTHER = "other"


class EnquiryBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    mobile_number: str = Field(..., pattern=r"^\d{10}$")
    whatsapp_number: Optional[str] = Field(None, pattern=r"^\d{10}$")
    vehicle_type: VehicleType
    vehicle_registration_number: Optional[str] = Field(None, max_length=50)
    requirement: RequirementType
    message: Optional[str] = Field(None, max_length=1000)


class EnquiryCreate(EnquiryBase):
    pass


class EnquiryUpdate(BaseModel):
    status: Optional[EnquiryStatus] = None
    new_note: Optional[str] = Field(None, max_length=2000)


class EnquiryInDBBase(EnquiryBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: EnquiryStatus = EnquiryStatus.NEW
    notes: List[Note] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True
    )

    @field_validator("notes", mode="before")
    @classmethod
    def fix_notes(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [{"text": v, "created_at": datetime.now(timezone.utc)}]
        return v


class EnquiryResponse(EnquiryInDBBase):
    pass
