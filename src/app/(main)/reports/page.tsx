import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthReport } from "@/lib/reports";
import ReportsClient from "./ReportsClient";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const now = new Date();

  const [report, user] = await Promise.all([
    getMonthReport(userId, now.getFullYear(), now.getMonth()),
    prisma.user.findUnique({
      where: { id: userId },
      select: { currency: true },
    }),
  ]);

  return (
    <ReportsClient
      totalIncome={report.totalIncome}
      totalExpense={report.totalExpense}
      categoryBreakdown={report.categoryBreakdown}
      dailyData={report.dailyData}
      currency={user?.currency || "BDT"}
      monthLabel={now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })}
    />
  );
}
