import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

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



async function main() {
  console.log("🌱 Seeding database...");

  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@pocketassistant.app" },
    update: {},
    create: {
      email: "demo@pocketassistant.app",
      password: "$2b$10$placeholder_hash_replace_with_real_bcrypt",
      name: "Demo User",
      currency: "BDT",
      language: "en",
    },
  });

  console.log(`✅ User created: ${user.email}`);

  // Seed expense categories
  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        id: `default-expense-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {},
      create: {
        id: `default-expense-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: "EXPENSE",
        isDefault: true,
        userId: user.id,
      },
    });
  }

  console.log(`✅ ${DEFAULT_EXPENSE_CATEGORIES.length} expense categories seeded`);

  // Seed income categories
  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        id: `default-income-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {},
      create: {
        id: `default-income-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: "INCOME",
        isDefault: true,
        userId: user.id,
      },
    });
  }

  console.log(`✅ ${DEFAULT_INCOME_CATEGORIES.length} income categories seeded`);



  // Create default account
  await prisma.account.upsert({
    where: { id: "default-cash-account" },
    update: {},
    create: {
      id: "default-cash-account",
      name: "Cash",
      type: "CASH",
      balance: 0,
      userId: user.id,
    },
  });

  console.log("✅ Default cash account created");

  // Create default settings
  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: "system",
      pushNotifications: true,
      dailyReminder: false,
      weeklySummary: false,
    },
  });

  console.log("✅ Default settings created");
  console.log("🎉 Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
