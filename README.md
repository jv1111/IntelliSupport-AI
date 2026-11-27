# IntelliSupport AI

**A smarter way to manage customer support, service operations, and business-client relationships.**

IntelliSupport AI is a SaaS-based customer support and service management platform designed to help businesses manage customer inquiries, provide product and service assistance, and streamline their support operations through intelligent automation and AI-powered assistance.

The vision is to bring the entire customer support operation into one centralized workspace, connecting business owners, customer service agents, and customers through a unified support platform.

Whether a business manages its own customer support team or operates with multiple agents handling customer inquiries, IntelliSupport AI aims to provide the tools needed to organize support resources, automate common interactions, manage customer assistance, and maintain visibility over support operations.

With AI-powered assistance, configurable automated responses, and centralized product and service information, IntelliSupport AI aims to make customer support more organized, consistent, and manageable as businesses grow.

## Core Features

### AI-Powered Customer Support

Provide intelligent customer assistance using business-defined information and AI.

- AI-powered customer support conversations.
- Product-specific and service-related information.
- Knowledge Base integration for AI-generated responses.
- Configurable automatic replies.
- Controlled AI responses based on available business information.
- Predefined fallback responses when information is unavailable.
- Configurable AI availability.

### Product and Service Management

Organize the products and services that a business offers to its customers.

- Create and manage product records.
- Maintain product names, SKUs, and descriptions.
- Upload and manage product images.
- Organize product records into Published, Draft, and Archived states.
- Search and browse product catalogs.

### Centralized Knowledge Base

Maintain organized support documentation that can be used by customer support personnel and AI assistants.

- Create and manage Knowledge Base articles.
- Organize articles into Generic and Product-Specific scopes.
- Associate support information with individual products.
- Categorize articles into:
  - Troubleshooting
  - Installation and Setup
  - Others
- Publish, archive, and restore articles.
- Search and filter support documentation.
- Maintain organized information for consistent customer assistance.

Only published articles are used as AI support context.

### Automated Customer Responses

Reduce repetitive support work through configurable automated responses.

- Create predefined customer messages and answers.
- Associate automatic replies with individual products.
- Configure nested follow-up messages.
- Organize automated responses into conversation branches.
- Edit, delete, and reorder configured replies.
- Enable or disable automatic replies independently of AI.

### Customer Support AI Playground

Experiment with and evaluate AI-powered support experiences.

- Select a product to test.
- Simulate customer interactions.
- Send custom messages.
- Preview configured automatic replies.
- Explore suggested messages and follow-up branches.
- Test product-specific AI responses.
- Restart conversations to evaluate different scenarios.

### Account Management

Manage application accounts and authentication.

- User registration and login.
- Secure password hashing.
- Database-backed session authentication.
- Email verification.
- Phone number verification.
- Password recovery and reset.
- Account email and phone management.
- Password changes.

### External Integrations

| Service              | Purpose                                  |
| -------------------- | ---------------------------------------- |
| AI Services          | AI-powered customer support              |
| Google Cloud Storage | Product image storage                    |
| Brevo                | Email verification and password recovery |
| UniSMS               | Phone verification                       |
| PostgreSQL           | Application database                     |

## API Endpoints

**GraphQL API**

```text
/api/graphql
```

**Product Image Upload**

```text
/api/uploads/product-image
```

## Getting Started

### Prerequisites

- Node.js compatible with Next.js 16.
- npm.
- Docker and Docker Compose.
- AI provider API credentials.
- Google Cloud Storage credentials.
- Brevo API credentials.
- UniSMS API credentials.

### 1. Clone the Repository

```bash
git clone git@github.com:jv1111/IntelliSupport-AI.git
cd IntelliSupport-AI
```

### 2. Install Dependencies

```bash
npm ci
```

### 3. Configure Environment Variables

Create your local environment file:

```bash
cp .env.example .env
```

Configure the required database, AI service, storage, email, and SMS credentials in `.env`.

Refer to `.env.example` for the complete list of required environment variables.

Keep your environment variables, API keys, and service account credentials private.

### 4. Start PostgreSQL

The project includes a Docker Compose configuration for PostgreSQL.

```bash
docker compose up -d db
```

The database is exposed locally at:

```text
127.0.0.1:5434
```

Make sure your database credentials and connection string match your `.env` configuration.

### 5. Generate the Prisma Client

```bash
npx prisma generate
```

### 6. Apply Database Migrations

```bash
npx prisma migrate deploy
```

### 7. Start the Development Server

```bash
npm run dev
```

Open the application in your browser:

```text
http://localhost:3000
```

## Available Scripts

| Command                | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `npm run dev`          | Start the development server                      |
| `npm run build`        | Build the production application                  |
| `npm run start`        | Start the production server                       |
| `npm run lint`         | Run ESLint                                        |
| `npm run type-check`   | Run TypeScript checks                             |
| `npm run format:check` | Check code formatting                             |
| `npm run test`         | Run the test suite                                |
| `npm run check-all`    | Run formatting, linting, type checking, and tests |
| `npm run test:chat-ai` | Run AI integration tests                          |

## Testing

IntelliSupport AI uses Vitest and React Testing Library.

Run the test suite:

```bash
npm run test
```

Run all project checks:

```bash
npm run check-all
```

Run AI integration tests:

```bash
npm run test:chat-ai
```

Live AI integration tests require valid API credentials and an explicitly enabled live testing configuration.

## Project Status

IntelliSupport AI is actively under development.

The current implementation focuses on product management, Knowledge Base management, automated response configuration, AI Playground, account authentication, and supporting backend integrations.

The broader objective is to evolve the platform into a comprehensive SaaS customer support and service management solution for businesses, including multi-agent support operations and business-level management capabilities.

Some application sections, including Dashboard, Billing, Conversations, Support Tickets, and Linked Stores, currently contain placeholder pages.

Business workspaces, multi-agent management, agent assignment, and agent performance tracking are planned capabilities and are not yet implemented.

## License

IntelliSupport AI is proprietary software.

See [LICENSE](LICENSE) for the applicable license terms.
