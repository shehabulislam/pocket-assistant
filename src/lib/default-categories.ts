import { prisma } from "@/lib/prisma";

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & Drinks", icon: "🍔", color: "#FF6B6B" },
  { name: "Shopping", icon: "🛍️", color: "#A855F7" },
  { name: "Transport", icon: "🚗", color: "#3B82F6" },
  { name: "Bills & Utilities", icon: "💡", color: "#F59E0B" },
  { name: "Entertainment", icon: "🎬", color: "#EC4899" },
  { name: "Health", icon: "🏥", color: "#10B981" },
  { name: "Education", icon: "📚", color: "#6366F1" },
  { name: "Groceries", icon: "🛒", color: "#14B8A6" },
  { name: "Rent", icon: "🏠", color: "#8B5CF6" },
  { name: "Insurance", icon: "🛡️", color: "#64748B" },
  { name: "Gifts", icon: "🎁", color: "#F43F5E" },
  { name: "Other Expense", icon: "📦", color: "#78716C" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "💰", color: "#10B981" },
  { name: "Freelance", icon: "💻", color: "#3B82F6" },
  { name: "Investment", icon: "📈", color: "#8B5CF6" },
  { name: "Business", icon: "🏢", color: "#F59E0B" },
  { name: "Gifts Received", icon: "🎉", color: "#EC4899" },
  { name: "Other Income", icon: "💵", color: "#6366F1" },
];

/**
 * Seeds default categories for a user if they have none.
 * Returns true if categories were created, false if user already had some.
 */
export async function ensureDefaultCategories(userId: string): Promise<boolean> {
  const count = await prisma.category.count({ where: { userId } });
  if (count > 0) return false;

  await prisma.category.createMany({
    data: [
      ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: "EXPENSE" as const,
        isDefault: true,
        userId,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: "INCOME" as const,
        isDefault: true,
        userId,
      })),
    ],
  });

  return true;
}
