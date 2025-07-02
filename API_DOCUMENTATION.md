# API Documentation

## Base URL
```
http://localhost:8000
```

## Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

To obtain a JWT token, use the login endpoint in the Customer Service.

## Rate Limiting

All endpoints are rate-limited to **100 requests per minute** per client.

## Customer Service

### Register User
**POST** `/customer/register`

Register a new user account.

**Request Body:**
```json
{
  "username": "alice",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "User registered"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Username and password required"
}
```

**Response (409 Conflict):**
```json
{
  "message": "Username already exists"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/customer/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
```

### Login User
**POST** `/customer/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "alice",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Username and password required"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Invalid credentials"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/customer/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'
```

## Order Service

### Get Order by ID
**GET** `/order/:id`

Retrieve a specific order by its ID.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "orderId": "123",
  "status": "pending",
  "customer": "alice",
  "items": [
    {
      "name": "Product 1",
      "quantity": 2,
      "price": 29.99
    },
    {
      "name": "Product 2",
      "quantity": 1,
      "price": 49.99
    }
  ],
  "total": 109.97,
  "createdAt": "2025-01-02T04:24:54.123Z"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Unauthorized"
}
```

**Example:**
```bash
curl -i http://localhost:8000/order/123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get All Orders
**GET** `/order`

Retrieve a list of all orders.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "orders": [
    {
      "orderId": "123",
      "status": "pending",
      "customer": "alice"
    },
    {
      "orderId": "124",
      "status": "shipped",
      "customer": "bob"
    },
    {
      "orderId": "125",
      "status": "delivered",
      "customer": "alice"
    }
  ]
}
```

**Example:**
```bash
curl -i http://localhost:8000/order \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Payment Service

### Process Payment
**POST** `/payment/charge`

Process a payment transaction.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 109.97,
  "currency": "USD",
  "paymentMethod": "credit_card",
  "orderId": "123"
}
```

**Response (200 OK):**
```json
{
  "message": "Payment processed",
  "transactionId": "txn_123456789",
  "status": "success"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/payment/charge \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"amount":109.97,"currency":"USD","paymentMethod":"credit_card","orderId":"123"}'
```

## Cache Service

### Get Cached Data
**GET** `/cache/:key`

Retrieve data from cache by key.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "key": "user_profile_123",
  "value": {
    "username": "alice",
    "email": "alice@example.com",
    "preferences": {
      "theme": "dark",
      "language": "en"
    }
  },
  "expiresAt": "2025-01-02T05:24:54.123Z"
}
```

**Response (404 Not Found):**
```json
{
  "key": "nonexistent_key",
  "value": null
}
```

**Example:**
```bash
curl -i http://localhost:8000/cache/user_profile_123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Chat Service

### Get Chat Messages
**GET** `/chat/messages`

Retrieve chat messages.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `room` (optional): Chat room ID
- `limit` (optional): Number of messages to retrieve (default: 50)
- `offset` (optional): Number of messages to skip (default: 0)

**Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "msg_123",
      "sender": "alice",
      "content": "Hello, how are you?",
      "timestamp": "2025-01-02T04:20:00.000Z",
      "room": "general"
    },
    {
      "id": "msg_124",
      "sender": "bob",
      "content": "I'm doing well, thanks!",
      "timestamp": "2025-01-02T04:21:00.000Z",
      "room": "general"
    }
  ],
  "total": 2,
  "hasMore": false
}
```

**Example:**
```bash
curl -i "http://localhost:8000/chat/messages?room=general&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## File Service

### Upload File
**POST** `/file/upload`

Upload a file to the system.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data:**
- `file`: The file to upload
- `description` (optional): File description
- `category` (optional): File category

**Response (200 OK):**
```json
{
  "message": "File uploaded",
  "fileId": "file_123456789",
  "filename": "document.pdf",
  "size": 1024000,
  "mimeType": "application/pdf",
  "uploadedAt": "2025-01-02T04:24:54.123Z"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "No file provided"
}
```

**Response (413 Payload Too Large):**
```json
{
  "message": "File too large"
}
```

**Example:**
```bash
curl -X POST http://localhost:8000/file/upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@document.pdf" \
  -F "description=Important document" \
  -F "category=documents"
```

## Error Responses

### Standard Error Format
All services return errors in a consistent format:

**401 Unauthorized:**
```json
{
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "message": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found"
}
```

**429 Too Many Requests:**
```json
{
  "message": "Rate limit exceeded"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error"
}
```

## Response Headers

All responses include standard headers:

```
Content-Type: application/json; charset=utf-8
X-Kong-Response-Latency: 1
X-Kong-Request-Id: 60e19021be2cb23e01ec6a6d15dd4d09
RateLimit-Limit: 100
RateLimit-Remaining: 99
```

## Testing Examples

### Complete Authentication Flow
```bash
# 1. Register a new user
curl -X POST http://localhost:8000/customer/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}'

# 2. Login to get JWT token
TOKEN=$(curl -s -X POST http://localhost:8000/customer/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass123"}' | jq -r '.token')

# 3. Use token to access protected endpoints
curl -i http://localhost:8000/order/123 \
  -H "Authorization: Bearer $TOKEN"
```

### Testing Rate Limiting
```bash
# Test rate limiting (should fail after 100 requests)
for i in {1..110}; do
  echo "Request $i"
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/order/123 \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  sleep 0.1
done
```

## SDK Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class MicroservicesAPI {
  constructor(baseURL = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async login(username, password) {
    const response = await axios.post(`${this.baseURL}/customer/login`, {
      username,
      password
    });
    this.token = response.data.token;
    return this.token;
  }

  async getOrder(orderId) {
    const response = await axios.get(`${this.baseURL}/order/${orderId}`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    return response.data;
  }

  async processPayment(paymentData) {
    const response = await axios.post(`${this.baseURL}/payment/charge`, paymentData, {
      headers: { 
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }
}

// Usage
const api = new MicroservicesAPI();
await api.login('alice', 'password123');
const order = await api.getOrder('123');
```

### Python
```python
import requests

class MicroservicesAPI:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
        self.token = None

    def login(self, username, password):
        response = requests.post(f'{self.base_url}/customer/login', json={
            'username': username,
            'password': password
        })
        self.token = response.json()['token']
        return self.token

    def get_order(self, order_id):
        headers = {'Authorization': f'Bearer {self.token}'}
        response = requests.get(f'{self.base_url}/order/{order_id}', headers=headers)
        return response.json()

    def process_payment(self, payment_data):
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        response = requests.post(f'{self.base_url}/payment/charge', 
                               json=payment_data, headers=headers)
        return response.json()

# Usage
api = MicroservicesAPI()
api.login('alice', 'password123')
order = api.get_order('123')
``` 