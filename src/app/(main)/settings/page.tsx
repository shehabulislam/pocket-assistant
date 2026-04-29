import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      currency: true,
      language: true,
      budgetPeriod: true,
      viewPeriod: true,
      role: true,
      settings: true,
    },
  });

  if (!user) return null;

  return <SettingsClient user={JSON.parse(JSON.stringify(user))} />;
}
