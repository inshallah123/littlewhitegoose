const fs = require('fs');
const path = require('path');

// 确保electron相关文件被复制到build目录
const filesToCopy = [
  'electron.js',
  'preload.js',
  'database-service.js'
];

const srcDir = path.join(__dirname, '../public');
const destDir = path.join(__dirname, '../build');

// 确保build目录存在
if (!fs.existsSync(destDir)) {
  console.error('Build directory does not exist. Please run "npm run build" first.');
  process.exit(1);
}

// 复制文件
filesToCopy.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(destDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${file} to build directory`);
  } else {
    console.warn(`Warning: ${file} not found in public directory`);
  }
});

// 复制assets目录
const assetsSource = path.join(srcDir, 'assets');
const assetsDest = path.join(destDir, 'assets');

if (fs.existsSync(assetsSource)) {
  if (!fs.existsSync(assetsDest)) {
    fs.mkdirSync(assetsDest, { recursive: true });
  }
  
  fs.readdirSync(assetsSource).forEach(file => {
    fs.copyFileSync(
      path.join(assetsSource, file),
      path.join(assetsDest, file)
    );
  });
  console.log('Copied assets directory to build');
}

console.log('Post-build script completed successfully');