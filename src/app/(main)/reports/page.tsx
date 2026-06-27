import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthRange, getMonthReport } from "@/lib/reports";
import ReportsClient from "./ReportsClient";

/** Format a Date as YYYY-MM-DD in server-local time (matches the transactions filter). */
function toDateInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

  const { start, end } = getMonthRange(now.getFullYear(), now.getMonth());

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
      monthFrom={toDateInput(start)}
      monthTo={toDateInput(end)}
    />
  );
}
