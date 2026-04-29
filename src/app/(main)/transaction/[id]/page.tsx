import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditTransactionClient from "./EditTransactionClient";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const userId = session.user.id;

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true, account: true },
  });

  if (!transaction) notFound();

  const [expenseCategories, incomeCategories, accounts] = await Promise.all([
    prisma.category.findMany({
      where: { userId, type: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { userId, type: "INCOME" },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  const categories =
    transaction.type === "INCOME" ? incomeCategories : expenseCategories;

  return (
    <EditTransactionClient
      transaction={JSON.parse(JSON.stringify(transaction))}
      categories={JSON.parse(JSON.stringify(categories))}
      accounts={JSON.parse(JSON.stringify(accounts))}
    />
  );
}
