// resources/js/layouts/app/app-sidebar-layout.tsx
import { type BreadcrumbItem } from '@/types';
import { Sidebar } from '@/components/app-sidebar'; // Ubah ke named import

interface AppSidebarLayoutProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AppSidebarLayout({ isOpen, setIsOpen }: AppSidebarLayoutProps) {
  return <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />;
}