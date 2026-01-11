#!/bin/bash
echo "=== Checking for common render issues ==="

echo -e "\n1. Checking for maps without keys..."
grep -rn "\.map(" src/screens --include="*.tsx" | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  linenum=$(echo "$line" | cut -d: -f2)
  # Check if next few lines have key prop
  sed -n "${linenum},$((linenum+5))p" "$file" | grep -q "key=" || echo "⚠️  Potential missing key: $file:$linenum"
done

echo -e "\n2. Checking for undefined exports..."
for file in src/components/ui/*.tsx; do
  if ! grep -q "export default" "$file"; then
    echo "⚠️  Missing export in $file"
  fi
done

echo -e "\n3. Checking for common type errors..."
if grep -rn "gap:" src --include="*.tsx" 2>/dev/null | grep -v node_modules; then
  echo "⚠️  Found 'gap' property (not supported in RN)"
else
  echo "✅ No gap properties found"
fi

echo -e "\n4. Checking imports..."
if grep -rn "from '@apollo/client'" src/screens --include="*.tsx" | grep -E "(useQuery|useMutation|useLazyQuery)" | grep -v "/react'"; then
  echo "⚠️  Found incorrect Apollo imports"
else
  echo "✅ Apollo imports correct"
fi

echo -e "\n5. Checking for proper component exports..."
missing=0
for screen in SignInScreen SignUpScreen DashboardScreen CheckInScreen CheckOutScreen ScanScreen InventoryScreen ReportsScreen AdminScreen SettingsScreen; do
  if ! find src/screens -name "${screen}.tsx" -exec grep -q "export default" {} \; 2>/dev/null; then
    echo "⚠️  Missing export in ${screen}.tsx"
    ((missing++))
  fi
done
if [ $missing -eq 0 ]; then
  echo "✅ All screens properly exported"
fi

echo -e "\n=== Verification Complete ==="
