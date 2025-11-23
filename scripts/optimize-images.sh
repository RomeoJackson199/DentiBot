#!/bin/bash

# Image Optimization Script for DentiBot
# Automatically optimizes PNG and JPG images in the project

set -e

echo "=================================================="
echo "  DentiBot Image Optimization Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo -e "${RED}Error: ImageMagick is not installed${NC}"
    echo "Please install it:"
    echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
    echo "  macOS: brew install imagemagick"
    echo "  Windows: Download from https://imagemagick.org/script/download.php"
    exit 1
fi

# Check if optipng is installed (optional but recommended)
HAS_OPTIPNG=false
if command -v optipng &> /dev/null; then
    HAS_OPTIPNG=true
    echo -e "${GREEN}✓ optipng found${NC}"
else
    echo -e "${YELLOW}⚠ optipng not found (optional, but recommended for PNG optimization)${NC}"
    echo "  Install with: sudo apt-get install optipng (Ubuntu) or brew install optipng (macOS)"
fi

# Check if jpegoptim is installed (optional but recommended)
HAS_JPEGOPTIM=false
if command -v jpegoptim &> /dev/null; then
    HAS_JPEGOPTIM=true
    echo -e "${GREEN}✓ jpegoptim found${NC}"
else
    echo -e "${YELLOW}⚠ jpegoptim not found (optional, but recommended for JPEG optimization)${NC}"
    echo "  Install with: sudo apt-get install jpegoptim (Ubuntu) or brew install jpegoptim (macOS)"
fi

echo ""

# Find large images
echo -e "${BLUE}Finding large images...${NC}"
echo ""

# Create backup directory
BACKUP_DIR="./image-backups-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}Backup directory created: $BACKUP_DIR${NC}"
echo ""

# Track savings
TOTAL_BEFORE=0
TOTAL_AFTER=0

# Function to optimize a single image
optimize_image() {
    local file="$1"
    local ext="${file##*.}"
    local filename=$(basename "$file")
    local size_before=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

    TOTAL_BEFORE=$((TOTAL_BEFORE + size_before))

    # Skip if file is already small
    if [ $size_before -lt 100000 ]; then
        echo -e "${GREEN}✓ $filename already optimized ($(numfmt --to=iec-i --suffix=B $size_before))${NC}"
        return
    fi

    echo -e "${YELLOW}Optimizing: $filename ($(numfmt --to=iec-i --suffix=B $size_before))...${NC}"

    # Create backup
    cp "$file" "$BACKUP_DIR/"

    # Optimize based on file type
    case "${ext,,}" in
        jpg|jpeg)
            # Convert to progressive JPEG and optimize
            if [ "$HAS_JPEGOPTIM" = true ]; then
                jpegoptim --max=85 --strip-all --preserve --quiet "$file"
            else
                convert "$file" -strip -interlace Plane -quality 85 "$file"
            fi
            ;;
        png)
            # Optimize PNG
            if [ "$HAS_OPTIPNG" = true ]; then
                optipng -quiet -o2 "$file"
            else
                convert "$file" -strip "$file"
            fi

            # Try converting large PNGs to JPEG if appropriate
            if [ $size_before -gt 500000 ]; then
                echo -e "  ${BLUE}→ Large PNG detected. Consider converting to JPEG if not transparent.${NC}"
            fi
            ;;
        *)
            echo -e "  ${RED}✗ Unsupported format: $ext${NC}"
            return
            ;;
    esac

    local size_after=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    TOTAL_AFTER=$((TOTAL_AFTER + size_after))

    local saved=$((size_before - size_after))
    local percent=$((saved * 100 / size_before))

    if [ $saved -gt 0 ]; then
        echo -e "  ${GREEN}✓ Saved $(numfmt --to=iec-i --suffix=B $saved) (${percent}%) → $(numfmt --to=iec-i --suffix=B $size_after)${NC}"
    else
        echo -e "  ${YELLOW}✓ No size reduction${NC}"
    fi
}

# Export function for parallel execution
export -f optimize_image
export HAS_OPTIPNG
export HAS_JPEGOPTIM
export BACKUP_DIR
export TOTAL_BEFORE
export TOTAL_AFTER

# Find and optimize images in public/assets
if [ -d "public" ]; then
    echo -e "${BLUE}Optimizing images in public directory...${NC}"
    find public -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read file; do
        optimize_image "$file"
    done
fi

# Find and optimize images in src/assets
if [ -d "src/assets" ]; then
    echo -e "${BLUE}Optimizing images in src/assets directory...${NC}"
    find src/assets -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read file; do
        optimize_image "$file"
    done
fi

echo ""
echo "=================================================="
echo "  Optimization Complete!"
echo "=================================================="
echo ""
echo -e "${GREEN}Original backups saved to: $BACKUP_DIR${NC}"
echo ""
echo -e "${BLUE}Recommendations:${NC}"
echo "1. Convert large PNGs to JPEGs if they don't need transparency"
echo "2. Use WebP format for modern browsers (better compression)"
echo "3. Implement responsive images with different sizes for mobile/desktop"
echo "4. Consider using a CDN with automatic image optimization"
echo "5. Lazy load images below the fold"
echo ""
echo -e "${YELLOW}To convert PNG to JPEG:${NC}"
echo "  convert image.png -quality 85 image.jpg"
echo ""
echo -e "${YELLOW}To create WebP versions:${NC}"
echo "  cwebp -q 80 image.jpg -o image.webp"
echo ""
echo "Done!"
