import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PaymentTypesClient from "./PaymentTypesClient";

export default async function PaymentTypesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const paymentTypes = await prisma.paymentType.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { transactions: true } },
    },
  });

  return (
    <PaymentTypesClient
      paymentTypes={JSON.parse(JSON.stringify(paymentTypes))}
    />
  );
}
