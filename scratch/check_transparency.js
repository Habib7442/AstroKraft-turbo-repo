const fs = require('fs');
const path = require('path');

const brandLogoDir = path.join(__dirname, '..', 'assets', 'astrokraft-mobile-brand-kit', 'logo');
const adminAssetsDir = path.join(__dirname, '..', 'apps', 'admin', 'assets');

// Copy astrokraft-mark-knockout-emerald.png to icon.png, adaptive-icon.png, and splash.png
const knockoutEmerald = path.join(brandLogoDir, 'astrokraft-mark-knockout-emerald.png');
const fullLogo = path.join(__dirname, '..', 'assets', 'astrokraft_logo.png');

console.log('Knockout emerald exists:', fs.existsSync(knockoutEmerald));

if (fs.existsSync(knockoutEmerald)) {
  fs.copyFileSync(knockoutEmerald, path.join(adminAssetsDir, 'icon.png'));
  fs.copyFileSync(knockoutEmerald, path.join(adminAssetsDir, 'adaptive-icon.png'));
  fs.copyFileSync(knockoutEmerald, path.join(adminAssetsDir, 'splash.png'));
  console.log('Copied astrokraft-mark-knockout-emerald.png to admin assets');
}
