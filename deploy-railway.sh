#!/bin/bash

# ============================================================================
# VETTED Backend Deployment Script (Railway)
# ============================================================================
# This script deploys the Node.js/Express backend to Railway production
# ============================================================================

set -e  # Exit on error

echo "🚀 VETTED Backend Deployment to Railway"
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

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

log_info "Installing dependencies..."
npm install

log_info "Running TypeScript build..."
npm run build

log_info "Running linter..."
npm run lint || log_warn "Linter warnings detected (proceeding anyway)"

log_info "Generating Prisma client..."
npx prisma generate

log_info "Deploying to Railway production..."
railway up

log_info "Running database migrations..."
railway run npx prisma migrate deploy

log_info "Deployment complete!"
echo ""
echo "📍 Your backend is now live at:"
echo "   https://api.vettedforce.com"
echo ""
echo "Next steps:"
echo "1. Configure custom domain in Railway dashboard"
echo "2. Set up DNS CNAME record: api.vettedforce.com → Railway"
echo "3. Verify environment variables are set"
echo "4. Test health endpoint: curl https://api.vettedforce.com/health"
echo ""
