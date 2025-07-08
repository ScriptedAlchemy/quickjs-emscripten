// Fetch utilities for making HTTP requests to external APIs
export interface FetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface FetchResult<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
  timestamp: string;
  duration: number;
}

// Fetch from JSONPlaceholder API
export async function fetchPlaceholderPosts(count: number = 5): Promise<FetchResult> {
  const startTime = Date.now();
  const url = `https://jsonplaceholder.typicode.com/posts?_limit=${count}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      url,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    throw new Error(`Failed to fetch posts: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Fetch user data from JSONPlaceholder
export async function fetchPlaceholderUsers(count: number = 3): Promise<FetchResult> {
  const startTime = Date.now();
  const url = `https://jsonplaceholder.typicode.com/users?_limit=${count}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      url,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Fetch specific post with comments
export async function fetchPostWithComments(postId: number = 1): Promise<FetchResult> {
  const startTime = Date.now();
  
  try {
    // Fetch post and comments in parallel
    const [postResponse, commentsResponse] = await Promise.all([
      fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`),
      fetch(`https://jsonplaceholder.typicode.com/posts/${postId}/comments`)
    ]);
    
    const post = await postResponse.json();
    const comments = await commentsResponse.json();
    
    const combinedData = {
      post,
      comments,
      commentCount: comments.length
    };
    
    return {
      data: combinedData,
      status: postResponse.status,
      statusText: postResponse.statusText,
      headers: Object.fromEntries(postResponse.headers.entries()),
      url: `https://jsonplaceholder.typicode.com/posts/${postId}`,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    throw new Error(`Failed to fetch post with comments: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Create a new post (simulated)
export async function createPlaceholderPost(title: string, body: string, userId: number = 1): Promise<FetchResult> {
  const startTime = Date.now();
  const url = 'https://jsonplaceholder.typicode.com/posts';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        body,
        userId
      })
    });
    
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      url,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };
  } catch (error) {
    throw new Error(`Failed to create post: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Comprehensive demo that fetches multiple types of data
export async function demonstrateFetchCapabilities(): Promise<any> {
  const startTime = Date.now();
  
  try {
    console.log('Starting comprehensive fetch demo...');
    
    // Fetch posts
    console.log('Fetching posts...');
    const posts = await fetchPlaceholderPosts(3);
    
    // Fetch users  
    console.log('Fetching users...');
    const users = await fetchPlaceholderUsers(2);
    
    // Fetch specific post with comments
    console.log('Fetching post with comments...');
    const postWithComments = await fetchPostWithComments(1);
    
    // Create a new post
    console.log('Creating new post...');
    const newPost = await createPlaceholderPost(
      'Module Federation Test Post',
      'This post was created from a Module Federation component running in Cloudflare Workers!'
    );
    
    const totalTime = Date.now() - startTime;
    
    return {
      success: true,
      demo: 'comprehensive-fetch-capabilities',
      timestamp: new Date().toISOString(),
      totalDuration: totalTime,
      results: {
        posts: {
          count: posts.data.length,
          duration: posts.duration,
          firstPost: posts.data[0]?.title,
          sample: posts.data.slice(0, 2).map((p: any) => ({ id: p.id, title: p.title }))
        },
        users: {
          count: users.data.length,
          duration: users.duration,
          firstUser: users.data[0]?.name,
          sample: users.data.slice(0, 2).map((u: any) => ({ id: u.id, name: u.name, email: u.email }))
        },
        postWithComments: {
          postTitle: postWithComments.data.post.title,
          commentCount: postWithComments.data.commentCount,
          duration: postWithComments.duration,
          sampleComment: postWithComments.data.comments[0]?.body?.substring(0, 50) + '...'
        },
        newPost: {
          id: newPost.data.id,
          title: newPost.data.title,
          duration: newPost.duration,
          created: true
        }
      },
      summary: {
        totalRequests: 5, // posts + users + post + comments + create
        totalTime,
        averageRequestTime: Math.round(totalTime / 5),
        allSuccessful: true,
        message: `Successfully completed ${5} API requests in ${totalTime}ms`
      }
    };
  } catch (error) {
    return {
      success: false,
      demo: 'comprehensive-fetch-capabilities',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

// Simple fetch demo that returns data immediately
export async function quickFetchDemo(): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Just fetch a single post to keep it simple and fast
    const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
    const post = await response.json();
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      demo: 'quick-fetch',
      timestamp: new Date().toISOString(),
      duration: duration,
      data: {
        id: post.id,
        title: post.title,
        body: post.body.substring(0, 100) + '...',
        userId: post.userId
      },
      message: `Successfully fetched post #${post.id} in ${duration}ms`,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      demo: 'quick-fetch',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    };
  }
}

// Format for CloudflareResponse
export function formatFetchResult(result: any): {
  text: string;
  json: object;
  html: string;
} {
  return {
    text: JSON.stringify(result),
    json: result,
    html: `
      <div style="font-family: 'SF Mono', Monaco, monospace; padding: 25px; background: linear-gradient(135deg, #00b894 0%, #00cec9 100%); color: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 184, 148, 0.3);">
        <h2>🌐 Fetch Demo Results</h2>
        <div style="display: grid; gap: 15px; margin: 20px 0;">
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
            <h3>📊 Summary</h3>
            <p>Requests: ${result.summary?.totalRequests || 0} | Total Time: ${result.summary?.totalTime || 0}ms | Success: ${result.summary?.allSuccessful ? '✅' : '❌'}</p>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
            <h3>🔍 Results</h3>
            <pre style="color: #fff; margin: 0; overflow-x: auto; font-size: 12px;">
${JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
        <small>⚡ Powered by Module Federation Fetch Utils</small>
      </div>
    `
  };
} 