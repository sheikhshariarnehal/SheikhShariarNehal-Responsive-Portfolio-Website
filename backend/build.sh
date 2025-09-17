#!/bin/bash

# Build script for Render deployment
echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p data/backups

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 uploads
chmod -R 755 data

# Copy environment variables
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    echo "Creating .env from environment variables..."
    cat > .env << EOF
NODE_ENV=production
PORT=\${PORT:-5000}
JWT_SECRET=\${JWT_SECRET}
JWT_EXPIRES_IN=\${JWT_EXPIRES_IN:-24h}
ADMIN_USERNAME=\${ADMIN_USERNAME:-admin}
ADMIN_PASSWORD=\${ADMIN_PASSWORD}
MAX_FILE_SIZE=\${MAX_FILE_SIZE:-5242880}
ALLOWED_FILE_TYPES=\${ALLOWED_FILE_TYPES:-image/jpeg,image/jpg,image/png,image/gif,image/webp}
FRONTEND_URL=\${FRONTEND_URL}
PORTFOLIO_URL=\${PORTFOLIO_URL}
RATE_LIMIT_WINDOW_MS=\${RATE_LIMIT_WINDOW_MS:-900000}
RATE_LIMIT_MAX_REQUESTS=\${RATE_LIMIT_MAX_REQUESTS:-100}
EOF
fi

echo "✅ Build completed successfully!"
