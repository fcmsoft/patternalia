/**
 * Run this script once to create the app folder structure and install dependencies.
 * Usage: node setup.mjs
 */
import { mkdirSync } from 'fs';
import { execSync } from 'child_process';

const dirs = [
  'src/environments',
  'src/app/core/models',
  'src/app/core/auth',
  'src/app/core/guards',
  'src/app/core/interceptors',
  'src/app/features/auth/pages/login',
  'src/app/features/auth/pages/register',
  'src/app/features/auth/pages/confirm',
  'src/app/features/auth/pages/forgot-password',
  'src/app/features/categories/pages/categories',
  'src/app/features/patterns/pages/patterns-list',
  'src/app/features/patterns/pages/pattern-upload',
  'src/app/features/patterns/pages/pattern-detail',
  'src/app/features/patterns/pages/pattern-edit',
  'src/app/shared/components/pdf-viewer',
  'src/app/shared/components/confirm-dialog',
  'src/app/shared/components/empty-state',
  'src/app/shared/components/shell',
  'src/app/shared/services',
];

console.log('Creating directory structure...');
for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
  console.log(`  ✓ ${dir}`);
}

console.log('\nInstalling dependencies...');
execSync('pnpm install', { stdio: 'inherit' });

console.log('\n✅ Setup complete!');
