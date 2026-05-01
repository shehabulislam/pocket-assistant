"use client";

import { Home, PieChart, Settings } from "lucide-react";
import type { ActiveTab } from "@/app/(main)/AppClient";

const NAV_ITEMS: { key: ActiveTab; label: string; icon: typeof Home }[] = [
  { key: "home", label: "Home", icon: Home },
  { key: "reports", label: "Reports", icon: PieChart },
  { key: "settings", label: "Settings", icon: Settings },
];

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              id={`nav-${item.label.toLowerCase()}`}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-emerald-500"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-50 shadow-sm"
                    : ""
                }`}
              >
                <item.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={`text-[11px] font-medium transition-all ${
                  isActive ? "text-emerald-600 font-semibold" : ""
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
