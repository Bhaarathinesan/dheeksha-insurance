from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from app.core.config import settings
from app.schemas.admin import TokenPayload, Admin
from app.db.mongodb import db

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_admin(token: str = Depends(oauth2_scheme)) -> Admin:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenPayload(sub=email)
    except jwt.PyJWTError:
        raise credentials_exception

    admin = await db.db["admins"].find_one({"email": token_data.sub})
    if admin is None:
        raise credentials_exception
    return Admin(email=admin["email"])
