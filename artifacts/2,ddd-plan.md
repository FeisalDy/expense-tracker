For your Personal Finance WhatsApp Agent, I recommend organizing the NestJS application around business capabilities, not around every database table. With DDD, each module should have a clear responsibility, its own application use cases, domain model, and infrastructure implementations where needed.

Your plan is a good starting point. The main thing to clarify is the difference between:

* Module / bounded context: a business area, such as Transactions or Accounts.

* Entity: an object with identity and a lifecycle, such as a Transaction or Financial Account.

* Value object: a concept defined by its value, such as Money or a transaction period.

* Use case: an operation the application supports, such as Record Transaction or Get Monthly Summary.

* Repository: an abstraction for loading and saving domain objects.

* Persistence entity: a representation of a database table, which does not have to be identical to a domain entity.

You do not need a separate NestJS module for every domain entity. For example, `Transaction`, `TransactionAttachment`, and transaction-related domain services can belong to the Transactions module initially.

# 1. Recommended module structure

I'd start with the following modules for your architecture. Some are needed for the MVP; others can be added later.

WhatsApp / Agent Integration

OpenClaw tools, message handling, confirmation flow

Application Layer

Use cases and orchestration

Transactions

Income, expenses, transfers

Accounts

Financial accounts, balances

Categories

Income and expense classification

Reports

Summaries and analytics

Infrastructure

PostgreSQL, repositories, OpenAI, file storage, messaging adapters

This is a conceptual view, not a requirement that every layer be a separate NestJS module.

## Module responsibilities

| Module                   | Responsibility                                                      | MVP priority                         |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------ |
| `transactions`           | Record, update, delete, retrieve, and search financial transactions | Essential                            |
| `accounts`               | Manage cash, bank accounts, and e-wallets                           | Essential                            |
| `categories`             | Manage expense and income categories                                | Essential                            |
| `reports`                | Calculate monthly totals, category summaries, and top expenses      | Essential                            |
| `users`                  | Identify users and associate financial data with them               | Essential for multi-user support     |
| `integrations`           | Handle OpenClaw tool requests and WhatsApp message metadata         | Essential for integration            |
| `attachments`            | Store receipt files and link them to transactions                   | Add for receipt support              |
| `confirmations`          | Track proposed transactions awaiting user approval                  | Add for confirmation flow            |
| `ai`                     | Extract structured data from text and receipt images                | Add when implementing AI             |
| `transfers`              | Handle transfers and their account-balance effects                  | Can initially live in `transactions` |
| `recurring-transactions` | Schedule repeating financial events                                 | Later                                |
| `budgets`                | Define spending limits and monitor usage                            | Later                                |
| `audit`                  | Track sensitive actions and changes                                 | Basic logging early; expand later    |

### A useful DDD distinction

Not every row above must be a separate bounded context. In an initial application, you could treat Transactions, Accounts, and Categories as separate NestJS modules within one finance domain. Reports can be an application module that queries those modules' data without owning the underlying financial records.

Likewise, `ai` and `integrations` are technical or integration-oriented modules; they do not automatically need their own rich domain models.

# 2. Possible entities by module

This is the part I would define before writing more code. These are candidate domain entities, not a requirement to create every one immediately.

## 2.1 `transactions`

The central module of the application.

| Entity / concept        | Purpose                                             |
| ----------------------- | --------------------------------------------------- |
| `Transaction`           | Represents a recorded income, expense, or transfer  |
| `TransactionAttachment` | Links a receipt or supporting file to a transaction |
| `TransactionTag`        | Optional flexible labels attached to transactions   |
| `TransactionSplit`      | Splits one transaction into multiple categories     |
| `TransactionRevision`   | Optional history of transaction changes             |

Start with: `Transaction`.

Add `TransactionAttachment` when you implement receipt storage. Add `TransactionSplit` only if you need one purchase to belong to multiple categories.

A transaction might contain:

```
Transaction
├── id
├── userId
├── type
├── amount
├── currency
├── categoryId
├── accountId
├── merchant
├── description
├── transactionDate
├── source
├── sourceMessageId
├── status
├── createdAt
└── updatedAt
```

For transfers, you have two possible designs:

* Add `destinationAccountId` to `Transaction` when a transfer is a simple transaction type.

* Introduce a dedicated `Transfer` aggregate if transfers require more complex rules, lifecycle, or reconciliation.

Do not implement both models without a clear reason.

## 2.2 `accounts`

| Entity / concept   | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `FinancialAccount` | A user's cash, bank account, or e-wallet              |
| `AccountBalance`   | Optional persisted balance projection for performance |
| `AccountStatement` | Optional imported statement or reconciliation record  |

Start with `FinancialAccount`.

```
FinancialAccount
├── id
├── userId
├── name
├── type
├── currency
├── initialBalance
├── isArchived
├── createdAt
└── updatedAt
```

Possible account types include `cash`, `bank`, `e_wallet`, and eventually `credit_card`.

Important: `AccountBalance` does not need to be a separate domain entity in your MVP. You can calculate a balance from the opening balance and recorded ledger movements.

For example:

Balance=Initial Balance+Income−Expenses+Transfer In−Transfer Out\text{Balance} = \text{Initial Balance} + \text{Income} - \text{Expenses} + \text{Transfer In} - \text{Transfer Out}Balance=Initial Balance+Income−Expenses+Transfer In−Transfer Out

A credit card will eventually require different balance semantics because purchases increase the amount owed rather than reducing a cash balance.

## 2.3 `categories`

| Entity / concept | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `Category`       | Classifies income or expenses               |
| `CategoryGroup`  | Optional grouping for reporting and display |

Start with `Category` only.

```
Category
├── id
├── userId
├── name
├── type
├── parentCategoryId
├── icon
├── isSystem
└── isArchived
```

Examples:

* Expense: Food, Transportation, Utilities.

* Income: Salary, Freelance, Investment Returns.

A `parentCategoryId` allows hierarchical categories without requiring a separate entity for every level.

You can also seed default categories and let each user create custom ones.

## 2.4 `users`

| Entity / concept | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| `User`           | Owns financial data                                                     |
| `UserIdentity`   | Associates an external identity, such as a WhatsApp sender, with a user |
| `UserPreference` | Stores currency, timezone, and other preferences                        |

For your WhatsApp application, the important entity is `User`.

You can keep preferences inside `User` initially, but a separate `UserPreference` becomes useful if preferences grow.

`UserIdentity` is useful when you eventually support multiple external identities or messaging providers. Do not assume that a WhatsApp phone number is the entire identity model.

## 2.5 `confirmations`

This module becomes relevant because your plan requires explicit approval before saving AI-generated transactions.

| Entity / concept      | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `TransactionProposal` | Stores the extracted transaction data awaiting approval            |
| `Confirmation`        | Optional separate approval record if approval history is important |

I would initially use `TransactionProposal` as the main entity, with a status such as:

TypeScript

```
type ProposalStatus =
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'expired';
```

Example lifecycle:

```
WhatsApp message
      ↓
AI extracts transaction
      ↓
TransactionProposal (pending)
      ↓
User confirms
      ↓
Validated transaction is recorded
      ↓
Proposal (confirmed)
```

The proposal is not yet a financial transaction. It is a request to create one.

This distinction makes it easier to support editing extracted values, rejecting suggestions, and expiring old proposals without polluting the ledger.

## 2.6 `attachments`

| Entity / concept             | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| `Attachment`                 | Represents a stored receipt or document      |
| `AttachmentProcessingResult` | Optional result of OCR or receipt extraction |

For the MVP, `Attachment` is sufficient.

```
Attachment
├── id
├── transactionId
├── storageKey
├── mimeType
├── fileSize
├── uploadedAt
└── processingStatus
```

You could also place `TransactionAttachment` inside the Transactions domain and keep file storage operations in an infrastructure service. You do not necessarily need both `Attachment` and `TransactionAttachment`.

Choose based on whether attachments will be reused by other business areas or have their own lifecycle.

## 2.7 `reports`

I would not initially create entities for every report.

Your planned operations are primarily queries:

* `GetMonthlySummary`

* `GetCategorySummary`

* `GetTopExpenses`

* `GetCashflow`

* `GetAccountBalance`

These are application use cases or query handlers, not domain entities.

Later, if you need cached summaries, materialized views, or historical snapshots, you can introduce read models such as `MonthlySummary`. They should not replace the underlying ledger.

## 2.8 `ai` and `integrations`

These modules usually need fewer domain entities than financial modules.

| Module         | Possible entities or models                              |
| -------------- | -------------------------------------------------------- |
| `ai`           | `ExtractionResult`, `ExtractionRun`                      |
| `integrations` | `InboundMessage`, `ExternalIdentity`, `IntegrationEvent` |
| `audit`        | `AuditLog` or `AuditEntry`                               |

These are candidates, not mandatory entities.

For example, `ExtractionResult` can initially be a DTO or value object instead of a persisted entity. Persist `ExtractionRun` if you need to inspect extraction attempts, confidence, errors, or model versions.

For the first version, keeping the original message identifier and extraction result associated with the proposal may be sufficient.

# 3. How I would structure the NestJS code

Your current structure has both `dto` and `application/dto`, as well as both `domain/entities` and `entities`. That duplication is likely to become confusing.

I recommend a consistent layered structure. For example, the Transactions module could look like this:

```
src/
├── main.ts
├── app.module.ts
├── config/
│   └── database.config.ts
│
├── modules/
│   ├── transactions/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── transaction.ts
│   │   │   ├── value-objects/
│   │   │   │   └── money.ts
│   │   │   ├── repositories/
│   │   │   │   └── transaction.repository.ts
│   │   │   └── services/
│   │   │
│   │   ├── application/
│   │   │   ├── use-cases/
│   │   │   │   ├── record-transaction.use-case.ts
│   │   │   │   ├── update-transaction.use-case.ts
│   │   │   │   ├── delete-transaction.use-case.ts
│   │   │   │   ├── get-transaction.use-case.ts
│   │   │   │   └── search-transactions.use-case.ts
│   │   │   └── dto/
│   │   │       ├── create-transaction.dto.ts
│   │   │       └── update-transaction.dto.ts
│   │   │
│   │   ├── infrastructure/
│   │   │   └── persistence/
│   │   │       ├── entities/
│   │   │       │   └── transaction.orm-entity.ts
│   │   │       ├── repositories/
│   │   │       │   └── postgres-transaction.repository.ts
│   │   │       └── mappers/
│   │   │           └── transaction.mapper.ts
│   │   │
│   │   ├── presentation/
│   │   │   └── http/
│   │   │       └── transactions.controller.ts
│   │   │
│   │   ├── transactions.module.ts
│   │   └── transactions.controller.spec.ts
│   │
│   ├── accounts/
│   ├── categories/
│   ├── users/
│   ├── reports/
│   ├── confirmations/
│   ├── attachments/
│   ├── integrations/
│   └── ai/
│
└── shared/
    ├── domain/
    │   └── value-objects/
    └── infrastructure/
```

This is a target structure, not a requirement to create all these files today. Start with the layers that you actually need.

### What belongs in each layer?

| Layer            | Contains                                                            | Should not contain                                  |
| ---------------- | ------------------------------------------------------------------- | --------------------------------------------------- |
| `domain`         | Business entities, value objects, invariants, repository interfaces | NestJS controllers, TypeORM decorators, HTTP DTOs   |
| `application`    | Use cases, orchestration, application DTOs                          | Database-specific queries and HTTP request handling |
| `infrastructure` | TypeORM entities, repository implementations, database adapters     | Core business rules                                 |
| `presentation`   | Controllers, request validation, HTTP response mapping              | Financial business logic                            |

One nuance: some teams put repository interfaces under `domain/repositories`; others put them under `application/ports`. Either is defensible. Be consistent with the dependency direction.

The key rule is that the domain should not depend on TypeORM or NestJS infrastructure.

# 4. Domain entity versus database entity

This is particularly important given your existing `transaction.entity.ts` files.

Suppose you have these two files:

```
domain/entities/transaction.ts
infrastructure/persistence/entities/transaction.orm-entity.ts
```

They represent different concerns.

Domain entity

TypeScript

```
export class Transaction {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public readonly amount: Money,
    public readonly accountId: string,
    public readonly transactionDate: Date,
  ) {}

  // Business rules and behavior belong here.
}
```

Persistence entity

TypeScript

```
@Entity('transactions')
export class TransactionOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  type: string;

  @Column({ type: 'numeric', precision: 19, scale: 4 })
  amount: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @Column({ name: 'transaction_date', type: 'timestamptz' })
  transactionDate: Date;
}
```

These are illustrative examples; the full implementation needs constructors, validation, mapping, and the rest of the fields.

The distinction matters because a database schema may change without changing the business meaning of a transaction. Conversely, a new business rule may require domain changes without requiring a new database column.

For a small application, it is also reasonable to use a simpler model without a separate domain class and ORM class for every entity. DDD is about modeling the domain and controlling dependencies, not maximizing the number of files.

# 5. What are the actual use cases for your MVP?

I would define these before implementing controllers.

| Module          | Use cases                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `transactions`  | `RecordTransaction`, `UpdateTransaction`, `DeleteTransaction`, `GetTransaction`, `SearchTransactions` |
| `accounts`      | `CreateAccount`, `UpdateAccount`, `ListAccounts`, `GetAccountBalance`                                 |
| `categories`    | `CreateCategory`, `ListCategories`, `UpdateCategory`                                                  |
| `reports`       | `GetMonthlySummary`, `GetCategorySummary`, `GetTopExpenses`, `GetCashflow`                            |
| `confirmations` | `CreateProposal`, `EditProposal`, `ConfirmProposal`, `RejectProposal`, `ExpireProposal`               |
| `attachments`   | `AttachReceipt`, `GetAttachment`, `DeleteAttachment`                                                  |
| `integrations`  | `HandleInboundMessage`, `ResolveExternalUser`, `DispatchAgentTool`                                    |
| `ai`            | `ExtractTransaction`, `ExtractReceiptData`                                                            |

You do not need to expose all use cases as HTTP endpoints. For example, `ConfirmProposal` may be called by an OpenClaw tool, while `ExtractTransaction` may be invoked internally by an application service.

Also, a controller should not need to know how PostgreSQL stores the transaction. It should validate and translate the request, then invoke the relevant use case.

# 6. Important financial design decisions

Before finalizing your schema, I would make these decisions explicit.

1. Money: Use a decimal database type or integer minor units. Avoid JavaScript floating-point arithmetic for financial calculations.

2. Account balances: Treat the transaction ledger as the source of truth. Cached balances are derived data.

3. Transfers: Record both account movements consistently and ensure they are committed atomically.

4. Deletion: Decide whether completed transactions can be physically deleted or should be reversed or voided. For a personal MVP, deletion can be simpler, but preserve appropriate audit history as the application matures.

5. Idempotency: Enforce uniqueness for an external message identifier within the appropriate integration/user scope. Retrying the same WhatsApp request must not create duplicate transactions.

6. Ownership: Every read and write must be scoped to the authenticated user. Never trust a `userId` supplied by the AI tool without verifying it.

7. Confirmation: A proposal must not alter the ledger until the backend validates and commits the transaction.

8. Reports: Calculate totals from recorded transactions and apply consistent rules for date ranges, statuses, currencies, and transfers.

# 7. My recommended starting point

Don't implement every module in the proposed tree yet. I would build this subset first:

Build now

`transactions`, `accounts`, `categories`, `users`, and `reports`.

Establish the ledger, account ownership, basic classifications, and queries.

Build for WhatsApp integration

`confirmations` and `integrations`.

Introduce transaction proposals, message identity, and safe tool execution when connecting OpenClaw.

Build when needed

`ai`, `attachments`, `recurring-transactions`, `budgets`, and more advanced audit functionality.

Add each when its corresponding workflow is ready to implement.

My strongest recommendation is to keep `Transaction` as the core financial record, `TransactionProposal` as the unconfirmed AI suggestion, and `FinancialAccount` as the account whose balance is affected. These three concepts form the foundation of your WhatsApp-first expense tracker.

Once those boundaries are clear, the remaining modules and their entities become much easier to design.
