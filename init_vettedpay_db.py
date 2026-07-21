"""
VettedPay Database Initialization Script for SQLite

This script creates the VettedPay tables directly using SQLAlchemy models,
bypassing the complex Alembic migration history.

Usage: python init_vettedpay_db.py
"""
import asyncio
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine
from app.config import settings
from app.models.vettedpay import Base as VettedPayBase


async def init_database():
    """Initialize the VettedPay database with all required tables."""
    print(f"Initializing VettedPay database at: {settings.DATABASE_URL}")
    
    # Create async engine
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=True  # Show SQL statements
    )
    
    try:
        # Create all VettedPay tables
        async with engine.begin() as conn:
            print("\nCreating VettedPay tables...")
            await conn.run_sync(VettedPayBase.metadata.create_all)
        
        print("\n✅ VettedPay database initialized successfully!")
        print("\nCreated tables:")
        for table in VettedPayBase.metadata.sorted_tables:
            print(f"  - {table.name}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error initializing database: {e}")
        return False
    
    finally:
        await engine.dispose()


if __name__ == "__main__":
    print("=" * 60)
    print(" VettedPay Database Initialization")
    print("=" * 60)
    
    success = asyncio.run(init_database())
    sys.exit(0 if success else 1)
