import BottomNav from "@/components/layout/BottomNav";
import PageWrapper from "@/components/layout/PageWrapper";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageWrapper>{children}</PageWrapper>
      <BottomNav role="client" />
    </>
  );
}
