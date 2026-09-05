/**
 * One command from a local repository to a running site.
 *
 *   npm run deploy
 *
 * 1. Authorises with GitHub through the device flow (you approve a code in the
 *    browser — no token is ever typed into a chat or a file), or reuses
 *    .secrets/github-token.txt if you prefer a personal access token.
 * 2. Creates the repository (public, so Render can read it without OAuth) and
 *    pushes `main`.
 * 3. If .secrets/render-api-key.txt exists, creates the Render web service from
 *    render.yaml's settings and waits until the first deploy is live.
 *
 * Secrets are read from .secrets/ (git-ignored) and never printed.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PROJECT = process.cwd();
const SECRETS = path.join(PROJECT, ".secrets");
const REPO_NAME = process.env.REPO_NAME || "walko-wallnuts";
const SERVICE_NAME = process.env.SERVICE_NAME || "walko-wallnuts";
// Public client id of the GitHub CLI: the device flow needs no client secret.
const DEVICE_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "178c6fc778ccc68e1d6a";

fs.mkdirSync(SECRETS, { recursive: true });

function readSecret(file) {
  const full = path.join(SECRETS, file);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8").trim() || null;
}

function git(args) {
  return execFileSync("git", args, { cwd: PROJECT, encoding: "utf8" }).trim();
}

async function api(url, { token, method = "GET", body, kind = "github" } = {}) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (kind === "github") headers["X-GitHub-Api-Version"] = "2022-11-28";
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function tokenIsValid(token) {
  if (!token) return false;
  const me = await api("https://api.github.com/user", { token });
  return me.ok ? me.data.login : false;
}

/** GitHub device flow: prints a code, waits for the approval, returns a token. */
async function deviceFlow() {
  const start = await api("https://github.com/login/device/code", {
    method: "POST",
    body: { client_id: DEVICE_CLIENT_ID, scope: "repo" },
  });
  if (!start.ok) throw new Error(`device code request failed: ${start.status}`);
  const { device_code, user_code, verification_uri, interval = 5, expires_in = 900 } = start.data;

  console.log("\n──────────────────────────────────────────────");
  console.log(`  1. Open:  ${verification_uri}`);
  console.log(`  2. Code:  ${user_code}`);
  console.log("  3. Approve access for this machine.");
  console.log(`  (the code is valid for ${Math.round(expires_in / 60)} minutes)`);
  console.log("──────────────────────────────────────────────\n");

  const deadline = Date.now() + expires_in * 1000;
  let wait = interval * 1000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, wait));
    const poll = await api("https://github.com/login/oauth/access_token", {
      method: "POST",
      body: { client_id: DEVICE_CLIENT_ID, device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" },
    });
    const data = poll.data || {};
    if (data.access_token) return data.access_token;
    if (data.error === "authorization_pending") continue;
    if (data.error === "slow_down") {
      wait += 5000;
      continue;
    }
    throw new Error(`authorisation failed: ${data.error_description || data.error}`);
  }
  throw new Error("the code expired before it was approved");
}

/* ------------------------------------------------------------------ GitHub */

let token = readSecret("github-token.txt");
let login = await tokenIsValid(token);
if (!login) {
  if (token) console.log("The stored token is not valid any more — starting the device authorisation.");
  token = await deviceFlow();
  fs.writeFileSync(path.join(SECRETS, "github-token.txt"), token);
  login = await tokenIsValid(token);
}
console.log(`GitHub: authorised as ${login}`);

let repo = await api(`https://api.github.com/repos/${login}/${REPO_NAME}`, { token });
if (repo.status === 404) {
  repo = await api("https://api.github.com/user/repos", {
    token,
    method: "POST",
    body: {
      name: REPO_NAME,
      description: "Walko Wallnuts — bilingual (EN/DE) walnut tree ownership platform",
      private: false,
      has_wiki: false,
      auto_init: false,
    },
  });
  if (!repo.ok) throw new Error(`repository creation failed: ${repo.status} ${repo.data?.message}`);
  console.log(`Repository created: ${repo.data.html_url}`);
} else if (repo.ok) {
  console.log(`Repository already exists: ${repo.data.html_url}`);
} else {
  throw new Error(`GitHub error ${repo.status}: ${repo.data?.message}`);
}

const cloneUrl = repo.data.clone_url;
try {
  const remotes = git(["remote"]).split("\n").filter(Boolean);
  if (remotes.includes("origin")) git(["remote", "set-url", "origin", cloneUrl]);
  else git(["remote", "add", "origin", cloneUrl]);
  git(["push", "--quiet", cloneUrl.replace("https://", `https://${login}:${token}@`), "main:main"]);
  console.log(`Pushed main → ${repo.data.html_url}`);
} catch (error) {
  throw new Error(String(error.stderr || error.message).replaceAll(token, "***"));
}

/* ------------------------------------------------------------------ Render */

const renderKey = readSecret("render-api-key.txt");
if (!renderKey) {
  console.log("\nNo Render API key in .secrets/render-api-key.txt.");
  console.log("Finish in the dashboard: New → Blueprint → pick the repository → Apply.");
  process.exit(0);
}

const owners = await api("https://api.render.com/v1/owners?limit=20", { token: renderKey, kind: "render" });
if (!owners.ok) throw new Error(`Render key rejected: ${owners.status}`);
const ownerId = owners.data[0]?.owner?.id;
console.log(`Render: ${owners.data[0]?.owner?.name}`);

const found = await api(`https://api.render.com/v1/services?name=${SERVICE_NAME}&limit=5`, {
  token: renderKey,
  kind: "render",
});
let service = found.ok ? found.data.find((s) => s.service?.name === SERVICE_NAME)?.service : null;

if (!service) {
  const created = await api("https://api.render.com/v1/services", {
    token: renderKey,
    kind: "render",
    method: "POST",
    body: {
      type: "web_service",
      name: SERVICE_NAME,
      ownerId,
      repo: repo.data.html_url,
      branch: "main",
      autoDeploy: "yes",
      serviceDetails: {
        env: "node",
        region: "frankfurt",
        plan: "starter",
        healthCheckPath: "/api/health",
        envSpecificDetails: { buildCommand: "npm ci && npm run build", startCommand: "npm run start" },
      },
      envVars: [
        { key: "NODE_VERSION", value: "22" },
        { key: "NODE_ENV", value: "production" },
        { key: "SESSION_SECRET", generateValue: true },
      ],
    },
  });
  if (!created.ok) throw new Error(`Render service creation failed: ${created.status} ${JSON.stringify(created.data).slice(0, 300)}`);
  service = created.data.service ?? created.data;
  console.log(`Service created: ${service.dashboardUrl ?? service.id}`);
} else {
  console.log(`Service exists: ${service.dashboardUrl ?? service.id}`);
  await api(`https://api.render.com/v1/services/${service.id}/deploys`, {
    token: renderKey,
    kind: "render",
    method: "POST",
    body: {},
  });
}

for (let i = 0; i < 80; i++) {
  await new Promise((r) => setTimeout(r, 15000));
  const deploys = await api(`https://api.render.com/v1/services/${service.id}/deploys?limit=1`, {
    token: renderKey,
    kind: "render",
  });
  const status = deploys.data?.[0]?.deploy?.status;
  console.log(`  deploy: ${status}`);
  if (["live", "build_failed", "update_failed", "canceled", "deactivated"].includes(status)) {
    const detail = await api(`https://api.render.com/v1/services/${service.id}`, { token: renderKey, kind: "render" });
    console.log(`\nLive URL: ${detail.data?.serviceDetails?.url ?? "(see dashboard)"}`);
    break;
  }
}
