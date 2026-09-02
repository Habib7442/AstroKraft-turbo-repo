const fs = require('fs');
const path = require('path');

const logoDir = path.join(__dirname, '..', 'assets', 'astrokraft-mobile-brand-kit', 'logo');
const adminAssetsDir = path.join(__dirname, '..', 'apps', 'admin', 'assets');

console.log('Logo dir contents:', fs.readdirSync(logoDir));

// Clean logo files
const emeraldMark = path.join(logoDir, 'astrokraft-mark-emerald.png');
const knockoutEmerald = path.join(logoDir, 'astrokraft-mark-knockout-emerald.png');

console.log('Emerald mark exists:', fs.existsSync(emeraldMark));
console.log('Knockout emerald exists:', fs.existsSync(knockoutEmerald));

// Copy clean emerald mark to admin assets
fs.copyFileSync(emeraldMark, path.join(adminAssetsDir, 'icon.png'));
fs.copyFileSync(emeraldMark, path.join(adminAssetsDir, 'adaptive-icon.png'));
fs.copyFileSync(emeraldMark, path.join(adminAssetsDir, 'splash.png'));

console.log('Successfully updated icon.png, adaptive-icon.png, and splash.png with clean gemstone emblem!');
