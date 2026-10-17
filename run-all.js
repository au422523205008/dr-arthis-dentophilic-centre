const { spawn } = require('child_process');
const path = require('path');

console.log('================================================================');
console.log("🦷 Dr. Arthi's Dentophilic Centre - Dual System Orchestrator");
console.log('================================================================');
console.log('Starting all 4 systems concurrently:');
console.log('  1. Website API        -> http://localhost:5000');
console.log('  2. Website Frontend   -> http://localhost:5173');
console.log('  3. Management API     -> http://localhost:5001');
console.log('  4. Management Portal  -> http://localhost:3000');
console.log('================================================================\n');

const processes = [
  {
    name: '[Web API :5000]',
    cwd: path.resolve(__dirname, 'dentophilic-website/server'),
    command: 'node',
    args: ['server.js'],
    color: '\x1b[36m' // Cyan
  },
  {
    name: '[Web Client :5173]',
    cwd: path.resolve(__dirname, 'dentophilic-website/client'),
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev', '--', '--port', '5173', '--host'],
    color: '\x1b[35m' // Magenta
  },
  {
    name: '[Mgmt API :5001]',
    cwd: path.resolve(__dirname, 'dentophilic-management/server'),
    command: 'node',
    args: ['server.js'],
    color: '\x1b[32m' // Green
  },
  {
    name: '[Mgmt Client :3000]',
    cwd: path.resolve(__dirname, 'dentophilic-management/client'),
    command: process.platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', 'dev', '--', '--port', '3000', '--host'],
    color: '\x1b[33m' // Yellow
  }
];

const children = [];

processes.forEach(proc => {
  const child = spawn(proc.command, proc.args, {
    cwd: proc.cwd,
    shell: true,
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  child.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${proc.color}${proc.name}\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${proc.color}${proc.name}\x1b[0m \x1b[31m${line}\x1b[0m`);
      }
    });
  });

  child.on('close', code => {
    console.log(`${proc.color}${proc.name}\x1b[0m exited with code ${code}`);
  });

  children.push(child);
});

// Clean shutdown handler
process.on('SIGINT', () => {
  console.log('\nShutting down all servers...');
  children.forEach(c => c.kill());
  process.exit(0);
});

process.on('SIGTERM', () => {
  children.forEach(c => c.kill());
  process.exit(0);
});
