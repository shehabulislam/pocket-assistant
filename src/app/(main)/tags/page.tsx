import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TagsClient from "./TagsClient";

export const metadata: Metadata = {
  title: "Tags - Pocket Assistant",
  description: "Organize transactions with tags.",
};

export default async function TagsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { transactions: true } } },
  });

  return <TagsClient tags={JSON.parse(JSON.stringify(tags))} />;
}
