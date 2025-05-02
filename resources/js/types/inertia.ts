import { Page } from '@inertiajs/core';

export interface PageProps {
  [key: string]: any; // Index signature untuk props dinamis
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