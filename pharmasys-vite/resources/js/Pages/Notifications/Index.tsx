import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { PageProps, type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Bell, CheckCircle, Clock, Info, Trash2, ExternalLink } from 'lucide-react';
import { NotificationType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface IndexProps extends PageProps {
  notifications: {
    data: NotificationType[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      links: { url: string | null; label: string; active: boolean }[];
      path: string;
      per_page: number;
      to: number;
      total: number;
    };
  };
}

export default function Index({ auth, notifications }: IndexProps) {
  const [activeTab, setActiveTab] = useState('all');
  
  // Mark notification as read
  const markAsRead = async (id: string | number) => {
    try {
      await fetch(`/api/notifications/mark-read/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      // Refresh the page to update notifications
      router.reload({ only: ['notifications'] });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      // Refresh the page to update notifications
      router.reload({ only: ['notifications'] });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  // Delete notification
  const deleteNotification = async (id: string | number) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        }
      });
      
      // Refresh the page to update notifications
      router.reload({ only: ['notifications'] });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type: string | undefined) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'expiring_soon':
      case 'expired':
        return <Clock className="h-5 w-5 text-red-500" />;
      case 'payment_due_soon':
      case 'payment_overdue':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get notification badge type based on type
  const getNotificationBadgeType = (type: string | undefined) => {
    switch (type) {
      case 'low_stock':
      case 'out_of_stock':
        return 'warning';
      case 'expiring_soon':
      case 'expired':
      case 'payment_overdue':
        return 'destructive';
      case 'payment_due_soon':
        return 'default';
      case 'success':
        return 'success';
      default:
        return 'secondary';
    }
  };
  
  // Get notification label based on type
  const getNotificationLabel = (type: string | undefined) => {
    switch (type) {
      case 'low_stock':
        return 'Stok Menipis';
      case 'out_of_stock':
        return 'Stok Habis';
      case 'expiring_soon':
        return 'Hampir Kadaluarsa';
      case 'expired':
        return 'Kadaluarsa';
      case 'payment_due_soon':
        return 'Jatuh Tempo Segera';
      case 'payment_overdue':
        return 'Melewati Jatuh Tempo';
      case 'success':
        return 'Sukses';
      default:
        return 'Info';
    }
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = notifications.data.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return notification.unread;
    return notification.type?.includes(activeTab);
  });
  
  const hasUnread = notifications.data.some(notification => notification.unread);

  // Definisikan breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Notifikasi', href: route('notifications.index') },
  ];
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Notifikasi" />

      <div className="py-12">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Notifikasi</CardTitle>
                  <CardDescription>Daftar notifikasi untuk Anda</CardDescription>
                </div>
                {hasUnread && (
                  <Button onClick={markAllAsRead} variant="secondary" size="sm">
                    Tandai Semua Dibaca
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">Semua</TabsTrigger>
                  <TabsTrigger value="unread">Belum Dibaca</TabsTrigger>
                  <TabsTrigger value="low_stock">Stok</TabsTrigger>
                  <TabsTrigger value="expir">Kadaluarsa</TabsTrigger>
                  <TabsTrigger value="payment">Pembayaran</TabsTrigger>
                </TabsList>
              </Tabs>
              
              {filteredNotifications.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: 50 }}>Status</TableHead>
                        <TableHead>Notifikasi</TableHead>
                        <TableHead style={{ width: 140 }}>Tipe</TableHead>
                        <TableHead style={{ width: 160 }}>Waktu</TableHead>
                        <TableHead style={{ width: 120 }}>Tindakan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((notification) => (
                        <TableRow 
                          key={notification.id} 
                          className={notification.unread ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                        >
                          <TableCell>
                            <div className="w-3 h-3 rounded-full bg-blue-500 mx-auto" 
                                 style={{ visibility: notification.unread ? 'visible' : 'hidden' }} 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.type)}
                              <div>
                                <div className="font-medium">{notification.title}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {notification.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getNotificationBadgeType(notification.type) as any}>
                              {getNotificationLabel(notification.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-500 dark:text-gray-400">{notification.time}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {notification.unread && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="sr-only">Tandai Dibaca</span>
                                </Button>
                              )}
                              
                              {notification.link && (
                                <Link href={notification.link}>
                                  <Button variant="ghost" size="icon">
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">Lihat Detail</span>
                                  </Button>
                                </Link>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteNotification(notification.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                                <span className="sr-only">Hapus</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                  <div className="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-600">
                    <Bell className="h-12 w-12" />
                  </div>
                  <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
                    Tidak Ada Notifikasi
                  </h3>
                  <p className="text-sm">
                    Saat ini tidak ada notifikasi untuk ditampilkan.
                  </p>
                </div>
              )}
              
              {notifications.meta.last_page > 1 && (
                <div className="mt-6 flex justify-center">
                  <nav className="mx-auto flex w-full justify-center">
                    <div className="flex flex-row items-center gap-1">
                      <Link 
                        href={`/notifications?page=1`} 
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                          notifications.meta.current_page === 1 
                            ? 'text-gray-500 bg-white dark:bg-gray-800 cursor-not-allowed' 
                            : 'text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        &laquo;
                      </Link>
                      {notifications.meta.links.slice(1, -1).map((link, i) => (
                        <Link
                          key={i}
                          href={link.url || ''}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                            link.active
                              ? 'z-10 bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                      <Link 
                        href={`/notifications?page=${notifications.meta.last_page}`} 
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                          notifications.meta.current_page === notifications.meta.last_page 
                            ? 'text-gray-500 bg-white dark:bg-gray-800 cursor-not-allowed' 
                            : 'text-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        &raquo;
                      </Link>
                    </div>
                  </nav>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
