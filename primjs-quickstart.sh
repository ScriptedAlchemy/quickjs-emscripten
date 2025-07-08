#!/bin/bash

# PrimJS QuickStart Script for quickjs-emscripten
# This script sets up, builds, and tests PrimJS integration

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}    $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if running from repo root
if [ ! -f "package.json" ] || [ ! -d "vendor" ]; then
    print_error "Please run this script from the quickjs-emscripten repository root"
    exit 1
fi

# Check for required tools
check_requirements() {
    print_header "🔍 Checking Requirements"
    
    local missing=0
    
    # Check for Node.js
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed. Please install Node.js 16.0.0 or later."
        missing=1
    else
        print_success "Node.js found: $(node --version)"
    fi
    
    # Check for Yarn
    if ! command -v yarn >/dev/null 2>&1; then
        print_error "Yarn is not installed. Please install Yarn."
        missing=1
    else
        print_success "Yarn found: $(yarn --version)"
    fi
    
    # Check for Git
    if ! command -v git >/dev/null 2>&1; then
        print_error "Git is not installed. Please install Git."
        missing=1
    else
        print_success "Git found: $(git --version | head -1)"
    fi
    
    # Check for Make
    if ! command -v make >/dev/null 2>&1; then
        print_error "Make is not installed. Please install Make."
        missing=1
    else
        print_success "Make found: $(make --version | head -1)"
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "\nMissing required dependencies. Please install them and try again."
        return 1
    fi
    
    print_success "\nAll basic requirements satisfied!"
    return 0
}

# Setup Emscripten
setup_emscripten() {
    print_header "🛠️  Setting up Emscripten"
    
    # Target version
    EMSDK_VERSION="3.1.65"
    
    # Check if we already have the correct version
    if command -v emcc >/dev/null 2>&1; then
        CURRENT_VERSION=$(emcc --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        if [ "$CURRENT_VERSION" = "$EMSDK_VERSION" ]; then
            print_success "Emscripten $EMSDK_VERSION is already installed and active"
            return 0
        else
            print_info "Found Emscripten $CURRENT_VERSION, but need $EMSDK_VERSION"
        fi
    fi
    
    # Install Emscripten
    print_info "Installing Emscripten $EMSDK_VERSION..."
    
    # Clean up any existing emsdk directory
    if [ -d "./emsdk" ]; then
        print_info "Removing existing emsdk directory..."
        rm -rf ./emsdk
    fi
    
    # Clone emsdk
    print_info "Cloning Emscripten SDK..."
    git clone https://github.com/emscripten-core/emsdk.git ./emsdk
    
    # Install and activate the specific version
    cd emsdk
    print_info "Installing Emscripten $EMSDK_VERSION..."
    ./emsdk install $EMSDK_VERSION
    print_info "Activating Emscripten $EMSDK_VERSION..."
    ./emsdk activate $EMSDK_VERSION
    cd ..
    
    # Source the environment
    source ./emsdk/emsdk_env.sh
    
    # Verify installation
    if command -v emcc >/dev/null 2>&1; then
        print_success "Emscripten $EMSDK_VERSION installed successfully"
        print_info "Emscripten version: $(emcc --version | head -1)"
    else
        print_error "Failed to install Emscripten"
        return 1
    fi
}

# Install dependencies
install_deps() {
    print_header "📦 Installing Dependencies"
    
    print_info "Installing yarn dependencies..."
    yarn install
    
    print_info "Initializing git submodules..."
    git submodule update --init --recursive
    
    # Check if PrimJS submodule exists
    if [ ! -d "vendor/primjs/.git" ]; then
        print_info "Adding PrimJS as a submodule..."
        git submodule add https://github.com/lynx-family/primjs.git vendor/primjs || true
        git submodule update --init vendor/primjs
    fi
    
    print_success "Dependencies installed successfully!"
}

# Build PrimJS variants
build_primjs() {
    print_header "🔨 Building PrimJS Variants"
    
    # Ensure Emscripten is available
    if ! command -v emcc >/dev/null 2>&1; then
        print_error "Emscripten is not available. Running setup..."
        setup_emscripten || return 1
    fi
    
    # Source emsdk environment if we have a local installation
    if [ -f "./emsdk/emsdk_env.sh" ]; then
        source ./emsdk/emsdk_env.sh
    fi
    
    print_info "Using Emscripten for building..."
    print_info "Emscripten version: $(emcc --version | head -1)"
    
    # Run the full build process
    print_info "Running full build process (this may take a while)..."
    yarn build || {
        print_error "Build failed"
        return 1
    }
    
    print_success "All packages built successfully!"
}

# Run PrimJS tests
run_tests() {
    print_header "🧪 Running PrimJS Tests"
    
    local test_variant="packages/variant-primjs-wasmfile-release-sync"
    
    if [ ! -d "$test_variant" ]; then
        print_error "PrimJS variant not found. Please build first."
        return 1
    fi
    
    if [ ! -f "$test_variant/dist/index.js" ]; then
        print_error "PrimJS variant not built. Please build first."
        return 1
    fi
    
    # Create and run test file
    cat > "$test_variant/test-primjs.js" << 'EOF'
#!/usr/bin/env node

async function main() {
  console.log('🚀 Testing PrimJS Integration\n');
  
  // Load PrimJS variant
  const variant = require('./dist/index.js').default;
  const FFI = await variant.importFFI();
  const loadModule = await variant.importModuleLoader();
  const wasmModule = await loadModule();
  const ffi = new FFI(wasmModule);
  
  // Create runtime and context
  const rtPtr = ffi.QTS_NewRuntime();
  const ctxPtr = ffi.QTS_NewContext(rtPtr, 0xFFFF);
  
  // Helper function
  function evalCode(code) {
    const codeLen = wasmModule.lengthBytesUTF8(code) + 1;
    const codePtr = wasmModule._malloc(codeLen);
    wasmModule.stringToUTF8(code, codePtr, codeLen);
    
    const resultPtr = ffi.QTS_Eval(ctxPtr, codePtr, code.length, 'test.js', 0, 0);
    wasmModule._free(codePtr);
    
    const strPtr = ffi.QTS_Dump(ctxPtr, resultPtr);
    const result = wasmModule.UTF8ToString(strPtr);
    
    ffi.QTS_FreeCString(ctxPtr, strPtr);
    ffi.QTS_FreeValuePointer(ctxPtr, resultPtr);
    
    return result;
  }
  
  // Run tests
  const tests = [
    { name: 'Basic Math', code: '2 + 2', expected: '4' },
    { name: 'String Concat', code: '"Hello, " + "PrimJS!"', expected: '"Hello, PrimJS!"' },
    { name: 'Array Operations', code: '[1,2,3].map(x => x * 2).join(",")', expected: '"2,4,6"' },
    { name: 'ES6 Classes', code: 'class A { constructor() { this.x = 42; } } new A().x', expected: '42' },
    { name: 'Promises', code: 'typeof Promise', expected: '"function"' }
  ];
  
  let passed = 0;
  for (const test of tests) {
    const result = evalCode(test.code);
    const success = result === test.expected;
    console.log(`${success ? '✅' : '❌'} ${test.name}: ${result}`);
    if (success) passed++;
  }
  
  // Cleanup
  ffi.QTS_FreeContext(ctxPtr);
  ffi.QTS_FreeRuntime(rtPtr);
  
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed`);
  return passed === tests.length;
}

main()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
EOF

    chmod +x "$test_variant/test-primjs.js"
    
    print_info "Running PrimJS tests..."
    if (cd "$test_variant" && node test-primjs.js); then
        print_success "All PrimJS tests passed!"
    else
        print_error "Tests failed"
        rm -f "$test_variant/test-primjs.js"
        return 1
    fi
    
    # Clean up test file
    rm -f "$test_variant/test-primjs.js"
}

# Clean build artifacts
clean_build() {
    print_header "🧹 Cleaning Build Artifacts"
    
    print_info "Cleaning build directories..."
    
    # Clean root build directory
    rm -rf build/
    
    # Clean package build and dist directories
    find packages -name "build" -type d -exec rm -rf {} + 2>/dev/null || true
    find packages -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    
    # Clean other generated files
    find packages -name "*.d.ts" -type f -exec rm -f {} + 2>/dev/null || true
    find packages -name "*.js" -type f -exec rm -f {} + 2>/dev/null || true
    find packages -name "*.mjs" -type f -exec rm -f {} + 2>/dev/null || true
    find packages -name "*.map" -type f -exec rm -f {} + 2>/dev/null || true
    
    # Clean emsdk if exists
    if [ -d "./emsdk" ]; then
        print_info "Removing Emscripten SDK..."
        rm -rf ./emsdk
    fi
    
    print_success "Build artifacts cleaned!"
}

# Main setup function
run_setup() {
    print_header "🚀 PrimJS QuickStart Setup"
    
    print_info "This will set up PrimJS in quickjs-emscripten."
    print_info "The process includes:"
    print_info "  1. Checking requirements"
    print_info "  2. Setting up Emscripten (if needed)"
    print_info "  3. Installing dependencies"
    print_info "  4. Building PrimJS variants"
    print_info "  5. Running tests"
    print_info "\nThis may take 10-20 minutes depending on your system.\n"
    
    # Check requirements first
    if ! check_requirements; then
        print_error "\nSetup cannot proceed due to missing requirements."
        print_info "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    # Setup Emscripten if needed
    setup_emscripten || exit 1
    
    # Run all steps
    install_deps || exit 1
    build_primjs || exit 1
    run_tests || exit 1
    
    print_header "🎉 PrimJS Setup Complete!"
    print_success "PrimJS has been successfully integrated into quickjs-emscripten!"
    print_info "\nYou can now use any of the 16 PrimJS variants in your projects."
    print_info "See PRIMJS_HOWTO.md for usage instructions."
    print_info "\nQuick example:"
    print_info "  import { newQuickJSWASMModuleFromVariant } from 'quickjs-emscripten-core'"
    print_info "  import primjsVariant from '@jitl/primjs-wasmfile-release-sync'"
    print_info "  const QuickJS = await newQuickJSWASMModuleFromVariant(primjsVariant)"
    print_info "\nHappy coding! 🚀"
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "PrimJS QuickStart Script for quickjs-emscripten"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h        Show this help message"
    echo "  --check           Check requirements only"
    echo "  --clean           Clean build artifacts and Emscripten SDK"
    echo ""
    echo "By default, the script runs the complete setup process."
    exit 0
elif [ "$1" = "--check" ]; then
    check_requirements
    exit $?
elif [ "$1" = "--clean" ]; then
    clean_build
    exit 0
fi

# Run the setup
run_setup