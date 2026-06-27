import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function AdminUsersPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user?.id) return null;
  // Only super admins may manage other users.
  if (role !== "SUPERADMIN") redirect("/settings");

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <UsersClient
      users={JSON.parse(JSON.stringify(users))}
      currentUserId={session.user.id}
    />
  );
}
