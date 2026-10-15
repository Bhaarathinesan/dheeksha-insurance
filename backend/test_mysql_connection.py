"""
Temporary connection verification script for Dheeksha Insurance backend.
Tests asynchronous connectivity to MySQL / MariaDB using SQLAlchemy and asyncmy.
"""

import asyncio
import re
import sys
from pathlib import Path

# Ensure backend directory is in sys.path and load backend/.env reliably
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Import settings which loads environment variables from backend/.env
from app.core.config import settings


async def verify_mysql_connection() -> None:
    print("[*] Initializing asynchronous connection test...")

    # Load DATABASE_URL from project settings
    database_url = settings.DATABASE_URL
    if not database_url:
        print("[!] Error: DATABASE_URL is not configured in settings or backend/.env.")
        return

    # Check dialect/driver prefix
    if not database_url.startswith("mysql+asyncmy://"):
        print("[!] Warning: DATABASE_URL does not start with expected 'mysql+asyncmy://' scheme.")

    engine = None
    try:
        # Create async engine with pool_pre_ping for connection health verification
        engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
        )

        # Establish connection and execute simple ping query
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1 AS connection_test;"))
            row = result.scalar()

            # Retrieve server version to verify MariaDB / MySQL version compatibility
            version_result = await conn.execute(text("SELECT VERSION();"))
            db_version = version_result.scalar()

            print(f"[+] Query Result: SELECT 1 -> {row}")
            print(f"[+] Connected Server Version: {db_version}")
            print("[+] SUCCESS: Successfully connected to the target database!")

    except Exception as exc:
        # Sanitize output: Never print connection string or raw credentials
        error_class = type(exc).__name__
        error_msg = str(exc)
        # Scrub any potential passwords if present in exception string
        if "@" in error_msg and "://" in error_msg:
            error_msg = re.sub(r"://[^@]+@", "://***:***@", error_msg)

        print(f"[!] CONNECTION FAILED: {error_class}")
        print(f"[!] Sanitized Error Details: {error_msg}")

    finally:
        # Always dispose of the SQLAlchemy engine cleanly if created
        if engine is not None:
            await engine.dispose()
            print("[*] Engine connection pool disposed.")


if __name__ == "__main__":
    asyncio.run(verify_mysql_connection())
