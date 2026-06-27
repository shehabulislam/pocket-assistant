import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="animate-fadeIn">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200 mb-4">
          <KeyRound size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
        <p className="text-gray-500 mt-1">Here&apos;s how to get back in</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 p-6 border border-gray-100 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Password resets are handled by an administrator. Please contact your
          administrator and ask them to reset your password — they can set a
          temporary one for you from the admin panel.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Once they&apos;ve reset it, sign in with the temporary password, then
          change it from{" "}
          <span className="font-medium text-gray-800">
            Settings → Change Password
          </span>
          .
        </p>

        <Link
          href="/login"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-semibold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 hover:from-emerald-500 hover:to-teal-600 transition-all active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
