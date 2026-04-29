import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tags - Pocket Assistant",
  description: "Organize transactions with tags.",
};

export default function TagsPage() {
  return (
    <div className="animate-fadeIn">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 text-center">
            Tags
          </h1>
        </div>
      </header>
      <div className="px-4 pt-8 pb-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-2xl">
          🏷️
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Tags</h2>
        <p className="text-gray-500 mb-6 max-w-sm">
          Use tags to easily group, search, and analyze your transactions across different categories.
        </p>
        <button className="bg-amber-500 text-white px-6 py-3 rounded-xl font-medium shadow-sm shadow-amber-200">
          Create Tag
        </button>
      </div>
    </div>
  );
}
