"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLoan(data: {
  type: "GIVEN" | "TAKEN";
  personName: string;
  amount: number;
  description?: string;
  deadline?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (data.amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }
  if (!data.personName.trim()) {
    return { error: "Person name is required" };
  }

  try {
    await prisma.loan.create({
      data: {
        type: data.type,
        personName: data.personName.trim(),
        amount: data.amount,
        remainingAmount: data.amount,
        description: data.description || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        userId: session.user.id,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Create loan error:", error?.message || error);
    return { error: error?.message || "Failed to create loan" };
  }
}

export async function recordLoanPayment(data: {
  loanId: string;
  amount: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (data.amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }

  try {
    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, userId: session.user.id },
    });

    if (!loan) return { error: "Loan not found" };

    if (data.amount > loan.remainingAmount) {
      return { error: "Payment exceeds remaining amount" };
    }

    const newRemaining = loan.remainingAmount - data.amount;

    await prisma.loan.update({
      where: { id: data.loanId },
      data: {
        remainingAmount: newRemaining,
        isSettled: newRemaining <= 0,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Record loan payment error:", error);
    return { error: "Failed to record payment" };
  }
}

export async function settleLoan(loanId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId: session.user.id },
    });
    if (!loan) return { error: "Loan not found" };

    await prisma.loan.update({
      where: { id: loanId },
      data: { isSettled: true, remainingAmount: 0 },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Settle loan error:", error);
    return { error: "Failed to settle loan" };
  }
}

export async function deleteLoan(loanId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    await prisma.loan.delete({
      where: { id: loanId },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete loan error:", error);
    return { error: "Failed to delete loan" };
  }
}
