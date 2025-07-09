export interface HelloWorldProps {
  name?: string;
  message?: string;
}

// Simple function that returns text - perfect for Cloudflare Workers
export function helloWorld(props: HelloWorldProps = {}): string {
  const name = props.name || 'World';
  const message = props.message || 'Hello';
  return `${message}, ${name}!`;
}

// More advanced function that returns formatted text
export function helloWorldFormatted(props: HelloWorldProps = {}): string {
  const name = props.name || 'World';
  const message = props.message || 'Hello';
  const timestamp = new Date().toISOString();
  
  return JSON.stringify({
    greeting: `${message}, ${name}!`,
    timestamp,
    source: 'Module Federation + Rsbuild + Cloudflare Workers',
    props: { name, message }
  }, null, 2);
}

// Function that can be used in Cloudflare Workers Response
export function helloWorldResponse(props: HelloWorldProps = {}): {
  text: string;
  html: string;
  json: object;
} {
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
}

// Default export - simple function
export default helloWorld;