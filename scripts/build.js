const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Building frontend...');
  // Use npm run build --workspace=frontend
  execSync('npm run build --workspace=frontend', { stdio: 'inherit' });

  const distDir = path.join(process.cwd(), 'frontend', 'dist');
  const publicDir = path.join(process.cwd(), 'public');

  console.log(`Moving build artifacts from ${distDir} to ${publicDir}...`);

  if (fs.existsSync(publicDir)) {
    console.log('Removing existing public directory...');
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  if (fs.existsSync(distDir)) {
    fs.renameSync(distDir, publicDir);
    console.log('✅ Build artifacts moved successfully!');
  } else {
    console.error('❌ Error: frontend/dist directory not found!');
    process.exit(1);
  }

  console.log('✨ Build process finished successfully!');
} catch (error) {
  console.error('❌ Build script failed:', error.message);
  process.exit(1);
}
