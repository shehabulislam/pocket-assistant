import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";
import HomeClient from "./HomeClient";

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

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

  // Ensure default categories exist
  await ensureDefaultCategories(userId);

  // Fetch all needed data in parallel
  const [transactions, user, goals, incomeCategories, expenseCategories, accounts] =
    await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        include: {
          category: true,
          account: true,
        },
        orderBy: { date: "desc" },
        take: 50,
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currency: true, name: true },
      }),
      prisma.goal.findMany({
        where: { userId },
        orderBy: [{ currentAmount: "desc" }, { name: "asc" }],
        take: 5,
      }),
      prisma.category.findMany({
        where: { userId, type: "INCOME" },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { userId, type: "EXPENSE" },
        orderBy: { name: "asc" },
      }),
      prisma.account.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      }),
    ]);

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <HomeClient
      transactions={JSON.parse(JSON.stringify(transactions))}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      currency={user?.currency || "BDT"}
      currentMonth={month}
      currentYear={year}
      goals={JSON.parse(JSON.stringify(goals))}
      incomeCategories={JSON.parse(JSON.stringify(incomeCategories))}
      expenseCategories={JSON.parse(JSON.stringify(expenseCategories))}
      accounts={JSON.parse(JSON.stringify(accounts))}
    />
  );
}
