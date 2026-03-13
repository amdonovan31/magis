import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img src="/magis_logo_clean.svg" alt="Magis" style={{ height: 40 }} />
          <p
            className="font-body text-xs uppercase tracking-widest"
            style={{ color: "var(--color-muted)" }}
          >
            Sign in to your account
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
