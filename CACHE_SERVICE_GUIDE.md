# Cache Service Implementation Guide

## Overview

The Cache Service is a comprehensive Redis-based caching microservice that provides high-performance data caching with advanced features like TTL management, bulk operations, and monitoring.

## Features Implemented ✅

### Core Features
- ✅ **Redis Integration**: Full Redis client with connection management
- ✅ **CRUD Operations**: Get, Set, Delete, Update operations
- ✅ **TTL Management**: Time-to-live with automatic expiration
- ✅ **Bulk Operations**: Multi-get and multi-set capabilities
- ✅ **Health Monitoring**: Health checks and statistics
- ✅ **Error Handling**: Comprehensive error handling and logging
- ✅ **Key Search**: Pattern-based key searching
- ✅ **Cache Statistics**: Hit rates, memory usage, performance metrics

### Advanced Features
- ✅ **Connection Resilience**: Automatic retry strategy
- ✅ **JSON Support**: Automatic JSON serialization/deserialization
- ✅ **Pipeline Operations**: Efficient bulk operations
- ✅ **Cache Invalidation**: Individual and bulk cache clearing
- ✅ **Monitoring**: Real-time cache statistics and health metrics

## API Endpoints

### 1. Health Check
```bash
GET /cache/health
```
**Response:**
```json
{
  "status": "healthy",
  "message": "Cache service is running",
  "redis": "connected"
}
```

### 2. Cache Statistics
```bash
GET /cache/stats
```
**Response:**
```json
{
  "status": "success",
  "statistics": {
    "connected_clients": "1",
    "used_memory_human": "1.23M",
    "total_commands_processed": "1234",
    "keyspace_hits": "1000",
    "keyspace_misses": "100",
    "hit_rate": "90.91%"
  }
}
```

### 3. Get Value
```bash
GET /cache/:key
```
**Example:**
```bash
curl -i http://localhost:8000/cache/user_profile_123 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```
**Response:**
```json
{
  "status": "success",
  "key": "user_profile_123",
  "value": {
    "username": "alice",
    "email": "alice@example.com",
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  },
  "retrieved_at": "2025-01-02T04:30:00.000Z"
}
```

### 4. Set Value
```bash
POST /cache/:key
```
**Request Body:**
```json
{
  "value": {
    "username": "alice",
    "email": "alice@example.com"
  },
  "ttl": 3600
}
```
**Response:**
```json
{
  "status": "success",
  "message": "Value cached successfully with expiration",
  "key": "user_profile_123",
  "ttl": 3600,
  "expires_at": "2025-01-02T05:30:00.000Z"
}
```

### 5. Update TTL
```bash
PUT /cache/:key/ttl
```
**Request Body:**
```json
{
  "ttl": 7200
}
```

### 6. Delete Key
```bash
DELETE /cache/:key
```

### 7. Clear All Cache
```bash
DELETE /cache/?confirm=true
```

### 8. Multi-Get
```bash
POST /cache/mget
```
**Request Body:**
```json
{
  "keys": ["user_1", "user_2", "user_3"]
}
```

### 9. Multi-Set
```bash
POST /cache/mset
```
**Request Body:**
```json
{
  "data": {
    "user_1": {"name": "Alice", "age": 25},
    "user_2": {"name": "Bob", "age": 30},
    "user_3": {"name": "Charlie", "age": 35}
  },
  "ttl": 1800
}
```

### 10. Search Keys
```bash
GET /cache/search/:pattern
```
**Example:**
```bash
curl -i http://localhost:8000/cache/search/user_* \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Testing the Cache Service

### 1. Start the Service
```bash
# Rebuild and restart cache service
sudo docker-compose up -d --build cache-service

# Check if it's running
sudo docker-compose ps cache-service
```

### 2. Test Health Check
```bash
curl -i http://localhost:8000/cache/health
```

### 3. Test Basic Operations
```bash
# Get JWT token first
TOKEN=$(curl -s -X POST http://localhost:8000/customer/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | jq -r '.token')

# Set a value
curl -X POST http://localhost:8000/cache/test_key \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"Hello World","ttl":300}'

# Get the value
curl -i http://localhost:8000/cache/test_key \
  -H "Authorization: Bearer $TOKEN"

# Delete the value
curl -X DELETE http://localhost:8000/cache/test_key \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Test Advanced Features
```bash
# Test multi-set
curl -X POST http://localhost:8000/cache/mset \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "session_1": {"user_id": "123", "expires": "2025-01-03"},
      "session_2": {"user_id": "456", "expires": "2025-01-03"}
    },
    "ttl": 3600
  }'

# Test multi-get
curl -X POST http://localhost:8000/cache/mget \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keys":["session_1","session_2","session_3"]}'

# Test key search
curl -i http://localhost:8000/cache/search/session_* \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Test Statistics
```bash
curl -i http://localhost:8000/cache/stats \
  -H "Authorization: Bearer $TOKEN"
```

## Use Cases and Examples

### 1. User Session Caching
```javascript
// Set user session
const sessionData = {
  user_id: "12345",
  username: "alice",
  permissions: ["read", "write"],
  last_activity: new Date().toISOString()
};

// Cache for 1 hour
fetch('/cache/session_12345', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    value: sessionData,
    ttl: 3600
  })
});
```

### 2. API Response Caching
```javascript
// Cache API responses
const cacheKey = `api_response_${endpoint}_${userId}`;
const response = await fetch(`/cache/${cacheKey}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (response.status === 404) {
  // Cache miss - fetch from API
  const apiResponse = await fetchFromAPI(endpoint);
  
  // Cache for 5 minutes
  await fetch(`/cache/${cacheKey}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: apiResponse,
      ttl: 300
    })
  });
}
```

### 3. Database Query Caching
```javascript
// Cache database query results
const queryHash = generateHash(sqlQuery + JSON.stringify(params));
const cacheKey = `db_query_${queryHash}`;

// Try to get from cache first
const cachedResult = await fetch(`/cache/${cacheKey}`, {
  headers: { 'Authorization': `Bearer ${token}` }
});

if (cachedResult.status === 404) {
  // Execute database query
  const result = await executeQuery(sqlQuery, params);
  
  // Cache result for 10 minutes
  await fetch(`/cache/${cacheKey}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: result,
      ttl: 600
    })
  });
}
```

## Performance Optimization

### 1. Connection Pooling
The Redis client is configured with automatic retry strategy and connection management.

### 2. Pipeline Operations
Use multi-get and multi-set operations for bulk data operations:
```javascript
// Efficient bulk operations
const bulkData = {
  'user_1': userData1,
  'user_2': userData2,
  'user_3': userData3
};

await fetch('/cache/mset', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    data: bulkData,
    ttl: 3600
  })
});
```

### 3. TTL Strategy
- **Short TTL (1-5 minutes)**: Frequently changing data
- **Medium TTL (15-60 minutes)**: Moderately stable data
- **Long TTL (1-24 hours)**: Stable reference data
- **No TTL**: Session data, user preferences

## Monitoring and Maintenance

### 1. Health Monitoring
```bash
# Check service health
curl http://localhost:8000/cache/health

# Monitor cache statistics
curl http://localhost:8000/cache/stats
```

### 2. Key Metrics to Monitor
- **Hit Rate**: Percentage of cache hits vs misses
- **Memory Usage**: Redis memory consumption
- **Connection Count**: Number of active connections
- **Command Count**: Total commands processed

### 3. Cache Invalidation Strategies
- **Time-based**: Automatic expiration with TTL
- **Manual**: Delete specific keys when data changes
- **Pattern-based**: Clear keys matching patterns
- **Bulk**: Clear entire cache when needed

## Security Considerations

### 1. Access Control
- All endpoints require JWT authentication
- Rate limiting applied through Kong Gateway
- Service isolation in Docker containers

### 2. Data Protection
- Sensitive data should not be cached without encryption
- Use appropriate TTL for sensitive data
- Implement cache invalidation on data changes

### 3. Monitoring
- Log all cache operations for audit
- Monitor for unusual access patterns
- Set up alerts for cache failures

## Troubleshooting

### Common Issues

#### 1. Connection Errors
```bash
# Check Redis container
sudo docker-compose ps redis

# Check Redis logs
sudo docker logs redis

# Restart Redis
sudo docker-compose restart redis
```

#### 2. Memory Issues
```bash
# Check Redis memory usage
curl http://localhost:8000/cache/stats

# Clear cache if needed
curl -X DELETE "http://localhost:8000/cache/?confirm=true" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Performance Issues
- Monitor hit rates and adjust TTL
- Use pipeline operations for bulk data
- Consider Redis clustering for high load

## Integration with Other Services

### 1. Customer Service Integration
```javascript
// Cache user profiles
const userProfile = await getUserFromDatabase(userId);
await cacheService.set(`user_profile_${userId}`, userProfile, 3600);
```

### 2. Order Service Integration
```javascript
// Cache order details
const orderDetails = await getOrderFromDatabase(orderId);
await cacheService.set(`order_${orderId}`, orderDetails, 1800);
```

### 3. Payment Service Integration
```javascript
// Cache payment status
const paymentStatus = await getPaymentStatus(paymentId);
await cacheService.set(`payment_${paymentId}`, paymentStatus, 300);
```

## Best Practices

### 1. Cache Key Naming
- Use descriptive, hierarchical names
- Include version numbers for schema changes
- Use consistent naming conventions

### 2. TTL Strategy
- Set appropriate TTL based on data volatility
- Use shorter TTL for frequently changing data
- Consider business requirements for data freshness

### 3. Error Handling
- Always handle cache misses gracefully
- Implement fallback to primary data source
- Log cache errors for monitoring

### 4. Monitoring
- Monitor cache hit rates regularly
- Set up alerts for cache failures
- Track memory usage and performance metrics 