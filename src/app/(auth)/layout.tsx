import AuthListener from "@/components/auth/AuthListener";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AuthListener />
      {children}
    </>
  );
}
