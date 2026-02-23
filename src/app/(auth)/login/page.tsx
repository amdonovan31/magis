import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Magis</h1>
          <p className="mt-2 text-sm text-primary/60">Sign in to your account</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
