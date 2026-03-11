# @flyweel/skill

Install [Flyweel](https://flyweel.co) ad analysis skills for any AI coding agent — Claude Code, Cursor, Windsurf, Gemini CLI, Codex, OpenCode, and more. One command to install, update, or remove. Auto-detects your agents.

## Quick Start

```bash
npx @flyweel/skill install flyweel-mcp-deep-ad-analysis
```

Auto-detects which agents you have installed and configures each one.

## Commands

```bash
# List available skills and supported agents
npx @flyweel/skill

# Install a skill (auto-detects your agents)
npx @flyweel/skill install <skill-name>

# Install for a specific agent
npx @flyweel/skill install <skill-name> --agent=cursor
npx @flyweel/skill install <skill-name> --agent=claude-code,gemini

# Install for all supported agents
npx @flyweel/skill install <skill-name> --agent=all

# Install all Flyweel skills
npx @flyweel/skill install --all

# Update (re-run install)
npx @flyweel/skill install <skill-name>

# Remove a skill from all agents
npx @flyweel/skill remove <skill-name>
```

## Available Skills

| Skill | Description |
|---|---|
| `flyweel-mcp-deep-ad-analysis` | Analyse Google Ads and Meta Ads with the Flyweel MCP server |
| `ad-performance-analyser-flyweel` | Analyse ad spend across Google, Meta, LinkedIn, and TikTok from any data source |

## Supported Agents

| Agent | How it installs |
|---|---|
| **Claude Code** | Clones to `~/.claude/skills/` |
| **Cursor** | Copies as `.mdc` rule to `~/.cursor/rules/` |
| **Windsurf** | Copies as `.md` rule to `~/.windsurf/rules/` |
| **Codex CLI** | Appends to `~/.codex/instructions.md` |
| **Gemini CLI** | Appends to `~/.gemini/GEMINI.md` |
| **OpenCode** | Appends to `~/.opencode/instructions.md` |

## Built by Flyweel

Originally built by [Flyweel](https://flyweel.co) — we're building the layer connecting spend, revenue, and capital with agentic finance.

## License

MIT
