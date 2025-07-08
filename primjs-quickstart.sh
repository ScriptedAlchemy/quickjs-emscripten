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
    local build_possible=false
    
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
    
    # Check for build tools (Docker or Emscripten)
    print_info "\nChecking build tools..."
    
    # Check for Docker
    if command -v docker >/dev/null 2>&1; then
        print_success "Docker found: $(docker --version)"
        # Check if Docker daemon is running
        if docker info >/dev/null 2>&1; then
            print_success "Docker daemon is running"
            build_possible=true
        else
            print_error "Docker daemon is not running. Please start Docker."
            print_info "On Linux: sudo systemctl start docker"
            print_info "On macOS/Windows: Start Docker Desktop"
        fi
    else
        print_info "Docker not found."
    fi
    
    # Check for Emscripten
    if command -v emcc >/dev/null 2>&1; then
        print_success "Emscripten found: $(emcc --version | head -1)"
        build_possible=true
    else
        print_info "Emscripten not found."
    fi
    
    # Summary of build tools
    if [ "$build_possible" = false ]; then
        print_error "\nNo build tools available. You need either Docker or Emscripten to build PrimJS."
        print_info "\nOption 1: Install Docker (recommended, easier):"
        print_info "  - Ubuntu/Debian: sudo apt-get install docker.io"
        print_info "  - macOS: Install Docker Desktop from https://www.docker.com/products/docker-desktop"
        print_info "  - Windows: Install Docker Desktop from https://www.docker.com/products/docker-desktop"
        print_info "\nOption 2: Install Emscripten (advanced):"
        print_info "  - Follow instructions at: https://emscripten.org/docs/getting_started/downloads.html"
        print_info "\nNote: The build process will automatically use Docker if available,"
        print_info "      falling back to native Emscripten if Docker is not found."
        print_info "\nFor detailed Docker installation instructions, run:"
        print_info "  ./install-docker-helper.sh"
        missing=1
    fi
    
    if [ $missing -eq 1 ]; then
        print_error "\nMissing required dependencies. Please install them and try again."
        return 1
    fi
    
    print_success "\nAll requirements satisfied!"
    return 0
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
    
    # Check if we can build
    if ! command -v docker >/dev/null 2>&1 && ! command -v emcc >/dev/null 2>&1; then
        print_error "Cannot build: Neither Docker nor Emscripten is available."
        print_info "Please install one of them first."
        return 1
    fi
    
    print_info "Generating build configurations..."
    yarn generate
    
    print_info "Building all PrimJS variants (this may take a while)..."
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        print_info "Using Docker for building..."
    elif command -v emcc >/dev/null 2>&1; then
        print_info "Using native Emscripten for building..."
    fi
    
    # Build each PrimJS variant
    local variants=(
        "primjs-wasmfile-release-sync"
        "primjs-wasmfile-release-asyncify"
        "primjs-wasmfile-debug-sync"
        "primjs-wasmfile-debug-asyncify"
    )
    
    for variant in "${variants[@]}"; do
        if [ -d "packages/variant-$variant" ]; then
            print_info "Building @jitl/$variant..."
            (cd "packages/variant-$variant" && yarn build) || {
                print_error "Failed to build $variant"
                return 1
            }
            print_success "Built $variant"
        fi
    done
    
    print_success "All PrimJS variants built successfully!"
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
    (cd "$test_variant" && node test-primjs.js) || {
        print_error "Tests failed"
        return 1
    }
    
    # Clean up test file
    rm -f "$test_variant/test-primjs.js"
    
    print_success "All PrimJS tests passed!"
}

# Main setup function
run_setup() {
    print_header "🚀 PrimJS QuickStart Setup"
    
    print_info "This will set up PrimJS in quickjs-emscripten."
    print_info "The process includes:"
    print_info "  1. Checking requirements"
    print_info "  2. Installing dependencies"
    print_info "  3. Building PrimJS variants"
    print_info "  4. Running tests"
    print_info "\nThis may take 10-20 minutes depending on your system.\n"
    
    # Check requirements first
    if ! check_requirements; then
        print_error "\nSetup cannot proceed due to missing requirements."
        print_info "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
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
    echo "  --clean           Clean build artifacts"
    echo ""
    echo "By default, the script runs the complete setup process."
    exit 0
elif [ "$1" = "--check" ]; then
    check_requirements
    exit $?
elif [ "$1" = "--clean" ]; then
    print_header "🧹 Cleaning Build Artifacts"
    print_info "Cleaning generated files..."
    yarn clean
    print_info "Cleaning PrimJS build artifacts..."
    find packages -name "variant-primjs-*" -type d -exec rm -rf {} + 2>/dev/null || true
    print_success "Build artifacts cleaned!"
    exit 0
fi

# Run the setup
run_setup