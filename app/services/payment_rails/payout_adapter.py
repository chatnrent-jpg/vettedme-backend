"""
VettedPay Payout Provider Adapter
Abstract interface for payment rails
"""

from enum import Enum
from typing import Optional, Dict, Any
from dataclasses import dataclass
from decimal import Decimal


# Exception Classes
class PayoutProviderError(Exception):
    """Base exception for payout provider errors"""
    pass


class ComplianceVerificationError(PayoutProviderError):
    """Raised when compliance verification fails"""
    pass


class InsufficientFundsError(PayoutProviderError):
    """Raised when insufficient funds for payout"""
    pass


class InvalidDestinationError(PayoutProviderError):
    """Raised when destination account is invalid"""
    pass


class RateLimitError(PayoutProviderError):
    """Raised when rate limit is exceeded"""
    pass


class PayoutRail(str, Enum):
    """Payment rail providers"""
    AIRWALLEX = "airwallex"
    NIUM = "nium"
    WISE = "wise"
    STABLECOIN_USDC = "stablecoin_usdc"
    FALLBACK_MOCK = "fallback_mock"


class PayoutStatus(str, Enum):
    """Payout transaction status"""
    INITIATED = "initiated"
    ZK_VERIFIED = "zk_verified"
    DISPATCHED_TO_RAIL = "dispatched_to_rail"
    SETTLED = "settled"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class PayoutResult:
    """Result of a payout transaction"""
    success: bool
    rail_transaction_id: Optional[str] = None
    status: PayoutStatus = PayoutStatus.INITIATED
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class PayoutProviderAdapter:
    """Base adapter interface for payment providers"""
    
    def __init__(self, rail: PayoutRail):
        self.rail = rail
    
    async def submit_payout(
        self,
        recipient_did: str,
        amount: Decimal,
        currency: str = "USD",
        compliance_packet_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PayoutResult:
        """Submit a payout to the payment rail"""
        raise NotImplementedError("Subclasses must implement submit_payout")
    
    async def check_status(self, rail_transaction_id: str) -> PayoutResult:
        """Check the status of a payout"""
        raise NotImplementedError("Subclasses must implement check_status")
    
    async def health_check(self) -> bool:
        """Check if the payment rail is healthy"""
        return True
