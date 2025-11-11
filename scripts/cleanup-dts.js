const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
  process.exit(0);
}

const files = fs.readdirSync(distDir);
files
  .filter(file => file.endsWith('.d.mts'))
  .forEach(file => {
    fs.unlinkSync(path.join(distDir, file));
    console.log(`Removed ${file}`);
  });
