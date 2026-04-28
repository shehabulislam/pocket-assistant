import BottomNav from "@/components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[var(--background)]">
      {/* Main content — padded bottom for nav */}
      <main className="max-w-md mx-auto pb-24">{children}</main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
