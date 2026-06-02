"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createTag(data: { name: string; color: string }) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = data.name.trim();
  if (!name) return { error: "Please enter a name" };

  try {
    // Prevent duplicate tag names per user
    const existing = await prisma.tag.findFirst({
      where: { userId: session.user.id, name },
    });
    if (existing) return { error: "A tag with this name already exists" };

    await prisma.tag.create({
      data: { name, color: data.color, userId: session.user.id },
    });
    revalidatePath("/tags");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Create tag error:", error);
    return { error: "Failed to create tag" };
  }
}

export async function updateTag(
  id: string,
  data: { name: string; color: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const name = data.name.trim();
  if (!name) return { error: "Please enter a name" };

  try {
    // Ownership check
    const tag = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!tag) return { error: "Tag not found" };

    const duplicate = await prisma.tag.findFirst({
      where: { userId: session.user.id, name, id: { not: id } },
    });
    if (duplicate) return { error: "A tag with this name already exists" };

    await prisma.tag.update({
      where: { id },
      data: { name, color: data.color },
    });
    revalidatePath("/tags");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Update tag error:", error);
    return { error: "Failed to update tag" };
  }
}

export async function deleteTag(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  try {
    const tag = await prisma.tag.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!tag) return { error: "Tag not found" };

    // TagOnTransaction rows cascade-delete via the schema relation.
    await prisma.tag.delete({ where: { id } });
    revalidatePath("/tags");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Delete tag error:", error);
    return { error: "Failed to delete tag" };
  }
}
