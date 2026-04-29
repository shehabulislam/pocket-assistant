import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GoalsClient from "./GoalsClient";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [goals, user] = await Promise.all([
    prisma.goal.findMany({
      where: { userId },
      orderBy: [{ currentAmount: "desc" }, { name: "asc" }],
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    }),
  ]);

  return (
    <GoalsClient
      goals={JSON.parse(JSON.stringify(goals))}
      currency={user?.currency || "BDT"}
    />
  );
}
