# Order Microservice

This microservice handles order management functionality as part of the e-commerce microservices architecture.

## Features

- Order creation and management
- Order status tracking with logs
- Order item management
- Discount application
- Integration with product and user services
- Admin operations for order management

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
