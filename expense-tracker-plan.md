# Personal Finance WhatsApp Agent — Implementation Plan

## 1. Core Stack

- OpenClaw — WhatsApp + AI agent
- NestJS — Finance API + business logic
- PostgreSQL — financial ledger
- Redis/BullMQ — optional, for async jobs
- OpenAI API — transaction extraction / receipt analysis

Architecture:

WhatsApp
  ↓
OpenClaw
  ↓ tool calls
NestJS Finance API
  ↓
PostgreSQL


## 2. Phase 1 — Finance Backend

Create NestJS application/modules:

- `users`
- `accounts`
- `categories`
- `transactions`
- `attachments`

Core transaction types:

- `income`
- `expense`
- `transfer`

Implement:

- Create transaction
- Update transaction
- Delete transaction
- Get transaction
- Search/filter transactions
- Get balance
- Monthly summary
- Category summary
- Top expenses

Important:

> AI never writes directly to PostgreSQL.
> All writes go through validated Finance API services.


## 3. Phase 2 — Transaction Model

Start with:

```text
accounts
- id
- name
- type
- currency
- initial_balance

categories
- id
- name
- type

transactions
- id
- account_id
- type
- amount
- currency
- category_id
- merchant
- description
- transaction_date
- source
- source_message_id
- status
- created_at
- updated_at

attachments
- id
- transaction_id
- storage_key
- mime_type
````

Keep the model simple initially.

## 4. Phase 3 — AI Extraction

Create structured transaction schema:

```ts
{
  type: 'income' | 'expense' | 'transfer',
  amount: number,
  currency: string,
  merchant?: string,
  category?: string,
  description?: string,
  transactionDate?: string,
  account?: string
}
```

AI responsibilities:

* Understand natural language
* Extract transaction information
* Analyze receipt images
* Identify missing information

Backend responsibilities:

* Validate data
* Resolve accounts/categories
* Apply business rules
* Calculate balances
* Persist transactions

## 5. Phase 4 — OpenClaw Tools

Expose Finance API operations as agent tools:

```text
record_transaction()
update_transaction()
delete_transaction()

search_transactions()

get_balance()
get_monthly_summary()
get_category_summary()
get_top_expenses()
get_cashflow()
```

Example:

> "I spent 45k for lunch."

OpenClaw:

```text
AI extraction
    ↓
record_transaction(...)
    ↓
NestJS validation
    ↓
PostgreSQL
```

## 6. Phase 5 — Confirmation Flow

Initially require confirmation before saving AI-generated transactions.

Example:

```text
Expense detected

Amount: Rp45,000
Category: Food
Description: Lunch
Date: 8 Oct 2026
Account: Cash

1. Save
2. Edit
3. Cancel
```

Only `Save` triggers the API write.

Later, allow automatic saving for simple high-confidence messages.

## 7. Phase 6 — Receipt Support

Support:

```text
WhatsApp image
    ↓
OpenClaw
    ↓
Vision model
    ↓
Structured transaction
    ↓
Confirmation
    ↓
Finance API
    ↓
PostgreSQL
```

Store the original receipt as an attachment.

## 8. Phase 7 — Queries

Support natural-language queries:

```text
How much did I spend this month?

How much did I spend on food?

What were my biggest expenses last month?

What's my current balance?

Show my spending this month.

How much did I spend at Indomaret?
```

OpenClaw converts these into Finance API tool calls.

## 9. Phase 8 — Transfers

Treat transfers separately from expenses.

Example:

```text
"I transferred 2m from BCA to Cash."
```

Result:

```text
BCA
- Rp2,000,000

Cash
+ Rp2,000,000

Net worth
unchanged
```

This logic belongs entirely in the backend.

## 10. Phase 9 — Security

Before real usage:

* Authenticate WhatsApp user
* Whitelist allowed phone number(s)
* Validate every tool request
* Never expose raw SQL to AI
* Never allow arbitrary database operations
* Log AI extraction + final transaction
* Keep WhatsApp `source_message_id`
* Make transaction creation idempotent

## 11. Phase 10 — Optional Dashboard

Once the WhatsApp flow works:

```text
Web Dashboard
      │
      ▼
Finance API
      │
      ▼
PostgreSQL
```

Add:

* Transaction history
* Account balances
* Spending charts
* Category breakdown
* Receipt viewer
* Monthly reports

# MVP Order

Implement only this first:

1. PostgreSQL schema
2. NestJS Finance API
3. `record_transaction()`
4. `get_monthly_summary()`
5. `search_transactions()`
6. OpenClaw tool integration
7. WhatsApp text input
8. Confirmation flow
9. Receipt image extraction
10. Basic security/idempotency

Then expand into dashboard, analytics, budgeting, and financial advice.

# Target MVP

```text
WhatsApp
    ↓
OpenClaw
    ↓
AI
    ↓
Structured Transaction
    ↓
Confirmation
    ↓
NestJS Finance API
    ↓
PostgreSQL
```

Core principle:

> **The ledger is the system. AI is only the interface.**

```
```
