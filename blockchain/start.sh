#!/bin/sh
set -e

echo "Starting Hardhat blockchain node..."
npx hardhat node --hostname 0.0.0.0 &
HARDHAT_PID=$!

echo "Waiting for Hardhat node to become responsive on port 8545..."
while ! nc -z 127.0.0.1 8545; do
  sleep 1
done

echo "Node is live! Running direct deployment script..."
node scripts/deployDirect.js || true

echo "Blockchain node is running with contract deployed."
wait $HARDHAT_PID
