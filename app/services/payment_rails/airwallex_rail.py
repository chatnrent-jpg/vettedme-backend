"""
VettedPay Airwallex Payment Rail Adapter
Mock implementation for Sprint A & C
"""

from decimal import Decimal
from typing import Optional, Dict, Any
import uuid
import logging

from .payout_adapter import PayoutProviderAdapter, PayoutResult, PayoutRail, PayoutStatus

logger = logging.getLogger(__name__)


class AirwallexRail(PayoutProviderAdapter):
    """Airwallex payment rail adapter (mock for local development)"""
    
    def __init__(self):
        super().__init__(PayoutRail.AIRWALLEX)
        self.api_key = "mock_airwallex_key"
        logger.info("Initialized Airwallex rail (MOCK MODE)")
    
    async def submit_payout(
        self,
        recipient_did: str,
        amount: Decimal,
        currency: str = "USD",
        compliance_packet_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> PayoutResult:
        """Submit a mock payout"""
        
        logger.info(f"[MOCK] Airwallex payout: {amount} {currency} to {recipient_did}")
        
        # Mock successful payout
        rail_tx_id = f"airwallex_{uuid.uuid4().hex[:16]}"
        
        return PayoutResult(
            success=True,
            rail_transaction_id=rail_tx_id,
            status=PayoutStatus.SETTLED,
            metadata={
                "mock": True,
                "rail": "airwallex",
                "amount": str(amount),
                "currency": currency
            }
        )
    
    async def check_status(self, rail_transaction_id: str) -> PayoutResult:
        """Check payout status (mock)"""
        return PayoutResult(
            success=True,
            rail_transaction_id=rail_transaction_id,
            status=PayoutStatus.SETTLED
        )
    
    async def health_check(self) -> bool:
        """Health check (always healthy in mock)"""
        return True
