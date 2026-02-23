import { parseArgs } from "node:util";
import { join, resolve } from "node:path";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { execSync, spawnSync } from "node:child_process";

const { values } = parseArgs({
  options: {
    question: { type: "string" },
    package: { type: "string" },
    "cache-dir": { type: "string", default: "./.package-cache" },
  },
});

if (!values.package || !values.question) {
  console.error("Error: --question and --package are required");
  process.exit(1);
}

const cacheDir = resolve(process.cwd(), values["cache-dir"] ?? "./.package-cache");
const pkg = values.package;
const questionAsked = values.question;

const versionSeparator = pkg.lastIndexOf("@");
if (versionSeparator <= 0) {
  console.error("Error: --package must be in the form <name@version>");
  process.exit(1);
}

const pkgName = pkg.slice(0, versionSeparator);
const pkgVersion = pkg.slice(versionSeparator + 1);

if (!pkgName || !pkgVersion) {
  console.error("Error: --package must be in the form <name@version>");
  process.exit(1);
}

const packageDir = join(cacheDir, pkgName, pkgVersion);
mkdirSync(join(cacheDir, pkgName), { recursive: true });

function shellQuote(value) {
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function parseNpmJson(output) {
  const trimmed = output.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function normalizeRepositoryUrl(repository) {
  let url = repository.trim();

  if (url.startsWith("github:")) {
    url = `https://github.com/${url.slice("github:".length)}`;
  }

  if (url.startsWith("git+")) {
    url = url.slice("git+".length);
  }

  if (url.startsWith("git://")) {
    url = `https://${url.slice("git://".length)}`;
  }

  return url;
}

function resolveRepositoryUrl(packageSpecifier) {
  const repoUrlRaw = execSync(
    `npm view ${shellQuote(packageSpecifier)} repository.url --json`,
    { encoding: "utf8" },
  );

  const repoUrlValue = parseNpmJson(repoUrlRaw);
  if (typeof repoUrlValue === "string" && repoUrlValue !== "null") {
    return normalizeRepositoryUrl(repoUrlValue);
  }

  const repoRaw = execSync(
    `npm view ${shellQuote(packageSpecifier)} repository --json`,
    { encoding: "utf8" },
  );

  const repoValue = parseNpmJson(repoRaw);
  if (typeof repoValue === "string" && repoValue !== "null") {
    return normalizeRepositoryUrl(repoValue);
  }

  if (repoValue && typeof repoValue === "object" && "url" in repoValue) {
    const url = repoValue.url;
    if (typeof url === "string") {
      return normalizeRepositoryUrl(url);
    }
  }

  throw new Error(`Unable to resolve repository URL for ${packageSpecifier}`);
}

if (!existsSync(join(packageDir, ".git"))) {
  const repositoryUrl = resolveRepositoryUrl(pkg);
  console.log(`Cloning ${repositoryUrl}...`);

  if (existsSync(packageDir)) {
    rmSync(packageDir, { recursive: true, force: true });
  }

  execSync(
    `git clone --depth 1 ${shellQuote(repositoryUrl)} ${shellQuote(packageDir)}`,
    { stdio: "inherit" },
  );
}

const systemPrompt = [
  "---SystemPrompt---",
  "You are an agent to help me answer the following question.",
  "",
  `This is the codebase of the package ${pkg}. be sure to check if \"examples\" directory exist in this codebase.`,
  "If examples exists that is a good resources to find your answer",
  "Only give me the answer and nothing else.",
  "---",
  "QUESTION:",
];

const question = `${systemPrompt.join("\n")}\n\n${questionAsked}`;

function stripTerminalCodes(text) {
  return text
    .replace(/\u001b\[[^m]*m|\u001b\[\?[0-9;]*[a-zA-Z]|\u001b\[[0-9;]*[a-zA-Z]/g, "")
    .replace(/\r[^\n]*/g, "");
}

const result = spawnSync(
  "kiro-cli",
  [
    "chat",
    "--trust-tools=code,read,write,introspect,subagent",
    "--no-interactive",
    "--",
    question,
  ],
  {
    cwd: packageDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

const combinedOutput = `${result.stdout ?? ""}${result.stderr ?? ""}`.trim();
if (combinedOutput) {
  console.log(stripTerminalCodes(combinedOutput));
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

if (typeof result.status === "number" && result.status !== 0) {
  if (!combinedOutput) {
    process.exit(result.status);
  }

  console.error(`kiro-cli exited with code ${result.status} after producing output`);
}
