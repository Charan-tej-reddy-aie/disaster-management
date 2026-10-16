#!/bin/bash
# ==============================================================================
# Azure Cloud Shell Automated Provisioning Script
# Run this inside Azure Cloud Shell (https://shell.azure.com)
# ==============================================================================

set -e

# Configuration Variables
RESOURCE_GROUP="rg-disaster-management"
LOCATION="centralindia"  # Choose your nearest region (e.g., eastus, centralindia, westeurope)
VM_NAME="vm-disaster-mgmt"
VM_SIZE="Standard_B2s"   # 2 vCPUs, 4GB RAM (~$25/mo or free under student credits)
ADMIN_USER="azureuser"

echo "=========================================================="
echo "🌐 1-Click Azure Infrastructure Provisioning"
echo "=========================================================="

# 1. Create Resource Group
echo "[1/4] Creating Resource Group: $RESOURCE_GROUP in $LOCATION..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output table

# 2. Create Ubuntu Virtual Machine
echo "[2/4] Provisioning Virtual Machine: $VM_NAME ($VM_SIZE)..."
az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image Ubuntu2204 \
  --size $VM_SIZE \
  --admin-username $ADMIN_USER \
  --generate-ssh-keys \
  --output table

# 3. Open Ports 80 (HTTP) and 443 (HTTPS)
echo "[3/4] Opening Network Security Group firewall ports (80, 443, 5000)..."
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 80 --priority 1001 --output table
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 443 --priority 1002 --output table
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 5000 --priority 1003 --output table

# 4. Get Public IP Address
PUBLIC_IP=$(az vm show -d -g $RESOURCE_GROUP -n $VM_NAME --query publicIps -o tsv)

echo "=========================================================="
echo "✅ VM PROVISIONED SUCCESSFULLY!"
echo "Public IP: $PUBLIC_IP"
echo "SSH Command: ssh $ADMIN_USER@$PUBLIC_IP"
echo "=========================================================="
echo "Next step: Copy your repository to the VM or clone it, then run:"
echo "ssh $ADMIN_USER@$PUBLIC_IP 'bash deploy_azure_vm.sh'"
echo "=========================================================="
