// Example Cloudflare Worker that uses the Module Federation exposed HelloWorld functions
// Deploy this to Cloudflare Workers to test the federated module

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    try {
      // Import the federated module (you'd need to host the remoteEntry.js somewhere accessible)
      // For demo purposes, we'll simulate the functions that would be available
      
      // In a real scenario, you'd do something like:
      // const { helloWorld, helloWorldFormatted, helloWorldResponse } = await import('https://your-cdn.com/remoteEntry.js');
      
      // For now, let's simulate the functions for demonstration
      const helloWorld = (props = {}) => {
        const name = props.name || 'World';
        const message = props.message || 'Hello';
        return `${message}, ${name}!`;
      };
      
      const helloWorldFormatted = (props = {}) => {
        const name = props.name || 'World';
        const message = props.message || 'Hello';
        const timestamp = new Date().toISOString();
        
        return JSON.stringify({
          greeting: `${message}, ${name}!`,
          timestamp,
          source: 'Module Federation + Rsbuild + Cloudflare Workers',
          props: { name, message }
        }, null, 2);
      };
      
      const helloWorldResponse = (props = {}) => {
        const name = props.name || 'World';
        const message = props.message || 'Hello';
        const greeting = `${message}, ${name}!`;
        
        return {
          text: greeting,
          html: `
            <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; text-align: center; font-family: Arial, sans-serif;">
              <h2>${greeting}</h2>
              <p>Exposed via Module Federation from Rsbuild for Cloudflare Workers</p>
              <small>Generated at ${new Date().toLocaleString()}</small>
            </div>
          `,
          json: {
            greeting,
            timestamp: new Date().toISOString(),
            source: 'Module Federation + Rsbuild + Cloudflare Workers',
            props: { name, message }
          }
        };
      };
      
      // Handle different routes
      if (url.pathname === '/') {
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Module Federation + Cloudflare Workers</title>
              <meta charset="utf-8">
            </head>
            <body>
              <h1>Module Federation + Rsbuild + Cloudflare Workers</h1>
              <p>Try these endpoints:</p>
              <ul>
                <li><a href="/hello">/hello</a> - Simple text greeting</li>
                <li><a href="/hello?name=Developer&message=Welcome">/hello?name=Developer&message=Welcome</a> - Custom greeting</li>
                <li><a href="/formatted">/formatted</a> - JSON formatted response</li>
                <li><a href="/response">/response</a> - Full response object</li>
                <li><a href="/html">/html</a> - HTML formatted response</li>
              </ul>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      if (url.pathname === '/hello') {
        const name = url.searchParams.get('name');
        const message = url.searchParams.get('message');
        const result = helloWorld({ name, message });
        
        return new Response(result, {
          headers: { 'Content-Type': 'text/plain' }
        });
      }
      
      if (url.pathname === '/formatted') {
        const name = url.searchParams.get('name');
        const message = url.searchParams.get('message');
        const result = helloWorldFormatted({ name, message });
        
        return new Response(result, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.pathname === '/response') {
        const name = url.searchParams.get('name');
        const message = url.searchParams.get('message');
        const result = helloWorldResponse({ name, message });
        
        return new Response(JSON.stringify(result, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      if (url.pathname === '/html') {
        const name = url.searchParams.get('name');
        const message = url.searchParams.get('message');
        const result = helloWorldResponse({ name, message });
        
        return new Response(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Module Federation Demo</title>
              <meta charset="utf-8">
            </head>
            <body>
              ${result.html}
              <br><br>
              <a href="/">← Back to home</a>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response('Not Found', { status: 404 });
      
    } catch (error) {
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  },
};