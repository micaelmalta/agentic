#!/usr/bin/env bash

# AI Development Skills Collection - Automated Installer
# Repository: https://github.com/micaelmalta/agentic

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default installation path
DEFAULT_PATH="${HOME}/.claude/skills"
INSTALL_PATH="${DEFAULT_PATH}"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --path)
      INSTALL_PATH="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--path /custom/path]"
      echo ""
      echo "Options:"
      echo "  --path    Custom installation path (default: ~/.claude/skills)"
      echo "  --help    Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AI Development Skills Collection - Installer             ║${NC}"
echo -e "${BLUE}║  Repository: github.com/micaelmalta/agentic               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check command existence
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check Python version
check_python_version() {
  if command_exists python3; then
    local version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    local major=$(echo "$version" | cut -d. -f1)
    local minor=$(echo "$version" | cut -d. -f2)

    if [[ $major -ge 3 ]] && [[ $minor -ge 10 ]]; then
      return 0
    fi
  fi
  return 1
}

# Check prerequisites
echo -e "${YELLOW}[1/5] Checking prerequisites...${NC}"
MISSING_DEPS=()

if ! command_exists git; then
  MISSING_DEPS+=("git")
fi

if ! check_python_version; then
  MISSING_DEPS+=("python3.10+")
fi

if ! command_exists node; then
  MISSING_DEPS+=("node")
fi

if ! command_exists gh; then
  MISSING_DEPS+=("gh (GitHub CLI)")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
  echo -e "${RED}✗ Missing required dependencies:${NC}"
  for dep in "${MISSING_DEPS[@]}"; do
    echo -e "${RED}  - $dep${NC}"
  done
  echo ""
  echo -e "${YELLOW}Please install missing dependencies:${NC}"
  echo "  - Git: https://git-scm.com/downloads"
  echo "  - Python 3.10+: https://www.python.org/downloads/"
  echo "  - Node.js: https://nodejs.org/"
  echo "  - GitHub CLI: brew install gh (macOS) or https://cli.github.com"
  exit 1
else
  echo -e "${GREEN}✓ All prerequisites met${NC}"
  echo "  - Git: $(git --version | cut -d' ' -f3)"
  echo "  - Python: $(python3 --version | cut -d' ' -f2)"
  echo "  - Node: $(node --version)"
  echo "  - GitHub CLI: $(gh --version | head -n1 | cut -d' ' -f3)"
fi

echo ""

# Check if installation directory exists
echo -e "${YELLOW}[2/5] Checking installation directory...${NC}"
if [ -d "$INSTALL_PATH" ]; then
  echo -e "${YELLOW}⚠ Directory already exists: $INSTALL_PATH${NC}"
  read -p "Do you want to remove and reinstall? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing existing installation...${NC}"
    rm -rf "$INSTALL_PATH"
  else
    echo -e "${BLUE}ℹ Using existing installation. To update, run 'git pull' inside $INSTALL_PATH${NC}"
    exit 0
  fi
fi

echo -e "${GREEN}✓ Installation path: $INSTALL_PATH${NC}"
echo ""

# Create parent directory if needed
echo -e "${YELLOW}[3/5] Creating directories...${NC}"
mkdir -p "$(dirname "$INSTALL_PATH")"
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Clone repository
echo -e "${YELLOW}[4/5] Cloning repository...${NC}"
if git clone https://github.com/micaelmalta/agentic.git "$INSTALL_PATH"; then
  echo -e "${GREEN}✓ Repository cloned successfully${NC}"
else
  echo -e "${RED}✗ Failed to clone repository${NC}"
  exit 1
fi
echo ""

# Display success message
echo -e "${YELLOW}[5/5] Installation complete!${NC}"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Installation Successful!                                 ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Skills installed to: ${NC}$INSTALL_PATH"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo -e "${BLUE}1. Initialize PARA in your project:${NC}"
echo "   cd /path/to/your/project"
echo "   # In Claude Code or Cursor, run:"
echo "   /init"
echo ""
echo -e "${BLUE}2. (Optional) Configure MCP servers for Jira/Confluence/Datadog:${NC}"
echo "   /setup"
echo ""
echo -e "${BLUE}3. Start using skills:${NC}"
echo "   /help              # Show all available commands"
echo "   /check \"<task>\"    # Decide if you need PARA workflow"
echo "   /plan \"<task>\"     # Create implementation plan"
echo "   /workflow          # Run complete dev workflow"
echo ""
echo -e "${BLUE}4. Update skills anytime:${NC}"
echo "   cd $INSTALL_PATH"
echo "   git pull origin main"
echo ""
echo -e "${GREEN}Happy coding with AI! 🚀${NC}"
echo ""
