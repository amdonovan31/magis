import LoginForm from "@/components/auth/LoginForm";

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: "Sign-in link is invalid or expired. Please request a new one.",
  missing_role: "Account setup incomplete. Please contact support.",
};

const SUCCESS_MESSAGES: Record<string, string> = {
  password_reset: "Password updated. Sign in with your new password.",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const urlError = searchParams.error ? ERROR_MESSAGES[searchParams.error] : null;
  const urlSuccess = searchParams.success ? SUCCESS_MESSAGES[searchParams.success] : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/magis_logo_clean.svg" alt="Magis" style={{ height: 160 }} />
          <p
            className="font-body text-xs uppercase tracking-widest"
            style={{ color: "var(--color-muted)" }}
          >
            Sign in to your account
          </p>
        </div>
        {urlSuccess && (
          <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
            {urlSuccess}
          </p>
        )}
        {urlError && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {urlError}
          </p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
