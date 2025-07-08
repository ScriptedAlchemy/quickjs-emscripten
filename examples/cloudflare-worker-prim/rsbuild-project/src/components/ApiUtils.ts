// API utilities for Cloudflare Workers with async/promise examples
export interface ApiRequest {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  timestamp: string;
  processingTime: number;
}

// Mock fetch implementation for testing (since this runs in LEPUS/PrimJS)
export function mockFetch(request: ApiRequest): Promise<ApiResponse> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    // Simulate network delay
    setTimeout(() => {
      const mockData = {
        message: `Mock response for ${request.method || 'GET'} ${request.url}`,
        requestId: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        mockData: {
          users: [
            { id: 1, name: 'Alice', email: 'alice@example.com' },
            { id: 2, name: 'Bob', email: 'bob@example.com' },
            { id: 3, name: 'Charlie', email: 'charlie@example.com' }
          ],
          posts: [
            { id: 1, title: 'Hello World', author: 'Alice' },
            { id: 2, title: 'Learning Module Federation', author: 'Bob' },
            { id: 3, title: 'Cloudflare Workers are Cool', author: 'Charlie' }
          ]
        }
      };

      resolve({
        data: mockData,
        status: 200,
        headers: { 'content-type': 'application/json' },
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
    }, Math.random() * 100 + 50); // 50-150ms delay
  });
}

// Batch API requests
export async function batchRequests(requests: ApiRequest[]): Promise<ApiResponse[]> {
  const promises = requests.map(request => mockFetch(request));
  return Promise.all(promises);
}

// API with error handling
export async function safeApiCall<T>(request: ApiRequest): Promise<{
  success: boolean;
  data?: ApiResponse<T>;
  error?: string;
}> {
  try {
    const response = await mockFetch(request);
    return { success: true, data: response };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Transform API responses
export function transformApiResponse<T, R>(
  response: ApiResponse<T>,
  transformer: (data: T) => R
): ApiResponse<R> {
  return {
    ...response,
    data: transformer(response.data),
    processingTime: response.processingTime + 1 // Add transform time
  };
}

// Format for Cloudflare Worker response
export function formatApiResult(result: any): {
  text: string;
  json: object;
  html: string;
} {
  return {
    text: typeof result === 'string' ? result : JSON.stringify(result),
    json: result,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%); color: white; border-radius: 8px;">
        <h2>API Response</h2>
        <pre style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px; overflow-x: auto; color: white;">
${JSON.stringify(result, null, 2)}
        </pre>
        <small>Processed by Module Federation API Utils</small>
      </div>
    `
  };
}

// Demo function that showcases async capabilities
export async function demonstrateAsyncApi(): Promise<any> {
  const startTime = Date.now();
  
  // Single request
  const singleResponse = await mockFetch({
    url: 'https://api.example.com/users',
    method: 'GET'
  });

  // Batch requests
  const batchResponses = await batchRequests([
    { url: 'https://api.example.com/users' },
    { url: 'https://api.example.com/posts' },
    { url: 'https://api.example.com/comments' }
  ]);

  // Safe API call with error handling
  const safeResponse = await safeApiCall({
    url: 'https://api.example.com/might-fail',
    method: 'POST',
    body: { test: true }
  });

  return {
    demo: 'async-api-capabilities',
    totalTime: Date.now() - startTime,
    results: {
      single: singleResponse,
      batch: batchResponses,
      safe: safeResponse
    },
    summary: {
      singleRequestTime: singleResponse.processingTime,
      batchRequestCount: batchResponses.length,
      safeRequestSuccess: safeResponse.success
    }
  };
}