"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTransaction(formData: {
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string;
  accountId: string;
  description?: string;
  date: string;
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

    const transaction = await prisma.transaction.create({
      data: {
        amount,
        type: formData.type,
        categoryId: formData.categoryId,
        accountId: formData.accountId,
        description: formData.description || null,
        date: new Date(formData.date),
        userId,
      },
    });

    // Update account balance
    const balanceChange = formData.type === "INCOME" ? amount : -amount;
    await prisma.account.update({
      where: { id: formData.accountId },
      data: { balance: { increment: balanceChange } },
    });

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

    // Reverse old balance
    const oldBalanceChange =
      existing.type === "INCOME" ? -existing.amount : existing.amount;
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: oldBalanceChange } },
    });

    // Update the transaction
    await prisma.transaction.update({
      where: { id },
      data: {
        amount,
        type: formData.type,
        categoryId: formData.categoryId,
        accountId: formData.accountId,
        description: formData.description || null,
        date: new Date(formData.date),
      },
    });

    // Apply new balance
    const newBalanceChange = formData.type === "INCOME" ? amount : -amount;
    await prisma.account.update({
      where: { id: formData.accountId },
      data: { balance: { increment: newBalanceChange } },
    });

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

    // Reverse the balance change
    const balanceChange =
      transaction.type === "INCOME"
        ? -transaction.amount
        : transaction.amount;
    await prisma.account.update({
      where: { id: transaction.accountId },
      data: { balance: { increment: balanceChange } },
    });

    await prisma.transaction.delete({ where: { id } });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete transaction error:", error);
    return { error: "Failed to delete transaction" };
  }
}
