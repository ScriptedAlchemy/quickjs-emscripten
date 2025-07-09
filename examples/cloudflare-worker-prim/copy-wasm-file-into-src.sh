#!/usr/bin/env bash
#
# PrimJS-emscripten exposes an export for the .wasm file, but Cloudflare refuses to accept it.
# Cloudflare's build system only allows importing .wasm files using a relative path.
# Github issue: https://github.com/cloudflare/workers-sdk/issues/1672
#
# Instead the easy way out is to just copy the .wasm files we need into the build directory.
# Once there, we can import them and use them to make a new PrimJS variant.
#

set -eo pipefail

VARIANTS=(
	DEBUG_SYNC
	RELEASE_SYNC
)

# PrimJS variants use different package names
PRIMJS_VARIANTS=(
	RELEASE_SYNC
	DEBUG_SYNC
)

# Copy PrimJS WASM files
for VARIANT in "${PRIMJS_VARIANTS[@]}"; do
	kebab="$(echo "$VARIANT" | tr '[:upper:]' '[:lower:]' | tr '_' '-')"
	PRIMJS_PACKAGE="@jitl/primjs-wasmfile-$kebab"

	echo "Copying PrimJS variant: $VARIANT from package $PRIMJS_PACKAGE"

	# Get the WASM file path from the PrimJS variant package
	WASM_FILE="$(node -e "try { console.log(require.resolve('$PRIMJS_PACKAGE/wasm')); } catch(e) { console.error('Package not found:', e.message); process.exit(1); }")"

	if [[ -f "$WASM_FILE" ]]; then
		cp -v "$WASM_FILE" "src/PRIMJS_$VARIANT.wasm"
		echo "Successfully copied PrimJS $VARIANT WASM file"
	else
		echo "Warning: PrimJS WASM file not found at $WASM_FILE"
	fi

	# Check for source map
	if [[ -f "$WASM_FILE.map" ]]; then
		cp -v "$WASM_FILE.map" "src/PRIMJS_$VARIANT.wasm.map.txt"
	fi
done

# Keep original QuickJS files for compatibility
for VARIANT in "${VARIANTS[@]}"; do
	kebab="$(echo "$VARIANT" | tr '[:upper:]' '[:lower:]' | tr '_' '-')"
	WASM_FILE="$(node -p 'require.resolve("@jitl/quickjs-wasmfile-'$kebab'/wasm")')"
	cp -v "$WASM_FILE" src/$VARIANT.wasm
	if [[ -f "$WASM_FILE.map" ]]; then
		cp -v "$WASM_FILE.map" src/$VARIANT.wasm.map.txt
	fi
done
