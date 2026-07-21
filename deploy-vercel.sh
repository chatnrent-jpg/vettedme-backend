#!/bin/bash

# ============================================================================
# VETTED Frontend Deployment Script (Vercel)
# ============================================================================
# This script deploys the Next.js 15 frontend to Vercel production
# ============================================================================

set -e  # Exit on error

echo "🚀 VETTED Frontend Deployment to Vercel"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    log_error "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Navigate to frontend directory
cd frontend

log_info "Installing dependencies..."
npm install

log_info "Running production build..."
npm run build

log_info "Running linter..."
npm run lint || log_warn "Linter warnings detected (proceeding anyway)"

log_info "Deploying to Vercel production..."
vercel --prod --yes

log_info "Deployment complete!"
echo ""
echo "📍 Your frontend is now live at:"
echo "   https://vettedme.app"
echo "   https://vettedforce.com"
echo ""
echo "Next steps:"
echo "1. Configure custom domains in Vercel dashboard"
echo "2. Set up DNS records at your domain registrar"
echo "3. Test all endpoints"
echo ""
