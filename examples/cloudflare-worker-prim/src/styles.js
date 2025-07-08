// CSS styles exported as a string for use in Cloudflare Workers
export const css = `/* Simple, Clean CSS Reset */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #2d3748;
    background: #f7fafc;
    min-height: 100vh;
    padding: 20px;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.header {
    background: #4299e1;
    color: white;
    padding: 40px;
    text-align: center;
}

.header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    font-weight: 700;
}

.header p {
    font-size: 1.2rem;
    opacity: 0.9;
}

.content {
    padding: 40px;
}

.section {
    margin-bottom: 40px;
}

.section h2 {
    color: #2d3748;
    margin-bottom: 20px;
    font-size: 1.8rem;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 10px;
}

.test-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.test-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    text-decoration: none;
    color: #1e293b;
    display: block;
    transition: box-shadow 0.2s ease;
}

.test-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.test-card h3 {
    color: #4299e1;
    margin-bottom: 10px;
    font-size: 1.3rem;
    font-weight: 600;
}

.test-card p {
    color: #718096;
    margin-bottom: 15px;
}

.test-status {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
}

.status-working {
    background: #c6f6d5;
    color: #2f855a;
}

.status-demo {
    background: #bee3f8;
    color: #2b6cb0;
}

.status-api {
    background: #fef5e7;
    color: #c05621;
}

.examples-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}

.example-card {
    background: #f1f5f9;
    border-radius: 6px;
    padding: 15px;
    border-left: 4px solid #4338ca;
    color: #1e293b;
}

.example-card h4 {
    margin-bottom: 8px;
    color: #4338ca;
}

.example-card code {
    background: #e2e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.9rem;
}

.footer {
    background: #1e293b;
    color: white;
    padding: 30px 40px;
    text-align: center;
}

.tech-stack {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.tech-badge {
    background: #334155;
    padding: 6px 12px;
    border-radius: 16px;
    font-size: 0.8rem;
}

.interactive-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
}

.module-executor {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 25px;
    max-width: 100%;
    width: 100%;
    color: #1e293b;
}

.module-executor:hover {
    border-color: #4338ca;
    box-shadow: 0 4px 20px rgba(67, 56, 202, 0.1);
}

.module-executor h3 {
    color: #4299e1;
    margin-bottom: 20px;
    font-size: 1.3rem;
    font-weight: 600;
    text-align: center;
}

.input-group {
    margin-bottom: 15px;
}

.input-group label {
    display: block;
    margin-bottom: 5px;
    color: #4a5568;
    font-weight: 500;
}

.input-group input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.2s ease;
}

.input-group input:focus {
    outline: none;
    border-color: #4299e1;
}

.execute-btn {
    background: #4299e1;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    width: 100%;
    margin-bottom: 15px;
}

.execute-btn:hover {
    background: #3182ce;
}

.execute-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.code-executor {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 25px;
<<<<<<< HEAD
=======
    transition: all 0.3s ease;
    color: #1e293b;
}

.code-executor:hover {
    border-color: #4338ca;
    box-shadow: 0 4px 20px rgba(67, 56, 202, 0.1);
}

.code-input-section {
    margin-bottom: 20px;
>>>>>>> e7277c538f24df6313d78726b9d57685413f1970
}

.code-input-section label {
    display: block;
    margin-bottom: 10px;
    color: #4a5568;
    font-weight: 600;
    font-size: 1.1rem;
}

#user-code {
    width: 100%;
    height: 200px;
    padding: 15px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 14px;
    line-height: 1.5;
    background: #2d3748;
    color: #e2e8f0;
    resize: vertical;
}

#user-code:focus {
    outline: none;
    border-color: #4299e1;
}

#user-code::placeholder {
    color: #a0aec0;
}

.code-controls {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.clear-btn {
    background: #718096;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 4px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s ease;
    flex: 1;
}

.clear-btn:hover {
    background: #4a5568;
}

.code-controls .execute-btn {
    flex: 2;
    margin-bottom: 0;
    background: #38a169;
}

.code-controls .execute-btn:hover {
    background: #2f855a;
}

.sandbox-notice {
    background: #ebf8ff;
    border: 1px solid #4299e1;
    color: #2b6cb0;
    padding: 12px 15px;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-bottom: 15px;
}

.result-display {
    background: #2d3748;
    color: #e2e8f0;
    border-radius: 4px;
    padding: 0;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.5;
    min-height: 60px;
    max-height: 400px;
    border: 1px solid #4a5568;
    overflow: hidden;
    margin-top: 15px;
}

.execution-header {
    background: #38a169;
    padding: 12px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #4a5568;
    font-weight: 600;
}

.execution-header.error {
    background: #e53e3e;
}

.execution-timestamp {
    font-size: 0.8rem;
    opacity: 0.9;
}

.copy-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #e2e8f0;
    padding: 6px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
}

.copy-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.copy-btn.copied {
    background: rgba(56, 161, 105, 0.3);
    color: #c6f6d5;
}

.result-content {
    padding: 16px;
    max-height: 320px;
    overflow-y: auto;
}

.result-content pre {
    margin: 0;
    white-space: pre-wrap;
    word-wrap: break-word;
}

.result-section {
    margin-bottom: 15px;
}

.result-section:last-child {
    margin-bottom: 0;
}

.result-section h4 {
    color: #a0aec0;
    margin-bottom: 8px;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.result-logs {
    color: #a0aec0;
    font-style: italic;
}

.result-value {
    color: #e2e8f0;
}

.result-value.string {
    color: #f6e05e;
}

.result-value.number {
    color: #68d391;
}

.result-value.boolean {
    color: #b794f6;
}

.result-value.object {
    color: #63b3ed;
}

.result-error {
    color: #fed7d7;
    background: rgba(229, 62, 62, 0.1);
    padding: 10px;
    border-radius: 4px;
    border-left: 4px solid #e53e3e;
}

.api-documentation {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 25px;
    margin-bottom: 25px;
}

.api-documentation h3 {
    color: #2d3748;
    margin-bottom: 15px;
    font-size: 1.5rem;
    font-weight: 600;
}

.api-documentation h4 {
    color: #4a5568;
    margin-bottom: 10px;
    font-size: 1.1rem;
    font-weight: 500;
}

.api-documentation pre {
    background: #2d3748;
    color: #e2e8f0;
    padding: 15px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 13px;
    line-height: 1.4;
    overflow-x: auto;
    margin: 10px 0;
}

.info-notice {
    background: #f7fafc;
    border: 1px solid #4299e1;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 4px;
    border-left: 4px solid #4299e1;
}

.info-notice p {
    margin: 0;
    color: #4a5568;
    font-size: 0.9rem;
    line-height: 1.5;
}

.footer {
    background: #2d3748;
    color: white;
    padding: 30px 40px;
    text-align: center;
}

.tech-stack {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 20px;
    flex-wrap: wrap;
}

.tech-badge {
    background: #4a5568;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    body {
        padding: 10px;
    }

    .header {
        padding: 30px 20px;
    }

    .content {
        padding: 20px;
    }

    .test-grid {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .interactive-section {
        grid-template-columns: 1fr;
        gap: 20px;
    }

    .code-controls {
        flex-direction: column;
        gap: 10px;
    }

    .code-controls .execute-btn {
        flex: unset;
    }

    #user-code {
        height: 180px;
    }

    .result-display {
        max-height: 300px;
        font-size: 12px;
    }

    .result-content {
        padding: 12px;
        max-height: 240px;
    }
}

@media (max-width: 480px) {
    body {
        padding: 5px;
    }

    .header {
        padding: 20px 15px;
    }

    .content {
        padding: 15px;
    }

    .module-executor,
    .code-executor {
        padding: 15px;
    }

    .result-display {
        max-height: 250px;
        font-size: 11px;
    }

    .result-content {
        padding: 10px;
        max-height: 190px;
    }
}

/* Simple scrollbar */
::-webkit-scrollbar {
    width: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
}
`;

export default css;
