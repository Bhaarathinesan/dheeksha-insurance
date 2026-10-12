from enum import Enum
from typing import Optional, List, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field, ConfigDict, field_validator
from pydantic_core import core_schema
from bson import ObjectId

class Note(BaseModel):
    text: str = Field(..., max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.no_info_plain_validator_function(cls.validate),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x), return_schema=core_schema.str_schema(), when_used="json"
            )
        )

    @classmethod
    def validate(cls, v: Any) -> ObjectId:
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str) and ObjectId.is_valid(v):
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")

class EnquiryStatus(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
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
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    status: EnquiryStatus = EnquiryStatus.NEW
    notes: List[Note] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

    @field_validator("notes", mode="before")
    @classmethod
    def fix_notes(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            # Backward compatibility if there's a string note
            return [{"text": v, "created_at": datetime.now(timezone.utc)}]
        return v

class EnquiryResponse(EnquiryInDBBase):
    id: str = Field(alias="id")
    
    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v):
        return str(v)
