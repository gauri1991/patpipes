import { Navigation } from '@/components/Navigation';
import { ScrollToTop } from '@/components/ScrollToTop';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
      <ScrollToTop />
    </>
  );
}
