import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { transactions: true } },
    },
  });

  return (
    <CategoriesClient
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
