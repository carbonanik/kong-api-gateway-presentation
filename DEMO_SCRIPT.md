# Interview Demo Script

## Pre-Demo Setup (5 minutes before interview)

### 1. Start All Services
```bash
# Navigate to project directory
cd /home/carbonanik/code/presentation

# Start all services
sudo docker-compose up -d

# Verify all services are running
sudo docker-compose ps
```

### 2. Test Basic Connectivity
```bash
# Test Kong Gateway is responding
curl -i http://localhost:8000

# Test customer service registration
curl -X POST http://localhost:8000/customer/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123"}'
```

## Demo Script (15 minutes)

### Introduction (2 minutes)
**"I've built a complete microservices architecture with 6 services using Node.js and Kong Gateway. Let me show you how it works."**

### 1. Show Architecture (2 minutes)
```bash
# Show running containers
sudo docker-compose ps

# Explain: "Here we have Kong Gateway, 6 microservices, MongoDB, and Redis all running in containers."
```

### 2. Demonstrate Authentication Flow (3 minutes)

**"Let me show you the authentication flow. First, I'll register a user, then login to get a JWT token."**

```bash
# Step 1: Register a new user
echo "=== REGISTERING USER ==="
curl -X POST http://localhost:8000/customer/register \
  -H "Content-Type: application/json" \
  -d '{"username":"interview","password":"password123"}'

# Step 2: Login to get JWT token
echo "=== LOGGING IN ==="
TOKEN=$(curl -s -X POST http://localhost:8000/customer/login \
  -H "Content-Type: application/json" \
  -d '{"username":"interview","password":"password123"}' | jq -r '.token')

echo "JWT Token: $TOKEN"
```

### 3. Demonstrate Protected Endpoints (3 minutes)

**"Now let me show you how protected endpoints work. First, I'll try to access an order without authentication."**

```bash
# Step 3: Try to access protected endpoint without JWT (should fail)
echo "=== ACCESSING PROTECTED ENDPOINT WITHOUT JWT ==="
curl -i http://localhost:8000/order/123

# Step 4: Access protected endpoint with JWT (should succeed)
echo "=== ACCESSING PROTECTED ENDPOINT WITH JWT ==="
curl -i http://localhost:8000/order/123 \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Show Rate Limiting (2 minutes)

**"Let me demonstrate the rate limiting feature. I'll make multiple requests to show the rate limit headers."**

```bash
# Step 5: Show rate limiting headers
echo "=== DEMONSTRATING RATE LIMITING ==="
for i in {1..3}; do
  echo "Request $i:"
  curl -s -o /dev/null -w "Status: %{http_code}, Rate Limit Remaining: %{RateLimit-Remaining}\n" \
    http://localhost:8000/order/123 \
    -H "Authorization: Bearer $TOKEN"
done
```

### 5. Show Service Isolation (2 minutes)

**"Let me show you how services are isolated. Each service runs independently and can be scaled separately."**

```bash
# Step 6: Show service logs
echo "=== SHOWING SERVICE LOGS ==="
echo "Customer Service Logs:"
sudo docker logs customer-service --tail 5

echo "Order Service Logs:"
sudo docker logs order-service --tail 5
```

### 6. Demonstrate Different Services (2 minutes)

**"Let me show you how different services handle different types of requests."**

```bash
# Step 7: Test payment service
echo "=== TESTING PAYMENT SERVICE ==="
curl -X POST http://localhost:8000/payment/charge \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":99.99,"currency":"USD","paymentMethod":"credit_card"}'

# Step 8: Test cache service
echo "=== TESTING CACHE SERVICE ==="
curl -i http://localhost:8000/cache/test-key \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Show Architecture Documentation (1 minute)

**"I've also created comprehensive documentation including architecture diagrams and security documentation."**

```bash
# Step 9: Show documentation files
echo "=== DOCUMENTATION FILES ==="
ls -la *.md
```

## Backup Demo Commands

If the live demo fails, use these commands to show the system is working:

```bash
# Quick health check
echo "=== HEALTH CHECK ==="
sudo docker-compose ps

# Show Kong configuration
echo "=== KONG CONFIGURATION ==="
cat gateway/kong.yaml

# Show service code structure
echo "=== SERVICE STRUCTURE ==="
ls -la services/

# Show Docker Compose configuration
echo "=== DOCKER COMPOSE CONFIG ==="
head -20 docker-compose.yml
```

## Key Points to Emphasize

### 1. Security
- **JWT Authentication**: All protected endpoints require valid JWT tokens
- **Rate Limiting**: 100 requests per minute per client
- **Service Isolation**: Each service runs in its own container
- **Password Security**: bcrypt hashing for password storage

### 2. Scalability
- **Independent Scaling**: Each service can be scaled independently
- **Load Balancing**: Kong Gateway handles traffic distribution
- **Container Orchestration**: Easy deployment with Docker Compose

### 3. Maintainability
- **Service Isolation**: Changes to one service don't affect others
- **Technology Flexibility**: Each service can use different technologies
- **Clear Documentation**: Comprehensive architecture and API documentation

### 4. Production Ready Features
- **Monitoring**: Kong Gateway provides comprehensive logging
- **Error Handling**: Consistent error responses across services
- **Database Integration**: MongoDB for persistence, Redis for caching

## Troubleshooting Commands

If something goes wrong during the demo:

```bash
# Restart a specific service
sudo docker-compose restart order-service

# Check service logs
sudo docker logs order-service

# Restart all services
sudo docker-compose down && sudo docker-compose up -d

# Check Kong status
curl -i http://localhost:8001/status
```

## Post-Demo Cleanup

```bash
# Stop all services (optional)
sudo docker-compose down

# Remove containers (optional)
sudo docker-compose down --rmi all
``` 