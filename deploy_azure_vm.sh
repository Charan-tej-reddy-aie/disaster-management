#!/bin/bash
# ==============================================================================
# 1-Click Azure VM Automated Setup Script for Disaster Management System
# Target OS: Ubuntu 22.04 / 24.04 LTS
# ==============================================================================

set -e

echo "=========================================================="
echo "🚀 Starting Automated Deployment on Azure VM"
echo "=========================================================="

# 1. Update system packages
echo "[1/6] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ufw net-tools

# 2. Install Docker & Docker Compose
echo "[2/6] Installing Docker Engine & Docker Compose plugin..."
if ! command -v docker &> /dev/null; then
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER
    echo "Docker installed successfully!"
else
    echo "Docker already installed."
fi

# 3. Configure Firewall
echo "[3/6] Configuring Azure VM firewall rules..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Check if docker-compose.yml exists in current directory
echo "[4/6] Checking project files..."
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found in current directory!"
    echo "Please run this script from inside the disaster-management repository root."
    exit 1
fi

# 5. Build and launch all 6 containers
echo "[5/6] Building and starting all 6 microservices via Docker Compose..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

# 6. Seed Complete Database (Warehouses, Inventory, Requests, Allocations, Blockchain)
echo "[6/7] Waiting for MySQL to be ready and seeding complete database..."
until sudo docker exec disaster_mysql mysqladmin ping -h localhost -uroot -prootpassword123 --silent; do
    echo "Waiting for MySQL to accept connections..."
    sleep 3
done

echo "MySQL is ready! Importing complete seed data..."
sudo docker exec -i disaster_mysql mysql -uroot -prootpassword123 disaster_management < database/init/complete_seed.sql
sudo docker exec disaster_backend node src/scripts/setup_roles_and_managers.js || true

echo "Restarting backend to apply fresh schema and connections..."
sudo docker restart disaster_backend
sleep 3

PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo "=========================================================="
echo "🎉 DEPLOYMENT COMPLETE & SYSTEM IS LIVE!"
echo "=========================================================="
echo "Frontend Dashboard: http://$PUBLIC_IP"
echo "Backend API:        http://$PUBLIC_IP/api/health"
echo "ML Service:         http://$PUBLIC_IP:8001/health"
echo "Quantum Service:    http://$PUBLIC_IP:8002/health"
echo "Blockchain RPC:     http://$PUBLIC_IP:8545"
echo "=========================================================="
