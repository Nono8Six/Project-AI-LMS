#!/usr/bin/env node
import { execSync } from 'node:child_process';

const port = parseInt(process.argv[2] || '3000', 10);
if (!Number.isInteger(port)) {
  console.error('Usage: node scripts/port-free.mjs <port>');
  process.exit(1);
}

try {
  if (process.platform === 'win32') {
    const cmd = `powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"`;
    execSync(cmd, { stdio: 'ignore' });
  } else {
    // unix-like
    try {
      const pids = execSync(`lsof -ti :${port} -sTCP:LISTEN`, { encoding: 'utf-8' })
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const pid of pids) {
        execSync(`kill -9 ${pid}`);
      }
    } catch (_) {
      // fallback
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
  }
  console.log(`Freed port ${port}`);
} catch (e) {
  console.error(`Unable to free port ${port}:`, e.message);
  process.exit(1);
}

