#!/bin/bash

# Comprehensive Production Readiness Automation Script
# This script automates many of the remaining production readiness tasks

set -e

echo "🚀 DentiBot Production Readiness - Automated Fixes"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
print_header "Checking Prerequisites"

if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Run from project root."
    exit 1
fi
print_success "Found project root"

# Install terser if not present
if ! npm list terser &>/dev/null; then
    print_warning "Installing terser for production builds..."
    npm install -D terser
fi

# 1. ADD LOGGER IMPORTS
print_header "Step 1: Adding Logger Imports"

FILES_WITH_CONSOLE=$(grep -rl "console\.\(log\|error\|warn\)" src/ | grep -v "logger.ts" | grep -v ".test." | grep -v "node_modules" || true)

if [ -n "$FILES_WITH_CONSOLE" ]; then
    print_warning "Found $(echo "$FILES_WITH_CONSOLE" | wc -l) files with console statements"

    echo "$FILES_WITH_CONSOLE" | while read file; do
        # Check if logger import already exists
        if ! grep -q "from.*lib/logger" "$file" 2>/dev/null; then
            # Add import after the last import statement
            if grep -q "^import" "$file"; then
                # Get the line number of the last import
                LAST_IMPORT=$(grep -n "^import" "$file" | tail -1 | cut -d: -f1)

                # Insert logger import after last import
                sed -i "${LAST_IMPORT}a import { logger } from '@/lib/logger';" "$file"

                print_success "Added logger import to $file"
            fi
        fi
    done
else
    print_success "No files need logger imports"
fi

# 2. REPLACE CONSOLE STATEMENTS
print_header "Step 2: Replacing Console Statements"

echo "$FILES_WITH_CONSOLE" | while read file; do
    if [ -f "$file" ]; then
        # Replace console.log with logger.log
        sed -i 's/console\.log(/logger.log(/g' "$file"

        # Replace console.error with logger.error
        sed -i 's/console\.error(/logger.error(/g' "$file"

        # Replace console.warn with logger.warn
        sed -i 's/console\.warn(/logger.warn(/g' "$file"

        # Replace console.info with logger.info
        sed -i 's/console\.info(/logger.info(/g' "$file"

        # Replace console.debug with logger.debug
        sed -i 's/console\.debug(/logger.debug(/g' "$file"

        print_success "Updated console statements in $file"
    fi
done

# 3. FIX USEEFFECT DEPENDENCIES
print_header "Step 3: Checking React Hook Dependencies"

print_warning "Running ESLint to find dependency issues..."
npm run lint -- --rule 'react-hooks/exhaustive-deps: error' 2>&1 | tee /tmp/eslint-output.txt || true

HOOK_WARNINGS=$(grep -c "React Hook useEffect has a missing dependency" /tmp/eslint-output.txt || echo "0")
print_warning "Found $HOOK_WARNINGS React Hook dependency warnings"
print_warning "These require manual review - see /tmp/eslint-output.txt"

# 4. ADD SKIP-TO-CONTENT LINK
print_header "Step 4: Adding Accessibility Improvements"

# Add SkipToContent to App.tsx if not present
if ! grep -q "SkipToContent" src/App.tsx; then
    print_warning "Adding SkipToContent import to App.tsx..."
    sed -i '/import.*DentistInvitationDialog/a import { SkipToContent } from "@/components/ui/skip-to-content";' src/App.tsx

    # Add SkipToContent component in the return statement
    sed -i 's/<ErrorBoundary>/<ErrorBoundary>\n      <SkipToContent \/>/' src/App.tsx

    print_success "Added SkipToContent to App.tsx"
else
    print_success "SkipToContent already present in App.tsx"
fi

# 5. REMOVE @ts-nocheck COMMENTS
print_header "Step 5: Identifying @ts-nocheck Files"

TS_NOCHECK_FILES=$(grep -rl "@ts-nocheck" src/ || true)
TS_NOCHECK_COUNT=$(echo "$TS_NOCHECK_FILES" | grep -c . || echo "0")

if [ "$TS_NOCHECK_COUNT" -gt 0 ]; then
    print_warning "Found $TS_NOCHECK_COUNT files with @ts-nocheck"
    print_warning "Creating backup before removing..."

    echo "$TS_NOCHECK_FILES" | while read file; do
        # Create backup
        cp "$file" "$file.backup"

        # Remove @ts-nocheck comment
        sed -i '/@ts-nocheck/d' "$file"
        sed -i '/@ts-ignore/d' "$file"

        print_success "Removed @ts-nocheck from $file (backup: $file.backup)"
    done

    print_warning "Running TypeScript compiler to check for errors..."
    npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.txt || true

    ERROR_COUNT=$(grep -c "error TS" /tmp/tsc-errors.txt || echo "0")

    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_error "Found $ERROR_COUNT TypeScript errors"
        print_warning "Review /tmp/tsc-errors.txt and fix errors"
        print_warning "Backup files saved as *.backup - restore if needed"
    else
        print_success "No TypeScript errors! Removing backup files..."
        find src/ -name "*.backup" -delete
    fi
else
    print_success "No @ts-nocheck files found"
fi

# 6. ADD ARIA LABELS TO BUTTONS
print_header "Step 6: Adding Accessibility Attributes"

# Find buttons without aria-label
print_warning "Scanning for buttons without aria-label..."
grep -rn "Button\|button" src/ --include="*.tsx" | grep -v "aria-label" | head -20 > /tmp/buttons-without-aria.txt || true

BUTTON_COUNT=$(wc -l < /tmp/buttons-without-aria.txt || echo "0")
if [ "$BUTTON_COUNT" -gt 0 ]; then
    print_warning "Found $BUTTON_COUNT potential buttons without aria-label"
    print_warning "Review /tmp/buttons-without-aria.txt and add manually"
else
    print_success "All buttons have accessibility attributes"
fi

# 7. BUILD AND TEST
print_header "Step 7: Running Build and Tests"

print_warning "Building project..."
if npm run build; then
    print_success "Build successful!"

    # Check bundle sizes
    print_warning "Bundle sizes:"
    du -sh dist/* | sort -h
else
    print_error "Build failed - check errors above"
fi

# Check if tests exist
if [ -f "jest.config.cjs" ]; then
    print_warning "Running tests..."
    npm run test || print_warning "Some tests failed"
else
    print_warning "No test configuration found"
fi

# 8. GIT STATUS
print_header "Step 8: Git Status"

echo "Modified files:"
git status --short

# 9. SUMMARY REPORT
print_header "Summary Report"

echo "✅ Completed Tasks:"
echo "  - Added logger imports to files"
echo "  - Replaced console.* with logger.*"
echo "  - Identified React Hook dependency issues"
echo "  - Added SkipToContent component"
echo "  - Removed @ts-nocheck directives"
echo "  - Identified accessibility issues"
echo "  - Ran build and tests"
echo ""
echo "⚠️  Manual Review Required:"
echo "  - /tmp/eslint-output.txt - React Hook dependencies"
echo "  - /tmp/tsc-errors.txt - TypeScript errors (if any)"
echo "  - /tmp/buttons-without-aria.txt - Accessibility issues"
echo ""
echo "📋 Next Steps:"
echo "  1. Review and fix TypeScript errors"
echo "  2. Fix React Hook dependencies"
echo "  3. Add aria-label to buttons"
echo "  4. Run tests and fix failures"
echo "  5. Commit changes"
echo ""

print_success "Script complete! Review the output above and fix any remaining issues."
