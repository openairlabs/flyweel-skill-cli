#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const SKILLS_DIR = join(homedir(), ".claude", "skills");
const ORG = "openairlabs";
const BASE_URL = `https://github.com/${ORG}`;

const SKILLS = {
  "flyweel-mcp-deep-ad-analysis": {
    description: "Analyse Google Ads and Meta Ads with the Flyweel MCP server",
  },
  "ad-performance-analyser-flyweel": {
    description:
      "Analyse ad spend across Google, Meta, LinkedIn, and TikTok from any data source",
  },
};

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function banner() {
  console.log();
  console.log(`${BOLD}  flyweel skill installer${RESET}`);
  console.log(`${DIM}  https://flyweel.co${RESET}`);
  console.log();
}

function listSkills() {
  banner();
  console.log(`${BOLD}Available skills:${RESET}`);
  console.log();
  for (const [name, info] of Object.entries(SKILLS)) {
    console.log(`  ${CYAN}${name}${RESET}`);
    console.log(`  ${DIM}${info.description}${RESET}`);
    console.log();
  }
  console.log(`${DIM}Usage: npx @flyweel/skill install <skill-name>${RESET}`);
  console.log(`${DIM}       npx @flyweel/skill install --all${RESET}`);
  console.log();
}

function installSkill(name) {
  if (!SKILLS[name]) {
    console.log(`${RED}Unknown skill: ${name}${RESET}`);
    console.log();
    console.log(`Available skills: ${Object.keys(SKILLS).join(", ")}`);
    process.exit(1);
  }

  const targetDir = join(SKILLS_DIR, name);

  if (existsSync(targetDir)) {
    console.log(`${CYAN}Updating${RESET} ${name}...`);
    try {
      execSync("git pull --ff-only", { cwd: targetDir, stdio: "pipe" });
      console.log(`${GREEN}Updated${RESET} ${name}`);
    } catch {
      console.log(`${DIM}Already up to date${RESET}`);
    }
    return;
  }

  // Ensure ~/.claude/skills/ exists
  if (!existsSync(SKILLS_DIR)) {
    mkdirSync(SKILLS_DIR, { recursive: true });
  }

  const repoUrl = `${BASE_URL}/${name}.git`;
  console.log(`${CYAN}Installing${RESET} ${name}...`);

  try {
    execSync(`git clone --depth 1 ${repoUrl} ${targetDir}`, {
      stdio: "pipe",
    });
    console.log(`${GREEN}Installed${RESET} ${name} → ${DIM}${targetDir}${RESET}`);
  } catch (err) {
    console.log(`${RED}Failed to clone ${repoUrl}${RESET}`);
    console.log(`${DIM}${err.message}${RESET}`);
    process.exit(1);
  }
}

function removeSkill(name) {
  const targetDir = join(SKILLS_DIR, name);

  if (!existsSync(targetDir)) {
    console.log(`${DIM}${name} is not installed${RESET}`);
    return;
  }

  execSync(`rm -rf ${targetDir}`);
  console.log(`${GREEN}Removed${RESET} ${name}`);
}

// --- CLI ---

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "list" || command === "--help" || command === "-h") {
  listSkills();
  process.exit(0);
}

if (command === "install") {
  banner();

  if (args[1] === "--all") {
    for (const name of Object.keys(SKILLS)) {
      installSkill(name);
    }
  } else if (args[1]) {
    installSkill(args[1]);
  } else {
    console.log(`${RED}Specify a skill name or --all${RESET}`);
    console.log();
    listSkills();
    process.exit(1);
  }

  console.log();
  console.log(`${DIM}Restart Claude Code to load new skills.${RESET}`);
  console.log();
  process.exit(0);
}

if (command === "remove" || command === "uninstall") {
  banner();

  if (!args[1]) {
    console.log(`${RED}Specify a skill name${RESET}`);
    process.exit(1);
  }

  removeSkill(args[1]);
  process.exit(0);
}

// If first arg looks like a skill name, assume install
if (SKILLS[command]) {
  banner();
  installSkill(command);
  console.log();
  console.log(`${DIM}Restart Claude Code to load new skills.${RESET}`);
  console.log();
  process.exit(0);
}

console.log(`${RED}Unknown command: ${command}${RESET}`);
listSkills();
process.exit(1);
