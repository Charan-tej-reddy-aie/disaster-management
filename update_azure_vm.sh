#!/bin/bash
# ==============================================================================
# Fast Update Script for Azure VM
# Rebuilds only Backend and Frontend without touching Database or ML/Quantum/Blockchain
# ==============================================================================

set -e

echo "=========================================================="
echo "🔄 Updating Disaster Management System on Azure VM"
echo "=========================================================="

# Navigate to project directory
if [ -d "$HOME/disaster-management" ]; then
    cd "$HOME/disaster-management"
else
    cd "$(dirname "$0")"
fi

# 1. Pull latest code from GitHub
echo "[1/2] Pulling latest code from GitHub repository..."
git pull origin main

# 2. Rebuild only Backend and Frontend containers
echo "[2/2] Rebuilding Backend API and Frontend Dashboard..."
sudo docker compose up -d --build backend frontend

echo "=========================================================="
echo "✅ AZURE VM UPDATED SUCCESSFULLY!"
echo "=========================================================="
sudo docker compose ps
echo "=========================================================="
