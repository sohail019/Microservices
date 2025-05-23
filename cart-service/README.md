# Cart Microservice

This microservice handles shopping cart functionality as part of the microservices architecture.

## Features

- Cart management (add, update, remove items)
- Save for later functionality
- Cross-service communication with product service
- JWT authentication integration

## Architecture

The service follows a modular design pattern with clean separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Database schemas and interfaces
- **Middleware**: Request processing (auth, validation, error handling)
- **Utils**: Helper functions and utilities

## Setup and Installation

### Prerequisites

- Node.js 18+
- MongoDB 4.4+

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```
