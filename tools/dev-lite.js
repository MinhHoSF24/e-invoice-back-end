#!/usr/bin/env node

const { spawn } = require('child_process');

const SERVICES = ['bff', 'einvoice-backend', 'authorizer', 'user-access', 'product', 'media', 'pdf-generator', 'mail'];

const ALIASES = {
  api: 'bff',
  invoice: 'einvoice-backend',
  backend: 'einvoice-backend',
  auth: 'authorizer',
  user: 'user-access',
  users: 'user-access',
  pdf: 'pdf-generator',
};

const PRESETS = {
  invoice: ['einvoice-backend', 'pdf-generator', 'media'],
  gateway: ['bff', 'einvoice-backend', 'authorizer', 'user-access'],
  catalog: ['bff', 'product'],
  notification: ['einvoice-backend', 'mail'],
};

const args = process.argv.slice(2);
const inspectEnabled = args.includes('--inspect');
const lokiEnabled = args.includes('--loki');
const serviceArgs = args.filter((arg) => !['--inspect', '--loki'].includes(arg));

if (serviceArgs.length === 0 || serviceArgs.includes('--help') || serviceArgs.includes('-h')) {
  printHelp();
  process.exit(0);
}

const selected = resolveServices(serviceArgs);

if (selected.errors.length > 0) {
  console.error(`Unknown service or preset: ${selected.errors.join(', ')}`);
  console.error(`Available services: ${SERVICES.join(', ')}`);
  console.error(`Available presets: ${Object.keys(PRESETS).join(', ')}`);
  process.exit(1);
}

const projects = [...new Set(selected.services)];

if (projects.length === 0) {
  console.error('No services selected.');
  process.exit(1);
}

console.log(`Starting services: ${projects.join(', ')}`);

const nxArgs = ['nx', 'run-many', '-t', 'serve', '--projects', projects.join(','), '--parallel'];

if (!inspectEnabled) {
  nxArgs.push('--inspect=false');
}

const child = spawnPackageManager(nxArgs);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function resolveServices(values) {
  const services = [];
  const errors = [];

  values
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      if (PRESETS[value]) {
        services.push(...PRESETS[value]);
        return;
      }

      const service = ALIASES[value] ?? value;

      if (SERVICES.includes(service)) {
        services.push(service);
        return;
      }

      errors.push(value);
    });

  return { services, errors };
}

function spawnPackageManager(args) {
  const env = {
    ...process.env,
    ENABLE_LOKI_PUSH: lokiEnabled ? (process.env.ENABLE_LOKI_PUSH ?? 'true') : 'false',
  };

  if (process.platform === 'win32') {
    return spawn('cmd.exe', ['/d', '/s', '/c', ['pnpm', ...args].join(' ')], {
      stdio: 'inherit',
      shell: false,
      env,
    });
  }

  return spawn('pnpm', args, {
    stdio: 'inherit',
    shell: false,
    env,
  });
}

function printHelp() {
  console.log(`dev-lite

Start only selected Nx services instead of the whole workspace.

Usage:
  pnpm dev:lite <service...>
  pnpm dev:lite <preset>
  pnpm dev:lite <service...> --inspect
  pnpm dev:lite <service...> --loki

Examples:
  pnpm dev:lite bff einvoice-backend
  pnpm dev:lite invoice
  pnpm dev:lite api,invoice,pdf,media

Notes:
  Inspector is disabled by default to avoid every service fighting for port 9229.
  Pass --inspect only when starting a single service you want to debug.
  Loki push is disabled by default for local lite runs. Pass --loki if Loki is running.

Services:
  ${SERVICES.join(', ')}

Aliases:
  ${Object.entries(ALIASES)
    .map(([alias, service]) => `${alias}=${service}`)
    .join(', ')}

Presets:
  ${Object.entries(PRESETS)
    .map(([name, services]) => `${name}=[${services.join(', ')}]`)
    .join('\n  ')}
`);
}
