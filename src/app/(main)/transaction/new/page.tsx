import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TransactionForm from "./TransactionForm";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { type: txnType } = await searchParams;
  const userId = session.user.id;

  // Fetch categories based on type
  const categoryType =
    txnType === "INCOME" ? "INCOME" : "EXPENSE";

  const [categories, accounts, paymentTypes] = await Promise.all([
    prisma.category.findMany({
      where: { userId, type: categoryType },
      orderBy: { name: "asc" },
    }),
    prisma.account.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
    prisma.paymentType.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <TransactionForm
      type={categoryType}
      categories={JSON.parse(JSON.stringify(categories))}
      accounts={JSON.parse(JSON.stringify(accounts))}
      paymentTypes={JSON.parse(JSON.stringify(paymentTypes))}
    />
  );
}
