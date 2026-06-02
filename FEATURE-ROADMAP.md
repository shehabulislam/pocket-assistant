# Pocket Assistant — Feature Analysis & Roadmap

_Last analyzed: 2026-06-02_

A personal finance tracker (Next.js 16 + Prisma 7 + Postgres, mobile-first PWA-style UI). This document maps **what exists**, **what's stubbed but unfinished**, and **what's missing**, with a prioritized implementation plan.

---

## 1. Current State — What Works Today

| Area | Status | Notes |
|------|--------|-------|
| **Auth** | ✅ Working | Credentials (email/password) via NextAuth, signup, route protection in [proxy.ts](src/proxy.ts) |
| **Accounts** | ✅ Working | CRUD, balances, transfer between accounts, view/delete account transactions |
| **Transactions** | ✅ Working | Create / edit / delete (INCOME, EXPENSE), balance checks, atomic balance updates, month navigation |
| **Categories** | ✅ Working | CRUD + default categories seeded per user |
| **Budgets** | ✅ Working | Per-category, per-month limits; spend tracking |
| **Goals** | ✅ Working | Create, update saved amount, delete |
| **Loans** | ✅ Working | Given/Taken, record payments, settle, delete |
| **Reports** | ✅ Working | Income/expense totals, category breakdown, daily chart (recently de-duplicated to a single source of truth in [lib/reports.ts](src/lib/reports.ts)) |
| **CSV export** | ✅ Working | Full-history export via [api/export/csv](src/app/api/export/csv/route.ts) |
| **Settings** | ✅ Partial | Currency, reminder toggles, theme field |

---

## 2. Stubbed / Half-Built — Schema Exists, Feature Doesn't

These have **database models or UI placeholders already**, so they're the cheapest high-value wins.

### 2.1 🏷️ Tags — ✅ **IMPLEMENTED** (`feature/tags-and-transfers`)
- Tag CRUD via [tags/actions.ts](src/app/(main)/tags/actions.ts) + [TagsClient.tsx](src/app/(main)/tags/TagsClient.tsx) (create/edit/delete, duplicate-name guard, ownership checks).
- Reusable [TagPicker.tsx](src/components/TagPicker.tsx) multi-select wired into both the new and edit transaction forms; tag links are written/replaced inside the same atomic `$transaction` as the balance update.
- Tag chips now render on transaction rows in [HomeTab.tsx](src/app/(main)/tabs/HomeTab.tsx); Tags is ungated in Settings for all users.
- **Still open:** filtering/reporting _by_ tag (depends on the transaction search/filter work in Phase 1.3).

### 2.2 🔁 Recurring Transactions — _model exists, no engine_
- `RecurringTransaction` model (with `frequency`, `nextDue`, `isActive`) exists.
- [recurring/page.tsx](src/app/(main)/recurring/page.tsx) is a placeholder button.
- **No scheduler** anywhere processes `nextDue` to auto-create transactions.
- **To implement:** CRUD UI + a cron/scheduled job (Vercel Cron or a `/api/cron/recurring` route) that materializes due transactions and advances `nextDue`.

### 2.3 🔔 Notifications — _toggles save, nothing sends_
- `Settings.pushNotifications`, `dailyReminder`, `reminderTime`, `weeklySummary` are stored and toggleable.
- **Nothing actually delivers** a notification — no service worker, no Web Push, no email digest.
- **To implement:** service worker + Web Push subscription, a cron for daily reminders / weekly summary email.

### 2.4 💑 Partner Mode — _stub only_
- [partner/page.tsx](src/app/(main)/partner/page.tsx) is "Coming Soon"; gated to SUPERADMIN in the settings menu.
- **To implement:** account linking/invites, shared accounts or a shared "household" scope, permission model.

### 2.5 🔀 Manual TRANSFER transactions
- `TRANSFER` exists as a `TransactionType` and is produced by account-to-account transfers, but the **transaction form only offers INCOME/EXPENSE**.
- The UI already renders TRANSFER rows ([HomeTab.tsx](src/app/(main)/tabs/HomeTab.tsx)), so wiring a transfer option into the create form is low effort.

---

## 3. Missing Features — Not Started

### 3.1 Core finance gaps
- **Search & filter transactions** — no way to search by text, amount, category, account, date range, or tag.
- **Custom date-range / period reports** — reports are hardcoded to the current month. The `viewPeriod` user setting (weekly/monthly/yearly) is stored but **never used**.
- **Multi-currency** — `currency` is only a display symbol. No per-account currency, no FX conversion, no consolidated net worth across currencies.
- **Net worth / trends over time** — no month-over-month income/expense trend, no balance-over-time, no category trends.
- **Budget alerts & rollover** — no notification when a budget is exceeded; no carry-over of unspent budget.
- **Receipts / attachments** — no image upload per transaction.
- **Split transactions** — can't split one payment across categories.
- **CSV/Statement import** — export exists, but no import (and no date-range on export).

### 3.2 Account & loan integrity
- **Goal funding doesn't move money** — `Goal.currentAmount` is edited manually; contributions don't debit an account.
- **Loan ↔ account balance** — ✅ **IMPLEMENTED** (`feature/loan-account-balance`). Loans can now be linked to an account; creating, repaying, settling, and deleting a loan adjust that account's balance atomically (GIVEN moves money out / repayments back in; TAKEN the reverse), with insufficient-balance guards on outflows. The account link is optional, so loans created without one behave as before. _Still open:_ loan flows do not yet create visible Transaction records, so they remain outside income/expense reports (intentional for now).
- **Account archiving** — accounts can only be deleted, not archived/hidden.

### 3.3 Auth & account security
- **No password reset / forgot password** flow.
- **No email verification** on signup.
- **No OAuth** (Google/Apple) — only credentials.
- **No 2FA**, no login rate limiting / lockout.

### 3.4 Platform / quality
- **Not an installable PWA** — mobile-first UI but no `manifest.json`, no service worker, no offline support, no "Add to Home Screen".
- **No i18n** — `language` setting stored but all copy is hardcoded English.
- **`Float` money columns** — accumulates rounding drift; should be integer minor units or `Decimal`.
- **No automated tests** — no unit/integration/e2e coverage for the money-math invariants.
- **Dead code** — `HomeClient.tsx` is unused; a stale `.next` type references a deleted `cloud-sync` route.

---

## 4. Prioritized Implementation Plan

### 🟢 Phase 1 — Quick Wins (schema already supports it)
1. **Tags end-to-end** — CRUD actions + transaction-form multi-select + filter by tag.
2. **Manual TRANSFER in the transaction form** — add the third type; UI already renders it.
3. **Transaction search & filter** — text/category/account/date-range filter on the Home list.
4. **Custom date-range reports** — honor the existing `viewPeriod` setting; the new `getMonthReport` helper generalizes cleanly to arbitrary ranges.

### 🟡 Phase 2 — Engines & Automation
5. **Recurring transactions engine** — CRUD UI + scheduled job to materialize due entries.
6. **Notifications** — service worker + Web Push for daily reminders, budget-exceeded alerts, weekly summary email.
7. **PWA** — manifest, icons, service worker, offline shell, installability.

### 🟠 Phase 3 — Depth & Trust
8. **Money as integers/Decimal** (migration) — eliminates rounding drift across all views.
9. **Trends & net worth reports** — multi-month income/expense, balance-over-time, category trends.
10. **Goal funding that moves money** + loan↔account cash-flow linkage.
11. **Auth hardening** — password reset, email verification, OAuth, rate limiting.

### 🔵 Phase 4 — Collaboration & Scale
12. **Partner / household mode** — invites, shared scope, permissions.
13. **Multi-currency** with FX conversion.
14. **CSV/statement import**, receipts/attachments, split transactions.
15. **i18n**, automated test suite (especially the `Reports total === Budget total === Σ transactions` invariant).

---

## 5. Suggested Next Step

The single highest value-to-effort item is **Tags end-to-end** (Phase 1.1) — the data model is already there, it touches the transaction form and reports, and it unlocks tag-based filtering used by several later features. A close second is the **recurring transactions engine** (Phase 2.5), since the model exists but the feature is entirely inert today.
