#!/bin/bash

echo "🚀 DaanaRx Mobile - Expo Go Launch"
echo "==================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Kill any existing processes
echo "🧹 Cleaning up..."
pkill -9 "expo" 2>/dev/null || true
pkill -9 "node" 2>/dev/null || true
pkill -9 "Simulator" 2>/dev/null || true
sleep 1

# Remove any old native builds (THIS IS CRITICAL)
if [ -d "ios" ] || [ -d "android" ] || [ -d ".expo" ]; then
    echo "⚠️  WARNING: Found native build folders!"
    echo "🗑️  Removing them to prevent crashes..."
    rm -rf ios android .expo
    echo ""
fi

echo "✨ Starting Expo Go..."
echo ""
echo "📱 When the QR code appears:"
echo "   → Press 'i' to open iOS Simulator"
echo "   → Or scan with Expo Go app on your device"
echo ""
echo "⚠️  IMPORTANT: This uses Expo Go (NOT a development build)"
echo "   If the app crashes, you may have an old build cached."
echo "   Run: ./reset-simulator.sh then try again"
echo ""

# Start Expo with clear cache
npx expo start --clear
