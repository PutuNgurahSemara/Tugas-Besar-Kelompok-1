import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type NotificationType = {
  id: number;
  title: string;
  description: string;
  time: string;
  unread: boolean;
};

interface NotificationProps {
  notifications: NotificationType[];
  unreadCount: number;
  markAllAsRead: () => void;
}

export default function Notification({ notifications, unreadCount, markAllAsRead }: NotificationProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white border-0" 
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium">Notifikasi</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium" 
              onClick={markAllAsRead}
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={cn(
                  "p-3 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer",
                  notification.unread ? "bg-blue-50 dark:bg-blue-900/10" : ""
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{notification.description}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{notification.time}</p>
                  </div>
                  {notification.unread && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Tidak ada notifikasi
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <Button variant="secondary" size="sm" className="w-full text-xs">
              Lihat semua notifikasi
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
} 