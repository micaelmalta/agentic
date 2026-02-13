# Installation Guide

Quick reference for installing AI Development Skills Collection.

## One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash
```

## Custom Install Path

```bash
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash -s -- --path /custom/path
```

## What Gets Installed

```
~/.claude/skills/
├── skills/                    # 18 specialized skills
│   ├── para/                 # PARA methodology
│   ├── workflow/             # Complete dev workflow
│   ├── developer/            # TDD implementation
│   ├── rlm/                  # Large codebase handling
│   ├── architect/            # Technical specifications
│   ├── testing/              # Test design and execution
│   ├── code-reviewer/        # Code review
│   ├── security-reviewer/    # Security auditing
│   ├── documentation/        # Documentation generation
│   ├── git-commits/          # Git and version control
│   ├── refactoring/          # Code refactoring
│   ├── debugging/            # Bug fixing
│   ├── dependencies/         # Dependency management
│   ├── performance/          # Performance optimization
│   ├── ci-cd/                # CI/CD pipelines
│   ├── setup/                # MCP configuration
│   ├── skill-creator/        # Skill authoring guide
│   ├── mcp-builder/          # MCP server development
│   └── agents/               # Phase agents (testing, validation, PR)
├── CLAUDE.md                 # AI assistant guidance
├── README.md                 # Full documentation
└── install.sh                # This installer script
```

## Prerequisites

The installer checks for:

- **Git** — Version control
- **Python 3.10+** — Required for RLM, skill-creator, validation scripts
- **Node.js** — Required for MCP setup
- **GitHub CLI (`gh`)** — Required for PR creation

### Installing Prerequisites

**macOS:**
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install prerequisites
brew install git python node gh
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git python3 nodejs npm

# GitHub CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

**Windows:**
```powershell
# Install via Chocolatey
choco install git python nodejs gh
```

## Verification

After installation:

```bash
# Verify installation directory
ls -la ~/.claude/skills/

# In Claude Code or Cursor
/help
/init
```

## Updating

```bash
cd ~/.claude/skills
git pull origin main
```

Or re-run the installer:

```bash
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash
```

## Uninstalling

```bash
rm -rf ~/.claude/skills
```

## For Cursor Users

```bash
# Install to Cursor directory
curl -fsSL https://raw.githubusercontent.com/micaelmalta/agentic/main/install.sh | bash -s -- --path ~/.cursor/skills

# Or symlink from Claude Code installation
ln -s ~/.claude/skills ~/.cursor/skills
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Missing prerequisites | Install missing tools (see Prerequisites section) |
| Permission denied | Install to user directory (default) or use `sudo` |
| Directory exists | Installer prompts to remove/reinstall |
| `curl` not found | `brew install curl` or use manual git clone |

## Manual Installation

If automated installation fails:

```bash
# 1. Clone repository
git clone https://github.com/micaelmalta/agentic.git ~/.claude/skills

# 2. Verify prerequisites
python3 --version  # 3.10+
node --version
git --version
gh --version

# 3. In your project
cd /your/project
# Then in Claude Code:
/init
```

## Next Steps

1. Initialize PARA in your project: `/init`
2. Configure MCP servers (optional): `/setup`
3. Start using skills: `/help`
4. Create your first plan: `/plan "your task"`

## Support

- **Full Documentation**: [README.md](README.md)
- **Repository**: https://github.com/micaelmalta/agentic
- **Issues**: https://github.com/micaelmalta/agentic/issues
