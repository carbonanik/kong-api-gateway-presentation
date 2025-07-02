# Microservices Architecture Documentation

## System Overview

This project implements a **Node.js microservices architecture** with **Kong Gateway** as the API Gateway, featuring 6 specialized services: Cache, Customer, Order, Payment, Chat, and File services.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                            │
│                    (Web App, Mobile App, Third-party APIs)                 │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │ HTTP/HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KONG GATEWAY                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API GATEWAY LAYER                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   JWT Auth  │ │Rate Limiting│ │   Routing   │ │   Logging   │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  Port: 8000 (HTTP) / 8443 (HTTPS)                                          │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │ Internal Docker Network
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MICROSERVICES LAYER                             │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   CUSTOMER  │ │    ORDER    │ │   PAYMENT   │ │    CHAT     │          │
│  │   Service   │ │   Service   │ │   Service   │ │   Service   │          │
│  │   Port:3002 │ │   Port:3003 │ │   Port:3004 │ │   Port:3005 │          │
│  │             │ │             │ │             │ │             │          │
│  │ • Register  │ │ • Get Order │ │ • Process   │ │ • Messages  │          │
│  │ • Login     │ │ • List      │ │   Payment   │ │ • Real-time │          │
│  │ • JWT Gen   │ │ • Protected │ │ • Protected │ │   Chat      │          │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐                                            │
│  │    CACHE    │ │    FILE     │                                            │
│  │   Service   │ │   Service   │                                            │
│  │   Port:3001 │ │   Port:3006 │                                            │
│  │             │ │             │                                            │
│  │ • Redis     │ │ • Upload    │                                            │
│  │ • Key-Value │ │ • Download  │                                            │
│  │ • Caching   │ │ • Storage   │                                            │
│  └─────────────┘ └─────────────┘                                            │
└─────────────────────┬───────────────────────────────────────────────────────┘
                      │ Database Connections
                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                      │
│                                                                             │
│  ┌─────────────────────────────────┐ ┌─────────────────────────────────┐   │
│  │           MONGODB               │ │             REDIS               │   │
│  │         Port: 27017             │ │           Port: 6379            │   │
│  │                                 │ │                                 │   │
│  │ • User Data                     │ │ • Session Storage               │   │
│  │ • Order Data                    │ │ • Cache Data                    │   │
│  │ • Payment Data                  │ │ • Rate Limiting                 │   │
│  │ • Chat Messages                 │ │ • Temporary Data                │   │
│  └─────────────────────────────────┘ └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Service Details

### 1. Kong Gateway (API Gateway)
- **Purpose**: Central entry point for all API requests
- **Features**:
  - JWT Authentication
  - Rate Limiting (100 requests/minute)
  - Request Routing
  - Load Balancing
  - Request/Response Logging
- **Ports**: 8000 (HTTP), 8443 (HTTPS)

### 2. Customer Service
- **Purpose**: User management and authentication
- **Endpoints**:
  - `POST /customer/register` - User registration (Public)
  - `POST /customer/login` - User login (Public)
- **Database**: MongoDB
- **Security**: Password hashing with bcrypt, JWT token generation

### 3. Order Service
- **Purpose**: Order management and processing
- **Endpoints**:
  - `GET /order/:id` - Get specific order (Protected)
  - `GET /order` - List all orders (Protected)
- **Security**: JWT authentication required

### 4. Payment Service
- **Purpose**: Payment processing and transactions
- **Endpoints**:
  - `POST /payment/charge` - Process payment (Protected)
- **Security**: JWT authentication required

### 5. Cache Service
- **Purpose**: Caching frequently accessed data
- **Endpoints**:
  - `GET /cache/:key` - Retrieve cached data (Protected)
- **Database**: Redis
- **Security**: JWT authentication required

### 6. Chat Service
- **Purpose**: Real-time messaging and communication
- **Endpoints**:
  - `GET /chat/messages` - Get chat messages (Protected)
- **Security**: JWT authentication required

### 7. File Service
- **Purpose**: File upload and management
- **Endpoints**:
  - `POST /file/upload` - Upload files (Protected)
- **Security**: JWT authentication required

## Security Architecture

### Authentication Flow
1. **Registration**: User registers via `/customer/register`
2. **Login**: User logs in via `/customer/login` and receives JWT token
3. **API Access**: All subsequent requests include JWT token in Authorization header
4. **Validation**: Kong Gateway validates JWT token before routing to services

### Security Features
- **JWT Tokens**: Stateless authentication with 1-hour expiration
- **Rate Limiting**: 100 requests per minute per client
- **Password Security**: bcrypt hashing for password storage
- **Service Isolation**: Each service runs in its own container
- **Network Security**: Internal Docker network for service communication

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **API Gateway**: Kong Gateway 3.5
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt

### Databases
- **Primary Database**: MongoDB 6
- **Cache Database**: Redis 7

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Networking**: Docker internal networks
- **Port Management**: Exposed ports for external access

### Development Tools
- **Package Management**: npm
- **Environment**: Environment variables for configuration
- **Logging**: Console logging for debugging

## Deployment Architecture

### Container Structure
```
presentation/
├── kong/                    # API Gateway
├── customer-service/        # User management
├── order-service/          # Order processing
├── payment-service/        # Payment handling
├── cache-service/          # Caching layer
├── chat-service/           # Real-time messaging
├── file-service/           # File management
├── mongo/                  # MongoDB database
└── redis/                  # Redis cache
```

### Network Configuration
- **External Access**: Port 8000 (Kong Gateway)
- **Internal Communication**: Docker network with service names
- **Database Access**: Internal ports (27017 for MongoDB, 6379 for Redis)

## Scalability Considerations

### Horizontal Scaling
- Each service can be scaled independently
- Kong Gateway can handle multiple instances
- Database clustering for MongoDB and Redis

### Load Balancing
- Kong Gateway provides load balancing
- Service discovery through Docker networking
- Health checks for service availability

### Performance Optimization
- Redis caching for frequently accessed data
- Connection pooling for database connections
- Rate limiting to prevent abuse 