#!/bin/bash

# Production Readiness Fix Script
# This script helps automate fixes for common production issues

set -e

echo "🚀 DentiBot Production Readiness Automation"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Run this script from the project root."
    exit 1
fi

print_status "Found project root"

# 1. Find and list @ts-nocheck files
echo ""
echo "📝 Finding @ts-nocheck files..."
TS_NOCHECK_FILES=$(grep -rl "@ts-nocheck" src/ 2>/dev/null || true)
TS_NOCHECK_COUNT=$(echo "$TS_NOCHECK_FILES" | grep -c . || echo "0")

if [ "$TS_NOCHECK_COUNT" -gt 0 ]; then
    print_warning "Found $TS_NOCHECK_COUNT files with @ts-nocheck:"
    echo "$TS_NOCHECK_FILES" | while read file; do
        echo "  - $file"
    done
else
    print_status "No @ts-nocheck files found!"
fi

# 2. Find console statements
echo ""
echo "📝 Finding console.* statements..."
CONSOLE_FILES=$(grep -rl "console\.\(log\|error\|warn\|info\|debug\)" src/ 2>/dev/null | grep -v "logger.ts" | grep -v ".test." || true)
CONSOLE_COUNT=$(echo "$CONSOLE_FILES" | grep -c . || echo "0")

if [ "$CONSOLE_COUNT" -gt 0 ]; then
    print_warning "Found $CONSOLE_COUNT files with console statements:"
    echo "$CONSOLE_FILES" | head -10 | while read file; do
        echo "  - $file"
    done
    if [ "$CONSOLE_COUNT" -gt 10 ]; then
        echo "  ... and $(($CONSOLE_COUNT - 10)) more"
    fi
else
    print_status "No problematic console statements found!"
fi

# 3. Check for 'any' types
echo ""
echo "📝 Finding 'any' type usage..."
ANY_COUNT=$(grep -r ": any" src/ 2>/dev/null | grep -v "node_modules" | wc -l || echo "0")

if [ "$ANY_COUNT" -gt 0 ]; then
    print_warning "Found $ANY_COUNT instances of ': any' type"
else
    print_status "No 'any' types found!"
fi

# 4. Interactive fixing
echo ""
echo "🔧 Would you like to automatically fix some issues?"
echo ""
echo "Available fixes:"
echo "  1. Add logger import to files with console statements"
echo "  2. Run TypeScript compiler to check for errors"
echo "  3. Run ESLint to check for issues"
echo "  4. Run tests"
echo "  5. Build the project"
echo "  0. Skip automatic fixes"
echo ""
read -p "Enter your choice (0-5): " choice

case $choice in
    1)
        echo ""
        print_status "Adding logger imports..."
        # This is a placeholder - actual implementation would be more complex
        print_warning "Manual implementation required"
        ;;
    2)
        echo ""
        print_status "Running TypeScript compiler..."
        npx tsc --noEmit || print_error "TypeScript errors found"
        ;;
    3)
        echo ""
        print_status "Running ESLint..."
        npm run lint || print_error "Linting errors found"
        ;;
    4)
        echo ""
        print_status "Running tests..."
        npm run test || print_error "Tests failed"
        ;;
    5)
        echo ""
        print_status "Building project..."
        npm run build || print_error "Build failed"
        ;;
    0)
        print_status "Skipping automatic fixes"
        ;;
    *)
        print_error "Invalid choice"
        ;;
esac

# 5. Summary and recommendations
echo ""
echo "📊 Summary"
echo "==========="
echo "  @ts-nocheck files: $TS_NOCHECK_COUNT"
echo "  Files with console.*: $CONSOLE_COUNT"
echo "  'any' type instances: $ANY_COUNT"
echo ""

if [ "$TS_NOCHECK_COUNT" -gt 0 ] || [ "$CONSOLE_COUNT" -gt 0 ] || [ "$ANY_COUNT" -gt 50 ]; then
    echo "📋 Recommended Next Steps:"
    echo ""
    if [ "$TS_NOCHECK_COUNT" -gt 0 ]; then
        echo "  1. Fix @ts-nocheck files (priority: HIGH)"
        echo "     - Start with: $(echo "$TS_NOCHECK_FILES" | head -1)"
    fi
    if [ "$CONSOLE_COUNT" -gt 0 ]; then
        echo "  2. Replace console.* with logger.* (priority: HIGH)"
        echo "     - Use: import { logger } from '@/lib/logger'"
    fi
    if [ "$ANY_COUNT" -gt 50 ]; then
        echo "  3. Replace 'any' types with proper types (priority: MEDIUM)"
    fi
    echo ""
    echo "  See PRODUCTION_READINESS_IMPROVEMENTS.md for detailed guide"
else
    print_status "Great! Your codebase is in good shape!"
fi

echo ""
print_status "Script complete!"
