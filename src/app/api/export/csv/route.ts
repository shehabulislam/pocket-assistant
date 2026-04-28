import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      include: {
        category: { select: { name: true } },
        account: { select: { name: true } },
        paymentType: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });

    // Build CSV
    const headers = [
      "Date",
      "Type",
      "Category",
      "Amount",
      "Account",
      "Payment Method",
      "Description",
    ];

    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split("T")[0],
      t.type,
      t.category.name,
      t.amount.toFixed(2),
      t.account.name,
      t.paymentType?.name || "",
      `"${(t.description || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const now = new Date().toISOString().split("T")[0];

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="pocket-assistant-${now}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}
