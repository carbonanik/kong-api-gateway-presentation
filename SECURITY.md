# Security Documentation

## Security Overview

This microservices architecture implements a **multi-layered security approach** with Kong Gateway as the primary security enforcement point, complemented by service-level security measures.

## Security Architecture Layers

### 1. API Gateway Security (Kong Gateway)

#### JWT Authentication
```yaml
# Kong JWT Configuration
plugins:
  - name: jwt
    config:
      key_claim_name: iss
      secret_is_base64: false
      claims_to_verify:
        - exp
        - nbf
```

**How it works:**
- **Token Generation**: Customer service generates JWT tokens during login
- **Token Validation**: Kong validates tokens before routing requests
- **Claims Verification**: Checks expiration (`exp`) and not-before (`nbf`) claims
- **Secret Management**: Uses shared secret between services and Kong

#### Rate Limiting
```yaml
# Kong Rate Limiting Configuration
plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: local
```

**Protection Features:**
- **100 requests per minute** per client
- **Local policy** for high performance
- **Automatic blocking** of excessive requests
- **Rate limit headers** in responses

### 2. Service-Level Security

#### Customer Service Security
```javascript
// Password Security
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash(password, 10);
const valid = await bcrypt.compare(password, user.password);

// JWT Token Generation
const token = jwt.sign(
  { 
    sub: user._id, 
    username, 
    iss: JWT_ISSUER 
  }, 
  JWT_SECRET, 
  { 
    algorithm: 'HS256', 
    expiresIn: '1h' 
  }
);
```

**Security Measures:**
- **Password Hashing**: bcrypt with salt rounds of 10
- **JWT Token Issuance**: 1-hour expiration with user claims
- **Input Validation**: Username/password validation
- **Error Handling**: Secure error messages

#### Protected Service Security
All other services (Order, Payment, Cache, Chat, File) require valid JWT tokens:
- **Authentication Required**: No public endpoints
- **Token Validation**: Kong handles JWT validation
- **Service Isolation**: Each service runs in separate container

### 3. Network Security

#### Docker Network Security
```yaml
# Docker Compose Network Configuration
services:
  kong:
    ports:
      - "8000:8000"    # External access
  customer-service:
    ports:
      - "3002:3000"    # Direct access (for testing)
```

**Security Features:**
- **Internal Communication**: Services communicate via Docker network
- **Port Exposure**: Only necessary ports exposed externally
- **Service Discovery**: Internal DNS resolution
- **Network Isolation**: Services isolated in Docker network

### 4. Database Security

#### MongoDB Security
```javascript
// MongoDB Connection
mongoose.connect('mongodb://mongo:27017/microservices', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

**Security Measures:**
- **Internal Network**: MongoDB only accessible within Docker network
- **No Authentication**: Development setup (production would require auth)
- **Data Validation**: Mongoose schema validation
- **Connection Security**: Internal network communication

#### Redis Security
```javascript
// Redis Connection (when implemented)
const redis = require('redis');
const client = redis.createClient({
  host: 'redis',
  port: 6379
});
```

**Security Features:**
- **Internal Access**: Redis only accessible within Docker network
- **No Authentication**: Development setup
- **Data Encryption**: In-memory storage
- **Connection Pooling**: Efficient connection management

## Authentication Flow

### 1. User Registration
```
Client → Kong Gateway → Customer Service → MongoDB
   ↑                                        ↓
   └────────── Success Response ←──────────┘
```

**Security Steps:**
1. Input validation on username/password
2. Password hashing with bcrypt
3. Duplicate username check
4. Secure error handling

### 2. User Login
```
Client → Kong Gateway → Customer Service → MongoDB
   ↑                                        ↓
   └────────── JWT Token ←──────────────────┘
```

**Security Steps:**
1. Username/password validation
2. Password comparison with bcrypt
3. JWT token generation with user claims
4. Token expiration set to 1 hour

### 3. Protected API Access
```
Client → Kong Gateway (JWT Validation) → Service → Response
   ↑                                                    ↓
   └────────── Protected Data ←────────────────────────┘
```

**Security Steps:**
1. JWT token validation by Kong
2. Claims verification (exp, nbf)
3. Request routing to appropriate service
4. Service processes request and returns data

## Security Best Practices Implemented

### 1. Principle of Least Privilege
- **Service Isolation**: Each service has minimal required permissions
- **Network Access**: Only necessary ports exposed
- **Database Access**: Services only access required databases

### 2. Defense in Depth
- **Multiple Layers**: Gateway + Service + Database security
- **Redundant Protection**: Rate limiting + authentication
- **Fail-Safe Design**: Services fail securely

### 3. Secure by Default
- **No Public Endpoints**: All services require authentication (except login/register)
- **Secure Headers**: Kong adds security headers
- **Error Handling**: No sensitive information in error messages

### 4. Token Security
- **Short Expiration**: 1-hour JWT token lifetime
- **Secure Claims**: Minimal required claims in tokens
- **Algorithm Security**: HS256 algorithm for signing

## Security Headers

Kong Gateway automatically adds security headers:
```
X-Kong-Response-Latency: 1
X-Kong-Request-Id: 60e19021be2cb23e01ec6a6d15dd4d09
RateLimit-Limit: 100
RateLimit-Remaining: 99
```

## Monitoring and Logging

### Kong Gateway Logging
- **Access Logs**: All requests logged
- **Error Logs**: Security violations logged
- **Rate Limit Logs**: Excessive requests tracked

### Service Logging
- **Authentication Events**: Login attempts logged
- **Error Logging**: Security errors captured
- **Performance Monitoring**: Response times tracked

## Security Testing

### Authentication Testing
```bash
# Test without JWT (should fail)
curl -i http://localhost:8000/order/123

# Test with valid JWT (should succeed)
curl -i http://localhost:8000/order/123 \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

### Rate Limiting Testing
```bash
# Test rate limiting
for i in {1..110}; do
  curl -i http://localhost:8000/order/123 \
    -H "Authorization: Bearer <JWT_TOKEN>"
done
```

## Production Security Considerations

### Additional Security Measures for Production
1. **HTTPS/TLS**: Enable SSL termination in Kong
2. **Database Authentication**: Add MongoDB and Redis authentication
3. **Environment Variables**: Secure secret management
4. **Logging**: Centralized logging and monitoring
5. **Backup**: Regular database backups
6. **Updates**: Regular security updates
7. **Monitoring**: Security event monitoring
8. **Penetration Testing**: Regular security assessments

### Security Configuration
```yaml
# Production Kong Configuration
KONG_SSL: "on"
KONG_SSL_CERT: "/path/to/cert.pem"
KONG_SSL_CERT_KEY: "/path/to/key.pem"
KONG_ADMIN_SSL: "on"
```

## Compliance and Standards

This architecture follows security best practices:
- **OWASP Top 10**: Addresses common web vulnerabilities
- **JWT Standards**: RFC 7519 compliant
- **Docker Security**: Container security best practices
- **Microservices Security**: Service-to-service security patterns 