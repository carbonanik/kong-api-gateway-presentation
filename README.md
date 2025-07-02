# Node.js Microservices with Kong Gateway

A modular backend system using Node.js microservices, routed through Kong Gateway. The services include: Cache, Customer, Order, Payment, Chat, File.

## System Architecture
- **Kong Gateway (API Gateway)** routes to:
  - `/cache` → Cache Service
  - `/customer` → Customer Service
  - `/order` → Order Service
  - `/payment` → Payment Service
  - `/chat` → Chat Service
  - `/file` → File Service

All services are containerized with Docker and can be scaled independently.

## Project Structure
```
.
├── gateway/
│   └── kong.yaml
├── services/
│   ├── cache/
│   │   └── index.js
│   ├── customer/
│   │   └── index.js
│   ├── order/
│   │   └── index.js
│   ├── payment/
│   │   └── index.js
│   ├── chat/
│   │   └── index.js
│   └── file/
│       └── index.js
├── shared/
│   └── db.js
├── docker-compose.yml
└── README.md
```

## Tech Stack
- Node.js + Express
- Redis (Cache)
- MongoDB (Database)
- Socket.IO (Chat)
- Multer/S3 (File Uploads)
- Kong Gateway (API Management)
- Docker + Docker Compose

## Running the Project
1. Clone the repo
```bash
git clone <your_repo>
cd kong-microservice-app
```
2. Start with Docker
```bash
docker-compose up --build
```
3. Access gateway: [http://localhost:8000/](http://localhost:8000/)

## Security Design
- Kong Gateway: JWT Auth / API Key / Rate Limiting
- Role-Based Access Control (RBAC) inside services
- HTTPS with Kong TLS termination
- WebSocket token validation (chat)
- File validation (MIME type, size)

## Useful Endpoints
- POST /customer/register
- GET /order/:id
- POST /payment/charge
- POST /file/upload
- GET /chat/messages
- GET /cache/:key 