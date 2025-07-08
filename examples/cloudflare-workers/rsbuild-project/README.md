# Rsbuild + Module Federation + Cloudflare Workers

This project demonstrates how to use Rsbuild with Module Federation to create ESM modules that can be consumed by Cloudflare Workers.

## Features

- ✅ **Rsbuild** for fast building and development
- ✅ **Module Federation Enhanced** for exposing modules
- ✅ **ESM Output** compatible with Cloudflare Workers
- ✅ **TypeScript** support with type generation
- ✅ **Web Worker Target** optimized for worker environments

## Exposed Modules

The project exposes a `HelloWorld` module via Module Federation with these functions:

### `helloWorld(props)`
Simple function that returns a greeting string.
```typescript
helloWorld({ name: 'World', message: 'Hello' }) // "Hello, World!"
```

### `helloWorldFormatted(props)`
Returns a JSON-formatted response with timestamp and metadata.
```typescript
helloWorldFormatted({ name: 'Developer', message: 'Welcome' })
// Returns JSON string with greeting, timestamp, and source info
```

### `helloWorldResponse(props)`
Returns an object with text, HTML, and JSON formats.
```typescript
helloWorldResponse({ name: 'User', message: 'Hi' })
// Returns { text: string, html: string, json: object }
```

## Development

```bash
# Install dependencies
npm install

# Start development server (port 3001)
npm run dev

# Build for production
npm run build
```

## Build Output

The build generates:
- `remoteEntry.js` - Main module federation entry point
- `@mf-types.d.ts` - TypeScript definitions for exposed modules
- ESM-compatible chunks for web worker environments

## Usage in Cloudflare Workers

### 1. Host the Built Files

Upload the `dist/` folder contents to a CDN or static hosting service accessible to your Cloudflare Worker.

### 2. Import in Your Worker

```javascript
// In your Cloudflare Worker
export default {
  async fetch(request, env, ctx) {
    try {
      // Import the federated module
      const { helloWorld, helloWorldFormatted, helloWorldResponse } = 
        await import('https://your-cdn.com/remoteEntry.js');
      
      // Use the functions
      const greeting = helloWorld({ 
        name: 'Cloudflare', 
        message: 'Hello from' 
      });
      
      return new Response(greeting);
    } catch (error) {
      return new Response('Error loading module', { status: 500 });
    }
  },
};
```

### 3. Example Worker Implementation

See `cloudflare-worker-example.js` for a complete example that demonstrates different usage patterns.

## Configuration

The project is configured with:

- **Target**: `web-worker` for Cloudflare Workers compatibility
- **Output**: ESM modules with proper chunk formatting
- **Module Federation**: Exposes `./HelloWorld` module
- **TypeScript**: Generates type definitions for federated modules

## Module Federation Configuration

```typescript
new ModuleFederationPlugin({
  name: 'cloudflare_worker_host',
  filename: 'remoteEntry.js',
  exposes: {
    './HelloWorld': './src/components/HelloWorld.ts',
  },
  shared: {},
  library: { type: 'module' },
})
```

## Files Structure

```
src/
├── components/
│   └── HelloWorld.ts          # Exposed module with functions
├── index.ts                   # Demo page for development
└── index.css                  # Styles

dist/                          # Build output
├── remoteEntry.js             # Module federation entry
├── @mf-types.d.ts            # TypeScript definitions
└── static/js/                 # Chunks and assets
```

## Resources

- [Rsbuild Documentation](https://rsbuild.dev/)
- [Module Federation Enhanced](https://module-federation.io/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Using Webpack with Workers](https://blog.cloudflare.com/using-webpack-to-bundle-workers/)
