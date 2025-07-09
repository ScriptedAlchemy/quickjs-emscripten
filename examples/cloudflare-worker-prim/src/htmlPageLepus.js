// HTML page template exported as a string for the Module Federation interface
import { css } from './styles.js';

export const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Module Federation + Workers</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="Edge Module Federation - Cloudflare Workers">
    <meta property="og:description" content="Dynamic Module Federation with Cloudflare Workers. Execute JavaScript modules at the edge with secure sandboxing, real-time API integration, and micro-frontend architecture.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://cloudflare-workers.example.com">
    <meta property="og:image" content="https://cloudflare-workers.example.com/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="Edge Module Federation">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Edge Module Federation - Cloudflare Workers">
    <meta name="twitter:description" content="Dynamic Module Federation with Cloudflare Workers. Execute JavaScript modules at the edge with secure sandboxing and real-time API integration.">
    <meta name="twitter:image" content="https://cloudflare-workers.example.com/og-image.png">
    <meta name="twitter:image:alt" content="Edge Module Federation architecture diagram">
    
    <!-- Additional SEO Meta Tags -->
    <meta name="description" content="Edge Module Federation on Cloudflare Workers - Execute JavaScript modules dynamically at the edge with secure sandboxing, Module Federation architecture, and real-time API integration.">
    <meta name="keywords" content="Module Federation, Cloudflare Workers, Edge Computing, Micro-frontends, JavaScript, Dynamic Module Loading, Serverless, Edge Runtime">
    <meta name="author" content="Edge Module Federation Team">
    <meta name="robots" content="index, follow">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://cloudflare-workers.example.com">
    
    <style>
        ${css}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Edge Module Federation</h1>
            <p>Cloudflare Workers with Dynamic Module Execution</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>🧪 Module Federation Tests</h2>
                <div class="test-grid">
                    <a href="/arena-test" class="test-card">
                        <h3>Simple Module Test</h3>
                        <p>Dynamic Module Federation test demonstrating the working pattern with HelloWorld module.</p>
                        <span class="test-status status-working">✅ Working</span>
                    </a>

                    <a href="/test-module" class="test-card">
                        <h3>Comprehensive Test</h3>
                        <p>Full dynamic test of all Module Federation modules: HelloWorld, DataProcessor, WorkerUtils, and AdvancedExamples.</p>
                        <span class="test-status status-working">✅ Working</span>
                    </a>

                    <a href="/test-fetch" class="test-card">
                        <h3>External API Fetch Test</h3>
                        <p>Test FetchUtils module making real external API calls to JSONPlaceholder from within QuickJS.</p>
                        <span class="test-status status-working">🌐 External API</span>
                    </a>

                    <a href="/test-real-fetch" class="test-card">
                        <h3>🚀 Real External API Fetch Test</h3>
                        <p>Live external API calls to JSONPlaceholder with real data fetching, user creation, and comprehensive testing.</p>
                        <span class="test-status status-working">🌐 Live API</span>
                    </a>

                    <a href="/federation-demo" class="test-card">
                        <h3>Federation Demo</h3>
                        <p>Overview of Module Federation capabilities and available exposed modules.</p>
                        <span class="test-status status-demo">ℹ️ Info</span>
                    </a>
                </div>
            </div>

            <div class="section">
                <h2>📦 Module Federation Assets</h2>
                <div class="test-grid">
                    <a href="/remoteEntry.js" class="test-card">
                        <h3>Remote Entry</h3>
                        <p>Main Module Federation entry point that bootstraps the federated modules.</p>
                        <span class="test-status status-demo">📄 File</span>
                    </a>

                    <a href="/assets/__federation_expose_HelloWorld.js" class="test-card">
                        <h3>HelloWorld Module</h3>
                        <p>Exposed HelloWorld module with greeting functions.</p>
                        <span class="test-status status-demo">📄 File</span>
                    </a>

                    <a href="/assets/__federation_expose_DataProcessor.js" class="test-card">
                        <h3>DataProcessor Module</h3>
                        <p>Data manipulation utilities for processing and aggregating data.</p>
                        <span class="test-status status-demo">📄 File</span>
                    </a>
                </div>
            </div>

                        <div class="section">
                <h2>🔧 Dynamic Code Execution</h2>
                <p style="margin-bottom: 20px;">Execute arbitrary JavaScript code in a secure, sandboxed environment:</p>
                <div class="info-notice" style="background: #f1f5f9; border-left: 4px solid #4338ca; padding: 15px; margin-bottom: 20px; border-radius: 6px; color: #1e293b;">
                    <p style="margin: 0; color: #1e293b; font-size: 0.95rem; line-height: 1.5;">
                        <strong>📢 IO Restrictions:</strong> We deliberately disable network access, file system operations, and external APIs in this dynamic code evaluation demonstration to prevent abuse of the public endpoint. However, full IO capabilities can be enabled when needed and are fully available for federation modules which run with complete access to fetch, KV storage, and other Cloudflare Worker APIs.
                    </p>
                </div>

                <div class="code-executor">
                    <div class="code-input-section">
                        <label for="user-code">JavaScript Code (No fetch/IO access):</label>
                        <textarea id="user-code" placeholder="// Enter your JavaScript code here...
// Examples:
// console.log('Hello, World!');
// const result = [1, 2, 3].map(x => x * 2);
// result; // Last expression is returned

const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = doubled.reduce((a, b) => a + b, 0);
console.log('Numbers:', numbers);
console.log('Doubled:', doubled);
console.log('Sum:', sum);
({ original: numbers, doubled, sum });">const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
const sum = doubled.reduce((a, b) => a + b, 0);
console.log('Numbers:', numbers);
console.log('Doubled:', doubled);
console.log('Sum:', sum);
({ original: numbers, doubled, sum });</textarea>
                        <div class="code-controls">
                            <button onclick="executeUserCode()" class="execute-btn" id="code-execute-btn">Execute Code</button>
                            <button onclick="clearCode()" class="clear-btn">Clear</button>
                        </div>
                        <div class="sandbox-notice">
                            🔒 <strong>Sandboxed Environment:</strong> No network access, no file system, no external APIs.
                            Pure JavaScript computation only.
                        </div>
                    </div>
                    <div id="code-result" class="result-display"></div>
                </div>
            </div>

            <div class="section">
                <h2>🎮 Interactive Module Execution</h2>
                <p style="margin-bottom: 20px;">Execute Module Federation modules directly with custom parameters:</p>

                <div class="interactive-section">
                    <div class="module-executor">
                        <h3>HelloWorld Module</h3>
                        <div class="input-group">
                            <label for="hello-name">Name:</label>
                            <input type="text" id="hello-name" value="Interactive User" placeholder="Enter your name">
                        </div>
                        <div class="input-group">
                            <label for="hello-message">Message:</label>
                            <input type="text" id="hello-message" value="Greetings from" placeholder="Enter message">
                        </div>
                        <button onclick="executeHelloWorld()" class="execute-btn">Execute HelloWorld</button>
                        <div id="hello-result" class="result-display"></div>
                    </div>

                    <div class="module-executor">
                        <h3>DataProcessor Module</h3>
                        <div class="input-group">
                            <label for="data-count">Sample Data Count:</label>
                            <input type="number" id="data-count" value="5" min="1" max="20">
                        </div>
                        <button onclick="executeDataProcessor()" class="execute-btn">Generate & Process Data</button>
                        <div id="data-result" class="result-display"></div>
                    </div>

                    <div class="module-executor">
                        <h3>WorkerUtils Module</h3>
                        <div class="input-group">
                            <label for="route-path">Route Path:</label>
                            <input type="text" id="route-path" value="/health" placeholder="Enter route path">
                        </div>
                        <button onclick="executeWorkerUtils()" class="execute-btn">Test Route Handler</button>
                        <div id="worker-result" class="result-display"></div>
                    </div>

                    <div class="module-executor">
                        <h3>FetchUtils Module</h3>
                        <div class="input-group">
                            <label for="posts-count">Posts Count:</label>
                            <input type="number" id="posts-count" value="3" min="1" max="10">
                        </div>
                        <button onclick="executeFetchUtils()" class="execute-btn">Fetch External API Data</button>
                        <div id="fetch-result" class="result-display"></div>
                    </div>

                </div>
            </div>


            <div class="section">
                <h2>📚 API Documentation</h2>
                <p style="margin-bottom: 20px;">Use these REST API endpoints to execute code and modules programmatically:</p>

                <div class="api-documentation" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; color: #1e293b;">
                    <div style="margin-bottom: 25px;">
                        <h4 style="color: #1e293b; margin-bottom: 10px;">🔧 Code Execution</h4>
                        <div style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; margin-bottom: 15px;">
                            <div><strong>POST</strong> /code</div>
                            <div style="margin-top: 8px; color: #94a3b8;">Content-Type: application/json</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Request Body:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "code": "const result = [1, 2, 3].map(x => x * 2); console.log('Result:', result); result;"
}</code></pre>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Response:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "result": [2, 4, 6],
  "logs": ["[VM] Result: 2,4,6"],
  "success": true,
  "executionTime": 45
}</code></pre>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h4 style="color: #1e293b; margin-bottom: 10px;">🚀 Module Execution</h4>
                        <div style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; margin-bottom: 15px;">
                            <div><strong>POST</strong> /execute-module</div>
                            <div style="margin-top: 8px; color: #94a3b8;">Content-Type: application/json</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Request Body:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "module": "HelloWorld",
  "function": "helloWorld",
  "params": {"name": "API User", "message": "Hello from API"}
}</code></pre>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Response:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "success": true,
  "execution": {
    "result": "Hello, API User! Hello from API",
    "module": "HelloWorld",
    "function": "helloWorld"
  },
  "logs": ["[VM] Module execution completed"],
  "iterations": 3
}</code></pre>
                        </div>
                    </div>

                    <div style="color: #1e293b; font-size: 0.9rem;">
                        <strong>💡 Usage Examples:</strong>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            <li>Mathematical calculations and data processing</li>
                            <li>String manipulation and text analysis</li>
                            <li>Algorithm testing and prototyping</li>
                            <li>Module Federation execution with parameters</li>
                            <li>External API data fetching via FetchUtils module</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📖 How It Works</h2>
                <p style="margin-bottom: 20px;">This Cloudflare Worker demonstrates advanced Module Federation patterns running on the edge:</p>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🏗️ Module Federation Architecture</h3>
                    <p style="margin-bottom: 15px;">Module Federation enables micro-frontend architecture where modules can be developed, built, and deployed independently while sharing runtime dependencies and state.</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Federated Modules:</strong> Each module (HelloWorld, DataProcessor, WorkerUtils, FetchUtils) is built as an independent bundle with its own dependencies</li>
                        <li><strong>Remote Entry:</strong> The main federation entry point that orchestrates module loading and dependency resolution</li>
                        <li><strong>Shared Dependencies:</strong> Common libraries are shared across modules to reduce bundle size and prevent duplication</li>
                        <li><strong>Dynamic Imports:</strong> Modules are loaded on-demand at runtime, enabling true code splitting and lazy loading</li>
                    </ul>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🔧 Build Process & Asset Management</h3>
                    <p style="margin-bottom: 15px;">The federation setup uses Rsbuild (based on Rspack) to create optimized, federated bundles:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Rsbuild Configuration:</strong> Defines module federation settings, exposed modules, and shared dependencies</li>
                        <li><strong>Code Splitting:</strong> Each federated module is split into separate chunks for optimal loading</li>
                        <li><strong>Asset Optimization:</strong> Modules are minified, compressed, and optimized for edge delivery</li>
                        <li><strong>KV Storage:</strong> Built federation assets are stored in Cloudflare KV for global distribution and fast access</li>
                    </ul>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🌐 Edge Runtime Execution</h3>
                    <p style="margin-bottom: 15px;">The Worker runtime provides a secure, isolated environment for dynamic module execution:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Sandboxed Environment:</strong> Each module execution runs in an isolated context with controlled access to APIs</li>
                        <li><strong>Dynamic Module Loading:</strong> Modules are fetched from KV storage and instantiated at runtime</li>
                        <li><strong>Cross-Context Communication:</strong> Secure parameter passing and result marshalling between execution contexts</li>
                        <li><strong>Resource Management:</strong> Automatic cleanup of execution contexts and memory management</li>
                    </ul>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🔄 Federation Lifecycle</h3>
                    <p style="margin-bottom: 15px;">The complete federation process from request to response:</p>
                    <div style="background: #f8fafc; border-left: 4px solid #4338ca; padding: 15px; margin-bottom: 20px; border-radius: 6px;">
                        <ol style="margin-left: 20px; line-height: 1.8;">
                            <li><strong>Module Resolution:</strong> Worker identifies which federated module to load based on request</li>
                            <li><strong>Asset Retrieval:</strong> Module bundle is fetched from KV storage with edge caching</li>
                            <li><strong>Runtime Instantiation:</strong> Module code is loaded and initialized in secure execution context</li>
                            <li><strong>Function Execution:</strong> Target function is called with sanitized parameters</li>
                            <li><strong>Result Marshalling:</strong> Execution results are serialized and returned to client</li>
                            <li><strong>Context Cleanup:</strong> Execution environment is cleaned up to prevent memory leaks</li>
                        </ol>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🛡️ Security & Isolation</h3>
                    <p style="margin-bottom: 15px;">Multiple layers of security ensure safe execution of federated modules:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Execution Sandboxing:</strong> Modules run in isolated environments with limited access to system resources</li>
                        <li><strong>API Restrictions:</strong> Controlled access to external APIs and network resources based on module permissions</li>
                        <li><strong>Parameter Validation:</strong> Input sanitization and type checking prevent code injection attacks</li>
                        <li><strong>Memory Limits:</strong> Resource quotas prevent modules from consuming excessive memory or CPU</li>
                    </ul>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">⚡ Performance Optimizations</h3>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Edge Caching:</strong> Federated modules are cached globally for sub-50ms load times</li>
                        <li><strong>Lazy Loading:</strong> Modules are loaded only when needed, reducing initial bundle size</li>
                        <li><strong>Shared Dependencies:</strong> Common libraries are loaded once and shared across modules</li>
                        <li><strong>Bundle Optimization:</strong> Tree shaking and dead code elimination reduce module size</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Powered by Cloudflare Workers • Built with Module Federation</p>
            <div class="tech-stack">
                <span class="tech-badge">Module Federation</span>
                <span class="tech-badge">Rsbuild</span>
                <span class="tech-badge">Cloudflare Workers</span>
                <span class="tech-badge">KV Storage</span>
            </div>
        </div>
    </div>

    <script>

        async function executeHelloWorld() {
            const name = document.getElementById('hello-name').value;
            const message = document.getElementById('hello-message').value;
            const button = event.target;

            const params = { name, message };
            await executeModuleFederation('HelloWorld', 'helloWorld', params, 'hello-result', button, 'Execute HelloWorld');
        }

        async function executeDataProcessor() {
            const count = parseInt(document.getElementById('data-count').value) || 5;
            const button = event.target;

            // DataProcessor.generateSampleData expects a simple number, not an object
            const params = count;
            await executeModuleFederation('DataProcessor', 'generateSampleData', params, 'data-result', button, 'Generate & Process Data');
        }

        async function executeWorkerUtils() {
            const routePath = document.getElementById('route-path').value || '/health';
            const button = event.target;

            // WorkerUtils.routeHandler expects a simple string, not an object
            const params = routePath;
            await executeModuleFederation('WorkerUtils', 'routeHandler', params, 'worker-result', button, 'Test Route Handler');
        }

        async function executeFetchUtils() {
            const count = parseInt(document.getElementById('posts-count').value) || 3;
            const button = event.target;

            // FetchUtils.demonstrateFetchCapabilities expects an empty object (it doesn't use count parameter)
            const params = {};
            await executeModuleFederation('FetchUtils', 'demonstrateFetchCapabilities', params, 'fetch-result', button, 'Fetch External API Data');
        }

        // Utility function to escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Copy result to clipboard
        function copyResult(button) {
            const resultElement = button.closest('.result-display');
            let textToCopy = '';

            // Extract text content from the result display
            const logEntries = resultElement.querySelectorAll('.log-entry');
            if (logEntries.length > 0) {
                textToCopy += '=== Console Logs ===\\n';
                logEntries.forEach(entry => {
                    textToCopy += entry.textContent + '\\n';
                });
                textToCopy += '\\n';
            }

            const resultContent = resultElement.querySelector('.result-content, .error-content');
            if (resultContent) {
                if (resultElement.classList.contains('error')) {
                    textToCopy += '=== Error ===\\n';
                } else {
                    textToCopy += '=== Result ===\\n';
                }
                textToCopy += resultContent.textContent;
            }

            // Copy to clipboard
            navigator.clipboard.writeText(textToCopy).then(() => {
                // Show feedback
                const originalText = button.textContent;
                button.textContent = '✅ Copied!';
                button.disabled = true;
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                button.textContent = '❌ Failed';
                setTimeout(() => {
                    button.textContent = '📋 Copy';
                }, 2000);
            });
        }

        async function executeUserCode() {
            const codeTextarea = document.getElementById('user-code');
            const resultElement = document.getElementById('code-result');
            const button = document.getElementById('code-execute-btn');
            const originalText = button.textContent;

            const code = codeTextarea.value.trim();

            if (!code) {
                resultElement.className = 'result-display error';
                resultElement.textContent = 'Please enter some JavaScript code to execute.';
                return;
            }

            // Start timing
            const startTime = performance.now();

            // Show loading state
            button.disabled = true;
            button.textContent = 'Executing...';
            resultElement.className = 'result-display loading';
            resultElement.textContent = 'Executing code in sandboxed environment...';

            try {
                const response = await fetch('/code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code: code })
                });
                const data = await response.json();

                // Calculate total request time
                const totalTime = Math.round(performance.now() - startTime);

                console.log('Code Execution Response:', data); // Debug logging

                                if (data.result !== undefined || data.logs) {
                    resultElement.className = 'result-display success';

                    // Create structured HTML output
                    let htmlOutput = '';

                    // Show execution info
                    htmlOutput += '<div class="execution-header">';
                    htmlOutput += '<span class="execution-badge success">✅ Executed Successfully</span>';
                    htmlOutput += '<div class="execution-actions">';
                    htmlOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    if (data.executionTime) {
                        htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #6b7280;">🔧 ' + data.executionTime + 'ms execution</span>';
                    }
                    htmlOutput += '</div>';
                    htmlOutput += '</div>';

                    // Show logs if any
                    if (data.logs && data.logs.length > 0) {
                        htmlOutput += '<div class="logs-section">';
                        htmlOutput += '<div class="section-header">📝 Console Logs</div>';
                        htmlOutput += '<div class="logs-content">';
                        data.logs.forEach(log => {
                            const cleanLog = log.replace(/\\[VM\\]\\s*/, '');
                            htmlOutput += '<div class="log-entry">' + escapeHtml(cleanLog) + '</div>';
                        });
                        htmlOutput += '</div></div>';
                    }

                    // Show result
                    if (data.result !== undefined) {
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">📊 Result</div>';
                        htmlOutput += '<div class="result-content">';

                        if (typeof data.result === 'object') {
                            htmlOutput += '<pre class="json-result">' + escapeHtml(JSON.stringify(data.result, null, 2)) + '</pre>';
                        } else if (typeof data.result === 'string') {
                            htmlOutput += '<div class="string-result">"' + escapeHtml(data.result) + '"</div>';
                        } else {
                            htmlOutput += '<div class="primitive-result">' + escapeHtml(String(data.result)) + '</div>';
                        }

                        htmlOutput += '</div></div>';
                    } else if (data.error) {
                        resultElement.className = 'result-display error';
                        htmlOutput = '<div class="execution-header">';
                        htmlOutput += '<span class="execution-badge error">❌ Execution Error</span>';
                        htmlOutput += '<div class="execution-actions">';
                        htmlOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                        htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                        htmlOutput += '</div>';
                        htmlOutput += '</div>';
                        htmlOutput += '<div class="error-section">';
                        htmlOutput += '<div class="section-header">⚠️ Error Details</div>';
                        htmlOutput += '<div class="error-content">' + escapeHtml(data.error) + '</div>';
                        htmlOutput += '</div>';
                    } else if (!data.logs || data.logs.length === 0) {
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">✅ Success</div>';
                        htmlOutput += '<div class="result-content">Code executed successfully (no return value)</div>';
                        htmlOutput += '</div>';
                    }

                    resultElement.innerHTML = htmlOutput;
                                } else if (data.error) {
                    resultElement.className = 'result-display error';
                    let errorOutput = '<div class="execution-header">';
                    errorOutput += '<span class="execution-badge error">❌ Execution Failed</span>';
                    errorOutput += '<div class="execution-actions">';
                    errorOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    errorOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    errorOutput += '</div>';
                    errorOutput += '</div>';
                    errorOutput += '<div class="error-section">';
                    errorOutput += '<div class="section-header">⚠️ Error Details</div>';
                    errorOutput += '<div class="error-content">' + escapeHtml(data.error) + '</div>';
                    if (data.context || data.stack) {
                        errorOutput += '<div class="debug-section">';
                        errorOutput += '<div class="section-header">🔍 Debug Information</div>';
                        errorOutput += '<pre class="debug-content">' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
                        errorOutput += '</div>';
                    }
                    errorOutput += '</div>';
                    resultElement.innerHTML = errorOutput;
                } else {
                    resultElement.className = 'result-display error';
                    let unexpectedOutput = '<div class="execution-header">';
                    unexpectedOutput += '<span class="execution-badge error">⚠️ Unexpected Response</span>';
                    unexpectedOutput += '<div class="execution-actions">';
                    unexpectedOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    unexpectedOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    unexpectedOutput += '</div>';
                    unexpectedOutput += '</div>';
                    unexpectedOutput += '<div class="error-section">';
                    unexpectedOutput += '<div class="section-header">📋 Raw Response</div>';
                    unexpectedOutput += '<pre class="debug-content">' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
                    unexpectedOutput += '</div>';
                    resultElement.innerHTML = unexpectedOutput;
                }
            } catch (error) {
                const totalTime = Math.round(performance.now() - startTime);
                resultElement.className = 'result-display error';
                let networkErrorOutput = '<div class="execution-header">';
                networkErrorOutput += '<span class="execution-badge error">🌐 Network Error</span>';
                networkErrorOutput += '<div class="execution-actions">';
                networkErrorOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                networkErrorOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                networkErrorOutput += '</div>';
                networkErrorOutput += '</div>';
                networkErrorOutput += '<div class="error-section">';
                networkErrorOutput += '<div class="section-header">⚠️ Connection Problem</div>';
                networkErrorOutput += '<div class="error-content">' + escapeHtml(error.message) + '</div>';
                networkErrorOutput += '<div class="error-help">This could indicate a problem with the code execution endpoint or your network connection.</div>';
                networkErrorOutput += '</div>';
                resultElement.innerHTML = networkErrorOutput;
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        }

        function clearCode() {
            const codeTextarea = document.getElementById('user-code');
            const resultElement = document.getElementById('code-result');

            codeTextarea.value = '';
            resultElement.className = 'result-display';
            resultElement.textContent = '';
        }

        async function executeModuleFederation(module, func, params, resultElementId, button, originalText) {
            const resultElement = document.getElementById(resultElementId);

            // Start timing
            const startTime = performance.now();

            // Show loading state
            button.disabled = true;
            button.textContent = 'Executing...';
            resultElement.className = 'result-display loading';
            resultElement.textContent = 'Executing real Module Federation...';

            try {
                const response = await fetch('/execute-module', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        module: module,
                        function: func,
                        params: params
                    })
                });
                const data = await response.json();

                // Calculate total request time
                const totalTime = Math.round(performance.now() - startTime);

                console.log('API Response:', data); // Debug logging

                if (data.success) {
                    resultElement.className = 'result-display success';

                    // Create structured HTML output (same as code execution)
                    let htmlOutput = '';

                    // Show execution info
                    htmlOutput += '<div class="execution-header">';
                    htmlOutput += '<span class="execution-badge success">✅ Module Executed Successfully</span>';
                    htmlOutput += '<div class="execution-actions">';
                    htmlOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    htmlOutput += '</div>';
                    htmlOutput += '</div>';

                    // Show module execution details
                    if (data.execution && data.execution.module) {
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">🚀 Module Execution Details</div>';
                        htmlOutput += '<div class="result-content">';
                        htmlOutput += '<div class="execution-details">';
                        htmlOutput += '<div><strong>Module:</strong> ' + escapeHtml(data.execution.module) + '</div>';
                        htmlOutput += '<div><strong>Function:</strong> ' + escapeHtml(data.execution.function) + '</div>';
                        htmlOutput += '</div>';
                        htmlOutput += '</div></div>';

                        // Show result
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">📊 Result</div>';
                        htmlOutput += '<div class="result-content">';

                        if (typeof data.execution.result === 'object') {
                            htmlOutput += '<pre class="json-result">' + escapeHtml(JSON.stringify(data.execution.result, null, 2)) + '</pre>';
                        } else if (typeof data.execution.result === 'string') {
                            htmlOutput += '<div class="string-result">"' + escapeHtml(data.execution.result) + '"</div>';
                        } else {
                            htmlOutput += '<div class="primitive-result">' + escapeHtml(String(data.execution.result)) + '</div>';
                        }

                        htmlOutput += '</div></div>';
                    } else {
                        // Fallback for different response structure
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">📋 Full Response</div>';
                        htmlOutput += '<div class="result-content">';
                        htmlOutput += '<pre class="json-result">' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
                        htmlOutput += '</div></div>';
                    }

                    resultElement.innerHTML = htmlOutput;
                } else {
                    resultElement.className = 'result-display error';
                    let errorOutput = '<div class="execution-header">';
                    errorOutput += '<span class="execution-badge error">❌ Module Execution Failed</span>';
                    errorOutput += '<div class="execution-actions">';
                    errorOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    errorOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    errorOutput += '</div>';
                    errorOutput += '</div>';
                    errorOutput += '<div class="error-section">';
                    errorOutput += '<div class="section-header">⚠️ Error Details</div>';
                    errorOutput += '<div class="error-content">' + escapeHtml(data.error || 'Unknown error') + '</div>';
                    if (data.execution || data.context) {
                        errorOutput += '<div class="debug-section">';
                        errorOutput += '<div class="section-header">🔍 Debug Information</div>';
                        errorOutput += '<pre class="debug-content">' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
                        errorOutput += '</div>';
                    }
                    errorOutput += '</div>';
                    resultElement.innerHTML = errorOutput;
                }
            } catch (error) {
                const totalTime = Math.round(performance.now() - startTime);
                resultElement.className = 'result-display error';
                let networkErrorOutput = '<div class="execution-header">';
                networkErrorOutput += '<span class="execution-badge error">🌐 Network Error</span>';
                networkErrorOutput += '<div class="execution-actions">';
                networkErrorOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                networkErrorOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                networkErrorOutput += '</div>';
                networkErrorOutput += '</div>';
                networkErrorOutput += '<div class="error-section">';
                networkErrorOutput += '<div class="section-header">⚠️ Connection Problem</div>';
                networkErrorOutput += '<div class="error-content">' + escapeHtml(error.message) + '</div>';
                if (error.stack) {
                    networkErrorOutput += '<div class="debug-section">';
                    networkErrorOutput += '<div class="section-header">🔍 Stack Trace</div>';
                    networkErrorOutput += '<pre class="debug-content">' + escapeHtml(error.stack) + '</pre>';
                    networkErrorOutput += '</div>';
                }
                networkErrorOutput += '</div>';
                resultElement.innerHTML = networkErrorOutput;
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        }


        // Initialize button text storage
        document.addEventListener('DOMContentLoaded', function() {
            const buttons = document.querySelectorAll('.execute-btn');
            buttons.forEach(button => {
                button.setAttribute('data-original-text', button.textContent);
            });
        });
    </script>
</body>
</html>`;

export default htmlPage;