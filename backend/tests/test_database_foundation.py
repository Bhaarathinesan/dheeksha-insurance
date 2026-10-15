import configparser
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker

from app.core.config import settings
from app.db.base import Base as DbBase
from app.models import Base as ModelsBase
from app.db.session import AsyncSessionLocal, engine, get_db


def test_async_engine_configuration():
    """Verify engine is an AsyncEngine and pool_pre_ping is enabled."""
    assert isinstance(engine, AsyncEngine)
    assert engine.sync_engine.pool._pre_ping is True
    assert engine.echo is False
    assert engine.url.get_backend_name() == "mysql"
    assert engine.url.get_driver_name() == "asyncmy"


def test_async_session_maker_configuration():
    """Verify AsyncSessionLocal is configured with AsyncSession."""
    assert isinstance(AsyncSessionLocal, async_sessionmaker)
    assert issubclass(AsyncSessionLocal.class_, AsyncSession)
    assert AsyncSessionLocal.kw.get("expire_on_commit") is False
    assert AsyncSessionLocal.kw.get("autoflush") is False


@pytest.mark.asyncio
async def test_get_db_dependency_success():
    """Verify get_db yields an AsyncSession and closes it on normal exit."""
    mock_session = AsyncMock(spec=AsyncSession)

    with patch("app.db.session.AsyncSessionLocal") as mock_factory:
        # Configure context manager on mock_factory()
        mock_factory.return_value.__aenter__.return_value = mock_session
        mock_factory.return_value.__aexit__.return_value = False

        generator = get_db()
        yielded_session = await anext(generator)

        assert yielded_session is mock_session
        assert not mock_session.rollback.called

        # Complete generator
        with pytest.raises(StopAsyncIteration):
            await anext(generator)

        mock_session.close.assert_awaited_once()


@pytest.mark.asyncio
async def test_get_db_dependency_rollback_on_exception():
    """Verify get_db rolls back the session when an unhandled exception occurs."""
    mock_session = AsyncMock(spec=AsyncSession)

    with patch("app.db.session.AsyncSessionLocal") as mock_factory:
        mock_factory.return_value.__aenter__.return_value = mock_session
        mock_factory.return_value.__aexit__.return_value = False

        generator = get_db()
        yielded_session = await anext(generator)
        assert yielded_session is mock_session

        # Throw exception into generator
        with pytest.raises(RuntimeError, match="Simulated application error"):
            await generator.athrow(RuntimeError("Simulated application error"))

        mock_session.rollback.assert_awaited_once()
        mock_session.close.assert_awaited_once()


def test_metadata_model_discovery():
    """Verify all 3 required models are registered on Base.metadata."""
    expected_tables = {"admins", "enquiries", "enquiry_notes"}

    # Both DbBase and ModelsBase must discover all tables
    assert expected_tables.issubset(set(DbBase.metadata.tables.keys()))
    assert expected_tables.issubset(set(ModelsBase.metadata.tables.keys()))


def test_admin_table_schema():
    """Verify column definitions and constraints on admins table."""
    table = ModelsBase.metadata.tables["admins"]
    column_names = {c.name for c in table.columns}
    assert {"id", "email", "hashed_password", "created_at"}.issubset(column_names)
    assert table.columns["id"].primary_key is True
    assert table.columns["email"].unique is True


def test_enquiries_and_notes_table_schema():
    """Verify column definitions and relationships for enquiries and enquiry_notes."""
    enquiries_table = ModelsBase.metadata.tables["enquiries"]
    notes_table = ModelsBase.metadata.tables["enquiry_notes"]

    enquiries_cols = {c.name for c in enquiries_table.columns}
    assert {
        "id",
        "full_name",
        "mobile_number",
        "whatsapp_number",
        "vehicle_type",
        "vehicle_registration_number",
        "requirement",
        "message",
        "status",
        "created_at",
        "updated_at",
    }.issubset(enquiries_cols)

    notes_cols = {c.name for c in notes_table.columns}
    assert {"id", "enquiry_id", "text", "created_at"}.issubset(notes_cols)

    # Check foreign key linkage
    fk_targets = {fk.target_fullname for fk in notes_table.foreign_keys}
    assert "enquiries.id" in fk_targets


def test_alembic_ini_no_hardcoded_credentials():
    """Verify alembic.ini does not contain hardcoded database passwords or full credentials."""
    alembic_ini_path = Path(__file__).resolve().parent.parent / "alembic.ini"
    assert alembic_ini_path.exists(), "alembic.ini not found"

    parser = configparser.ConfigParser()
    parser.read(alembic_ini_path)

    raw_url = parser.get("alembic", "sqlalchemy.url", fallback="")
    # It must be empty or blank so credentials are not committed to source control
    assert raw_url.strip() == "", "alembic.ini should not have a hardcoded sqlalchemy.url"
