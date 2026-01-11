#!/bin/bash

echo "Uninstalling DaanaRx from all simulators..."

# Get all device IDs
xcrun simctl list devices | grep -E "iPhone|iPad" | grep -oE '\([A-F0-9-]{36}\)' | tr -d '()' | while read device_id; do
    echo "  → Device: $device_id"
    xcrun simctl uninstall "$device_id" com.daanarx.mobile 2>/dev/null || true
done

echo "✅ Done"
