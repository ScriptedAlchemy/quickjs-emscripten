// Data processing utilities for Cloudflare Workers
export interface DataPoint {
  id: string;
  value: number;
  timestamp: number;
  category?: string;
}

export interface ProcessingOptions {
  sortBy?: 'value' | 'timestamp' | 'id';
  filterCategory?: string;
  limit?: number;
  aggregateBy?: 'sum' | 'avg' | 'count' | 'max' | 'min';
}

// Generate sample data for testing
export function generateSampleData(count: number = 10): DataPoint[] {
  const categories = ['A', 'B', 'C', 'D'];
  const data: DataPoint[] = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: `item-${i + 1}`,
      value: Math.floor(Math.random() * 100) + 1,
      timestamp: Date.now() - (Math.random() * 1000000),
      category: categories[Math.floor(Math.random() * categories.length)]
    });
  }
  
  return data;
}

// Process data with various options
export function processData(data: DataPoint[], options: ProcessingOptions = {}): {
  processed: DataPoint[];
  stats: {
    count: number;
    total: number;
    average: number;
    min: number;
    max: number;
  };
} {
  let processed = [...data];
  
  // Filter by category
  if (options.filterCategory) {
    processed = processed.filter(item => item.category === options.filterCategory);
  }
  
  // Sort data
  if (options.sortBy) {
    processed.sort((a, b) => {
      switch (options.sortBy) {
        case 'value':
          return b.value - a.value;
        case 'timestamp':
          return b.timestamp - a.timestamp;
        case 'id':
          return a.id.localeCompare(b.id);
        default:
          return 0;
      }
    });
  }
  
  // Limit results
  if (options.limit && options.limit > 0) {
    processed = processed.slice(0, options.limit);
  }
  
  // Calculate stats
  const values = processed.map(item => item.value);
  const stats = {
    count: processed.length,
    total: values.reduce((sum, val) => sum + val, 0),
    average: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0
  };
  
  return { processed, stats };
}

// Advanced data aggregation
export function aggregateData(data: DataPoint[], groupBy: 'category' | 'none' = 'none'): Record<string, {
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}> {
  if (groupBy === 'none') {
    const values = data.map(item => item.value);
    return {
      all: {
        count: data.length,
        sum: values.reduce((sum, val) => sum + val, 0),
        avg: values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0,
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0
      }
    };
  }
  
  // Group by category
  const groups: Record<string, DataPoint[]> = {};
  data.forEach(item => {
    const key = item.category || 'uncategorized';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  });
  
  const result: Record<string, any> = {};
  Object.entries(groups).forEach(([category, items]) => {
    const values = items.map(item => item.value);
    result[category] = {
      count: items.length,
      sum: values.reduce((sum, val) => sum + val, 0),
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });
  
  return result;
}

// Export as CloudflareResponse format
export function formatAsCloudflareResponse(data: any): {
  text: string;
  json: object;
  html: string;
} {
  return {
    text: JSON.stringify(data),
    json: data,
    html: `
      <div style="font-family: monospace; padding: 20px; background: #f5f5f5; border-radius: 8px;">
        <h3>Data Processing Result</h3>
        <pre style="background: white; padding: 15px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(data, null, 2)}
        </pre>
        <small>Processed by Module Federation Data Processor</small>
      </div>
    `
  };
}