
# Factory Operations & Quality Control System

A full-stack factory operations and quality-control application developed for the Zapuza Technologies assignment.

The application manages product registration, quality inspections, supervisor approvals, production operations, hold periods, and dispatch validation.

## Features

### 1. Product Management
- Register products with unique serial numbers.
- View registered products and their creation dates.
- Prevent duplicate serial numbers.

### 2. Quality Inspections
- Record measurements for individual products.
- Define minimum and maximum acceptable values.
- Automatically determine PASS or FAIL based on the measured value.
- View inspection history and results.

### 3. Inspection Approvals
- Review inspections awaiting a decision.
- Approve or reject inspections.
- Record the reviewer and rejection reason.
- View approval history.

### 4. Production Operations
- Configure manufacturing steps and sequence numbers.
- Start and complete production operations.
- Enforce operation sequencing.
- Configure and enforce operation hold periods.

### 5. Dispatch Management
- Review production and inspection readiness.
- Require all operations to be completed.
- Require operation hold periods to have elapsed.
- Require a passing and approved Final PDI inspection.
- Prevent duplicate dispatches.
- Record the dispatcher and dispatch time.

### 6. Dashboard
- View product and inspection summaries.
- Review production operation progress.
- Navigate to the main application modules.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **ORM:** Prisma
- **Database:** SQLite
- **Runtime:** Node.js

## Prerequisites

Install the following before running the application:

- Node.js
- npm

## Installation and Setup

### 1. Clone the repository

```bash
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
cd zapuza-quality-system
```

Replace the repository URL with your actual GitHub repository URL.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="file:./dev.db"
```

Do not commit secrets or private environment variables.

### 4. Set up the database

Apply the committed Prisma migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

These commands assume the repository includes the required Prisma migration files.

### 5. Start the development server

```bash
npm run dev
```

Open the application:

http://localhost:3000

## Application Routes

| Route | Description |
|---|---|
| `/` | Dashboard |
| `/products` | Product registration and listing |
| `/inspections` | Quality inspection recording and history |
| `/approvals` | Inspection review and decisions |
| `/operations` | Production operation management |
| `/dispatch` | Dispatch readiness and authorization |

## Dispatch Validation

Before creating a dispatch record, the backend validates the following conditions:

1. The product exists.
2. The product has not already been dispatched.
3. At least one production operation is configured.
4. Every operation is completed and its hold period has elapsed.
5. A `Final PDI` inspection exists and has status `PASS`.
6. The Final PDI inspection has supervisor approval with status `APPROVED`.

Requests that fail these checks are rejected by the dispatch API.

## Validation and Testing

Run the TypeScript check:

```bash
npx tsc --noEmit
```

Manually test the main workflows:

- Register a product and verify duplicate serial numbers are rejected.
- Record passing and failing inspections.
- Approve and reject inspections.
- Verify production operation sequence enforcement.
- Verify hold-time restrictions.
- Verify dispatch rejection when requirements are incomplete.
- Verify successful dispatch for an eligible product.
- Verify that a product cannot be dispatched twice.

## Limitations

This is an assignment implementation. Authentication, role-based authorization, production deployment hardening, and any additional workflows required by the complete assignment specification should be assessed before production use.

## Author

Add your name and relevant contact information before submission.
