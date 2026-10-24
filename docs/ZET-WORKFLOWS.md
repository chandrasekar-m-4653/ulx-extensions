# ZET and Sigma process

This guide covers initial setup, local testing, Sigma synchronization, cloud
testing, and packaging for this Backstage extension starter.

## 1. Prerequisites

Install:

- Node.js 18 or newer
- npm 9 or newer
- Access to the private npm registry containing
  `zoho-extension-toolkit` 1.5.44 or newer with BACKSTAGE support

Confirm that npm uses the required private registry, then install dependencies:

```bash
npm config get registry
npm install
```

Show all available project workflows:

```bash
npm run zet
```

## 2. Authenticate with Sigma

### What login does

Login authenticates the ZET CLI with your Zoho account. It does not create an
extension and does not generate `app_info.json`.

The three setup stages are separate:

1. `sigma:login` authenticates your Zoho account.
2. `sigma:workspaces` selects the Sigma workspace.
3. `zet:init` creates and links the BACKSTAGE extension.

### Start login

Run:

```bash
npm run sigma:login
```

The project workflow first verifies that the project-local private
`zoho-extension-toolkit` is version 1.5.44 or newer. It then invokes:

```bash
zet login
```

Do not run the command with `sudo`. ZET stores the session for the current
operating-system user.

### Complete the terminal prompt

ZET may ask whether it can collect usage or diagnostic information. Choose the
option required by your organization's policy. This choice does not select a
Sigma workspace.

If a valid ZET session already exists, the CLI normally reports the logged-in
email address and skips browser authentication.

To deliberately replace the existing session, run:

```bash
npm run sigma:login -- --force
```

### Complete browser authorization

For a new login, ZET normally:

1. Starts a temporary callback server on an available localhost port from
   `9005` through `9009`.
2. Prints a Zoho Accounts authorization URL.
3. Opens that URL in the default browser.
4. Asks you to sign in to Zoho and approve the requested Sigma/ZET scopes.
5. Redirects the browser to the temporary localhost callback.
6. Exchanges the authorization code for the CLI session.
7. Reads the authenticated user's details and closes the callback server.

Use the Zoho account that has access to the required Sigma workspace. If the
browser is already signed in with another Zoho account, switch accounts before
approving access.

The account data center must match the account being used. For example, an
account hosted in a regional Zoho data center must complete authorization
through that region's Zoho Accounts endpoint. Follow any regional URL
instructions printed by the private ZET CLI.

If ZET cannot start its localhost callback server, supported toolkit builds may
fall back to device authorization. In that flow:

1. ZET prints a verification URL and one-time code.
2. Open the URL in a browser.
3. Sign in and enter the code.
4. Return to the terminal while ZET waits for approval.

Do not close the terminal until ZET reports that login completed.

### Where the login is stored

ZET stores the authenticated user, granted scopes, and protected OAuth
credentials in its user-level configuration store outside this repository.
They are not written to `plugin-manifest.json` or `app_info.json`.

The files have different purposes:

- ZET credentials identify the logged-in Zoho user.
- The selected workspace identifies where Sigma commands operate.
- `app_info.json` links this local project to one specific Sigma extension.

Never copy OAuth credentials into the project or commit them to Git.

### Verify login

Confirm the active account:

```bash
npm run sigma:whoami
npm run sigma:workspaces
```

`sigma:whoami` should display the expected Zoho email address. After a workspace
has been selected, it should also show the workspace.

`sigma:workspaces` lists the workspaces available to the authenticated account
and allows the private CLI to set the active workspace. Select the workspace
that should own the BACKSTAGE extension.

Only continue to `npm run zet:init` after both the account and workspace are
correct.

### Login troubleshooting

If the browser does not open, copy the authorization URL printed in the
terminal and open it manually.

If the browser cannot reach the localhost callback:

1. Keep the terminal command running.
2. Check whether security software, a firewall, VPN, or another process blocks
   localhost ports `9005` through `9009`.
3. Retry after freeing those ports.
4. Use the device flow if the private ZET build offers it.

If the wrong account is active:

```bash
npm run sigma:logout
npm run sigma:login -- --force
```

If login succeeds but no workspace is available, verify that the account has
been added to the required Sigma workspace. This is an account permission
issue, not a project-linking issue.

If later Sigma commands report an expired session, authenticate again:

```bash
npm run sigma:login -- --force
npm run sigma:whoami
```

## 3. Initialize and link the extension

Run:

```bash
npm run zet:init
```

When prompted:

1. Select the required Sigma workspace.
2. Select `BACKSTAGE` as the Zoho service.
3. Enter the extension name and requested details.
4. Wait for initialization to finish.

The workflow creates the Sigma project in a temporary directory and copies only
its encrypted `app_info.json` link into this project. The generated scaffold is
discarded, so the existing React application and `plugin-manifest.json` remain
unchanged.

Do not commit or share `app_info.json`. It is ignored by Git.

If the project is already linked, `zet:init` stops instead of replacing the
existing link.

## 4. Develop locally

Start the Vite source-development server:

```bash
npm start
```

Use this while editing files under `src/`. The local preview displays fallback
data when it is not running inside the Backstage host.

To build and run the packaged extension through ZET:

```bash
npm run zet:run
```

This performs:

```text
npm run build
zet run
```

ZET normally serves the extension on its configured local development port.

## 5. Validate

Run project validation and a production build:

```bash
npm run check
```

Run those checks followed by the private ZET validator:

```bash
npm run zet:validate
```

Fix all reported errors before pushing or packaging.

## 6. Push changes to Sigma

Run:

```bash
npm run sigma:push
```

The command executes this guarded sequence:

```text
validate local manifest and SDK usage
    ↓
build src/ into app/widget/
    ↓
zet push
```

The push requires a valid `app_info.json` created by `npm run zet:init`.

## 7. Test in Sigma cloud

After pushing, start cloud testing:

```bash
npm run sigma:cloud:run
```

Test the extension in the relevant Backstage location.

Stop the cloud session when finished:

```bash
npm run sigma:cloud:stop
```

When code changes, repeat:

```bash
npm run sigma:push
npm run sigma:cloud:run
```

## 8. Pull from Sigma

Pull only when you need to inspect the package currently stored in Sigma:

```bash
npm run sigma:pull
```

Safety behavior:

- The tracked Git worktree must be clean.
- Downloaded compiled files are written under ignored `app/`.
- The cloud manifest is saved to
  `dist/sigma-pull/plugin-manifest.json`.
- The local tracked `plugin-manifest.json` is restored after the pull.
- React source files under `src/` are not modified.

A Sigma pull cannot recreate React source from compiled assets. Continue making
source changes in `src/` and treat this repository as the source of truth.

## 9. Create an uploadable ZIP

Run:

```bash
npm run pack
```

This performs:

```text
npm run check
zet pack
```

The uploadable ZIP is created under `dist/`.

`npm run zet:pack` is an equivalent explicit command.

## 10. End the session

Stop cloud testing if it is running:

```bash
npm run sigma:cloud:stop
```

Log out:

```bash
npm run sigma:logout
```

## Daily workflow

For normal development:

```bash
npm start
```

When ready to test in Sigma:

```bash
npm run sigma:push
npm run sigma:cloud:run
```

When ready to create the final package:

```bash
npm run pack
```

## Troubleshooting

### Private ZET package cannot be installed

Check the registry:

```bash
npm config get registry
```

The public npm package does not provide the required private BACKSTAGE workflow.
Configure the organization registry before running `npm install`.

### Project is not linked to Sigma

Run:

```bash
npm run sigma:login
npm run sigma:workspaces
npm run zet:init
```

### Wrong Sigma account or workspace

Check and switch:

```bash
npm run sigma:whoami
npm run sigma:workspaces
```

### Pull refuses to run

Commit or stash tracked changes, then retry:

```bash
git status
npm run sigma:pull
```

### ZET version is rejected

This project requires the private `zoho-extension-toolkit` version 1.5.44 or
newer. Reconfigure the private registry and reinstall dependencies.

