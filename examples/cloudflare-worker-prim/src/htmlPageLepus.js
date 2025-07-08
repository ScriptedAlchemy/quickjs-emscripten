// HTML page template for LEPUS/PrimJS Module Federation interface
import { css } from './styles.js';

export const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LEPUS/PrimJS Module Federation + Workers</title>
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:title" content="LEPUS/PrimJS Edge Module Federation - Cloudflare Workers">
    <meta property="og:description" content="Native LEPUS/PrimJS Module Federation with Cloudflare Workers. Execute JavaScript modules at the edge with garbage collection, secure sandboxing, and micro-frontend architecture.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://cloudflare-workers-example.federation.workers.dev">
    <meta property="og:image" content="https://cloudflare-workers-example.federation.workers.dev/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="LEPUS/PrimJS Edge Module Federation">
    <meta property="og:locale" content="en_US">
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="LEPUS/PrimJS Edge Module Federation - Cloudflare Workers">
    <meta name="twitter:description" content="Native LEPUS/PrimJS Module Federation with Cloudflare Workers. Execute JavaScript modules at the edge with garbage collection and secure sandboxing.">
    <meta name="twitter:image" content="https://cloudflare-workers-example.federation.workers.dev/og-image.png">
    <meta name="twitter:image:alt" content="LEPUS/PrimJS Edge Module Federation architecture diagram">
    
    <!-- Additional SEO Meta Tags -->
    <meta name="description" content="LEPUS/PrimJS Edge Module Federation on Cloudflare Workers - Execute JavaScript modules dynamically at the edge with native LEPUS API, garbage collection, Module Federation architecture, and secure sandboxing.">
    <meta name="keywords" content="LEPUS, PrimJS, Module Federation, Cloudflare Workers, Edge Computing, Micro-frontends, JavaScript, Garbage Collection, Serverless, Edge Runtime">
    <meta name="author" content="LEPUS/PrimJS Edge Module Federation Team">
    <meta name="robots" content="index, follow">
    
    <!-- Canonical URL -->
    <link rel="canonical" href="https://cloudflare-workers-example.federation.workers.dev">
    
    <style>
        ${css}
        
        /* Additional LEPUS-specific styles */
        .lepus-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #ff6b6b;
            color: white;
            border-radius: 20px;
            font-size: 0.8em;
            margin-left: 10px;
            font-weight: 600;
        }
        
        .gc-badge {
            display: inline-block;
            padding: 4px 12px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-size: 0.8em;
            margin-left: 5px;
        }
        
        .precompiled-notice {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 6px;
            color: #92400e;
        }
        
        .operation-badge {
            display: inline-block;
            padding: 2px 8px;
            background: #e0e7ff;
            color: #4338ca;
            border-radius: 4px;
            font-size: 0.85em;
            font-family: 'Courier New', monospace;
            margin: 2px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 LEPUS/PrimJS Edge Module Federation <span class="lepus-badge">Native Mode</span><span class="gc-badge">GC Enabled</span></h1>
            <p>Cloudflare Workers with Native LEPUS/PrimJS Execution</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>🧪 Pre-compiled Module Tests</h2>
                <div class="precompiled-notice">
                    <strong>⚡ Platform Note:</strong> Cloudflare Workers restricts dynamic code evaluation for security. 
                    LEPUS/PrimJS modules are pre-compiled and registered for safe execution while maintaining garbage collection benefits.
                </div>
                <div class="test-grid">
                    <a href="/execute-module?module=HelloWorld&function=greet" class="test-card">
                        <h3>HelloWorld Module</h3>
                        <p>Pre-compiled greeting module demonstrating LEPUS execution with parameters.</p>
                        <span class="test-status status-working">✅ Pre-compiled</span>
                    </a>

                    <a href="/execute-module?module=MathUtils&function=factorial" class="test-card">
                        <h3>MathUtils Module</h3>
                        <p>Mathematical operations including factorial, addition, and multiplication.</p>
                        <span class="test-status status-working">✅ Pre-compiled</span>
                    </a>

                    <a href="/execute-module?module=StringUtils&function=reverse" class="test-card">
                        <h3>StringUtils Module</h3>
                        <p>String manipulation utilities with reverse, capitalize, and repeat functions.</p>
                        <span class="test-status status-working">✅ Pre-compiled</span>
                    </a>

                    <a href="/federation-demo" class="test-card">
                        <h3>Federation Demo</h3>
                        <p>Overview of LEPUS/PrimJS Module Federation capabilities and available modules.</p>
                        <span class="test-status status-demo">ℹ️ Info</span>
                    </a>
                </div>
            </div>

            <div class="section">
                <h2>📦 LEPUS/PrimJS Module Assets</h2>
                <div class="test-grid">
                    <a href="/remoteEntry.js" class="test-card">
                        <h3>Remote Entry</h3>
                        <p>Main Module Federation entry point for LEPUS/PrimJS modules.</p>
                        <span class="test-status status-demo">📄 File</span>
                    </a>

                    <a href="/assets/__federation_expose_HelloWorld.js" class="test-card">
                        <h3>HelloWorld Module</h3>
                        <p>Pre-compiled HelloWorld module with LEPUS optimizations.</p>
                        <span class="test-status status-demo">📄 File</span>
                    </a>

                    <a href="/assets/__federation_expose_DataProcessor.js" class="test-card">
                        <h3>DataProcessor Module</h3>
                        <p>Data manipulation utilities optimized for LEPUS execution.</p>
                        <span class="test-status status-demo">📄 File</span>
                    </a>
                </div>
            </div>

            <div class="section">
                <h2>🔧 Pre-compiled Operations</h2>
                <p style="margin-bottom: 20px;">Execute pre-compiled operations using LEPUS/PrimJS:</p>
                <div class="info-notice" style="background: #f1f5f9; border-left: 4px solid #4338ca; padding: 15px; margin-bottom: 20px; border-radius: 6px; color: #1e293b;">
                    <p style="margin: 0; color: #1e293b; font-size: 0.95rem; line-height: 1.5;">
                        <strong>🎯 Available Operations:</strong> Simple arithmetic (<code>5 + 3</code>), 
                        math functions (<code>math.add(10, 5)</code>), 
                        string operations (<code>string.toUpperCase("hello")</code>), 
                        and JSON operations (<code>json.stringify({a: 1})</code>).
                    </p>
                </div>

                <div class="code-executor">
                    <div class="code-input-section">
                        <label for="user-code">Pre-compiled Operations:</label>
                        <textarea id="user-code" placeholder="// Enter pre-compiled operations...
// Examples:
// 5 + 3
// math.multiply(4, 7)
// string.concat('Hello', ' ', 'LEPUS')
// json.stringify({name: 'LEPUS', gc: true})

10 * 5">10 * 5</textarea>
                        <div class="code-controls">
                            <button onclick="executeUserCode()" class="execute-btn" id="code-execute-btn">Execute with LEPUS</button>
                            <button onclick="clearCode()" class="clear-btn">Clear</button>
                        </div>
                        <div class="sandbox-notice">
                            🚀 <strong>LEPUS/PrimJS Engine:</strong> Garbage collection enabled. Pre-compiled operations only.
                        </div>
                    </div>
                    <div id="code-result" class="result-display"></div>
                </div>
            </div>

            <div class="section">
                <h2>🎮 Interactive Module Execution</h2>
                <p style="margin-bottom: 20px;">Execute pre-registered LEPUS/PrimJS modules with custom parameters:</p>

                <div class="interactive-section">
                    <div class="module-executor">
                        <h3>HelloWorld Module</h3>
                        <div class="input-group">
                            <label for="hello-name">Name:</label>
                            <input type="text" id="hello-name" value="LEPUS User" placeholder="Enter your name">
                        </div>
                        <button onclick="executeHelloWorld()" class="execute-btn">Execute with LEPUS</button>
                        <div id="hello-result" class="result-display"></div>
                    </div>

                    <div class="module-executor">
                        <h3>MathUtils Module</h3>
                        <div class="input-group">
                            <label for="math-n">Calculate Factorial of:</label>
                            <input type="number" id="math-n" value="5" min="1" max="20">
                        </div>
                        <button onclick="executeMathUtils()" class="execute-btn">Calculate with LEPUS</button>
                        <div id="math-result" class="result-display"></div>
                    </div>

                    <div class="module-executor">
                        <h3>StringUtils Module</h3>
                        <div class="input-group">
                            <label for="string-text">Text:</label>
                            <input type="text" id="string-text" value="Hello LEPUS" placeholder="Enter text">
                        </div>
                        <div class="input-group">
                            <label for="string-operation">Operation:</label>
                            <select id="string-operation">
                                <option value="reverse">Reverse</option>
                                <option value="capitalize">Capitalize</option>
                                <option value="repeat">Repeat (3x)</option>
                            </select>
                        </div>
                        <button onclick="executeStringUtils()" class="execute-btn">Process with LEPUS</button>
                        <div id="string-result" class="result-display"></div>
                    </div>

                </div>
            </div>

            <div class="section">
                <h2>📚 LEPUS/PrimJS API Documentation</h2>
                <p style="margin-bottom: 20px;">Use these REST API endpoints to execute pre-compiled operations and modules:</p>

                <div class="api-documentation" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px; color: #1e293b;">
                    <div style="margin-bottom: 25px;">
                        <h4 style="color: #1e293b; margin-bottom: 10px;">🔧 Pre-compiled Operations</h4>
                        <div style="background: #1e293b; color: #e2e8f0; padding: 15px; border-radius: 6px; font-family: 'Courier New', monospace; margin-bottom: 15px;">
                            <div><strong>POST</strong> /code</div>
                            <div style="margin-top: 8px; color: #94a3b8;">Content-Type: application/json</div>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Request Body:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "code": "math.add(10, 20)"
}</code></pre>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Response:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "success": true,
  "result": 30,
  "engine": "LEPUS/PrimJS (Pre-compiled)",
  "gc_enabled": true,
  "execution_time_ms": 0,
  "timestamp": "2025-07-08T20:51:05.793Z",
  "note": "Cloudflare Workers restricts dynamic code evaluation. Using pre-compiled operations."
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
  "function": "greet",
  "params": {"name": "LEPUS API"}
}</code></pre>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <strong style="color: #1e293b;">Response:</strong>
                            <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; margin-top: 5px; overflow-x: auto; color: #1e293b;"><code>{
  "success": true,
  "result": "Hello, LEPUS API!",
  "module": "HelloWorld",
  "function": "greet",
  "engine": "LEPUS/PrimJS (Pre-compiled)",
  "gc_enabled": true,
  "timestamp": "2025-07-08T20:51:12.960Z",
  "available_modules": ["HelloWorld", "MathUtils", "StringUtils"]
}</code></pre>
                        </div>
                    </div>

                    <div style="color: #1e293b; font-size: 0.9rem;">
                        <strong>💡 Available Pre-compiled Operations:</strong>
                        <ul style="margin-left: 20px; margin-top: 8px;">
                            <li><span class="operation-badge">5 + 3</span> Simple arithmetic</li>
                            <li><span class="operation-badge">math.add(a, b)</span> Addition function</li>
                            <li><span class="operation-badge">math.multiply(a, b)</span> Multiplication</li>
                            <li><span class="operation-badge">math.sqrt(n)</span> Square root</li>
                            <li><span class="operation-badge">string.concat(...args)</span> String concatenation</li>
                            <li><span class="operation-badge">string.toUpperCase(str)</span> Convert to uppercase</li>
                            <li><span class="operation-badge">json.stringify(obj)</span> JSON serialization</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📖 How LEPUS/PrimJS Works on Cloudflare</h2>
                <p style="margin-bottom: 20px;">This Cloudflare Worker demonstrates LEPUS/PrimJS with Module Federation on the edge:</p>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🏗️ LEPUS/PrimJS Architecture</h3>
                    <p style="margin-bottom: 15px;">LEPUS is the native API for PrimJS, a high-performance JavaScript engine based on QuickJS with garbage collection instead of reference counting.</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Native API:</strong> Direct LEPUS API usage without QuickJS compatibility layer</li>
                        <li><strong>Garbage Collection:</strong> Automatic memory management with <code>runGC()</code> and <code>isGCMode()</code></li>
                        <li><strong>Pre-compiled Operations:</strong> Safe execution within Cloudflare's security constraints</li>
                        <li><strong>Module Registry:</strong> Pre-registered modules for secure execution</li>
                    </ul>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🔧 Pre-compilation Strategy</h3>
                    <p style="margin-bottom: 15px;">Due to Cloudflare's security restrictions on dynamic code evaluation, LEPUS modules are pre-compiled:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Operation Parser:</strong> Simple expressions are parsed and mapped to pre-compiled functions</li>
                        <li><strong>Module Registry:</strong> Modules are pre-registered with typed functions</li>
                        <li><strong>Safe Execution:</strong> All operations run without eval/Function constructors</li>
                        <li><strong>Performance:</strong> Pre-compiled operations execute with zero overhead</li>
                    </ul>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🌐 Edge Runtime Integration</h3>
                    <p style="margin-bottom: 15px;">LEPUS/PrimJS integrates seamlessly with Cloudflare Workers:</p>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>WASM Module:</strong> PrimJS compiled to WebAssembly for edge execution</li>
                        <li><strong>Global Distribution:</strong> LEPUS modules cached at edge locations worldwide</li>
                        <li><strong>Resource Management:</strong> Automatic garbage collection prevents memory leaks</li>
                        <li><strong>Security Sandbox:</strong> Runs within Cloudflare's secure V8 isolates</li>
                    </ul>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🔄 LEPUS Execution Flow</h3>
                    <div style="background: #f8fafc; border-left: 4px solid #4338ca; padding: 15px; margin-bottom: 20px; border-radius: 6px;">
                        <ol style="margin-left: 20px; line-height: 1.8;">
                            <li><strong>Initialize LEPUS:</strong> Create LEPUS module with <code>createLEPUSModule()</code></li>
                            <li><strong>Parse Operation:</strong> Map input to pre-compiled function or module</li>
                            <li><strong>Execute Safely:</strong> Run operation without dynamic evaluation</li>
                            <li><strong>Garbage Collection:</strong> Automatic cleanup with PrimJS GC</li>
                            <li><strong>Return Result:</strong> Serialize and return execution results</li>
                        </ol>
                    </div>
                </div>

                <div style="margin-bottom: 30px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">⚡ Performance Benefits</h3>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>Garbage Collection:</strong> No manual memory management needed</li>
                        <li><strong>Pre-compiled Speed:</strong> Zero parsing overhead for operations</li>
                        <li><strong>Edge Caching:</strong> WASM modules cached globally</li>
                        <li><strong>Native Performance:</strong> Direct LEPUS API without compatibility layers</li>
                    </ul>
                </div>

                <div style="margin-bottom: 20px;">
                    <h3 style="color: #4338ca; margin-bottom: 15px;">🛡️ Security & Limitations</h3>
                    <ul style="margin-left: 20px; margin-bottom: 20px; line-height: 1.6;">
                        <li><strong>No Dynamic Eval:</strong> Cloudflare prohibits eval/Function for security</li>
                        <li><strong>Pre-compiled Only:</strong> All operations must be pre-registered</li>
                        <li><strong>Type Safety:</strong> Input validation prevents injection attacks</li>
                        <li><strong>Resource Limits:</strong> Cloudflare's standard Worker limits apply</li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Powered by LEPUS/PrimJS on Cloudflare Workers • Native Garbage Collection</p>
            <div class="tech-stack">
                <span class="tech-badge">LEPUS Native API</span>
                <span class="tech-badge">PrimJS 2.11.1</span>
                <span class="tech-badge">Garbage Collection</span>
                <span class="tech-badge">Cloudflare Workers</span>
                <span class="tech-badge">Module Federation</span>
            </div>
        </div>
    </div>

    <script>
        // Utility function to escape HTML to prevent XSS
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        async function executeUserCode() {
            const codeTextarea = document.getElementById('user-code');
            const resultElement = document.getElementById('code-result');
            const button = document.getElementById('code-execute-btn');
            const originalText = button.textContent;

            const code = codeTextarea.value.trim();

            if (!code) {
                resultElement.className = 'result-display error';
                resultElement.textContent = 'Please enter a pre-compiled operation to execute.';
                return;
            }

            // Start timing
            const startTime = performance.now();

            // Show loading state
            button.disabled = true;
            button.textContent = 'Executing...';
            resultElement.className = 'result-display loading';
            resultElement.textContent = 'Executing with LEPUS/PrimJS...';

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

                console.log('LEPUS Execution Response:', data);

                if (data.success) {
                    resultElement.className = 'result-display success';

                    let htmlOutput = '';

                    // Show execution info
                    htmlOutput += '<div class="execution-header">';
                    htmlOutput += '<span class="execution-badge success">✅ LEPUS Execution Successful</span>';
                    htmlOutput += '<div class="execution-actions">';
                    htmlOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    if (data.execution_time_ms !== undefined) {
                        htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #6b7280;">🔧 ' + data.execution_time_ms + 'ms execution</span>';
                    }
                    if (data.gc_enabled) {
                        htmlOutput += '<span class="gc-badge" style="margin-left: 10px;">GC Enabled</span>';
                    }
                    htmlOutput += '</div>';
                    htmlOutput += '</div>';

                    // Show result
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

                    // Show engine info
                    if (data.engine || data.note) {
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">ℹ️ Engine Info</div>';
                        htmlOutput += '<div class="result-content" style="font-size: 0.9em; color: #6b7280;">';
                        if (data.engine) {
                            htmlOutput += '<div><strong>Engine:</strong> ' + escapeHtml(data.engine) + '</div>';
                        }
                        if (data.note) {
                            htmlOutput += '<div style="margin-top: 5px;">' + escapeHtml(data.note) + '</div>';
                        }
                        htmlOutput += '</div></div>';
                    }

                    resultElement.innerHTML = htmlOutput;
                } else {
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
                    errorOutput += '<div class="error-content">' + escapeHtml(data.error || 'Unknown error') + '</div>';
                    if (data.hint) {
                        errorOutput += '<div class="error-help" style="margin-top: 10px; font-size: 0.9em; color: #6b7280;">' + escapeHtml(data.hint) + '</div>';
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

        async function executeHelloWorld() {
            const name = document.getElementById('hello-name').value;
            const button = event.target;
            await executeModuleFederation('HelloWorld', 'greet', { name }, 'hello-result', button, 'Execute with LEPUS');
        }

        async function executeMathUtils() {
            const n = parseInt(document.getElementById('math-n').value) || 5;
            const button = event.target;
            await executeModuleFederation('MathUtils', 'factorial', { n }, 'math-result', button, 'Calculate with LEPUS');
        }

        async function executeStringUtils() {
            const text = document.getElementById('string-text').value;
            const operation = document.getElementById('string-operation').value;
            const button = event.target;
            
            let params = { text };
            if (operation === 'repeat') {
                params.times = 3;
            }
            
            await executeModuleFederation('StringUtils', operation, params, 'string-result', button, 'Process with LEPUS');
        }

        async function executeModuleFederation(module, func, params, resultElementId, button, originalText) {
            const resultElement = document.getElementById(resultElementId);

            // Start timing
            const startTime = performance.now();

            // Show loading state
            button.disabled = true;
            button.textContent = 'Executing...';
            resultElement.className = 'result-display loading';
            resultElement.textContent = 'Executing LEPUS/PrimJS Module...';

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

                console.log('LEPUS Module Response:', data);

                if (data.success) {
                    resultElement.className = 'result-display success';

                    let htmlOutput = '';

                    // Show execution info
                    htmlOutput += '<div class="execution-header">';
                    htmlOutput += '<span class="execution-badge success">✅ LEPUS Module Executed</span>';
                    htmlOutput += '<div class="execution-actions">';
                    htmlOutput += '<span class="execution-time">' + new Date().toLocaleTimeString() + '</span>';
                    htmlOutput += '<span class="timing-info" style="margin-left: 10px; font-size: 0.9em; color: #10b981;">⚡ ' + totalTime + 'ms total</span>';
                    if (data.gc_enabled) {
                        htmlOutput += '<span class="gc-badge" style="margin-left: 10px;">GC Enabled</span>';
                    }
                    htmlOutput += '</div>';
                    htmlOutput += '</div>';

                    // Show module info
                    htmlOutput += '<div class="result-section">';
                    htmlOutput += '<div class="section-header">🚀 Module Execution</div>';
                    htmlOutput += '<div class="result-content">';
                    htmlOutput += '<div class="execution-details">';
                    htmlOutput += '<div><strong>Module:</strong> ' + escapeHtml(data.module) + '</div>';
                    htmlOutput += '<div><strong>Function:</strong> ' + escapeHtml(data.function) + '</div>';
                    htmlOutput += '<div><strong>Engine:</strong> ' + escapeHtml(data.engine || 'LEPUS/PrimJS') + '</div>';
                    htmlOutput += '</div>';
                    htmlOutput += '</div></div>';

                    // Show result
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

                    // Show available modules
                    if (data.available_modules && data.available_modules.length > 0) {
                        htmlOutput += '<div class="result-section">';
                        htmlOutput += '<div class="section-header">📦 Available Modules</div>';
                        htmlOutput += '<div class="result-content" style="font-size: 0.9em;">';
                        data.available_modules.forEach(mod => {
                            htmlOutput += '<span class="operation-badge" style="margin-right: 5px;">' + escapeHtml(mod) + '</span>';
                        });
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
                    
                    if (data.available_modules && data.available_modules.length > 0) {
                        errorOutput += '<div class="error-help" style="margin-top: 10px;">';
                        errorOutput += '<strong>Available modules:</strong> ';
                        data.available_modules.forEach((mod, idx) => {
                            if (idx > 0) errorOutput += ', ';
                            errorOutput += escapeHtml(mod);
                        });
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
                networkErrorOutput += '</div>';
                resultElement.innerHTML = networkErrorOutput;
            } finally {
                button.disabled = false;
                button.textContent = originalText;
            }
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', function() {
            console.log('LEPUS/PrimJS Module Federation Interface Loaded');
        });
    </script>
</body>
</html>`;

export default htmlPage;