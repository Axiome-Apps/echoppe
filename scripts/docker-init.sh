#!/bin/sh
# Échoppe - Docker initialization script
# Generates required secrets and prepares the environment

set -e

ENV_FILE="${1:-.env}"

echo "🏪 Échoppe - Docker Initialization"
echo "===================================="

# Check if .env already exists
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  $ENV_FILE already exists."
    read -p "Overwrite? (y/N) " -n 1 -r
    echo
    if [ "$REPLY" != "y" ] && [ "$REPLY" != "Y" ]; then
        echo "Aborted."
        exit 0
    fi
fi

# Copy template
if [ -f ".env.example" ]; then
    cp .env.example "$ENV_FILE"
    echo "✅ Copied .env.example to $ENV_FILE"
else
    echo "❌ .env.example not found"
    exit 1
fi

# Generate ENCRYPTION_KEY (32 bytes = 64 hex chars)
ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p | tr -d '\n')

# Update .env file with generated key
if [ "$(uname)" = "Darwin" ]; then
    # macOS
    sed -i '' "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
else
    # Linux
    sed -i "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$ENCRYPTION_KEY/" "$ENV_FILE"
fi

echo "✅ Generated ENCRYPTION_KEY"

# Generate random postgres password for production
POSTGRES_PASSWORD=$(openssl rand -base64 24 2>/dev/null || head -c 24 /dev/urandom | base64)

if [ "$(uname)" = "Darwin" ]; then
    sed -i '' "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" "$ENV_FILE"
else
    sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" "$ENV_FILE"
fi

echo "✅ Generated POSTGRES_PASSWORD"

echo ""
echo "🎉 Initialization complete!"
echo ""
echo "Next steps:"
echo "  1. Edit $ENV_FILE to configure your URLs and optional services"
echo "  2. Start services: docker compose up -d"
echo "     (the API creates/migrates the schema and the admin account on first boot)"
echo ""
echo "Default admin credentials: admin@echoppe.dev / admin123"
