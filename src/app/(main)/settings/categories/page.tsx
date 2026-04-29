import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureDefaultCategories } from "@/lib/default-categories";
import CategoriesClient from "./CategoriesClient";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Auto-seed default categories if user has none
  await ensureDefaultCategories(session.user.id);

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
