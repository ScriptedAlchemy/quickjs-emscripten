# Arena Usage Examples with defaultRegisteredObjects

## Basic Usage

```javascript
const { Arena, defaultRegisteredObjects } = require('quickjs-emscripten-sync');

// Use the default registered objects (recommended for most cases)
const arena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: defaultRegisteredObjects
});
```

## Adding Additional Objects When Needed

```javascript
const { Arena, defaultRegisteredObjects } = require('quickjs-emscripten-sync');

// Spread default objects and add custom ones for specific use cases
const arena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: [
        ...defaultRegisteredObjects,
        // Add custom objects only if needed for your specific use case
        [Date, "Date"],
        [RegExp, "RegExp"],
        [Buffer, "Buffer"], // Node.js specific
        [URL, "URL"], // Web API
        [AbortController, "AbortController"] // For fetch cancellation
    ]
});
```

## Use Case Examples

### Web API Heavy Applications
```javascript
// For applications that heavily use Web APIs
const webApiArena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: [
        ...defaultRegisteredObjects,
        [URL, "URL"],
        [URLSearchParams, "URLSearchParams"],
        [AbortController, "AbortController"],
        [Headers, "Headers"]
    ]
});
```

### Node.js Specific Applications
```javascript
// For Node.js applications with file system operations
const nodeArena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: [
        ...defaultRegisteredObjects,
        [Buffer, "Buffer"],
        [process, "process"], // Be careful with this in sandboxed environments
        [require('path'), "path"],
        [require('fs'), "fs"]
    ]
});
```

### Minimal Setup (Default Only)
```javascript
// Most applications should use this - defaultRegisteredObjects includes:
// - Math
// - JSON  
// - Promise
// - Object
// - Array
// - console (if available)
const arena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: defaultRegisteredObjects
});
```

## Performance Benefits

Using `defaultRegisteredObjects` provides:

1. **Pre-registered common objects** - avoids repeated marshalling overhead
2. **Optimized for QuickJS** - objects are registered efficiently
3. **Reduced code duplication** - no need to manually define common objects
4. **Consistent across projects** - same baseline objects everywhere
5. **Future-proof** - new optimizations are automatically included

## When to Add Custom Objects

Only add custom registered objects when you:

- **Frequently use specific APIs** (e.g., URL, Date, RegExp)
- **Have performance-critical operations** with specific objects
- **Need Node.js or browser-specific APIs** in your QuickJS environment
- **Want to expose custom global objects** to your scripts

## Migration from Manual Objects

### Before (Manual)
```javascript
const arena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: [
        [Math, "Math"],
        [JSON, "JSON"], 
        [Promise, "Promise"],
        [Object, "Object"],
        [Array, "Array"]
    ]
});
```

### After (Using defaultRegisteredObjects)
```javascript
const arena = new Arena(vm, {
    isMarshalable: true,
    registeredObjects: defaultRegisteredObjects
});
```

This provides the same functionality with less code and automatic updates!