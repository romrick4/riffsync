#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# RiffSync Setup Script
# Run on a fresh VPS to install and start RiffSync
# Usage: curl -fsSL https://raw.githubusercontent.com/YOUR_USER/riffsync/main/setup.sh | bash
# ──────────────────────────────────────────────

APP_DIR="${RIFFSYNC_DIR:-$HOME/riffsync}"
REPO_URL="${RIFFSYNC_REPO:-https://github.com/YOUR_USER/riffsync.git}"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         RiffSync Setup               ║"
echo "  ║   Your band's creative hub           ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "→ Docker not found. Installing..."
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "→ Docker installed. You may need to log out and back in for group changes."
    echo "  Then re-run this script."
    exit 0
fi

# Check for Docker Compose
if ! docker compose version &> /dev/null; then
    echo "✗ Docker Compose not found. Please install Docker Compose v2."
    exit 1
fi

echo "→ Docker found: $(docker --version)"

# Clone or update repo
if [ -d "$APP_DIR" ]; then
    echo "→ Updating existing installation at $APP_DIR..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "→ Cloning RiffSync to $APP_DIR..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "→ Creating .env from template..."
    cp .env.example .env

    # Generate random secrets
    DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
    SESSION_SECRET=$(openssl rand -base64 32)

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/change-me-to-a-strong-password/$DB_PASSWORD/g" .env
        sed -i '' "s/change-me-to-a-random-string/$SESSION_SECRET/" .env
    else
        sed -i "s/change-me-to-a-strong-password/$DB_PASSWORD/g" .env
        sed -i "s/change-me-to-a-random-string/$SESSION_SECRET/" .env
    fi

    echo "→ Generated secure passwords and secrets."
else
    echo "→ .env already exists, skipping..."
fi

# Build and start
echo "→ Building and starting RiffSync..."
docker compose up -d --build

# Wait for services to be ready
echo "→ Waiting for services to start..."
sleep 5

# Run migrations
echo "→ Running database migrations..."
docker compose run --rm migrate 2>/dev/null || echo "  (migrations will run on first request)"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║         RiffSync is running!         ║"
echo "  ╚══════════════════════════════════════╝"
echo ""
echo "  Open http://$(hostname -I 2>/dev/null | awk '{print $1}' || echo 'your-server-ip'):${APP_PORT:-3000}"
echo ""
echo "  Next steps:"
echo "    1. Open the URL above in your browser"
echo "    2. Create your account"
echo "    3. Create a project for your band"
echo "    4. Share the invite code with your bandmates"
echo ""
echo "  Useful commands:"
echo "    cd $APP_DIR"
echo "    docker compose logs -f      # view logs"
echo "    docker compose down          # stop"
echo "    docker compose up -d         # start"
echo "    docker compose pull && docker compose up -d --build  # update"
echo ""
