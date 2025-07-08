#!/bin/bash

# Docker Installation Helper Script
# This script provides instructions for installing Docker on various systems

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    Docker Installation Helper${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
fi

echo -e "${YELLOW}Detected OS: $OS${NC}\n"

case $OS in
    ubuntu|debian)
        echo -e "${GREEN}Ubuntu/Debian Installation Instructions:${NC}"
        echo "1. Update package index:"
        echo "   sudo apt-get update"
        echo ""
        echo "2. Install Docker:"
        echo "   sudo apt-get install -y docker.io"
        echo ""
        echo "3. Add your user to the docker group (to run without sudo):"
        echo "   sudo usermod -aG docker \$USER"
        echo ""
        echo "4. Log out and back in for group changes to take effect"
        echo ""
        echo "5. Start Docker service:"
        echo "   sudo systemctl start docker"
        echo "   sudo systemctl enable docker"
        ;;
        
    fedora|centos|rhel)
        echo -e "${GREEN}Fedora/CentOS/RHEL Installation Instructions:${NC}"
        echo "1. Install Docker:"
        echo "   sudo dnf install -y docker"
        echo ""
        echo "2. Start Docker service:"
        echo "   sudo systemctl start docker"
        echo "   sudo systemctl enable docker"
        echo ""
        echo "3. Add your user to the docker group:"
        echo "   sudo usermod -aG docker \$USER"
        echo ""
        echo "4. Log out and back in for group changes to take effect"
        ;;
        
    arch)
        echo -e "${GREEN}Arch Linux Installation Instructions:${NC}"
        echo "1. Install Docker:"
        echo "   sudo pacman -S docker"
        echo ""
        echo "2. Start Docker service:"
        echo "   sudo systemctl start docker"
        echo "   sudo systemctl enable docker"
        echo ""
        echo "3. Add your user to the docker group:"
        echo "   sudo usermod -aG docker \$USER"
        echo ""
        echo "4. Log out and back in for group changes to take effect"
        ;;
        
    macos)
        echo -e "${GREEN}macOS Installation Instructions:${NC}"
        echo "1. Download Docker Desktop for Mac from:"
        echo "   https://www.docker.com/products/docker-desktop"
        echo ""
        echo "2. Open the downloaded .dmg file"
        echo ""
        echo "3. Drag Docker to Applications folder"
        echo ""
        echo "4. Launch Docker from Applications"
        echo ""
        echo "5. Follow the setup wizard"
        ;;
        
    windows)
        echo -e "${GREEN}Windows Installation Instructions:${NC}"
        echo "1. Download Docker Desktop for Windows from:"
        echo "   https://www.docker.com/products/docker-desktop"
        echo ""
        echo "2. Run the installer"
        echo ""
        echo "3. Follow the installation wizard"
        echo ""
        echo "4. Restart your computer if prompted"
        echo ""
        echo "5. Launch Docker Desktop"
        ;;
        
    *)
        echo -e "${YELLOW}Generic Installation Instructions:${NC}"
        echo "Visit the official Docker installation guide:"
        echo "https://docs.docker.com/get-docker/"
        echo ""
        echo "Select your operating system for specific instructions."
        ;;
esac

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}After installing Docker:${NC}"
echo "1. Verify installation: docker --version"
echo "2. Test Docker: docker run hello-world"
echo "3. Return to primjs-quickstart.sh to continue setup"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"