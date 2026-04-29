import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & Drinks", icon: "🍔", color: "#FF6B6B" },
  { name: "Shopping", icon: "🛍️", color: "#A855F7" },
  { name: "Transport", icon: "🚗", color: "#3B82F6" },
  { name: "Bills & Utilities", icon: "💡", color: "#F59E0B" },
  { name: "Entertainment", icon: "🎬", color: "#EC4899" },
  { name: "Health", icon: "🏥", color: "#10B981" },
  { name: "Education", icon: "📚", color: "#6366F1" },
  { name: "Groceries", icon: "🛒", color: "#14B8A6" },
  { name: "Rent", icon: "🏠", color: "#8B5CF6" },
  { name: "Insurance", icon: "🛡️", color: "#64748B" },
  { name: "Gifts", icon: "🎁", color: "#F43F5E" },
  { name: "Other Expense", icon: "📦", color: "#78716C" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "💰", color: "#10B981" },
  { name: "Freelance", icon: "💻", color: "#3B82F6" },
  { name: "Investment", icon: "📈", color: "#8B5CF6" },
  { name: "Business", icon: "🏢", color: "#F59E0B" },
  { name: "Gifts Received", icon: "🎉", color: "#EC4899" },
  { name: "Other Income", icon: "💵", color: "#6366F1" },
];



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password, 12);

    // Create user with default data
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        currency: "BDT",
        language: "en",
        // Create default account
        accounts: {
          create: {
            name: "Cash",
            type: "CASH",
            balance: 0,
          },
        },
        // Create default settings
        settings: {
          create: {
            theme: "system",
            pushNotifications: true,
            dailyReminder: false,
            weeklySummary: false,
          },
        },
        // Create default categories
        categories: {
          create: [
            ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              type: "EXPENSE" as const,
              isDefault: true,
            })),
            ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              type: "INCOME" as const,
              isDefault: true,
            })),
          ],
        },
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
