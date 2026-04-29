import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

  // Fetch monthly transactions
  const transactions = await prisma.transaction.findMany({
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
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((sum, t) => sum + t.amount, 0);

  // Get user currency
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currency: true, name: true },
  });

  return (
    <HomeClient
      transactions={JSON.parse(JSON.stringify(transactions))}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      currency={user?.currency || "BDT"}
      currentMonth={month}
      currentYear={year}
    />
  );
}
