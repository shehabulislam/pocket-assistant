import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";
import { getMonthReport, getMonthRange } from "@/lib/reports";
import AppClient from "./AppClient";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const params = await searchParams;
  const now = new Date();

  const month = params.month ? parseInt(params.month) : now.getMonth();
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const { start: startOfMonth, end: endOfMonth } = getMonthRange(year, month);

  // Ensure default categories exist
  await ensureDefaultCategories(userId);

  // ── Fetch ALL data in parallel ──
  const [
    report,
    transactions,
    user,
    goals,
    incomeCategories,
    expenseCategories,
    accounts,
    budgets,
    categoriesWithCounts,
    accountsWithCounts,
    allGoals,
    allLoans,
  ] = await Promise.all([
    // Reports + Home totals: aggregated over the FULL month (single source of truth)
    getMonthReport(userId, year, month),
    // Home: recent transactions list (display only — capped)
    prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: {
        category: true,
        account: true,
        tags: { include: { tag: true } },
      },
      orderBy: { date: "desc" },
      take: 50,
    }),
    // Shared: user info
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        currency: true,
        language: true,
        budgetPeriod: true,
        viewPeriod: true,
        role: true,
        settings: true,
      },
    }),
    // Home: goals (top 5)
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ currentAmount: "desc" }, { name: "asc" }],
      take: 5,
    }),
    // Shared: income categories
    prisma.category.findMany({
      where: { userId, type: "INCOME" },
      orderBy: { name: "asc" },
    }),
    // Shared: expense categories
    prisma.category.findMany({
      where: { userId, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    // Shared: accounts
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    // Budgets
    prisma.budget.findMany({
      where: { userId, month: startOfMonth },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    // Settings: all categories with transaction counts
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      include: { _count: { select: { transactions: true } } },
    }),
    // Settings: accounts with transaction counts
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      include: { _count: { select: { transactions: true } } },
    }),
    // Settings: all goals (no limit)
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ currentAmount: "desc" }, { name: "asc" }],
    }),
    // Loans
    prisma.loan.findMany({
      where: { userId },
      orderBy: [{ isSettled: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const currency = user?.currency || "BDT";

  // ── Report aggregates (single source of truth — full month) ──
  const {
    totalIncome,
    totalExpense,
    categoryBreakdown,
    dailyData,
    expenseByCategory,
  } = report;

  // ── Budget calculations ──
  const spendingByCategory = expenseByCategory;
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce(
    (sum, b) => sum + (spendingByCategory[b.categoryId] || 0),
    0
  );

  const monthLabel = startOfMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const budgetMonthLabel = monthLabel;

  // Check if user has any transactions today (for reminder banner)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const hasTransactionsToday = transactions.some(
    (t) => new Date(t.date) >= todayStart
  );

  return (
    <AppClient
      // Home
      transactions={JSON.parse(JSON.stringify(transactions))}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      currency={currency}
      currentMonth={month}
      currentYear={year}
      goals={JSON.parse(JSON.stringify(goals))}
      incomeCategories={JSON.parse(JSON.stringify(incomeCategories))}
      expenseCategories={JSON.parse(JSON.stringify(expenseCategories))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      hasTransactionsToday={hasTransactionsToday}
      // Reports
      reportsTotalIncome={totalIncome}
      reportsTotalExpense={totalExpense}
      categoryBreakdown={categoryBreakdown}
      dailyData={dailyData}
      monthLabel={monthLabel}
      // Budgets
      budgets={JSON.parse(JSON.stringify(budgets))}
      spendingByCategory={spendingByCategory}
      totalBudget={totalBudget}
      totalSpent={totalSpent}
      currentBudgetMonth={startOfMonth.toISOString()}
      budgetMonthLabel={budgetMonthLabel}
      // Settings
      user={JSON.parse(JSON.stringify(user || {
        name: null,
        email: "",
        currency: "BDT",
        language: "en",
        budgetPeriod: 1,
        viewPeriod: "monthly",
        role: "USER",
        settings: null,
      }))}
      // Settings sub-views
      categoriesWithCounts={JSON.parse(JSON.stringify(categoriesWithCounts))}
      accountsWithCounts={JSON.parse(JSON.stringify(accountsWithCounts))}
      allGoals={JSON.parse(JSON.stringify(allGoals))}
      allLoans={JSON.parse(JSON.stringify(allLoans))}
    />
  );
}
