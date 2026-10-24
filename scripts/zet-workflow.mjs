#!/usr/bin/env node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = process.env.ZET_WORKFLOW_ROOT
  ? resolve(process.env.ZET_WORKFLOW_ROOT)
  : resolve(__dirname, '..');
const appInfoPath = join(root, 'app_info.json');
const manifestPath = join(root, 'plugin-manifest.json');
const minimumZetVersion = '1.5.44';

const commands = new Map([
  ['init', initializeSigma],
  ['run', () => checkedZetCommand({ before: ['run', 'build'], zet: ['run'] })],
  [
    'validate',
    () => checkedZetCommand({ before: ['run', 'check'], zet: ['validate'] }),
  ],
  ['pack', () => checkedZetCommand({ before: ['run', 'check'], zet: ['pack'] })],
  ['push', pushToSigma],
  ['pull', pullFromSigma],
  ['cloud-run', () => linkedZetCommand(['cloud_run'])],
  ['cloud-stop', () => linkedZetCommand(['cloud_stop'])],
  ['login', () => runZet(['login', ...forwardedArgs])],
  ['whoami', () => runZet(['whoami', ...forwardedArgs])],
  ['workspaces', () => runZet(['list_workspace', ...forwardedArgs])],
  ['logout', () => runZet(['logout', ...forwardedArgs])],
]);

const [, , command, ...forwardedArgs] = process.argv;

async function run(commandName, args, options = {}) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(commandName, args, {
      cwd: options.cwd ?? root,
      env: process.env,
      stdio: 'inherit',
    });

    child.once('error', (error) => {
      rejectPromise(
        new Error(
          error.code === 'ENOENT'
            ? `Could not run "${commandName}". Run npm install and try again.`
            : error.message,
        ),
      );
    });
    child.once('exit', (code, signal) => {
      if (signal) {
        rejectPromise(new Error(`${commandName} stopped after signal ${signal}.`));
      } else if (code !== 0) {
        rejectPromise(
          Object.assign(new Error(`${commandName} exited with code ${code}.`), {
            exitCode: code,
          }),
        );
      } else {
        resolvePromise();
      }
    });
  });
}

function zetExecutable() {
  if (process.env.ZET_BIN) return process.env.ZET_BIN;

  const executable = process.platform === 'win32' ? 'zet.cmd' : 'zet';
  const localZet = join(root, 'node_modules', '.bin', executable);
  if (!existsSync(localZet)) {
    throw new Error(
      'The project-local ZET CLI is not installed. Run npm install and try again.',
    );
  }
  return localZet;
}

function versionParts(version) {
  return String(version)
    .split('.')
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);
}

function versionAtLeast(version, minimum) {
  const actual = versionParts(version);
  const required = versionParts(minimum);
  for (let index = 0; index < required.length; index += 1) {
    if (actual[index] > required[index]) return true;
    if (actual[index] < required[index]) return false;
  }
  return true;
}

function verifyZetVersion() {
  if (process.env.ZET_BIN) return;

  const packagePath = join(
    root,
    'node_modules',
    'zoho-extension-toolkit',
    'package.json',
  );
  if (!existsSync(packagePath)) {
    throw new Error(
      'Cannot inspect zoho-extension-toolkit. Run npm install and try again.',
    );
  }

  const { version } = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (!versionAtLeast(version, minimumZetVersion)) {
    throw new Error(
      `ZET ${version} is installed; this Backstage workflow requires the private ZET ${minimumZetVersion} or newer.`,
    );
  }
}

async function runZet(args, options) {
  verifyZetVersion();
  await run(zetExecutable(), args, options);
}

async function runNpm(args) {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  await run(npm, args);
}

function requireSigmaLink() {
  if (!existsSync(appInfoPath)) {
    throw new Error(
      'This project is not linked to Sigma. Run "npm run zet:init" first.',
    );
  }
}

async function checkedZetCommand({ before, zet }) {
  await runNpm(before);
  await runZet([...zet, ...forwardedArgs]);
}

async function linkedZetCommand(args) {
  requireSigmaLink();
  await runZet([...args, ...forwardedArgs]);
}

function findInitializedProject(tempRoot) {
  return readdirSync(tempRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(tempRoot, entry.name))
    .filter((projectPath) => existsSync(join(projectPath, 'app_info.json')));
}

async function initializeSigma() {
  if (existsSync(appInfoPath)) {
    throw new Error(
      'This project already has app_info.json and is linked to Sigma. Remove it explicitly before linking a different app.',
    );
  }

  const temporaryRoot = mkdtempSync(join(tmpdir(), 'backstage-zet-init-'));
  try {
    console.log(
      'Creating a BACKSTAGE extension in Sigma. Complete the ZET prompts; the generated scaffold will be discarded.',
    );
    await runZet(['init', ...forwardedArgs], { cwd: temporaryRoot });

    const projects = findInitializedProject(temporaryRoot);
    if (projects.length !== 1) {
      throw new Error(
        `Expected one initialized Sigma project, but found ${projects.length}. Ensure BACKSTAGE was selected and try again.`,
      );
    }

    const generatedManifest = join(projects[0], 'plugin-manifest.json');
    if (existsSync(generatedManifest)) {
      const { service } = JSON.parse(readFileSync(generatedManifest, 'utf8'));
      if (service !== 'BACKSTAGE') {
        throw new Error(
          `ZET initialized service "${service ?? 'unknown'}"; select BACKSTAGE to link this starter.`,
        );
      }
    }

    copyFileSync(join(projects[0], 'app_info.json'), appInfoPath);
    console.log('Sigma app linked. Run "npm run sigma:push" to publish this build.');
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true });
  }
}

async function pushToSigma() {
  requireSigmaLink();
  await runNpm(['run', 'check']);
  await runZet(['push', ...forwardedArgs]);
}

function requireCleanTrackedFiles() {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=no'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (result.error?.code === 'ENOENT' || result.status === 128) {
    throw new Error('Sigma pull requires this project to be inside a Git repository.');
  }
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || 'Could not inspect the Git worktree.');
  }
  if (result.stdout.trim()) {
    throw new Error(
      'Sigma pull requires a clean tracked worktree. Commit or stash local changes first.',
    );
  }
}

async function pullFromSigma() {
  requireSigmaLink();
  requireCleanTrackedFiles();

  const temporaryRoot = mkdtempSync(join(tmpdir(), 'backstage-zet-pull-'));
  const manifestBackup = join(temporaryRoot, 'plugin-manifest.json');
  copyFileSync(manifestPath, manifestBackup);

  try {
    await runZet(['pull', ...forwardedArgs]);

    const snapshotDirectory = join(root, 'dist', 'sigma-pull');
    mkdirSync(snapshotDirectory, { recursive: true });
    if (existsSync(manifestPath)) {
      copyFileSync(manifestPath, join(snapshotDirectory, 'plugin-manifest.json'));
    }
  } finally {
    copyFileSync(manifestBackup, manifestPath);
    rmSync(temporaryRoot, { force: true, recursive: true });
  }

  console.log(
    'Sigma files pulled into ignored app/. The cloud manifest snapshot is in dist/sigma-pull/; React sources were not changed.',
  );
}

function printHelp() {
  console.log(`Usage: npm run zet:<command> -- [ZET options]

Project lifecycle:
  init          Create a BACKSTAGE app in Sigma and link this starter
  run           Build, then start the ZET local server
  validate      Run project checks, then ZET validation
  pack          Run project checks, then create dist/*.zip

Sigma synchronization:
  push          Build/check and push to the linked Sigma app
  pull          Pull cloud output while preserving the local manifest
  cloud-run     Start cloud testing for the linked app
  cloud-stop    Stop cloud testing
  login         Authenticate ZET
  whoami        Show the active account and workspace
  workspaces    List or switch Sigma workspaces
  logout        End the ZET session`);
}

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    return;
  }

  const handler = commands.get(command);
  if (!handler) {
    printHelp();
    throw new Error(`Unknown workflow command "${command}".`);
  }
  await handler();
}

main().catch((error) => {
  console.error(`\nZET workflow failed: ${error.message}`);
  process.exitCode = error.exitCode || 1;
});
