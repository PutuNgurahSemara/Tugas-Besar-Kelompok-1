import { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  submenu?: NavItem[];
}

export interface BreadcrumbItem {
  title: string;
  href: string;
  active?: boolean;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
  roles?: Array<{
    id: number;
    name: string;
    permissions?: Array<{
      id: number;
      name: string;
    }>;
  }>;
  permissions?: string[];
}

export interface Auth {
  user: User | null;
}

export interface SharedData {
  props: {
    auth: Auth;
    [key: string]: any;
  };
  [key: string]: any; // Add index signature to satisfy PageProps constraint
}

export interface NotificationType {
  id: string;
  type: 'info' | 'error' | 'warning' | 'success';
  title: string;
  description: string;
  read: boolean;
  icon?: any;
  time: string;
  timeAgo: string;
}

export type NotificationItemType = 'info' | 'error' | 'warning' | 'success'; 

export interface Supplier {
  id: number;
  company: string;
  phone?: string;
  note?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface PurchaseDetail {
  nama_produk: string;
  expired: string;
  jumlah: number;
  kemasan: string;
  harga_satuan: number;
  total: number;
}

export interface Purchase {
  id: number;
  no_faktur: string;
  pbf: string;
  tanggal_faktur: string;
  jatuh_tempo: string;
  jumlah: number;
  total: number;
  tanggal_pembayaran?: string;
  keterangan?: string;
  supplier: Supplier | null;
  category: Category | null;
  details?: PurchaseDetail[];
}

export interface PaginatedResponse<T> {
  data: T[];
  links: any[];
  meta: any;
}