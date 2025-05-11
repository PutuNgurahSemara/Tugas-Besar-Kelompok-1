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

export interface Permission { // Define Permission type if used by Role
    id: number;
    name: string;
}

export interface Role {
    id: number;
    name: string;
    permissions?: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  // role?: string; // This can likely be derived from roles array if needed
  roles?: Role[];
  permissions?: string[]; // This might be direct permissions or derived from roles
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

export interface Produk { // Basic Produk definition
  id: number;
  nama: string; // Assuming 'nama' for product name
  // Add other relevant product properties if needed by SaleItem display
}

export interface SaleItem {
  id: number;
  sale_id: number;
  produk_id: number;
  produk?: Produk | null; // Optional: if product details are eager-loaded
  quantity: number;
  price_at_sale: number; // Price of the product at the time of sale
  total_amount: number;
  // Add other SaleItem properties as needed
}

export interface Sale {
  id: number;
  user_id: number; // ID of the user (cashier) who made the sale
  user?: User | null; // Optional: if user details are eager-loaded
  total_price: number;
  total_items: number;
  payment_method?: string; // e.g., 'cash', 'card'
  status?: string; // e.g., 'completed', 'pending', 'cancelled'
  notes?: string;
  created_at: string; // Or Date
  updated_at: string; // Or Date
  items?: SaleItem[]; // Optional: if items are eager-loaded
}

// Re-export PageProps from inertia.ts
export type { PageProps } from './inertia';
