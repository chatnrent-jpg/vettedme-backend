#!/bin/bash

# ============================================================================
# VETTED Production Deployment Script
# ============================================================================
# 
# This script automates the deployment of VETTED to Railway production
# 
# Prerequisites:
# - Railway CLI installed (npm install -g @railway/cli)
# - Railway account authenticated (railway login)
# - Production environment variables configured in Railway dashboard
# - Docker installed and running
# 
# Usage: ./deploy-production.sh
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================================================
# PRE-FLIGHT CHECKS
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "🚀 VETTED PRODUCTION DEPLOYMENT"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

log_info "Running pre-flight checks..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    log_error "Railway CLI is not installed"
    log_info "Install with: npm install -g @railway/cli"
    exit 1
fi
log_success "Railway CLI is installed"

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    log_error "Not logged in to Railway"
    log_info "Login with: railway login"
    exit 1
fi
log_success "Authenticated with Railway"

# Check if Docker is running
if ! docker info &> /dev/null; then
    log_error "Docker is not running"
    log_info "Please start Docker Desktop"
    exit 1
fi
log_success "Docker is running"

# Check if we're on the correct branch
CURRENT_BRANCH=$(git branch --show-current)
log_info "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    log_warning "Not on main/master branch"
    read -p "Continue deployment from $CURRENT_BRANCH? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    log_warning "There are uncommitted changes"
    read -p "Continue deployment with uncommitted changes? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# ============================================================================
# BUILD CHECKS
# ============================================================================

log_info "Running build checks..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    log_warning "node_modules not found, installing dependencies..."
    npm install
fi

# Run linting
log_info "Running linter..."
if npm run lint &> /dev/null; then
    log_success "Lint passed"
else
    log_warning "Lint failed, but continuing..."
fi

# Run TypeScript compilation
log_info "Running TypeScript compilation..."
if npm run build; then
    log_success "TypeScript compilation successful"
else
    log_error "TypeScript compilation failed"
    exit 1
fi

# Run tests
log_info "Running tests..."
if npm run test:ci &> /dev/null; then
    log_success "Tests passed"
else
    log_warning "Tests failed, but continuing..."
    read -p "Continue deployment despite test failures? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
fi

# ============================================================================
# DOCKER BUILD TEST
# ============================================================================

log_info "Testing Docker build..."

if docker build -t vetted-test:latest . &> /dev/null; then
    log_success "Docker build successful"
    docker rmi vetted-test:latest &> /dev/null
else
    log_error "Docker build failed"
    exit 1
fi

# ============================================================================
# DEPLOYMENT CONFIRMATION
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "📋 DEPLOYMENT SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Branch:        $CURRENT_BRANCH"
echo "  Environment:   PRODUCTION"
echo "  Platform:      Railway"
echo "  Regions:       us-east (primary), lagos-ng, nairobi-ke, sao-paulo-br (replicas)"
echo ""
echo "⚠️  WARNING: This will deploy to PRODUCTION"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo

if [ "$REPLY" != "yes" ]; then
    log_info "Deployment cancelled"
    exit 0
fi

# ============================================================================
# DATABASE MIGRATION
# ============================================================================

log_info "Running database migrations..."

if railway run npm run db:migrate; then
    log_success "Database migrations completed"
else
    log_error "Database migrations failed"
    exit 1
fi

# ============================================================================
# DEPLOY TO RAILWAY
# ============================================================================

log_info "Deploying to Railway..."

if railway up; then
    log_success "Deployment successful"
else
    log_error "Deployment failed"
    exit 1
fi

# ============================================================================
# POST-DEPLOYMENT CHECKS
# ============================================================================

log_info "Running post-deployment checks..."

# Wait for deployment to stabilize
log_info "Waiting 30 seconds for deployment to stabilize..."
sleep 30

# Get deployment URL
DEPLOYMENT_URL=$(railway status --json 2>/dev/null | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

if [ -z "$DEPLOYMENT_URL" ]; then
    log_warning "Could not determine deployment URL"
else
    log_info "Deployment URL: $DEPLOYMENT_URL"
    
    # Health check
    log_info "Running health check..."
    if curl -f "$DEPLOYMENT_URL/health" &> /dev/null; then
        log_success "Health check passed"
    else
        log_error "Health check failed"
        log_info "Please check Railway logs for errors"
    fi
fi

# ============================================================================
# COMPLETION
# ============================================================================

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "🎉 DEPLOYMENT COMPLETE"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
log_success "VETTED is now live in production!"
echo ""
log_info "Next steps:"
echo "  1. Monitor Railway logs: railway logs"
echo "  2. Check application metrics in Railway dashboard"
echo "  3. Verify regional routing and CDN edge caching"
echo "  4. Run smoke tests against production API"
echo "  5. Monitor Sentry for errors"
echo ""
log_info "Production URLs:"
echo "  API:        https://api.vetted.ai"
echo "  VettedME:   https://vettedme.com"
echo "  VettedPay:  https://vettedpay.ai"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
