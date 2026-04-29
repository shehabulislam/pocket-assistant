"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCategory(data: {
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE";
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.category.create({
      data: { ...data, userId: session.user.id },
    });
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error) {
    console.error("Create category error:", error);
    return { error: "Failed to create category" };
  }
}

export async function updateCategory(
  id: string,
  data: { name: string; icon: string; color: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.category.update({
      where: { id },
      data,
    });
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error) {
    console.error("Update category error:", error);
    return { error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    // Check if category has transactions
    const count = await prisma.transaction.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      return {
        error: `Cannot delete: ${count} transaction(s) use this category`,
      };
    }

    await prisma.category.delete({ where: { id } });
    revalidatePath("/settings/categories");
    return { success: true };
  } catch (error) {
    console.error("Delete category error:", error);
    return { error: "Failed to delete category" };
  }
}



// ---- Account Actions ----

export async function createAccount(data: {
  name: string;
  type: "CASH" | "BANK" | "MOBILE_BANKING" | "CREDIT" | "INVESTMENT";
  icon: string;
  balance: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        balance: data.balance,
        userId: session.user.id,
      },
    });
    revalidatePath("/settings/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Create account error:", error);
    return { error: "Failed to create account" };
  }
}

export async function deleteAccount(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const count = await prisma.transaction.count({
      where: { accountId: id },
    });
    if (count > 0) {
      return {
        error: `Cannot delete: ${count} transaction(s) linked to this account`,
      };
    }

    // Prevent deleting the last account
    const totalAccounts = await prisma.account.count({
      where: { userId: session.user.id },
    });
    if (totalAccounts <= 1) {
      return { error: "You must have at least one account" };
    }

    await prisma.account.delete({ where: { id } });
    revalidatePath("/settings/accounts");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete account error:", error);
    return { error: "Failed to delete account" };
  }
}
