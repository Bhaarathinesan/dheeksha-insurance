from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.core.config import settings
from app.schemas.admin import Token, Admin
from app.db.mongodb import db
from app.api.deps import get_current_admin

router = APIRouter()

@router.post("/login", response_model=Token)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    admin = await db.db["admins"].find_one({"email": form_data.username})
    if not admin:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not security.verify_password(form_data.password, admin["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            admin["email"], expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=Admin)
async def test_token(current_admin: Admin = Depends(get_current_admin)):
    """
    Test access token
    """
    return current_admin
