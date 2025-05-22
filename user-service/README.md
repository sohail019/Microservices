# User Microservice

This microservice handles user profile management as part of the microservices architecture.

## Features

- User profile creation and management
- User preferences and settings
- Address management
- Query and filter capabilities
- Integration with auth-service

## Architecture

The service follows a modular design pattern with clean separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Database schemas and interfaces
- **Middleware**: Request processing (validation, error handling)
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
