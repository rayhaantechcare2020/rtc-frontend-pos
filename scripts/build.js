// scripts/build.js
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

async function cleanDist() {
  const distPath = path.join(__dirname, '..', 'dist');
  try {
    await fs.rm(distPath, { recursive: true, force: true });
    console.log('✅ Removed existing dist folder');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error removing dist folder:', error);
    }
  }
}

async function ensureDirectories() {
  const dirs = [
    'dist',
    'dist/assets',
    'dist/reports',
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(path.join(__dirname, '..', dir), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

async function createBuildInfo() {
  const buildInfo = {
    version: packageJson.version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production',
    commitHash: process.env.GITHUB_SHA || 'unknown',
  };
  
  const buildInfoPath = path.join(__dirname, '..', 'dist', 'build-info.json');
  await fs.writeFile(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  console.log('✅ Build info created');
}

async function createRobotsTxt() {
  const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${process.env.VITE_API_URL}/sitemap.xml
`;
  
  const robotsPath = path.join(__dirname, '..', 'dist', 'robots.txt');
  await fs.writeFile(robotsPath, robotsTxt);
  console.log('✅ robots.txt created');
}

async function createManifest() {
  const manifest = {
    name: "POS System",
    short_name: "POS",
    description: "Point of Sale System with Multi-user Support",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#3b82f6",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
  
  const manifestPath = path.join(__dirname, '..', 'dist', 'manifest.json');
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('✅ manifest.json created');
}

async function build() {
  console.log('\n🚀 Starting Production Build...\n');
  console.log(`📦 Building version: ${packageJson.version}`);
  console.log(`🕐 Build time: ${new Date().toLocaleString()}\n`);
  
  // Clean dist folder
  await cleanDist();
  await ensureDirectories();
  
  // Run build
  const buildProcess = exec('npm run build:prod', { 
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  buildProcess.stdout.on('data', (data) => {
    console.log(data);
  });
  
  buildProcess.stderr.on('data', (data) => {
    console.error(data);
  });
  
  buildProcess.on('close', async (code) => {
    if (code === 0) {
      console.log('\n✅ Build completed successfully!');
      await createBuildInfo();
      await createRobotsTxt();
      await createManifest();
      await analyzeBuild();
      await createDeploymentPackage();
    } else {
      console.error(`\n❌ Build failed with code ${code}`);
      process.exit(1);
    }
  });
}

async function analyzeBuild() {
  const distPath = path.join(__dirname, '..', 'dist');
  const assetsPath = path.join(distPath, 'assets');
  
  try {
    const files = await fs.readdir(assetsPath);
    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    
    let totalSize = 0;
    const fileSizes = [];
    
    for (const file of [...jsFiles, ...cssFiles]) {
      const filePath = path.join(assetsPath, file);
      const stats = await fs.stat(filePath);
      const sizeInKB = (stats.size / 1024).toFixed(2);
      totalSize += stats.size;
      fileSizes.push({ name: file, size: sizeInKB });
    }
    
    fileSizes.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));
    
    console.log('\n📊 Build Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📁 Top 10 files by size:');
    fileSizes.slice(0, 10).forEach(file => {
      console.log(`  ${file.name}: ${file.size} KB`);
    });
    
    console.log(`\n💾 Total build size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`📦 Number of JS files: ${jsFiles.length}`);
    console.log(`🎨 Number of CSS files: ${cssFiles.length}`);
    
    // Check if stats.html was generated
    const statsPath = path.join(distPath, 'stats.html');
    try {
      await fs.access(statsPath);
      console.log('\n📈 Detailed analysis available at: dist/stats.html');
    } catch (error) {
      // Stats file not generated
    }
    
  } catch (error) {
    console.error('Error analyzing build:', error);
  }
}

async function createDeploymentPackage() {
  const distPath = path.join(__dirname, '..', 'dist');
  const deployPath = path.join(__dirname, '..', 'deploy');
  
  try {
    // Create deploy directory
    await fs.mkdir(deployPath, { recursive: true });
    
    // Copy dist to deploy
    await fs.cp(distPath, path.join(deployPath, 'dist'), { recursive: true });
    
    // Create deployment instructions
    const deployInstructions = `# Deployment Package for POS System

## Version: ${packageJson.version}
## Build Date: ${new Date().toISOString()}

## Deployment Instructions

### Option 1: Deploy to Netlify
1. Drag and drop the 'dist' folder to Netlify
2. Or run: npm run deploy:netlify

### Option 2: Deploy to Vercel
1. Run: npm run deploy:vercel

### Option 3: Deploy to Apache/Nginx
1. Copy the contents of 'dist' folder to your web server
2. Configure web server to serve index.html for all routes

### Environment Variables Required:
- VITE_API_URL: Your backend API URL
- VITE_APP_NAME: Application name
- VITE_SESSION_TIMEOUT: Session timeout in seconds
- VITE_MAX_CONCURRENT_SESSIONS: Maximum concurrent sessions per user

### Post-Deployment Checklist:
- [ ] Verify API connection
- [ ] Test login with different roles
- [ ] Check module access based on roles
- [ ] Verify print functionality
- [ ] Test on different browsers
- [ ] Check responsive design
- [ ] Verify session timeout
- [ ] Test concurrent user access

### Support:
For issues, contact: support@yourcompany.com
`;
    
    await fs.writeFile(path.join(deployPath, 'DEPLOY.md'), deployInstructions);
    console.log('\n📦 Deployment package created in "deploy" folder');
    
    // Create zip file
    const archiver = (await import('archiver')).default;
    const output = fs.createWriteStream(path.join(deployPath, 'deploy.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`✅ Deployment package zipped: ${(archive.pointer() / 1024).toFixed(2)} KB`);
    });
    
    archive.pipe(output);
    archive.directory(path.join(deployPath, 'dist'), 'dist');
    archive.file(path.join(deployPath, 'DEPLOY.md'), { name: 'DEPLOY.md' });
    await archive.finalize();
    
  } catch (error) {
    console.error('Error creating deployment package:', error);
  }
}

// Run build
build();