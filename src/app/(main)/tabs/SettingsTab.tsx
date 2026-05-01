"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Globe,
  DollarSign,
  Calendar,
  CalendarDays,
  FolderOpen,
  CreditCard,
  Upload,
  Wallet,
  Users,
  FileDown,
  Repeat,
  Tag,
  Bell,
  Clock,
  Mail,
  Shield,
  ShieldCheck,
  Brain,
  Database,
  HelpCircle,
  FileText,
  ScrollText,
  Info,
  MessageCircle,
  Instagram,
  Star,
  LogOut,
  Trash2,
  Lock,
  ChevronRight,
  Landmark,
  Target,
} from "lucide-react";

interface SettingsClientProps {
  user: {
    name: string | null;
    email: string;
    currency: string;
    language: string;
    budgetPeriod: number;
    viewPeriod: string;
    role: string;
    settings: {
      theme: string;
      pushNotifications: boolean;
      dailyReminder: boolean;
      weeklySummary: boolean;
    } | null;
  };
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
        {title}
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

function SettingsItem({
  icon: Icon,
  iconBg,
  label,
  subtitle,
  trailing,
  locked,
  onClick,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  locked?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      {locked ? (
        <Lock size={16} className="text-amber-400" />
      ) : trailing ? (
        trailing
      ) : (
        <ChevronRight size={16} className="text-gray-300" />
      )}
    </button>
  );
}

function ToggleItem({
  icon: Icon,
  iconBg,
  label,
  subtitle,
  checked,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  subtitle?: string;
  checked: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div
        className={`w-11 h-6 rounded-full transition-colors relative ${
          checked ? "bg-emerald-400" : "bg-gray-200"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
        />
      </div>
    </div>
  );
}

function CheckItem({
  icon: Icon,
  iconBg,
  label,
  subtitle,
}: {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon size={18} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className="text-white"
        >
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

export default function SettingsTab({ user }: SettingsClientProps) {
  const router = useRouter();
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";
  
  const isSuperAdmin = user.role === "SUPERADMIN";

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Settings
          </h1>
        </div>
      </header>

      <div className="px-4 pt-4 pb-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center text-white font-bold text-lg">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {user.name || "User"}
            </p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Upgrade Banner */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-4 flex items-center gap-3 hover-lift cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
            <Star size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              Upgrade to Pro
            </p>
            <p className="text-xs text-gray-400">
              $0.99/month · Cloud backup, budgets
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </div>

        {/* Data Section */}
        <SettingsSection title="Data">
          <SettingsItem
            icon={Globe}
            iconBg="#10B981"
            label="Language"
            subtitle="English"
          />
          <SettingsItem
            icon={DollarSign}
            iconBg="#F59E0B"
            label="Currency"
            subtitle={`৳ ${user.currency} - Bangladeshi Taka`}
          />
          <SettingsItem
            icon={Calendar}
            iconBg="#3B82F6"
            label="Budget Period"
            subtitle={`${user.budgetPeriod}${user.budgetPeriod === 1 ? "st" : "th"} of month`}
          />
          <SettingsItem
            icon={CalendarDays}
            iconBg="#8B5CF6"
            label="View Period"
            subtitle={user.viewPeriod.charAt(0).toUpperCase() + user.viewPeriod.slice(1)}
          />
          <SettingsItem
            icon={FolderOpen}
            iconBg="#F59E0B"
            label="Manage Categories"
            onClick={() => router.push("/settings/categories")}
          />

          <SettingsItem
            icon={Landmark}
            iconBg="#14B8A6"
            label="Manage Accounts"
            subtitle="bKash, Nagad, Bank, Cash"
            onClick={() => router.push("/settings/accounts")}
          />
          <SettingsItem
            icon={Upload}
            iconBg="#F97316"
            label="Import Transactions"
            subtitle="From CSV or Excel · Free"
          />
        </SettingsSection>

        {/* Pro Features */}
        <SettingsSection title="Pro Features">
          <SettingsItem
            icon={Wallet}
            iconBg="#6366F1"
            label="Budgets"
            subtitle="Set spending limits"
            onClick={() => router.push("/budgets")}
          />
          <SettingsItem
            icon={Target}
            iconBg="#F59E0B"
            label="Goals"
            subtitle="Track your savings goals"
            onClick={() => router.push("/goals")}
          />
          <SettingsItem
            icon={Users}
            iconBg="#EF4444"
            label="Partner Mode"
            subtitle="Share expenses with your partner"
            locked={!isSuperAdmin}
            onClick={() => !isSuperAdmin ? null : router.push("/partner")}
          />

          <SettingsItem
            icon={FileDown}
            iconBg="#10B981"
            label="Export to CSV"
            subtitle="Download your transactions"
            onClick={() => window.open("/api/export/csv", "_blank")}
          />
          <SettingsItem
            icon={Repeat}
            iconBg="#8B5CF6"
            label="Recurring Transactions"
            subtitle="Auto-log rent, subscriptions, salary"
            locked={!isSuperAdmin}
            onClick={() => !isSuperAdmin ? null : router.push("/recurring")}
          />
          <SettingsItem
            icon={Tag}
            iconBg="#F59E0B"
            label="Tags"
            subtitle="Organize transactions"
            locked={!isSuperAdmin}
            onClick={() => !isSuperAdmin ? null : router.push("/tags")}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection title="Notifications">
          <ToggleItem
            icon={Bell}
            iconBg="#F59E0B"
            label="Push Notifications"
            subtitle="Reminders to track expenses"
            checked={user.settings?.pushNotifications ?? true}
          />
        </SettingsSection>

        {/* Reminders */}
        <SettingsSection title="Reminders">
          <ToggleItem
            icon={Clock}
            iconBg="#10B981"
            label="Daily Reminder"
            subtitle="Remind me to track spending"
            checked={user.settings?.dailyReminder ?? false}
          />
          <ToggleItem
            icon={Mail}
            iconBg="#6B7280"
            label="Weekly Summary"
            subtitle="Every Sunday at 10:00 AM"
            checked={user.settings?.weeklySummary ?? false}
          />
        </SettingsSection>

        {/* Privacy & Security */}
        <SettingsSection title="Privacy & Security">
          <CheckItem
            icon={Shield}
            iconBg="#EF4444"
            label="No Ads"
            subtitle="We never show ads"
          />
          <CheckItem
            icon={ShieldCheck}
            iconBg="#F59E0B"
            label="Encryption"
            subtitle="All data encrypted"
          />
          <CheckItem
            icon={Brain}
            iconBg="#A855F7"
            label="No AI Training"
            subtitle="Your data stays private"
          />
          <CheckItem
            icon={Database}
            iconBg="#10B981"
            label="No Data Selling"
            subtitle="We never sell your data"
          />
          <div className="px-4 py-2">
            <button className="text-emerald-500 text-sm font-medium flex items-center gap-1">
              <HelpCircle size={14} />
              Learn more
            </button>
          </div>
        </SettingsSection>

        {/* Legal */}
        <SettingsSection title="Legal">
          <SettingsItem
            icon={FileText}
            iconBg="#6366F1"
            label="Privacy Policy"
          />
          <SettingsItem
            icon={ScrollText}
            iconBg="#3B82F6"
            label="Terms of Service"
          />
        </SettingsSection>

        {/* About */}
        <SettingsSection title="About">
          <SettingsItem
            icon={Info}
            iconBg="#6B7280"
            label="Version"
            subtitle="0.1.0"
            trailing={
              <span className="text-xs text-gray-400">0.1.0</span>
            }
          />
          <SettingsItem
            icon={MessageCircle}
            iconBg="#EF4444"
            label="Contact Support"
          />
          <SettingsItem
            icon={Instagram}
            iconBg="#E1306C"
            label="Follow us on Instagram"
          />
          <SettingsItem
            icon={Star}
            iconBg="#F59E0B"
            label="Rate Pocket Assistant"
          />
        </SettingsSection>

        {/* Account */}
        <SettingsSection title="Account">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <LogOut size={18} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-700">Log Out</p>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 transition-colors">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Trash2 size={18} className="text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-500">Delete Account</p>
          </button>
        </SettingsSection>
      </div>
    </div>
  );
}
