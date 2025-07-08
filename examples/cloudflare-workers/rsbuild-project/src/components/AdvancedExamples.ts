// Advanced examples showcasing complex Module Federation capabilities
export interface TaskResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  duration?: number;
  timestamp: string;
}

export interface Pipeline {
  name: string;
  steps: string[];
  parallel: boolean;
}

// Task execution with promises
export class TaskExecutor {
  private tasks: Map<string, TaskResult> = new Map();
  private taskId = 0;

  async executeTask(name: string, fn: () => Promise<any>): Promise<TaskResult> {
    const id = `task-${++this.taskId}`;
    const startTime = Date.now();
    
    const task: TaskResult = {
      id,
      status: 'running',
      timestamp: new Date().toISOString()
    };
    
    this.tasks.set(id, task);

    try {
      const result = await fn();
      task.status = 'completed';
      task.result = result;
      task.duration = Date.now() - startTime;
      return task;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
      task.duration = Date.now() - startTime;
      return task;
    }
  }

  async executePipeline(pipeline: Pipeline): Promise<TaskResult[]> {
    const tasks = pipeline.steps.map(step => 
      this.executeTask(step, () => this.simulateWork(step))
    );

    if (pipeline.parallel) {
      return Promise.all(tasks);
    } else {
      const results: TaskResult[] = [];
      for (const task of tasks) {
        results.push(await task);
      }
      return results;
    }
  }

  private async simulateWork(stepName: string): Promise<any> {
    const delay = Math.random() * 200 + 50; // 50-250ms
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          step: stepName,
          processed: Math.floor(Math.random() * 1000),
          success: Math.random() > 0.1 // 90% success rate
        });
      }, delay);
    });
  }

  getTasks(): TaskResult[] {
    return Array.from(this.tasks.values());
  }
}

// Complex data transformation with async operations
export async function complexDataTransform(input: any[]): Promise<{
  original: any[];
  transformed: any[];
  operations: string[];
  stats: Record<string, number>;
}> {
  const operations: string[] = [];
  let transformed = [...input];

  // Step 1: Filter
  operations.push('filter');
  await new Promise(resolve => setTimeout(resolve, 10));
  transformed = transformed.filter((item, index) => index % 2 === 0);

  // Step 2: Transform
  operations.push('transform');
  await new Promise(resolve => setTimeout(resolve, 15));
  transformed = transformed.map((item, index) => ({
    ...item,
    id: `transformed-${index}`,
    processedAt: new Date().toISOString(),
    score: Math.random() * 100
  }));

  // Step 3: Sort
  operations.push('sort');
  await new Promise(resolve => setTimeout(resolve, 5));
  transformed.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Step 4: Enrich
  operations.push('enrich');
  await new Promise(resolve => setTimeout(resolve, 20));
  transformed = await Promise.all(
    transformed.map(async (item) => {
      await new Promise(resolve => setTimeout(resolve, 2));
      return {
        ...item,
        enriched: true,
        metadata: {
          processed: true,
          timestamp: Date.now(),
          version: '1.0'
        }
      };
    })
  );

  const stats = {
    originalCount: input.length,
    transformedCount: transformed.length,
    operationsApplied: operations.length,
    processingTime: Date.now() - Date.now() // Would be actual time in real scenario
  };

  return { original: input, transformed, operations, stats };
}

// State management with async updates
export class AsyncStateManager {
  private state: Record<string, any> = {};
  private subscribers: Map<string, Function[]> = new Map();

  async setState(key: string, value: any): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const oldValue = this.state[key];
        this.state[key] = value;
        
        // Notify subscribers
        const keySubscribers = this.subscribers.get(key) || [];
        keySubscribers.forEach(callback => {
          try {
            callback(value, oldValue);
          } catch (error) {
            console.error('Subscriber error:', error);
          }
        });

        resolve();
      }, Math.random() * 30 + 5); // 5-35ms delay
    });
  }

  async getState(key: string): Promise<any> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.state[key]);
      }, Math.random() * 10 + 2); // 2-12ms delay
    });
  }

  subscribe(key: string, callback: Function): () => void {
    const keySubscribers = this.subscribers.get(key) || [];
    keySubscribers.push(callback);
    this.subscribers.set(key, keySubscribers);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(key) || [];
      const index = subscribers.indexOf(callback);
      if (index > -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  getAllState(): Record<string, any> {
    return { ...this.state };
  }
}

// Comprehensive demo that combines all advanced features
export async function demonstrateAdvancedFeatures(): Promise<any> {
  const startTime = Date.now();
  
  // 1. Task execution
  const executor = new TaskExecutor();
  const singleTask = await executor.executeTask('data-processing', async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { processed: 1000, type: 'batch-job' };
  });

  const pipeline: Pipeline = {
    name: 'data-pipeline',
    steps: ['extract', 'transform', 'validate', 'load'],
    parallel: false
  };
  const pipelineResults = await executor.executePipeline(pipeline);

  // 2. Complex data transformation
  const sampleData = [
    { name: 'Item 1', value: 10 },
    { name: 'Item 2', value: 20 },
    { name: 'Item 3', value: 15 },
    { name: 'Item 4', value: 25 }
  ];
  const transformResult = await complexDataTransform(sampleData);

  // 3. State management
  const stateManager = new AsyncStateManager();
  const stateChanges: any[] = [];
  
  // Subscribe to state changes
  const unsubscribe = stateManager.subscribe('user', (newValue: any, oldValue: any) => {
    stateChanges.push({ new: newValue, old: oldValue, timestamp: Date.now() });
  });

  await stateManager.setState('user', { name: 'Alice', role: 'admin' });
  await stateManager.setState('config', { theme: 'dark', notifications: true });
  await stateManager.setState('user', { name: 'Alice', role: 'super-admin' });

  const finalUserState = await stateManager.getState('user');
  const allState = stateManager.getAllState();

  unsubscribe(); // Clean up subscription

  // 4. Parallel processing demo
  const parallelTasks = await Promise.all([
    executor.executeTask('parallel-1', () => Promise.resolve({ task: 1, result: 'success' })),
    executor.executeTask('parallel-2', () => Promise.resolve({ task: 2, result: 'success' })),
    executor.executeTask('parallel-3', () => Promise.resolve({ task: 3, result: 'success' }))
  ]);

  const totalTime = Date.now() - startTime;

  return {
    demo: 'advanced-features',
    timestamp: new Date().toISOString(),
    totalProcessingTime: totalTime,
    results: {
      taskExecution: {
        single: singleTask,
        pipeline: pipelineResults,
        parallel: parallelTasks,
        allTasks: executor.getTasks()
      },
      dataTransformation: transformResult,
      stateManagement: {
        finalState: allState,
        userState: finalUserState,
        stateChanges
      }
    },
    summary: {
      tasksExecuted: executor.getTasks().length,
      pipelineSteps: pipeline.steps.length,
      dataTransformed: transformResult.stats.transformedCount,
      stateUpdates: stateChanges.length,
      parallelTasksRun: parallelTasks.length,
      totalTime
    }
  };
}

// Format for CloudflareResponse
export function formatAdvancedResult(result: any): {
  text: string;
  json: object;
  html: string;
} {
  return {
    text: JSON.stringify(result),
    json: result,
    html: `
      <div style="font-family: 'SF Mono', Monaco, monospace; padding: 25px; background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%); color: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(108, 92, 231, 0.3);">
        <h2>🚀 Advanced Features Demo</h2>
        <div style="display: grid; gap: 15px; margin: 20px 0;">
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
            <h3>📊 Summary</h3>
            <p>Tasks: ${result.summary?.tasksExecuted || 0} | Data: ${result.summary?.dataTransformed || 0} items | Time: ${result.summary?.totalTime || 0}ms</p>
          </div>
          <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
            <h3>🔍 Details</h3>
            <pre style="color: #fff; margin: 0; overflow-x: auto; font-size: 12px;">
${JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
        <small>⚡ Powered by Module Federation Advanced Examples</small>
      </div>
    `
  };
}