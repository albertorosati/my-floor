import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

/**
 * Calculates the automated incremental version.
 * Baseline: Commit 6 introduces this automated versioning system as v1.0.0.
 * Every subsequent commit / push increments the patch number (1.0.1, 1.0.2, ...).
 */
export function getAutoVersion() {
  if (process.env.VITE_APP_VERSION) {
    return process.env.VITE_APP_VERSION;
  }
  try {
    const stdout = execSync('git rev-list --count HEAD', {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    const count = parseInt(stdout, 10);
    if (!isNaN(count)) {
      const BASELINE_COMMIT_COUNT = 6;
      const patch = Math.max(0, count - BASELINE_COMMIT_COUNT);
      return `1.0.${patch}`;
    }
  } catch {
    // Git unavailable or shallow clone fallback
  }
  return '1.0.0';
}

if (process.argv[1] === __filename) {
  const version = getAutoVersion();
  console.log(`Version: ${version}`);

  if (process.argv.includes('--sync-pkg')) {
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.version !== version) {
      pkg.version = version;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`Updated package.json to ${version}`);
    }
  }
}
