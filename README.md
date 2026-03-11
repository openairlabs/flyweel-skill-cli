# @flyweel/skill

Install [Flyweel](https://flyweel.co) skills for Claude Code.

## Quick Start

```bash
npx @flyweel/skill install flyweel-mcp-deep-ad-analysis
```

No setup required. Skills are cloned to `~/.claude/skills/` and available in your next Claude Code session.

## Commands

```bash
# List available skills
npx @flyweel/skill

# Install a skill
npx @flyweel/skill install <skill-name>

# Install all Flyweel skills
npx @flyweel/skill install --all

# Update an installed skill
npx @flyweel/skill install <skill-name>  # re-running pulls latest

# Remove a skill
npx @flyweel/skill remove <skill-name>
```

## Available Skills

| Skill | Description |
|---|---|
| `flyweel-mcp-deep-ad-analysis` | Analyse Google Ads and Meta Ads with the Flyweel MCP server |
| `ad-performance-analyser-flyweel` | Analyse ad spend across Google, Meta, LinkedIn, and TikTok from any data source |

## Built by Flyweel

Originally built by [Flyweel](https://flyweel.co) — we're building the layer connecting spend, revenue, and capital with agentic finance.

## License

MIT
