"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrUpdateBudget(data: {
  categoryId: string;
  limit: number;
  month: string; // ISO date string for the 1st of the month
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const monthDate = new Date(data.month);

    // Upsert: create or update for this user+category+month
    await prisma.budget.upsert({
      where: {
        userId_categoryId_month: {
          userId: session.user.id,
          categoryId: data.categoryId,
          month: monthDate,
        },
      },
      create: {
        userId: session.user.id,
        categoryId: data.categoryId,
        limit: data.limit,
        month: monthDate,
      },
      update: {
        limit: data.limit,
      },
    });

    revalidatePath("/budgets");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Budget upsert error:", error);
    return { error: "Failed to save budget" };
  }
}

export async function deleteBudget(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.budget.delete({ where: { id } });
    revalidatePath("/budgets");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete budget error:", error);
    return { error: "Failed to delete budget" };
  }
}
