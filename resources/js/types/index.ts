import { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  submenu?: NavItem[];
}

export interface BreadcrumbItem {
  label: string;
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