from fastapi import APIRouter, HTTPException, status, Query, Depends, Request
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongodb import db
from app.schemas.enquiry import EnquiryCreate, EnquiryUpdate, EnquiryResponse, EnquiryInDBBase, EnquiryStatus
from app.api.deps import get_current_admin
from app.schemas.admin import Admin
from app.core.rate_limit import limiter
from pymongo.errors import PyMongoError

router = APIRouter()

@router.post("", response_model=EnquiryResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def create_enquiry(request: Request, enquiry_in: EnquiryCreate):
    enquiry = EnquiryInDBBase(**enquiry_in.model_dump())

    try:
        result = await db.db["enquiries"].insert_one(enquiry.model_dump(by_alias=True))
        created_enquiry = await db.db["enquiries"].find_one({"_id": result.inserted_id})
        if created_enquiry:
            # Convert _id to id for response
            created_enquiry["id"] = str(created_enquiry["_id"])
            return created_enquiry
        raise HTTPException(status_code=500, detail="Failed to create enquiry")
    except PyMongoError:
        # Log the error internally if a logger was present, but return safe error
        raise HTTPException(status_code=500, detail="A database error occurred while processing your request")

@router.get("", response_model=List[EnquiryResponse])
async def list_enquiries(
    status: Optional[EnquiryStatus] = None,
    search: Optional[str] = None,
    sort_by: str = Query("newest", pattern="^(newest|oldest)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_admin: Admin = Depends(get_current_admin)
):
    query = {}
    if status:
        query["status"] = status

    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"mobile_number": {"$regex": search, "$options": "i"}},
            {"whatsapp_number": {"$regex": search, "$options": "i"}},
            {"vehicle_registration_number": {"$regex": search, "$options": "i"}}
        ]

    sort_dir = -1 if sort_by == "newest" else 1
    cursor = db.db["enquiries"].find(query).sort("created_at", sort_dir).skip(skip).limit(limit)
    enquiries = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        enquiries.append(doc)

    return enquiries

@router.get("/{id}", response_model=EnquiryResponse)
async def get_enquiry(id: str, current_admin: Admin = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    enquiry = await db.db["enquiries"].find_one({"_id": ObjectId(id)})
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    enquiry["id"] = str(enquiry["_id"])
    return enquiry

@router.patch("/{id}", response_model=EnquiryResponse)
async def update_enquiry(id: str, enquiry_in: EnquiryUpdate, current_admin: Admin = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    update_data = enquiry_in.model_dump(exclude_unset=True)
    new_note_text = update_data.pop("new_note", None)

    if not update_data and not new_note_text:
        raise HTTPException(status_code=400, detail="No data provided to update")

    update_op = {}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        update_op["$set"] = update_data

    if new_note_text:
        note = {"text": new_note_text, "created_at": datetime.now(timezone.utc)}
        update_op["$push"] = {"notes": note}

    if update_op:
        result = await db.db["enquiries"].update_one(
            {"_id": ObjectId(id)},
            update_op
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Enquiry not found")

    updated_enquiry = await db.db["enquiries"].find_one({"_id": ObjectId(id)})
    updated_enquiry["id"] = str(updated_enquiry["_id"])
    return updated_enquiry

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_enquiry(id: str, current_admin: Admin = Depends(get_current_admin)):
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=400, detail="Invalid ID format")

    result = await db.db["enquiries"].delete_one({"_id": ObjectId(id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Enquiry not found")
