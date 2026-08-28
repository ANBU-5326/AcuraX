const fs = require('fs');
const path = require('path');

const targets = [
  path.join(__dirname, '../src/app/(dashboard)'),
  path.join(__dirname, '../src/app/(auth)')
];

targets.forEach((target) => {
  if (fs.existsSync(target)) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      console.log(`[prebuild] Removed redundant directory: ${target}`);
    } catch (err) {
      console.error(`[prebuild] Could not remove directory ${target}:`, err);
    }
  }
});
