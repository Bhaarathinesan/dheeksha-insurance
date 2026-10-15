from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy models."""
    pass

# Ensure all models are registered on Base.metadata when imported from app.db.base
from app.models.admin import Admin  # noqa: E402, F401
from app.models.enquiry import Enquiry, EnquiryNote  # noqa: E402, F401
