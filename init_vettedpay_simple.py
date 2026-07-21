"""
Simple VettedPay Database Initialization for SQLite

Creates ONLY the 5 VettedPay tables we need for Sprint A & C.
"""
import asyncio
import sys
from pathlib import Path
import uuid
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import Column, String, Numeric, Boolean, Text, DateTime, Integer, Index, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PostgreSQL_UUID
from sqlalchemy.orm import declarative_base
from app.config import settings

# Create a fresh Base just for VettedPay
VettedPayOnlyBase = declarative_base()


class VettedPayTransaction(VettedPayOnlyBase):
    __tablename__ = "vettedpay_transactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    idempotency_key = Column(String(64), nullable=False, unique=True)
    sender_did = Column(String(255), nullable=False)
    recipient_did = Column(String(255), nullable=False)
    amount = Column(Numeric(14, 4), nullable=False)
    currency = Column(String(3), nullable=False, default='USD')
    active_rail = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default='initiated')
    rail_transaction_id = Column(String(255), nullable=True)
    zk_proof_verified = Column(Boolean, nullable=False, default=False)
    compliance_packet_id = Column(String(255), nullable=True)
    error_log = Column(Text, nullable=True)
    transaction_metadata = Column(Text, nullable=True)  # JSON as text for SQLite
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('idx_transactions_sender', 'sender_did'),
        Index('idx_transactions_recipient', 'recipient_did'),
        Index('idx_transactions_idempotency', 'idempotency_key'),
        Index('idx_transactions_status', 'status'),
        Index('idx_transactions_rail', 'active_rail'),
    )


class VettedPayRailHealth(VettedPayOnlyBase):
    __tablename__ = "vettedpay_rail_health"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rail = Column(String(50), nullable=False, unique=True)
    is_healthy = Column(Boolean, nullable=False, default=True)
    last_success_at = Column(DateTime, nullable=True)
    last_failure_at = Column(DateTime, nullable=True)
    failure_count = Column(Integer, nullable=False, default=0)
    circuit_status = Column(String(20), nullable=False, default='CLOSED')
    error_message = Column(Text, nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class VettedPayZKVerification(VettedPayOnlyBase):
    __tablename__ = "vettedpay_zk_verifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey('vettedpay_transactions.id', ondelete='CASCADE'), nullable=False)
    sender_did = Column(String(255), nullable=False)
    proof_type = Column(String(50), nullable=False)
    verification_result = Column(Boolean, nullable=False)
    verification_method = Column(String(100), nullable=False)
    proof_timestamp = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_zk_verifications_transaction', 'transaction_id'),
        Index('idx_zk_verifications_sender', 'sender_did'),
    )


class VettedPayWaitlist(VettedPayOnlyBase):
    __tablename__ = "vettedpay_waitlist"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True)
    full_name = Column(String(255), nullable=True)
    organization = Column(String(255), nullable=True)
    use_case = Column(Text, nullable=True)
    referral_source = Column(String(100), nullable=True)
    priority_score = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default='pending')
    invited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index('idx_waitlist_email', 'email'),
        Index('idx_waitlist_status', 'status'),
    )


async def init_database():
    """Initialize the VettedPay database."""
    print("=" * 60)
    print(" VettedPay SQLite Database Initialization")
    print("=" * 60)
    print(f"\nDatabase: {settings.DATABASE_URL}\n")
    
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    try:
        async with engine.begin() as conn:
            print("Creating tables...")
            await conn.run_sync(VettedPayOnlyBase.metadata.create_all)
        
        print("\n[SUCCESS] VettedPay database initialized!\n")
        print("Created tables:")
        for table in VettedPayOnlyBase.metadata.sorted_tables:
            print(f"  - {table.name}")
        
        # Insert default rail health records
        async with engine.begin() as conn:
            print("\nInitializing rail health records...")
            await conn.execute(sa_text("""
                INSERT OR IGNORE INTO vettedpay_rail_health (id, rail, is_healthy, circuit_status, failure_count, updated_at)
                VALUES 
                    (:id1, 'airwallex', 1, 'CLOSED', 0, :now),
                    (:id2, 'nium', 1, 'CLOSED', 0, :now),
                    (:id3, 'wise', 1, 'CLOSED', 0, :now),
                    (:id4, 'stablecoin_usdc', 1, 'CLOSED', 0, :now),
                    (:id5, 'fallback_mock', 1, 'CLOSED', 0, :now)
            """), {
                "id1": str(uuid.uuid4()),
                "id2": str(uuid.uuid4()),
                "id3": str(uuid.uuid4()),
                "id4": str(uuid.uuid4()),
                "id5": str(uuid.uuid4()),
                "now": datetime.utcnow()
            })
        
        print("\n[COMPLETE] VettedPay is ready for Sprint A & C!\n")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Failed to initialize database: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        await engine.dispose()


if __name__ == "__main__":
    from sqlalchemy import text as sa_text
    success = asyncio.run(init_database())
    sys.exit(0 if success else 1)
