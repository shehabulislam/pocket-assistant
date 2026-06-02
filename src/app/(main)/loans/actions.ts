"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { formatCurrency } from "@/lib/utils";

/**
 * Direction money moves on the linked account when the loan is *created*:
 *   GIVEN (you lend money out)  → balance decreases → -1
 *   TAKEN (you borrow money in) → balance increases → +1
 * Repayments always move the opposite direction (-createSign).
 */
function createSign(type: "GIVEN" | "TAKEN"): number {
  return type === "GIVEN" ? -1 : 1;
}

/** Verify an account belongs to the user; returns it or null. */
async function getOwnedAccount(userId: string, accountId?: string | null) {
  if (!accountId) return null;
  return prisma.account.findFirst({
    where: { id: accountId, userId },
    select: { id: true, balance: true, name: true },
  });
}

export async function createLoan(data: {
  type: "GIVEN" | "TAKEN";
  personName: string;
  amount: number;
  description?: string;
  deadline?: string;
  accountId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  if (data.amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }
  if (!data.personName.trim()) {
    return { error: "Person name is required" };
  }

  try {
    const account = await getOwnedAccount(userId, data.accountId);
    if (data.accountId && !account) {
      return { error: "Account not found" };
    }

    // Money leaves the account on a GIVEN loan — make sure it's covered.
    const sign = createSign(data.type);
    if (account && sign < 0 && account.balance < data.amount) {
      return {
        error: `Insufficient balance in ${account.name}. Available: ${formatCurrency(
          account.balance,
          ""
        )}`,
      };
    }

    const create = prisma.loan.create({
      data: {
        type: data.type,
        personName: data.personName.trim(),
        amount: data.amount,
        remainingAmount: data.amount,
        description: data.description || null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        accountId: account?.id ?? null,
        userId,
      },
    });

    if (account) {
      await prisma.$transaction([
        create,
        prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: sign * data.amount } },
        }),
      ]);
    } else {
      await create;
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Create loan error:", error);
    return { error: "Failed to create loan" };
  }
}

export async function recordLoanPayment(data: {
  loanId: string;
  amount: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id;

  if (data.amount <= 0) {
    return { error: "Amount must be greater than 0" };
  }

  try {
    const loan = await prisma.loan.findFirst({
      where: { id: data.loanId, userId },
    });
    if (!loan) return { error: "Loan not found" };
    if (data.amount > loan.remainingAmount) {
      return { error: "Payment exceeds remaining amount" };
    }

    const account = await getOwnedAccount(userId, loan.accountId);
    // Repayment moves opposite to the create direction.
    const paymentSign = -createSign(loan.type);

    // Money leaves the account when *you* repay a TAKEN loan.
    if (account && paymentSign < 0 && account.balance < data.amount) {
      return {
        error: `Insufficient balance in ${account.name}. Available: ${formatCurrency(
          account.balance,
          ""
        )}`,
      };
    }

    const newRemaining = loan.remainingAmount - data.amount;
    const updateLoan = prisma.loan.update({
      where: { id: loan.id },
      data: { remainingAmount: newRemaining, isSettled: newRemaining <= 0 },
    });

    if (account) {
      await prisma.$transaction([
        updateLoan,
        prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: paymentSign * data.amount } },
        }),
      ]);
    } else {
      await updateLoan;
    }

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
  const userId = session.user.id;

  try {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });
    if (!loan) return { error: "Loan not found" };

    const account = await getOwnedAccount(userId, loan.accountId);
    // Settling pays off whatever is left — same direction as a payment.
    const paymentSign = -createSign(loan.type);
    const remaining = loan.remainingAmount;

    const updateLoan = prisma.loan.update({
      where: { id: loan.id },
      data: { isSettled: true, remainingAmount: 0 },
    });

    if (account && remaining > 0) {
      await prisma.$transaction([
        updateLoan,
        prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: paymentSign * remaining } },
        }),
      ]);
    } else {
      await updateLoan;
    }

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
  const userId = session.user.id;

  try {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId },
    });
    if (!loan) return { error: "Loan not found" };

    const account = await getOwnedAccount(userId, loan.accountId);
    // Reverse the loan's remaining footprint on the account. The net effect a
    // loan has on its account at any moment is createSign * remainingAmount,
    // so undoing it means incrementing by the negative of that.
    const reversal = -createSign(loan.type) * loan.remainingAmount;

    const del = prisma.loan.delete({ where: { id: loan.id } });

    if (account && loan.remainingAmount > 0) {
      await prisma.$transaction([
        prisma.account.update({
          where: { id: account.id },
          data: { balance: { increment: reversal } },
        }),
        del,
      ]);
    } else {
      await del;
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete loan error:", error);
    return { error: "Failed to delete loan" };
  }
}
