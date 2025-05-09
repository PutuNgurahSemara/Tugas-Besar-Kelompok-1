import { Page, PageProps as InertiaPageProps } from '@inertiajs/core';

export interface PageProps extends InertiaPageProps {
  auth: {
    user: {
      id: number;
      name: string;
      email: string;
      roles?: string[];
    };
  };
  flash?: {
    message?: string;
    type?: 'success' | 'error';
  };
  errors: Record<string, string>;
  ziggy: {
    location: string;
    url: string;
    port: null | number;
    defaults: [];
    routes: Record<string, string>;
  };
  [key: string]: any; // Add index signature to satisfy PageProps constraint
}

// BreadcrumbItem interface - supporting both title and label for backwards compatibility
export interface BreadcrumbItem {
  title?: string;
  label?: string;
  href: string;
  active?: boolean;
}

export interface DashboardProps extends Page<PageProps> {
  todaySales: number;
  totalCategories: number;
  expiredMedicines: number;
  systemUsers: number;
  recentSales: Array<{
    medicine: string;
    quantity: number;
    total_price: number;
    date: string;
  }>;
  salesByCategory: Array<{
    label: string;
    value: number;
  }>;
  auth: {
    user: {
      name: string;
    };
  };
}