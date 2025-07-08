let consoleHandle;
let logHandle;
let requireHandle;
let moduleHandle;
let exportsHandle;
let urlHandle;
let kvGetHandle;
let kvNamespaceHandle;
let globalThisHandle;
let pluginLogsHandle;

try {
  // ... existing code ...
} finally {
  pluginLogsHandle.dispose();
  if (urlHandle) urlHandle.dispose();
}
