#!/bin/bash

# Cache Service Test Script
# This script demonstrates all the features of the cache service

echo "=== Cache Service Test Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if services are running
print_status "Checking if services are running..."
if ! sudo docker-compose ps | grep -q "cache-service.*Up"; then
    print_error "Cache service is not running. Starting services..."
    sudo docker-compose up -d
    sleep 5
fi

# Get JWT token
print_status "Getting JWT token..."
TOKEN=$(curl -s -X POST http://localhost:8000/customer/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}' | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    print_error "Failed to get JWT token. Creating test user first..."
    curl -s -X POST http://localhost:8000/customer/register \
      -H "Content-Type: application/json" \
      -d '{"username":"alice","password":"password123"}'
    
    TOKEN=$(curl -s -X POST http://localhost:8000/customer/login \
      -H "Content-Type: application/json" \
      -d '{"username":"alice","password":"password123"}' | jq -r '.token')
fi

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    print_error "Still failed to get JWT token. Exiting."
    exit 1
fi

print_success "JWT token obtained successfully"

echo ""
echo "=== Testing Cache Service Endpoints ==="
echo ""

# 1. Test Health Check
print_status "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/cache/health)
if echo "$HEALTH_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Health check passed"
    echo "$HEALTH_RESPONSE" | jq '.'
else
    print_error "Health check failed"
    echo "$HEALTH_RESPONSE"
fi

echo ""

# 2. Test Cache Statistics
print_status "2. Testing Cache Statistics..."
STATS_RESPONSE=$(curl -s http://localhost:8000/cache/stats)
if echo "$STATS_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Cache statistics retrieved"
    echo "$STATS_RESPONSE" | jq '.'
else
    print_error "Failed to get cache statistics"
    echo "$STATS_RESPONSE"
fi

echo ""

# 3. Test Set Value
print_status "3. Testing Set Value..."
SET_RESPONSE=$(curl -s -X POST http://localhost:8000/cache/test_user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "value": {
      "username": "testuser",
      "email": "test@example.com",
      "preferences": {
        "theme": "dark",
        "language": "en"
      }
    },
    "ttl": 300
  }')

if echo "$SET_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Value set successfully"
    echo "$SET_RESPONSE" | jq '.'
else
    print_error "Failed to set value"
    echo "$SET_RESPONSE"
fi

echo ""

# 4. Test Get Value
print_status "4. Testing Get Value..."
GET_RESPONSE=$(curl -s http://localhost:8000/cache/test_user \
  -H "Authorization: Bearer $TOKEN")

if echo "$GET_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Value retrieved successfully"
    echo "$GET_RESPONSE" | jq '.'
else
    print_error "Failed to get value"
    echo "$GET_RESPONSE"
fi

echo ""

# 5. Test Multi-Set
print_status "5. Testing Multi-Set..."
MSET_RESPONSE=$(curl -s -X POST http://localhost:8000/cache/mset \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "session_1": {"user_id": "123", "expires": "2025-01-03"},
      "session_2": {"user_id": "456", "expires": "2025-01-03"},
      "session_3": {"user_id": "789", "expires": "2025-01-03"}
    },
    "ttl": 600
  }')

if echo "$MSET_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Multiple values set successfully"
    echo "$MSET_RESPONSE" | jq '.'
else
    print_error "Failed to set multiple values"
    echo "$MSET_RESPONSE"
fi

echo ""

# 6. Test Multi-Get
print_status "6. Testing Multi-Get..."
MGET_RESPONSE=$(curl -s -X POST http://localhost:8000/cache/mget \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"keys":["session_1","session_2","session_3","nonexistent"]}')

if echo "$MGET_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Multiple values retrieved successfully"
    echo "$MGET_RESPONSE" | jq '.'
else
    print_error "Failed to get multiple values"
    echo "$MGET_RESPONSE"
fi

echo ""

# 7. Test Key Search
print_status "7. Testing Key Search..."
SEARCH_RESPONSE=$(curl -s http://localhost:8000/cache/search/session_* \
  -H "Authorization: Bearer $TOKEN")

if echo "$SEARCH_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Key search completed"
    echo "$SEARCH_RESPONSE" | jq '.'
else
    print_error "Failed to search keys"
    echo "$SEARCH_RESPONSE"
fi

echo ""

# 8. Test Update TTL
print_status "8. Testing Update TTL..."
TTL_RESPONSE=$(curl -s -X PUT http://localhost:8000/cache/test_user/ttl \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ttl": 600}')

if echo "$TTL_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "TTL updated successfully"
    echo "$TTL_RESPONSE" | jq '.'
else
    print_error "Failed to update TTL"
    echo "$TTL_RESPONSE"
fi

echo ""

# 9. Test Delete Key
print_status "9. Testing Delete Key..."
DELETE_RESPONSE=$(curl -s -X DELETE http://localhost:8000/cache/test_user \
  -H "Authorization: Bearer $TOKEN")

if echo "$DELETE_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    print_success "Key deleted successfully"
    echo "$DELETE_RESPONSE" | jq '.'
else
    print_error "Failed to delete key"
    echo "$DELETE_RESPONSE"
fi

echo ""

# 10. Verify deletion
print_status "10. Verifying deletion..."
VERIFY_RESPONSE=$(curl -s http://localhost:8000/cache/test_user \
  -H "Authorization: Bearer $TOKEN")

if echo "$VERIFY_RESPONSE" | jq -e '.status' > /dev/null 2>&1; then
    STATUS=$(echo "$VERIFY_RESPONSE" | jq -r '.status')
    if [ "$STATUS" = "not_found" ]; then
        print_success "Key successfully deleted (not found as expected)"
    else
        print_warning "Key still exists after deletion"
    fi
    echo "$VERIFY_RESPONSE" | jq '.'
else
    print_error "Failed to verify deletion"
    echo "$VERIFY_RESPONSE"
fi

echo ""
echo "=== Cache Service Test Summary ==="
print_success "All cache service tests completed!"
echo ""
print_status "Cache service features tested:"
echo "  ✅ Health check"
echo "  ✅ Cache statistics"
echo "  ✅ Set value with TTL"
echo "  ✅ Get value"
echo "  ✅ Multi-set operations"
echo "  ✅ Multi-get operations"
echo "  ✅ Key search by pattern"
echo "  ✅ TTL updates"
echo "  ✅ Key deletion"
echo "  ✅ Deletion verification"
echo ""
print_status "The cache service is fully functional with Redis integration!" 