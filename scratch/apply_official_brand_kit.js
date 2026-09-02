const fs = require('fs');
const path = require('path');

const brandKitDir = path.join(__dirname, '..', 'assets', 'astrokraft-mobile-brand-kit');
const adminAssetsDir = path.join(__dirname, '..', 'apps', 'admin', 'assets');

// Official iOS 1024 AppIcon
const ios1024 = path.join(brandKitDir, 'ios', 'AppIcon.appiconset', 'Icon-1024.png');
// Official Android Adaptive Foreground
const androidForeground = path.join(brandKitDir, 'android', 'adaptive', 'ic_launcher_foreground.png');
// Official Full Logo
const mainLogo = path.join(__dirname, '..', 'assets', 'astrokraft_logo.png');

console.log('iOS 1024 exists:', fs.existsSync(ios1024));
console.log('Android Foreground exists:', fs.existsSync(androidForeground));
console.log('Main Logo exists:', fs.existsSync(mainLogo));

if (fs.existsSync(ios1024)) {
  fs.copyFileSync(ios1024, path.join(adminAssetsDir, 'icon.png'));
  fs.copyFileSync(ios1024, path.join(adminAssetsDir, 'splash.png'));
  console.log('Copied Icon-1024.png to icon.png and splash.png');
}

if (fs.existsSync(androidForeground)) {
  fs.copyFileSync(androidForeground, path.join(adminAssetsDir, 'adaptive-icon.png'));
  console.log('Copied ic_launcher_foreground.png to adaptive-icon.png');
}

if (fs.existsSync(mainLogo)) {
  fs.copyFileSync(mainLogo, path.join(adminAssetsDir, 'logo.png'));
  console.log('Copied astrokraft_logo.png to logo.png');
}
