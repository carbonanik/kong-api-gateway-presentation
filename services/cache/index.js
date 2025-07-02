const express = require('express');
const redis = require('redis');
const app = express();

// Middleware
app.use(express.json());

// Redis client configuration
const redisClient = redis.createClient({
  socket: {
    host: 'redis',
    port: 6379
  },
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The server refused the connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      return new Error('Retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Redis event handlers
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('ready', () => {
  console.log('Redis client ready');
});

// Connect to Redis
redisClient.connect().catch(console.error);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await redisClient.ping();
    res.json({ 
      status: 'healthy', 
      message: 'Cache service is running',
      redis: 'connected'
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Cache service unavailable',
      error: err.message 
    });
  }
});

// Get cache statistics
app.get('/stats', async (req, res) => {
  try {
    const info = await redisClient.info();
    
    // Parse Redis INFO command output
    const lines = info.split('\r\n');
    const stats = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    });
    
    res.json({
      status: 'success',
      statistics: {
        connected_clients: stats.connected_clients,
        used_memory_human: stats.used_memory_human,
        total_commands_processed: stats.total_commands_processed,
        keyspace_hits: stats.keyspace_hits,
        keyspace_misses: stats.keyspace_misses,
        hit_rate: stats.keyspace_hits && stats.keyspace_misses ? 
          (parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses)) * 100).toFixed(2) + '%' : 'N/A'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get cache statistics',
      error: err.message 
    });
  }
});

// Get value by key
app.get('/:key', async (req, res) => {
  const { key } = req.params;
  
  if (!key) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Key is required' 
    });
  }

  try {
    const value = await redisClient.get(key);
    
    if (value === null) {
      return res.status(404).json({ 
        status: 'not_found', 
        message: 'Key not found in cache',
        key: key 
      });
    }

    // Try to parse JSON, fallback to string
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
    } catch (e) {
      parsedValue = value;
    }

    res.json({
      status: 'success',
      key: key,
      value: parsedValue,
      retrieved_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Redis GET error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve from cache',
      error: err.message 
    });
  }
});

// Set value with optional expiration
app.post('/:key', async (req, res) => {
  const { key } = req.params;
  const { value, ttl } = req.body;
  
  if (!key) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Key is required' 
    });
  }

  if (value === undefined) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Value is required' 
    });
  }

  // Convert value to string for storage
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  try {
    if (ttl) {
      // Set with expiration
      await redisClient.setEx(key, ttl, stringValue);
      res.json({
        status: 'success',
        message: 'Value cached successfully with expiration',
        key: key,
        ttl: ttl,
        expires_at: new Date(Date.now() + ttl * 1000).toISOString()
      });
    } else {
      // Set without expiration
      await redisClient.set(key, stringValue);
      res.json({
        status: 'success',
        message: 'Value cached successfully',
        key: key
      });
    }
  } catch (err) {
    console.error('Redis SET error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to set cache',
      error: err.message 
    });
  }
});

// Update TTL for existing key
app.put('/:key/ttl', (req, res) => {
  const { key } = req.params;
  const { ttl } = req.body;
  
  if (!key) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Key is required' 
    });
  }

  if (!ttl || ttl <= 0) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Valid TTL is required' 
    });
  }

  redisClient.expire(key, ttl, (err, result) => {
    if (err) {
      console.error('Redis EXPIRE error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to update TTL',
        error: err.message 
      });
    }

    if (result === 0) {
      return res.status(404).json({ 
        status: 'not_found', 
        message: 'Key not found in cache',
        key: key 
      });
    }

    res.json({
      status: 'success',
      message: 'TTL updated successfully',
      key: key,
      ttl: ttl,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString()
    });
  });
});

// Delete key
app.delete('/:key', (req, res) => {
  const { key } = req.params;
  
  if (!key) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Key is required' 
    });
  }

  redisClient.del(key, (err, result) => {
    if (err) {
      console.error('Redis DEL error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to delete from cache',
        error: err.message 
      });
    }

    if (result === 0) {
      return res.status(404).json({ 
        status: 'not_found', 
        message: 'Key not found in cache',
        key: key 
      });
    }

    res.json({
      status: 'success',
      message: 'Key deleted successfully',
      key: key
    });
  });
});

// Clear all cache (dangerous operation)
app.delete('/', (req, res) => {
  const { confirm } = req.query;
  
  if (confirm !== 'true') {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Confirmation required. Add ?confirm=true to clear all cache' 
    });
  }

  redisClient.flushall((err, result) => {
    if (err) {
      console.error('Redis FLUSHALL error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to clear cache',
        error: err.message 
      });
    }

    res.json({
      status: 'success',
      message: 'All cache cleared successfully'
    });
  });
});

// Get multiple keys
app.post('/mget', (req, res) => {
  const { keys } = req.body;
  
  if (!keys || !Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Keys array is required' 
    });
  }

  redisClient.mget(keys, (err, values) => {
    if (err) {
      console.error('Redis MGET error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to retrieve multiple keys',
        error: err.message 
      });
    }

    const result = keys.map((key, index) => {
      let value = values[index];
      
      if (value !== null) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if not JSON
        }
      }

      return {
        key: key,
        value: value,
        found: value !== null
      };
    });

    res.json({
      status: 'success',
      results: result
    });
  });
});

// Set multiple keys
app.post('/mset', (req, res) => {
  const { data, ttl } = req.body;
  
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Data object is required' 
    });
  }

  const pipeline = redisClient.pipeline();
  const keys = Object.keys(data);

  keys.forEach(key => {
    const value = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
    
    if (ttl) {
      pipeline.setex(key, ttl, value);
    } else {
      pipeline.set(key, value);
    }
  });

  pipeline.exec((err, results) => {
    if (err) {
      console.error('Redis MSET error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to set multiple keys',
        error: err.message 
      });
    }

    res.json({
      status: 'success',
      message: 'Multiple keys set successfully',
      keys_set: keys.length,
      ttl: ttl || 'no expiration'
    });
  });
});

// Search keys by pattern
app.get('/search/:pattern', (req, res) => {
  const { pattern } = req.params;
  
  if (!pattern) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Pattern is required' 
    });
  }

  redisClient.keys(pattern, (err, keys) => {
    if (err) {
      console.error('Redis KEYS error:', err);
      return res.status(500).json({ 
        status: 'error', 
        message: 'Failed to search keys',
        error: err.message 
      });
    }

    res.json({
      status: 'success',
      pattern: pattern,
      keys: keys,
      count: keys.length
    });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Cache service error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /stats',
      'GET /:key',
      'POST /:key',
      'PUT /:key/ttl',
      'DELETE /:key',
      'DELETE /?confirm=true',
      'POST /mget',
      'POST /mset',
      'GET /search/:pattern'
    ]
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Cache Service running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('- GET /health - Health check');
  console.log('- GET /stats - Cache statistics');
  console.log('- GET /:key - Get cached value');
  console.log('- POST /:key - Set cached value');
  console.log('- PUT /:key/ttl - Update TTL');
  console.log('- DELETE /:key - Delete cached value');
  console.log('- DELETE / - Clear all cache');
  console.log('- POST /mget - Get multiple keys');
  console.log('- POST /mset - Set multiple keys');
  console.log('- GET /search/:pattern - Search keys');
}); 