"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createGoal(data: {
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.goal.create({
      data: {
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        userId: session.user.id,
      },
    });
    revalidatePath("/goals");
    return { success: true };
  } catch (error) {
    console.error("Create goal error:", error);
    return { error: "Failed to create goal" };
  }
}

export async function updateGoalAmount(id: string, amount: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.userId !== session.user.id) {
      return { error: "Goal not found" };
    }

    const newAmount = Math.max(0, goal.currentAmount + amount);

    await prisma.goal.update({
      where: { id },
      data: { currentAmount: Math.min(newAmount, goal.targetAmount) },
    });

    revalidatePath("/goals");
    return { success: true };
  } catch (error) {
    console.error("Update goal error:", error);
    return { error: "Failed to update goal" };
  }
}

export async function deleteGoal(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.goal.delete({ where: { id } });
    revalidatePath("/goals");
    return { success: true };
  } catch (error) {
    console.error("Delete goal error:", error);
    return { error: "Failed to delete goal" };
  }
}
