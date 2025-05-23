# Payment Microservice

This microservice handles payment processing functionality as part of the e-commerce microservices architecture.

## Features

- Payment initiation with multiple gateways (Stripe, Razorpay)
- Webhook processing for payment status updates
- Payment refunds and cancellations
- Payment status tracking and history
- User payment history

## Architecture

The service follows a modular design pattern with clean separation of concerns:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Models**: Database schemas and interfaces
- **Middleware**: Request processing (auth, validation, error handling)
- **Utils**: Helper functions and utilities including payment gateway integrations

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
