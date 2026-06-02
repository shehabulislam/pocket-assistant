import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import TransactionsClient from "./TransactionsClient";

const RESULT_LIMIT = 200;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    categoryId?: string;
    accountId?: string;
    tagId?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const type =
    sp.type === "INCOME" || sp.type === "EXPENSE" || sp.type === "TRANSFER"
      ? sp.type
      : "";
  const categoryId = sp.categoryId || "";
  const accountId = sp.accountId || "";
  const tagId = sp.tagId || "";
  const from = sp.from || "";
  const to = sp.to || "";

  // ── Build the filter ──
  const where: Prisma.TransactionWhereInput = { userId };
  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (accountId) where.accountId = accountId;
  if (tagId) where.tags = { some: { tagId } };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(`${from}T00:00:00.000`);
    if (to) where.date.lte = new Date(`${to}T23:59:59.999`);
  }
  if (q) {
    where.OR = [
      { description: { contains: q, mode: "insensitive" } },
      { category: { is: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [transactions, categories, accounts, tags, user] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        account: true,
        tags: { include: { tag: true } },
      },
      orderBy: { date: "desc" },
      take: RESULT_LIMIT,
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: [{ type: "asc" }, { name: "asc" }],
      select: { id: true, name: true, type: true },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.tag.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    }),
  ]);

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <TransactionsClient
      transactions={JSON.parse(JSON.stringify(transactions))}
      categories={JSON.parse(JSON.stringify(categories))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      tags={JSON.parse(JSON.stringify(tags))}
      currency={user?.currency || "BDT"}
      totalIncome={totalIncome}
      totalExpense={totalExpense}
      resultLimit={RESULT_LIMIT}
      reachedLimit={transactions.length === RESULT_LIMIT}
      filters={{ q, type, categoryId, accountId, tagId, from, to }}
    />
  );
}
