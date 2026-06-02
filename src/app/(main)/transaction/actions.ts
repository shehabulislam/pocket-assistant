"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Filter the requested tag ids down to those the user actually owns, so a
 * transaction can never be linked to another user's (or a non-existent) tag.
 */
async function validateTagIds(
  userId: string,
  tagIds?: string[]
): Promise<string[]> {
  if (!tagIds || tagIds.length === 0) return [];
  const owned = await prisma.tag.findMany({
    where: { userId, id: { in: tagIds } },
    select: { id: true },
  });
  return owned.map((t) => t.id);
}

export async function createTransaction(formData: {
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  accountId: string;
  description?: string;
  date: string;
  tagIds?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const userId = session.user.id;
    const amount = Math.abs(formData.amount);

    // Check account balance for expenses
    if (formData.type === "EXPENSE") {
      const account = await prisma.account.findFirst({
        where: { id: formData.accountId, userId },
        select: { balance: true, name: true },
      });

      if (!account) {
        return { error: "Account not found" };
      }

      if (account.balance <= 0) {
        return { error: `Insufficient balance in ${account.name}. Current balance is ৳0.00` };
      }

      if (account.balance < amount) {
        const bal = account.balance.toLocaleString("en-US", { minimumFractionDigits: 2 });
        return { error: `Insufficient balance in ${account.name}. Available: ৳${bal}` };
      }
    }

    // Validate tag ownership so we never link another user's tags
    const tagIds = await validateTagIds(userId, formData.tagIds);

    // Create transaction + update balance atomically so they never drift apart
    const balanceChange = formData.type === "INCOME" ? amount : -amount;
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          amount,
          type: formData.type,
          categoryId: formData.categoryId,
          accountId: formData.accountId,
          description: formData.description || null,
          date: new Date(formData.date),
          userId,
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      }),
      prisma.account.update({
        where: { id: formData.accountId },
        data: { balance: { increment: balanceChange } },
      }),
    ]);

    revalidatePath("/");
    return { success: true, id: transaction.id };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { error: "Failed to create transaction" };
  }
}

export async function updateTransaction(
  id: string,
  formData: {
    amount: number;
    type: "INCOME" | "EXPENSE";
    categoryId: string;
    accountId: string;
    description?: string;
    date: string;
    tagIds?: string[];
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const userId = session.user.id;

    // Get existing transaction to reverse the old balance change
    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return { error: "Transaction not found" };
    }

    const amount = Math.abs(formData.amount);
    const oldBalanceChange =
      existing.type === "INCOME" ? -existing.amount : existing.amount;
    const newBalanceChange = formData.type === "INCOME" ? amount : -amount;
    const tagIds = await validateTagIds(userId, formData.tagIds);

    // Reverse old balance, update the transaction, re-link tags, apply new
    // balance — all atomically.
    await prisma.$transaction([
      prisma.account.update({
        where: { id: existing.accountId },
        data: { balance: { increment: oldBalanceChange } },
      }),
      prisma.tagOnTransaction.deleteMany({ where: { transactionId: id } }),
      prisma.transaction.update({
        where: { id },
        data: {
          amount,
          type: formData.type,
          categoryId: formData.categoryId,
          accountId: formData.accountId,
          description: formData.description || null,
          date: new Date(formData.date),
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      }),
      prisma.account.update({
        where: { id: formData.accountId },
        data: { balance: { increment: newBalanceChange } },
      }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Update transaction error:", error);
    return { error: "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const userId = session.user.id;

    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      return { error: "Transaction not found" };
    }

    // Reverse the balance change + delete atomically
    const balanceChange =
      transaction.type === "INCOME"
        ? -transaction.amount
        : transaction.amount;
    await prisma.$transaction([
      prisma.account.update({
        where: { id: transaction.accountId },
        data: { balance: { increment: balanceChange } },
      }),
      prisma.transaction.delete({ where: { id } }),
    ]);

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { error: "Failed to delete transaction" };
  }
}
