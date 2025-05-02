// resources/js/layouts/app/app-header-layout.tsx
import { type BreadcrumbItem } from '@/types';
import { AppHeader } from '@/components/app-header';
import { useState } from 'react';

interface AppHeaderLayoutProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function AppHeaderLayout({ breadcrumbs }: AppHeaderLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return <AppHeader breadcrumbs={breadcrumbs} setIsSidebarOpen={setIsSidebarOpen} />;
}