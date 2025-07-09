#!/bin/bash

# Build script for lepus packages
# This script builds all lepus-related packages in the correct order

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

print_info "Starting lepus build process..."

# Step 1: Build lepus-ffi-types
print_info "Building lepus-ffi-types..."
if [ -d "packages/lepus-ffi-types" ]; then
    cd packages/lepus-ffi-types
    
    # Install dependencies
    print_info "Installing dependencies for lepus-ffi-types..."
    if ! yarn install; then
        print_error "Failed to install dependencies for lepus-ffi-types"
        exit 1
    fi
    
    # Build the package
    print_info "Building lepus-ffi-types..."
    if ! yarn build; then
        print_error "Failed to build lepus-ffi-types"
        exit 1
    fi
    
    print_info "lepus-ffi-types built successfully!"
    cd "$SCRIPT_DIR"
else
    print_warning "lepus-ffi-types directory not found, skipping..."
fi

# Step 2: Build primjs-emscripten
print_info "Building primjs-emscripten..."
if [ -d "packages/primjs-emscripten" ]; then
    cd packages/primjs-emscripten
    
    # Install dependencies
    print_info "Installing dependencies for primjs-emscripten..."
    if ! yarn install; then
        print_error "Failed to install dependencies for primjs-emscripten"
        exit 1
    fi
    
    # Build the package
    print_info "Building primjs-emscripten..."
    if ! yarn build; then
        print_error "Failed to build primjs-emscripten"
        exit 1
    fi
    
    print_info "primjs-emscripten built successfully!"
    cd "$SCRIPT_DIR"
else
    print_warning "primjs-emscripten directory not found, skipping..."
fi

# Step 3: Install dependencies for cloudflare-worker-prim
print_info "Setting up cloudflare-worker-prim..."
if [ -d "examples/cloudflare-worker-prim" ]; then
    cd examples/cloudflare-worker-prim
    
    # Install dependencies
    print_info "Installing dependencies for cloudflare-worker-prim..."
    if ! npm install; then
        print_error "Failed to install dependencies for cloudflare-worker-prim"
        exit 1
    fi
    
    print_info "cloudflare-worker-prim dependencies installed successfully!"
    
    # Copy WASM file if the script exists
    if [ -f "copy-wasm-file-into-src.sh" ]; then
        print_info "Copying WASM file into src..."
        if ! ./copy-wasm-file-into-src.sh; then
            print_warning "Failed to copy WASM file, but continuing..."
        fi
    fi
    
    cd "$SCRIPT_DIR"
else
    print_warning "cloudflare-worker-prim directory not found, skipping..."
fi

print_info "Build process completed successfully!"
print_info "You can now run the cloudflare worker with 'npm run dev' in the examples/cloudflare-worker-prim directory"