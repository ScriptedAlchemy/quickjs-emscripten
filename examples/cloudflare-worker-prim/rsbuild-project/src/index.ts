import './index.css';
import { helloWorld, helloWorldFormatted, helloWorldResponse } from './components/HelloWorld';

// Demo the functions for browser testing
const rootEl = document.querySelector('#root');
if (rootEl) {
  rootEl.innerHTML = `
    <div class="content">
      <h1>Rsbuild + Module Federation + Cloudflare Workers</h1>
      <p>This app exposes HelloWorld functions via Module Federation with ESM output for Cloudflare Workers.</p>
      
      <div style="margin: 20px 0;">
        <h3>Simple Function:</h3>
        <code>${helloWorld({ name: 'Module Federation', message: 'Hello from Rsbuild' })}</code>
      </div>
      
      <div style="margin: 20px 0;">
        <h3>Formatted Function:</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto;">${helloWorldFormatted({ name: 'Cloudflare Workers', message: 'Greetings from' })}</pre>
      </div>
      
      <div style="margin: 20px 0;">
        <h3>Response Function (HTML):</h3>
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
          ${helloWorldResponse({ name: 'Developer', message: 'Welcome' }).html}
        </div>
      </div>
      
      <div style="margin: 20px 0; font-size: 14px; color: #666;">
        <p><strong>Module Federation Exposed:</strong></p>
        <ul>
          <li><code>./HelloWorld</code> - Default function (simple greeting)</li>
          <li><code>helloWorld</code> - Simple text function</li>
          <li><code>helloWorldFormatted</code> - JSON formatted function</li>
          <li><code>helloWorldResponse</code> - Multi-format response function</li>
        </ul>
      </div>
    </div>
  `;
}

// For Cloudflare Workers usage, these functions are available:
// import('./remoteEntry.js').then(module => {
//   const { helloWorld } = module;
//   console.log(helloWorld({ name: 'World', message: 'Hello' }));
// });
