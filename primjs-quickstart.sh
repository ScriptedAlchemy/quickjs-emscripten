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

# Parse command line arguments
INTERACTIVE=false
ACTION="full"

while [[ $# -gt 0 ]]; do
    case $1 in
        --interactive|-i)
            INTERACTIVE=true
            shift
            ;;
        --deps-only)
            ACTION="deps"
            shift
            ;;
        --build-only)
            ACTION="build"
            shift
            ;;
        --test-only)
            ACTION="test"
            shift
            ;;
        --clean)
            ACTION="clean"
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --interactive, -i    Run in interactive mode with menu"
            echo "  --deps-only         Install dependencies only"
            echo "  --build-only        Build PrimJS variants only"
            echo "  --test-only         Run tests only"
            echo "  --clean             Clean build artifacts"
            echo "  --help, -h          Show this help message"
            echo ""
            echo "Default: Run full setup (install deps, setup Emscripten, build, test)"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

# Check and setup Emscripten
setup_emscripten() {
    print_header "🛠️  Setting up Emscripten"
    
    # Check if local emsdk has the correct version
    if [ -f "./emsdk/emsdk_env.sh" ]; then
        print_info "Found local emsdk installation, checking version..."
        source ./emsdk/emsdk_env.sh > /dev/null 2>&1
        if command -v emcc &> /dev/null && emcc --version | grep "3.1.65" &> /dev/null; then
            print_success "Emscripten version 3.1.65 is already set up locally"
            return 0
        fi
    fi
    
    # Check if system emcc has correct version
    if command -v emcc &> /dev/null; then
        local emcc_version=$(emcc --version | head -1)
        print_info "System Emscripten found: $emcc_version"
        
        # Check if it's the correct version (3.1.65)
        if emcc --version | grep "3.1.65" &> /dev/null; then
            print_success "System Emscripten version 3.1.65 is installed"
            return 0
        else
            print_info "System version doesn't match required version (3.1.65)"
        fi
    fi
    
    # Install emsdk locally
    if [ ! -d "./emsdk" ]; then
        print_info "Cloning Emscripten SDK..."
        git clone https://github.com/emscripten-core/emsdk.git || {
            print_error "Failed to clone emsdk repository"
            return 1
        }
    fi
    
    print_info "Installing Emscripten 3.1.65 (this may take a while)..."
    cd emsdk
    
    # Install and activate specific version
    ./emsdk install 3.1.65 --shallow || {
        cd ..
        print_error "Failed to install Emscripten 3.1.65"
        return 1
    }
    
    ./emsdk activate 3.1.65 || {
        cd ..
        print_error "Failed to activate Emscripten 3.1.65"
        return 1
    }
    
    cd ..
    
    # Source emsdk for current session
    print_info "Activating Emscripten for current session..."
    source ./emsdk/emsdk_env.sh
    
    # Verify installation
    if command -v emcc &> /dev/null && emcc --version | grep "3.1.65" &> /dev/null; then
        print_success "Emscripten 3.1.65 setup complete!"
        print_info "For future sessions, run: source ./emsdk/emsdk_env.sh"
    else
        print_error "Failed to verify Emscripten installation"
        return 1
    fi
}

# Build PrimJS variants
build_primjs() {
    print_header "🔨 Building PrimJS Variants"
    
    # Check if emcc is available
    if ! command -v emcc &> /dev/null; then
        # Try to source emsdk if it's installed locally
        if [ -f "./emsdk/emsdk_env.sh" ]; then
            print_info "Sourcing local Emscripten installation..."
            source ./emsdk/emsdk_env.sh
        else
            print_info "Emscripten not found. Setting it up..."
            setup_emscripten || {
                print_error "Failed to setup Emscripten"
                return 1
            }
        fi
    fi
    
    # Set environment variables to use system emcc
    export EMSDK_USE_DOCKER=""
    export EMSDK_VERSION="3.1.65"
    export EMSDK_PROJECT_ROOT="$PWD"
    
    print_info "Using Emscripten directly (no Docker required)"
    emcc --version | head -1
    
    print_info "Preparing variants and generating build configurations..."
    ./scripts/prepareVariants.ts || {
        print_error "Failed to prepare variants"
        return 1
    }
    
    print_info "Building workspace packages..."
    yarn workspace @jitl/tsconfig build || {
        print_error "Failed to build tsconfig"
        return 1
    }
    
    print_info "Building all PrimJS variants (this may take a while)..."
    
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

# Clean build artifacts
clean_build() {
    print_header "🧹 Cleaning Build Artifacts"
    
    print_info "Cleaning generated files..."
    yarn clean
    
    print_info "Cleaning PrimJS build artifacts..."
    find packages -name "variant-primjs-*" -type d -exec rm -rf {} + 2>/dev/null || true
    
    print_success "Build artifacts cleaned!"
}

# Full setup
full_setup() {
    print_header "🚀 Running Full PrimJS Setup"
    
    install_deps || exit 1
    setup_emscripten || exit 1
    build_primjs || exit 1
    run_tests || exit 1
    
    print_header "🎉 PrimJS Setup Complete!"
    print_success "PrimJS has been successfully integrated into quickjs-emscripten!"
    print_info "You can now use any of the 16 PrimJS variants in your projects."
    print_info "See PRIMJS_HOWTO.md for usage instructions."
}

# Main menu for interactive mode
show_menu() {
    print_header "🚀 PrimJS QuickStart Menu"
    echo "1) Full setup (install deps, build all variants, run tests)"
    echo "2) Install dependencies only"
    echo "3) Setup Emscripten"
    echo "4) Build PrimJS variants only"
    echo "5) Run PrimJS tests only"
    echo "6) Clean build artifacts"
    echo "7) Exit"
    echo
    read -p "Select an option (1-7): " choice
}

# Execute based on mode
if [ "$INTERACTIVE" = true ]; then
    # Interactive mode with menu
    while true; do
        show_menu
        
        case $choice in
            1)
                full_setup
                ;;
            2)
                install_deps
                ;;
            3)
                setup_emscripten
                ;;
            4)
                build_primjs
                ;;
            5)
                run_tests
                ;;
            6)
                clean_build
                ;;
            7)
                print_info "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-7."
                ;;
        esac
        
        echo
        read -p "Press Enter to continue..."
    done
else
    # Non-interactive mode
    case $ACTION in
        full)
            full_setup
            ;;
        deps)
            install_deps
            ;;
        build)
            build_primjs
            ;;
        test)
            run_tests
            ;;
        clean)
            clean_build
            ;;
    esac
fi