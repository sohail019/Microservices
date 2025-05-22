# Auth Microservice

This microservice handles all authentication and authorization functionality for the system.

## Features

- Email/password authentication
- OAuth authentication (Google, Apple)
- JWT token management
- Session tracking and validation
- Secure token refresh flow
- Rate limiting and security measures

## Architecture

The service follows a modular design pattern with clean separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Providers**: Different authentication methods
- **Models**: Database schemas
- **Middleware**: Request processing (auth, validation, etc.)
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
