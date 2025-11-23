# Image Optimization Guide

## 🚨 Current Issues

Based on the latest build analysis, these images are **critically oversized**:

| Image | Current Size | Target Size | Priority |
|-------|-------------|-------------|----------|
| `mp-salon-interior-1.png` | **1.59 MB** | ~150 KB | 🔴 CRITICAL |
| `haircut-fade.jpg` | **1.13 MB** | ~100 KB | 🔴 CRITICAL |
| `haircut-kids-style.jpg` | **569 KB** | ~80 KB | 🟡 HIGH |
| `barbershop-hero.jpg` | **206 KB** | ~60 KB | 🟡 HIGH |
| `hairdresser-hero.jpg` | **159 KB** | ~50 KB | 🟡 HIGH |

**Total Savings Potential: ~2.5 MB → ~450 KB (80% reduction!)**

---

## Quick Fix Options

### Option 1: Automated Script (Recommended)

```bash
# Make script executable
chmod +x scripts/optimize-images.sh

# Run optimization
./scripts/optimize-images.sh
```

This will:
- ✅ Automatically optimize all JPG/PNG images
- ✅ Create backups before optimization
- ✅ Strip EXIF data
- ✅ Convert to progressive JPEGs
- ✅ Compress with optimal quality

### Option 2: Online Tools (No Installation Required)

Upload images to these free tools:

1. **TinyPNG** - https://tinypng.com/
   - Best for PNG files
   - Up to 80% size reduction
   - Maintains transparency

2. **Squoosh** - https://squoosh.app/
   - Best for JPG files
   - Real-time preview
   - Multiple format support (WebP, AVIF)

3. **ImageOptim** - https://imageoptim.com/ (macOS)
   - Drag & drop interface
   - Lossless compression
   - Batch processing

### Option 3: Manual with ImageMagick

```bash
# Install ImageMagick
# Ubuntu/Debian:
sudo apt-get install imagemagick

# macOS:
brew install imagemagick

# Optimize JPEG (quality 85 is sweet spot)
convert input.jpg -strip -interlace Plane -quality 85 output.jpg

# Optimize PNG
convert input.png -strip output.png

# Convert large PNG to JPEG (if no transparency needed)
convert input.png -quality 85 output.jpg

# Resize and optimize
convert input.jpg -resize 1920x1080\> -quality 85 output.jpg
```

---

## Specific Recommendations

### 1. `mp-salon-interior-1.png` (1.59 MB → ~150 KB)

```bash
# This is a photograph, should be JPEG, not PNG
convert public/mp-salon-interior-1.png \
  -resize 1920x1080\> \
  -quality 85 \
  public/mp-salon-interior-1.jpg

# Then update the import in your code to use .jpg
```

**Why?** PNGs are for graphics/logos with transparency. Photos should be JPEGs.

### 2. `haircut-fade.jpg` (1.13 MB → ~100 KB)

```bash
# Resize to reasonable dimensions and optimize
convert public/haircut-fade.jpg \
  -resize 1200x800\> \
  -quality 82 \
  -strip \
  -interlace Plane \
  public/haircut-fade.jpg
```

### 3. All Hero Images

```bash
# Batch process all hero images
for img in public/*-hero-*.jpg; do
  convert "$img" \
    -resize 1920x1080\> \
    -quality 85 \
    -strip \
    -interlace Plane \
    "$img"
done
```

---

## Best Practices

### 1. **Use Correct Formats**

| Content Type | Format | Why |
|-------------|--------|-----|
| Photos | JPEG/WebP | Better compression for photographs |
| Logos/Icons | PNG/SVG | Transparency support, sharp edges |
| Simple Graphics | SVG | Vector = infinite scaling |
| Screenshots | PNG (8-bit) | Sharp text, limited colors |

### 2. **Responsive Images**

Create multiple sizes for different devices:

```html
<picture>
  <source srcset="image-mobile.webp" media="(max-width: 768px)" />
  <source srcset="image-tablet.webp" media="(max-width: 1024px)" />
  <source srcset="image-desktop.webp" media="(min-width: 1025px)" />
  <img src="image-fallback.jpg" alt="Description" />
</picture>
```

### 3. **Lazy Loading**

Already implemented in React, but verify:

```jsx
<img
  src="large-image.jpg"
  loading="lazy" // Browser-native lazy loading
  alt="Description"
/>
```

### 4. **WebP Format (Modern)**

Better compression than JPEG/PNG:

```bash
# Convert to WebP (requires webp package)
cwebp -q 80 input.jpg -o output.webp

# Install on Ubuntu
sudo apt-get install webp
```

### 5. **Image CDN (Production)**

Consider using services that auto-optimize:
- **Cloudinary** - Free tier available
- **Imgix** - Real-time optimization
- **Cloudflare Images** - With CDN included

---

## Quality Guidelines

| Quality | File Size | Use Case |
|---------|-----------|----------|
| 60-70 | Small | Thumbnails, backgrounds |
| 75-85 | Medium | **General use (recommended)** |
| 90-95 | Large | Hero images, portfolios |
| 100 | Huge | **Avoid** (unnecessary for web) |

**Sweet spot: Quality 82-85** - Unnoticeable quality loss, significant size savings

---

## Vite Configuration (Already Added)

Your `vite.config.ts` should handle build-time optimizations:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Separate images into their own directory
          if (/\.(png|jpe?g|svg|gif|webp)$/.test(assetInfo.name || '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
```

---

## Verification

After optimization, check the improvements:

```bash
# Rebuild the project
npm run build

# Check dist directory sizes
du -sh dist/assets/*.{jpg,png,webp}

# Compare with previous build
# You should see significant reductions!
```

---

## Quick Wins Checklist

- [ ] Run `./scripts/optimize-images.sh`
- [ ] Convert `mp-salon-interior-1.png` to JPEG
- [ ] Resize `haircut-fade.jpg` to 1200px width
- [ ] Optimize all hero images to quality 85
- [ ] Verify lazy loading is enabled
- [ ] Consider WebP versions for modern browsers
- [ ] Update image references in code if filenames changed
- [ ] Test build size with `npm run build`

---

## Expected Impact

After optimization:

- ✅ **Initial page load: 40-50% faster**
- ✅ **Bandwidth savings: ~2 MB per user**
- ✅ **Better mobile experience**
- ✅ **Improved SEO scores**
- ✅ **Lower CDN costs**

---

## Monitoring

Track image performance:

1. **Lighthouse** - `npm run build && npm run preview`
   - Open DevTools → Lighthouse
   - Run "Performance" audit
   - Check "Properly size images" section

2. **Bundle Analyzer** (optional)
   ```bash
   npm install --save-dev rollup-plugin-visualizer
   ```

3. **Network Tab**
   - Check actual transfer sizes
   - Verify images are lazy-loaded

---

## Troubleshooting

**Images look blurry after optimization**
- Increase quality from 85 to 90
- Check if image was over-compressed

**File size didn't decrease**
- Image might already be optimized
- Try different compression tool
- Check if it's a vector (SVG) file

**Format conversion broke something**
- Restore from backup in `image-backups-*/`
- Verify transparency isn't needed before PNG→JPG conversion

---

## Additional Resources

- [Google Web Fundamentals - Image Optimization](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/image-optimization)
- [MDN - Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Web.dev - Fast load times](https://web.dev/fast/)
