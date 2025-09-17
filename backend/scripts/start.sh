#!/bin/bash

# Portfolio Backend Startup Script
# This script sets up and starts the portfolio backend server

set -e  # Exit on any error

echo "🚀 Starting Portfolio Backend Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

print_success "npm $(npm --version) detected"

# Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

print_status "Working directory: $BACKEND_DIR"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        print_warning ".env file not found. Copying from .env.example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before starting the server"
        print_warning "Important: Change JWT_SECRET and ADMIN_PASSWORD for security"
    else
        print_error ".env file not found and no .env.example available"
        exit 1
    fi
else
    print_success ".env file found"
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p uploads
mkdir -p backups
mkdir -p logs
print_success "Directories created"

# Check if projects.json exists
PROJECTS_FILE="../projects/projects.json"
if [ ! -f "$PROJECTS_FILE" ]; then
    print_error "projects.json not found at $PROJECTS_FILE"
    print_error "Make sure the portfolio frontend is in the parent directory"
    exit 1
fi

print_success "projects.json found"

# Validate environment variables
print_status "Validating environment configuration..."

# Source the .env file
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required environment variables
REQUIRED_VARS=("JWT_SECRET" "ADMIN_USERNAME" "ADMIN_PASSWORD")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        print_error "  - $var"
    done
    print_error "Please set these variables in your .env file"
    exit 1
fi

# Security warnings
if [ "$JWT_SECRET" = "your-super-secret-jwt-key-change-this-in-production" ] || [ ${#JWT_SECRET} -lt 32 ]; then
    print_warning "JWT_SECRET should be changed and be at least 32 characters long for security"
fi

if [ "$ADMIN_PASSWORD" = "admin123" ]; then
    print_warning "ADMIN_PASSWORD should be changed from the default value for security"
fi

print_success "Environment validation completed"

# Run tests if in development mode
if [ "$NODE_ENV" != "production" ]; then
    print_status "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed, but continuing startup"
    fi
fi

# Start the server
print_status "Starting the server..."
print_success "Portfolio Backend is ready!"
print_success "Dashboard URL: http://localhost:${PORT:-5000}/dashboard"
print_success "API Base URL: http://localhost:${PORT:-5000}/api"
print_success "Health Check: http://localhost:${PORT:-5000}/api/health"

echo ""
print_status "Default admin credentials:"
print_status "  Username: $ADMIN_USERNAME"
print_status "  Password: $ADMIN_PASSWORD"
echo ""
print_warning "Remember to change the default credentials in production!"
echo ""

# Start the server based on environment
if [ "$NODE_ENV" = "production" ]; then
    print_status "Starting in production mode..."
    npm start
else
    print_status "Starting in development mode..."
    npm run dev
fi
