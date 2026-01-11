#!/bin/bash

echo "🧹 COMPLETE RESET - Fixing Native Build Crashes"
echo "================================================"
echo ""
echo "This will:"
echo "  1. Kill all running processes"
echo "  2. Remove native build folders (ios/, android/, .expo/)"
echo "  3. Uninstall old app from all simulators"
echo "  4. Erase all simulator data"
echo ""
echo "Starting in 2 seconds... (Ctrl+C to cancel)"
sleep 2

# Kill any running processes
echo ""
echo "🔪 Killing running processes..."
pkill -9 "Simulator" 2>/dev/null && echo "  ✓ Killed Simulator" || echo "  - Simulator not running"
pkill -9 "expo" 2>/dev/null && echo "  ✓ Killed Expo" || echo "  - Expo not running"
pkill -9 "node" 2>/dev/null && echo "  ✓ Killed Node" || echo "  - Node not running"
sleep 1

# Remove native build folders
echo ""
echo "🗑️  Removing native build folders..."
if [ -d "ios" ] || [ -d "android" ] || [ -d ".expo" ]; then
    rm -rf ios android .expo
    echo "  ✓ Removed: ios/, android/, .expo/"
else
    echo "  - No native folders found (already clean)"
fi

# Uninstall the app from all simulators
echo ""
echo "📱 Uninstalling old app from simulators..."
./uninstall-app.sh 2>/dev/null || true

# Erase all simulators
echo ""
echo "💥 Erasing all simulator data..."
xcrun simctl erase all 2>/dev/null && echo "  ✓ All simulators erased" || echo "  ! Error erasing (may already be clean)"

echo ""
echo "✅ RESET COMPLETE!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "  1. Run: npm start"
echo "  2. Wait for QR code"
echo "  3. Press 'i' to open iOS Simulator"
echo "  4. Wait for Expo Go to load"
echo ""
echo "The app will open in Expo Go (not a native build)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
