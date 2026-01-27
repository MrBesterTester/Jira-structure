#!/bin/bash
# ============================================================================
# Jira Structure Learning Tool - Mac Launcher
# 
# Double-click this file to start the application.
# It will open automatically in your default web browser.
# ============================================================================

# Change to script directory (where this script is located)
cd "$(dirname "$0")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        Jira Structure Learning Tool - Launcher             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    echo ""
    echo "Please install Node.js 18 or later from:"
    echo -e "${YELLOW}https://nodejs.org/${NC}"
    echo ""
    echo "After installing Node.js, double-click this file again."
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Error: Node.js version 18 or later is required.${NC}"
    echo ""
    echo "Your current version: $(node -v)"
    echo "Please update Node.js from: https://nodejs.org/"
    echo ""
    read -p "Press Enter to close..."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js $(node -v) detected"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo ""
    echo -e "${YELLOW}Installing dependencies... (this may take a minute)${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}Error: Failed to install dependencies.${NC}"
        read -p "Press Enter to close..."
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Dependencies installed"
fi

# Check if dist folder exists (production build)
if [ ! -d "dist" ]; then
    echo ""
    echo -e "${YELLOW}Building the application... (this may take a moment)${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}Error: Failed to build the application.${NC}"
        read -p "Press Enter to close..."
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Application built"
fi

# Check if dist-server folder exists (server build)
if [ ! -d "dist-server" ]; then
    echo ""
    echo -e "${YELLOW}Building the server...${NC}"
    npm run build:server
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}Error: Failed to build the server.${NC}"
        read -p "Press Enter to close..."
        exit 1
    fi
    echo -e "${GREEN}✓${NC} Server built"
fi

echo ""
echo -e "${GREEN}Starting Jira Structure Learning Tool...${NC}"
echo ""
echo "The application will open in your browser automatically."
echo -e "${YELLOW}Press Ctrl+C to stop the server when done.${NC}"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TIP: Connect Claude Desktop for AI-powered workflows!    ║${NC}"
echo -e "${BLUE}║  See docs/MCP-SETUP.md for configuration instructions.    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start the server (it will auto-open browser)
npm start

# Keep terminal open if there's an error
read -p "Press Enter to close..."
