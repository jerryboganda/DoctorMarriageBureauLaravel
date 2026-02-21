/**
 * Generate all app icon and splash assets for Doctors Marriage Bureau.
 * 
 * Renders the SVG logo to:
 *  - assets/icon.png             (1024×1024 — iOS / Expo icon)
 *  - assets/adaptive-icon.png    (1024×1024 — Android adaptive foreground)
 *  - assets/splash.png           (1284×2778 — splash screen)
 *  - assets/favicon.png          (48×48 — web)
 *  - android mipmap ic_launcher* (mdpi→xxxhdpi)
 *  - android mipmap ic_launcher_foreground* (mdpi→xxxhdpi)
 *  - android drawable splashscreen_logo* (mdpi→xxxhdpi)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ── Caduceus Logo SVG ────────────────────────────────────────────────
// Faithfully reproduces the actual DMB logo: golden ring with sun-rays,
// blue caduceus staff with intertwined snakes, red wings, grey halo.
function buildLogoSvg(size, { withText = false, padding = 0.08 } = {}) {
  const s = size;
  const p = s * padding;
  const available = s - 2 * p;
  const cx = s / 2;
  // If text, shift logo up; otherwise center
  const logoAreaH = withText ? available * 0.72 : available;
  const cy = p + logoAreaH / 2;
  const r = logoAreaH * 0.38; // main golden circle radius

  // Ray geometry
  const rayCount = 14;
  const innerR = r * 0.88;
  const outerR = r * 1.12;
  const rays = Array.from({ length: rayCount }, (_, i) => {
    const angle = ((i * 360) / rayCount - 90) * (Math.PI / 180);
    const x1 = cx + innerR * Math.cos(angle);
    const y1 = cy + innerR * Math.sin(angle);
    const x2 = cx + outerR * Math.cos(angle);
    const y2 = cy + outerR * Math.sin(angle);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#E5A63B" stroke-width="${s * 0.008}" stroke-linecap="round" opacity="0.75"/>`;
  }).join('\n    ');

  // Wing width/height
  const ww = r * 0.92;
  const wh = r * 0.50;
  const wingY = cy - r * 0.30;

  const textSection = withText ? `
    <!-- Brand Text -->
    <text x="${cx}" y="${cy + r * 1.25}" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-weight="900" font-size="${s * 0.055}" fill="#EF4444" letter-spacing="${s * 0.004}">DOCTORS MARRIAGE</text>
    <line x1="${cx - s * 0.16}" y1="${cy + r * 1.38}" x2="${cx - s * 0.04}" y2="${cy + r * 1.38}" stroke="#2563EB" stroke-width="${s * 0.006}" stroke-linecap="round"/>
    <text x="${cx}" y="${cy + r * 1.50}" text-anchor="middle" font-family="Arial Black, Helvetica, sans-serif" font-weight="900" font-size="${s * 0.07}" fill="#2563EB" letter-spacing="${s * 0.006}">BUREAU</text>
    <line x1="${cx + s * 0.04}" y1="${cy + r * 1.38}" x2="${cx + s * 0.16}" y2="${cy + r * 1.38}" stroke="#2563EB" stroke-width="${s * 0.006}" stroke-linecap="round"/>` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="white"/>

  <!-- Sun Rays -->
  <g>
    ${rays}
  </g>

  <!-- Golden Ring (double) -->
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E5A63B" stroke-width="${s * 0.007}" opacity="0.95"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.96}" fill="none" stroke="#E5A63B" stroke-width="${s * 0.002}" opacity="0.3"/>

  <!-- Left Wing -->
  <g transform="translate(${cx - r * 0.08 - ww}, ${wingY})">
    <path d="M${ww} ${wh * 0.48} C ${ww * 0.78} ${wh * 0.15}, ${ww * 0.55} ${wh * 0.0}, ${ww * 0.40} ${wh * 0.15} C ${ww * 0.28} ${wh * 0.28}, ${ww * 0.15} ${wh * 0.05}, 0 ${wh * 0.22} C ${ww * 0.12} ${wh * 0.38}, ${ww * 0.35} ${wh * 0.70}, ${ww * 0.58} ${wh * 0.72} C ${ww * 0.75} ${wh * 0.73}, ${ww * 0.92} ${wh * 0.62}, ${ww} ${wh * 0.48} Z" fill="#EF4444" opacity="0.92"/>
    <path d="M${ww} ${wh * 0.56} C ${ww * 0.80} ${wh * 0.30}, ${ww * 0.55} ${wh * 0.18}, ${ww * 0.38} ${wh * 0.30} C ${ww * 0.25} ${wh * 0.40}, ${ww * 0.10} ${wh * 0.22}, ${ww * 0.02} ${wh * 0.36} C ${ww * 0.15} ${wh * 0.50}, ${ww * 0.40} ${wh * 0.82}, ${ww * 0.62} ${wh * 0.82} C ${ww * 0.78} ${wh * 0.82}, ${ww * 0.93} ${wh * 0.70}, ${ww} ${wh * 0.56} Z" fill="#DC2626" opacity="0.55"/>
  </g>

  <!-- Right Wing (mirrored) -->
  <g transform="translate(${cx + r * 0.08 + ww}, ${wingY}) scale(-1,1)">
    <path d="M${ww} ${wh * 0.48} C ${ww * 0.78} ${wh * 0.15}, ${ww * 0.55} ${wh * 0.0}, ${ww * 0.40} ${wh * 0.15} C ${ww * 0.28} ${wh * 0.28}, ${ww * 0.15} ${wh * 0.05}, 0 ${wh * 0.22} C ${ww * 0.12} ${wh * 0.38}, ${ww * 0.35} ${wh * 0.70}, ${ww * 0.58} ${wh * 0.72} C ${ww * 0.75} ${wh * 0.73}, ${ww * 0.92} ${wh * 0.62}, ${ww} ${wh * 0.48} Z" fill="#EF4444" opacity="0.92"/>
    <path d="M${ww} ${wh * 0.56} C ${ww * 0.80} ${wh * 0.30}, ${ww * 0.55} ${wh * 0.18}, ${ww * 0.38} ${wh * 0.30} C ${ww * 0.25} ${wh * 0.40}, ${ww * 0.10} ${wh * 0.22}, ${ww * 0.02} ${wh * 0.36} C ${ww * 0.15} ${wh * 0.50}, ${ww * 0.40} ${wh * 0.82}, ${ww * 0.62} ${wh * 0.82} C ${ww * 0.78} ${wh * 0.82}, ${ww * 0.93} ${wh * 0.70}, ${ww} ${wh * 0.56} Z" fill="#DC2626" opacity="0.55"/>
  </g>

  <!-- Caduceus Staff -->
  <line x1="${cx}" y1="${cy - r * 0.48}" x2="${cx}" y2="${cy + r * 0.65}" stroke="#2563EB" stroke-width="${s * 0.012}" stroke-linecap="round"/>
  <!-- Head circle -->
  <circle cx="${cx}" cy="${cy - r * 0.52}" r="${r * 0.09}" fill="#2563EB"/>
  <!-- Left helix -->
  <path d="M${cx} ${cy + r * 0.60} Q ${cx + r * 0.26} ${cy + r * 0.35} ${cx} ${cy + r * 0.15} Q ${cx - r * 0.26} ${cy - r * 0.05} ${cx} ${cy - r * 0.22} Q ${cx + r * 0.18} ${cy - r * 0.35} ${cx} ${cy - r * 0.42}" fill="none" stroke="#2563EB" stroke-width="${s * 0.010}" stroke-linecap="round"/>
  <!-- Right helix -->
  <path d="M${cx} ${cy + r * 0.60} Q ${cx - r * 0.26} ${cy + r * 0.35} ${cx} ${cy + r * 0.15} Q ${cx + r * 0.26} ${cy - r * 0.05} ${cx} ${cy - r * 0.22} Q ${cx - r * 0.18} ${cy - r * 0.35} ${cx} ${cy - r * 0.42}" fill="none" stroke="#2563EB" stroke-width="${s * 0.010}" stroke-linecap="round"/>

  <!-- Halo -->
  <ellipse cx="${cx}" cy="${cy - r * 0.72}" rx="${r * 0.20}" ry="${r * 0.09}" fill="none" stroke="#9CA3AF" stroke-width="${s * 0.007}" opacity="0.7"/>
  <ellipse cx="${cx}" cy="${cy - r * 0.72}" rx="${r * 0.20}" ry="${r * 0.09}" fill="none" stroke="#D1D5DB" stroke-width="${s * 0.003}" opacity="0.3"/>
  ${textSection}
</svg>`;
}

// ── Icon-only SVG (no text, more padding for circle crop safety) ─────
function buildIconSvg(size) {
  return buildLogoSvg(size, { withText: false, padding: 0.14 });
}

// ── Adaptive foreground (more padding for Android safe zone) ─────────
function buildAdaptiveFgSvg(size) {
  // Android adaptive icons use the inner 66% – outer 18% on each side
  return buildLogoSvg(size, { withText: false, padding: 0.22 });
}

// ── Splash SVG (centered logo with text on tall canvas) ──────────────
function buildSplashSvg(w, h) {
  const logoSize = Math.min(w, h) * 0.48;
  const svgLogo = buildLogoSvg(logoSize, { withText: true, padding: 0.06 });
  // Extract inner content (skip the outer <svg> and <rect>)
  const inner = svgLogo
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>/, '')
    .replace(/<rect[^/]*\/>/, '');

  const offsetX = (w - logoSize) / 2;
  const offsetY = (h - logoSize) / 2 - h * 0.04; // slightly above center

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="white"/>
  <g transform="translate(${offsetX}, ${offsetY})">
    ${inner}
  </g>
</svg>`;
}

// ── Generate all assets ──────────────────────────────────────────────
async function main() {
  const root = path.resolve(__dirname, '..');
  const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');

  // Android mipmap sizes (icon + foreground)
  const mipmaps = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
  };

  // Splash drawable sizes
  const drawables = {
    'drawable-mdpi': 200,
    'drawable-hdpi': 300,
    'drawable-xhdpi': 400,
    'drawable-xxhdpi': 600,
    'drawable-xxxhdpi': 800,
  };

  console.log('🎨 Generating Doctors Marriage Bureau app icons...\n');

  // 1) Expo / iOS icon  (1024×1024)
  const iconSvg = buildIconSvg(1024);
  await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toFile(path.join(root, 'assets', 'icon.png'));
  console.log('  ✅ assets/icon.png (1024×1024)');

  // 2) Adaptive icon foreground (1024×1024)
  const adaptiveSvg = buildAdaptiveFgSvg(1024);
  await sharp(Buffer.from(adaptiveSvg)).resize(1024, 1024).png().toFile(path.join(root, 'assets', 'adaptive-icon.png'));
  console.log('  ✅ assets/adaptive-icon.png (1024×1024)');

  // 3) Splash image (1284×2778)
  const splashSvg = buildSplashSvg(1284, 2778);
  await sharp(Buffer.from(splashSvg)).resize(1284, 2778).png().toFile(path.join(root, 'assets', 'splash.png'));
  console.log('  ✅ assets/splash.png (1284×2778)');

  // 4) Favicon (48×48)
  const faviconSvg = buildIconSvg(256);
  await sharp(Buffer.from(faviconSvg)).resize(48, 48).png().toFile(path.join(root, 'assets', 'favicon.png'));
  console.log('  ✅ assets/favicon.png (48×48)');

  // 5) Android mipmap icons (ic_launcher + ic_launcher_foreground + ic_launcher_round)
  for (const [folder, size] of Object.entries(mipmaps)) {
    const dir = path.join(androidRes, folder);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    // ic_launcher (standard square icon with rounded corners for older Android)
    const iconBuf = await sharp(Buffer.from(buildIconSvg(512))).resize(size, size).png().toBuffer();
    // Convert to webp for Android
    await sharp(iconBuf).webp({ quality: 95 }).toFile(path.join(dir, 'ic_launcher.webp'));

    // ic_launcher_round (same, but Android applies circular mask)
    await sharp(iconBuf).webp({ quality: 95 }).toFile(path.join(dir, 'ic_launcher_round.webp'));

    // ic_launcher_foreground (adaptive with extra padding)
    const fgBuf = await sharp(Buffer.from(buildAdaptiveFgSvg(512))).resize(size, size).png().toBuffer();
    await sharp(fgBuf).webp({ quality: 95 }).toFile(path.join(dir, 'ic_launcher_foreground.webp'));

    console.log(`  ✅ ${folder}/ (${size}×${size})`);
  }

  // 6) Android splashscreen_logo drawables
  for (const [folder, size] of Object.entries(drawables)) {
    const dir = path.join(androidRes, folder);
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }

    const logoSvg = buildLogoSvg(size, { withText: true, padding: 0.05 });
    await sharp(Buffer.from(logoSvg)).resize(size, size).png().toFile(path.join(dir, 'splashscreen_logo.png'));
    console.log(`  ✅ ${folder}/splashscreen_logo.png (${size}×${size})`);
  }

  // 7) Also copy icon to assets/images/logo.png (used by the app in some places)
  const logoWithTextSvg = buildLogoSvg(800, { withText: true, padding: 0.06 });
  await sharp(Buffer.from(logoWithTextSvg)).resize(800, 800).png().toFile(path.join(root, 'assets', 'images', 'logo.png'));
  console.log('  ✅ assets/images/logo.png (800×800 with text)');

  console.log('\n🎉 All icon assets generated successfully!');
  console.log('\nℹ️  Next steps:');
  console.log('  1. Run "npx expo prebuild --clean" to regenerate native projects');
  console.log('  2. Build a new APK with "eas build" or your build tool');
}

main().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
