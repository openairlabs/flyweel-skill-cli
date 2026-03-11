#!/usr/bin/env node

import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import { createInterface } from "readline";

const HOME = homedir();
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

// Agent configs: where each agent reads custom instructions/skills from
const AGENTS = {
  "claude-code": {
    name: "Claude Code",
    skillDir: join(HOME, ".claude", "skills"),
    method: "clone", // clone whole repo into skill dir
  },
  cursor: {
    name: "Cursor",
    ruleDir: join(HOME, ".cursor", "rules"),
    method: "copy-md", // copy SKILL.md as a .mdc rule file
    extension: ".mdc",
  },
  windsurf: {
    name: "Windsurf",
    ruleDir: join(HOME, ".windsurf", "rules"),
    method: "copy-md",
    extension: ".md",
  },
  codex: {
    name: "Codex CLI",
    file: join(HOME, ".codex", "instructions.md"),
    method: "append", // append skill content to instructions file
  },
  gemini: {
    name: "Gemini CLI",
    file: join(HOME, ".gemini", "GEMINI.md"),
    method: "append",
  },
  opencode: {
    name: "OpenCode",
    file: join(HOME, ".opencode", "instructions.md"),
    method: "append",
  },
};

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function banner() {
  console.log();
  console.log(`${BOLD}  flyweel skill installer${RESET}`);
  console.log(`${DIM}  https://flyweel.co${RESET}`);
  console.log();
}

function listSkills() {
  console.log(`${BOLD}Available skills:${RESET}`);
  console.log();
  for (const [name, info] of Object.entries(SKILLS)) {
    console.log(`  ${CYAN}${name}${RESET}`);
    console.log(`  ${DIM}${info.description}${RESET}`);
    console.log();
  }
}

function listAgents() {
  console.log(`${BOLD}Supported agents:${RESET}`);
  console.log();
  for (const [key, agent] of Object.entries(AGENTS)) {
    console.log(`  ${CYAN}${key}${RESET}  ${DIM}${agent.name}${RESET}`);
  }
  console.log();
}

function detectAgents() {
  const detected = [];
  for (const [key, agent] of Object.entries(AGENTS)) {
    if (agent.skillDir && existsSync(join(agent.skillDir, ".."))) {
      detected.push(key);
    } else if (agent.ruleDir && existsSync(join(agent.ruleDir, ".."))) {
      detected.push(key);
    } else if (agent.file && existsSync(join(agent.file, ".."))) {
      detected.push(key);
    }
  }
  // Always include claude-code as default
  if (!detected.includes("claude-code")) {
    detected.push("claude-code");
  }
  return detected;
}

function cloneSkillRepo(name, targetDir) {
  if (existsSync(targetDir)) {
    try {
      execSync("git pull --ff-only", { cwd: targetDir, stdio: "pipe" });
      return "updated";
    } catch {
      return "current";
    }
  }

  mkdirSync(targetDir, { recursive: true });
  const repoUrl = `${BASE_URL}/${name}.git`;
  execSync(`git clone --depth 1 ${repoUrl} ${targetDir}`, { stdio: "pipe" });
  return "installed";
}

function getSkillContent(name) {
  // Try local clone first, then fetch raw from GitHub
  const localPath = join(HOME, ".claude", "skills", name, "SKILL.md");
  if (existsSync(localPath)) {
    return readFileSync(localPath, "utf-8");
  }

  // Clone to temp, read, return
  const tmpDir = join(HOME, ".flyweel-tmp", name);
  try {
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true });
      execSync(`git clone --depth 1 ${BASE_URL}/${name}.git ${tmpDir}`, {
        stdio: "pipe",
      });
    }
    const content = readFileSync(join(tmpDir, "SKILL.md"), "utf-8");
    return content;
  } catch {
    return null;
  }
}

function stripFrontmatter(content) {
  // Remove YAML frontmatter for agents that don't understand it
  if (content.startsWith("---")) {
    const endIndex = content.indexOf("---", 3);
    if (endIndex !== -1) {
      return content.slice(endIndex + 3).trim();
    }
  }
  return content;
}

function installForAgent(agentKey, skillName) {
  const agent = AGENTS[agentKey];
  if (!agent) return;

  if (agent.method === "clone") {
    // Clone whole repo into skill directory
    const targetDir = join(agent.skillDir, skillName);
    const result = cloneSkillRepo(skillName, targetDir);
    if (result === "installed") {
      console.log(
        `  ${GREEN}+${RESET} ${agent.name}: installed → ${DIM}${targetDir}${RESET}`
      );
    } else if (result === "updated") {
      console.log(`  ${GREEN}+${RESET} ${agent.name}: updated`);
    } else {
      console.log(`  ${DIM}-${RESET} ${agent.name}: already up to date`);
    }
  } else if (agent.method === "copy-md") {
    // Copy SKILL.md as a rule file
    const content = getSkillContent(skillName);
    if (!content) {
      console.log(`  ${RED}x${RESET} ${agent.name}: could not read SKILL.md`);
      return;
    }
    mkdirSync(agent.ruleDir, { recursive: true });
    const targetFile = join(agent.ruleDir, `${skillName}${agent.extension}`);
    writeFileSync(targetFile, stripFrontmatter(content));
    console.log(
      `  ${GREEN}+${RESET} ${agent.name}: copied → ${DIM}${targetFile}${RESET}`
    );
  } else if (agent.method === "append") {
    // Append skill content to the agent's instructions file
    const content = getSkillContent(skillName);
    if (!content) {
      console.log(`  ${RED}x${RESET} ${agent.name}: could not read SKILL.md`);
      return;
    }

    const dir = join(agent.file, "..");
    mkdirSync(dir, { recursive: true });

    const marker = `<!-- flyweel:${skillName} -->`;
    const block = `\n\n${marker}\n${stripFrontmatter(content)}\n${marker}\n`;

    if (existsSync(agent.file)) {
      const existing = readFileSync(agent.file, "utf-8");
      if (existing.includes(marker)) {
        // Replace existing block
        const regex = new RegExp(
          `\n?\n?${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\n?`,
          "g"
        );
        writeFileSync(agent.file, existing.replace(regex, block));
        console.log(`  ${GREEN}+${RESET} ${agent.name}: updated in ${DIM}${agent.file}${RESET}`);
      } else {
        writeFileSync(agent.file, existing + block);
        console.log(`  ${GREEN}+${RESET} ${agent.name}: appended to ${DIM}${agent.file}${RESET}`);
      }
    } else {
      writeFileSync(agent.file, block.trim() + "\n");
      console.log(
        `  ${GREEN}+${RESET} ${agent.name}: created ${DIM}${agent.file}${RESET}`
      );
    }
  }
}

function removeForAgent(agentKey, skillName) {
  const agent = AGENTS[agentKey];
  if (!agent) return;

  if (agent.method === "clone") {
    const targetDir = join(agent.skillDir, skillName);
    if (existsSync(targetDir)) {
      execSync(`rm -rf "${targetDir}"`);
      console.log(`  ${GREEN}-${RESET} ${agent.name}: removed`);
    }
  } else if (agent.method === "copy-md") {
    const targetFile = join(agent.ruleDir, `${skillName}${agent.extension}`);
    if (existsSync(targetFile)) {
      execSync(`rm "${targetFile}"`);
      console.log(`  ${GREEN}-${RESET} ${agent.name}: removed`);
    }
  } else if (agent.method === "append") {
    if (existsSync(agent.file)) {
      const existing = readFileSync(agent.file, "utf-8");
      const marker = `<!-- flyweel:${skillName} -->`;
      if (existing.includes(marker)) {
        const regex = new RegExp(
          `\n?\n?${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\S]*?${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\n?`,
          "g"
        );
        writeFileSync(agent.file, existing.replace(regex, "").trim() + "\n");
        console.log(`  ${GREEN}-${RESET} ${agent.name}: removed from ${DIM}${agent.file}${RESET}`);
      }
    }
  }
}

function cleanupTmp() {
  const tmpDir = join(HOME, ".flyweel-tmp");
  if (existsSync(tmpDir)) {
    execSync(`rm -rf "${tmpDir}"`);
  }
}

// --- CLI ---

const args = process.argv.slice(2);
const command = args[0];

// Parse flags
const flagArgs = args.filter((a) => a.startsWith("--"));
const posArgs = args.filter((a) => !a.startsWith("--"));

const agentFlag = flagArgs
  .find((f) => f.startsWith("--agent="))
  ?.split("=")[1];
const allFlag = flagArgs.includes("--all");

if (!command || command === "list" || command === "--help" || command === "-h") {
  banner();
  listSkills();
  listAgents();
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  ${DIM}npx @flyweel/skill install <skill-name>${RESET}`);
  console.log(
    `  ${DIM}npx @flyweel/skill install <skill-name> --agent=cursor${RESET}`
  );
  console.log(`  ${DIM}npx @flyweel/skill install --all${RESET}`);
  console.log(`  ${DIM}npx @flyweel/skill remove <skill-name>${RESET}`);
  console.log();
  process.exit(0);
}

if (command === "install") {
  banner();

  const skillName = posArgs[1];
  const skillNames = allFlag ? Object.keys(SKILLS) : skillName ? [skillName] : [];

  if (skillNames.length === 0) {
    console.log(`${RED}Specify a skill name or --all${RESET}`);
    console.log();
    listSkills();
    process.exit(1);
  }

  // Determine target agents
  let targetAgents;
  if (agentFlag) {
    if (agentFlag === "all") {
      targetAgents = Object.keys(AGENTS);
    } else {
      const keys = agentFlag.split(",");
      for (const k of keys) {
        if (!AGENTS[k]) {
          console.log(`${RED}Unknown agent: ${k}${RESET}`);
          listAgents();
          process.exit(1);
        }
      }
      targetAgents = keys;
    }
  } else {
    // Auto-detect installed agents
    targetAgents = detectAgents();
  }

  console.log(
    `${DIM}Target agents: ${targetAgents.map((a) => AGENTS[a].name).join(", ")}${RESET}`
  );
  console.log();

  for (const name of skillNames) {
    if (!SKILLS[name]) {
      console.log(`${RED}Unknown skill: ${name}${RESET}`);
      continue;
    }

    console.log(`${BOLD}${name}${RESET}`);
    console.log(`${DIM}${SKILLS[name].description}${RESET}`);
    console.log();

    for (const agentKey of targetAgents) {
      try {
        installForAgent(agentKey, name);
      } catch (err) {
        console.log(`  ${RED}x${RESET} ${AGENTS[agentKey].name}: ${err.message}`);
      }
    }
    console.log();
  }

  cleanupTmp();
  console.log(`${DIM}Restart your agent to load new skills.${RESET}`);
  console.log();
  process.exit(0);
}

if (command === "remove" || command === "uninstall") {
  banner();

  const skillName = posArgs[1];
  if (!skillName) {
    console.log(`${RED}Specify a skill name${RESET}`);
    process.exit(1);
  }

  const targetAgents = agentFlag
    ? agentFlag === "all"
      ? Object.keys(AGENTS)
      : agentFlag.split(",")
    : Object.keys(AGENTS); // remove from all by default

  console.log(`${BOLD}Removing ${skillName}${RESET}`);
  console.log();

  for (const agentKey of targetAgents) {
    try {
      removeForAgent(agentKey, skillName);
    } catch (err) {
      console.log(`  ${RED}x${RESET} ${AGENTS[agentKey].name}: ${err.message}`);
    }
  }

  console.log();
  process.exit(0);
}

// If first arg looks like a skill name, assume install
if (SKILLS[command]) {
  // Re-invoke as install
  process.argv.splice(2, 0, "install");
  const mod = await import("./index.mjs");
}

console.log(`${RED}Unknown command: ${command}${RESET}`);
banner();
listSkills();
process.exit(1);
