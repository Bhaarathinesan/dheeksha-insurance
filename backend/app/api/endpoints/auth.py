from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import security
from app.core.config import settings
from app.core.rate_limit import limiter
from app.schemas.admin import Token, Admin
from app.db.session import get_db
from app.models.admin import Admin as AdminModel
from app.api.deps import get_current_admin

router = APIRouter()


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    result = await db.execute(select(AdminModel).where(AdminModel.email == form_data.username))
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not security.verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            admin.email, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


@router.get("/me", response_model=Admin)
async def test_token(current_admin: Admin = Depends(get_current_admin)):
    """
    Test access token
    """
    return current_admin
