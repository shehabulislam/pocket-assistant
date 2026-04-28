import type { MonthYear } from "@/types";

/**
 * Currency formatting map
 */
const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
};

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currency: string = "BDT"
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

/**
 * Format a number with sign prefix for display
 */
export function formatSignedCurrency(
  amount: number,
  currency: string = "BDT"
): string {
  const prefix = amount >= 0 ? "+" : "-";
  return `${prefix}${formatCurrency(Math.abs(amount), currency)}`;
}

/**
 * Get month name from month index (0-11)
 */
export function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month] || "";
}

/**
 * Get short month name
 */
export function getShortMonthName(month: number): string {
  return getMonthName(month).slice(0, 3);
}

/**
 * Format MonthYear as display string e.g. "April 2026"
 */
export function formatMonthYear({ month, year }: MonthYear): string {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Get the start and end dates for a given month/year
 */
export function getMonthDateRange(monthYear: MonthYear): {
  start: Date;
  end: Date;
} {
  const start = new Date(monthYear.year, monthYear.month, 1);
  const end = new Date(monthYear.year, monthYear.month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/**
 * Get the current MonthYear
 */
export function getCurrentMonthYear(): MonthYear {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

/**
 * Navigate to next month
 */
export function getNextMonth({ month, year }: MonthYear): MonthYear {
  if (month === 11) {
    return { month: 0, year: year + 1 };
  }
  return { month: month + 1, year };
}

/**
 * Navigate to previous month
 */
export function getPrevMonth({ month, year }: MonthYear): MonthYear {
  if (month === 0) {
    return { month: 11, year: year - 1 };
  }
  return { month: month - 1, year };
}

/**
 * Format a Date as relative time (e.g. "Today", "Yesterday", or "Apr 25")
 */
export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return `${getShortMonthName(date.getMonth())} ${date.getDate()}`;
}

/**
 * Format time from Date (e.g. "3:45 PM")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Group transactions by date for display
 */
export function groupByDate<T extends { date: Date }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const dateKey = new Date(item.date).toISOString().split("T")[0];
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(item);
  }

  return groups;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a className string from conditional classes
 */
export function cn(
  ...classes: (string | undefined | null | false)[]
): string {
  return classes.filter(Boolean).join(" ");
}
