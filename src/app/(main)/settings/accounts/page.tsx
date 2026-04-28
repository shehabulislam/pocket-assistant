import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountsClient from "./AccountsClient";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  return (
    <AccountsClient
      accounts={JSON.parse(JSON.stringify(accounts))}
    />
  );
}
