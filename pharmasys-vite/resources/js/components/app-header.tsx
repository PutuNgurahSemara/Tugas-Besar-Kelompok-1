// resources/js/components/app-header.tsx
import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { Bell, Settings, LogOut, Search, ReceiptText, XCircle } from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { type SharedData } from '@/types';
import { cn } from '@/lib/utils';
import Notification from './ui/notification';

// Definisi untuk hasil pencarian menu
interface SearchMenuItem {
  title: string;
  href: string;
  description: string;
  icon?: React.ComponentType<any>;
}

// Daftar menu yang bisa dicari
const searchableMenuItems: SearchMenuItem[] = [
  { title: 'Dashboard', href: route('dashboard'), description: 'Halaman utama aplikasi' },
  { title: 'Kategori', href: route('categories.index'), description: 'Mengelola kategori produk' },
  { title: 'Pembelian', href: route('purchases.index'), description: 'Daftar semua pembelian' },
  { title: 'Tambah Pembelian', href: route('purchases.create'), description: 'Tambah pembelian baru' },
  { title: 'Produk', href: route('produk.index'), description: 'Daftar semua produk' },
  { title: 'Tambah Produk', href: route('produk.create'), description: 'Tambah produk baru' },
  { title: 'Obat Kedaluwarsa', href: route('produk.expired'), description: 'Daftar obat yang hampir/sudah kedaluwarsa' },
  { title: 'Stok Menipis', href: route('produk.outstock'), description: 'Daftar produk dengan stok menipis' },
  { title: 'Penjualan', href: route('sales.index'), description: 'Daftar semua penjualan' },
  { title: 'Kasir (POS)', href: route('sales.create'), description: 'Halaman kasir untuk transaksi baru' },
  { title: 'Supplier', href: route('suppliers.index'), description: 'Mengelola data supplier' },
  { title: 'Laporan Penjualan', href: route('reports.sales'), description: 'Laporan penjualan produk' },
  { title: 'Laporan Pembelian', href: route('reports.purchase'), description: 'Laporan pembelian produk' },
  { title: 'Users', href: route('users.index'), description: 'Mengelola pengguna aplikasi' },
  { title: 'Roles', href: route('roles.index'), description: 'Mengelola peran pengguna' },
  { title: 'Permissions', href: route('permissions.index'), description: 'Mengelola izin pengguna' },
  { title: 'Pengaturan', href: route('settings.index'), description: 'Pengaturan aplikasi' },
  { title: 'Profil Pengguna', href: route('profile.edit'), description: 'Edit profil pengguna' },
];

export function AppHeader() {
  const { auth } = usePage<SharedData>().props;
  const getInitials = useInitials();
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchMenuItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Stok Obat Rendah', description: 'Paracetamol hampir habis', time: '5 menit lalu', unread: true },
    { id: 2, title: 'Pesanan Baru', description: 'Pesanan #1234 menunggu konfirmasi', time: '10 menit lalu', unread: true },
    { id: 3, title: 'Pembayaran Diterima', description: 'Pembayaran untuk Invoice #5678', time: '1 jam lalu', unread: false },
  ]);
  
  // Effect untuk mencari menu
  useEffect(() => {
    if (searchQuery.length > 1) {
      // Filter menu berdasarkan query
      const results = searchableMenuItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);
  
  // Menutup hasil pencarian saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const searchContainer = document.getElementById('search-container');
      if (searchContainer && !searchContainer.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleLogout = () => {
    router.post('/logout');
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  
  const markAllAsRead = () => {
    setNotifications(prevState => 
      prevState.map(notification => ({ ...notification, unread: false }))
    );
  };
  
  // Navigasi ke menu yang dipilih
  const navigateToResult = (href: string) => {
    router.visit(href);
    setSearchQuery('');
    setShowSearchResults(false);
    setShowSearchMobile(false);
  };
  
  // Membersihkan query pencarian
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center bg-white dark:bg-gray-900 border-b dark:border-gray-800 px-4 shadow-sm">
      <div className="w-full flex justify-between items-center">
        {/* Padding for mobile hamburger */}
        <div className="w-5 sm:hidden"></div>
        
        {/* Left side: Search */}
        <div 
          id="search-container"
          className={cn(
            "sm:relative sm:block w-full max-w-xs transition-all duration-300",
            showSearchMobile ? "absolute left-0 top-0 z-50 w-full px-4 py-3 bg-white dark:bg-gray-900 h-14" : "hidden sm:block"
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Cari menu, fitur, halaman..."
                    className="w-full rounded-md border border-gray-200 bg-white pl-8 pr-8 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 dark:border-gray-800 dark:bg-gray-950 dark:ring-offset-gray-950 dark:placeholder:text-gray-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length > 1 && setShowSearchResults(true)}
                  />
                  {searchQuery && (
                    <button 
                      className="absolute right-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400"
                      onClick={clearSearch}
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cari menu atau fitur (contoh: "produk", "kasir", "laporan")</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Dropdown hasil pencarian */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-950 z-50">
              <div className="p-2">
                <p className="px-2 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Hasil Pencarian ({searchResults.length})
                </p>
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    className="flex w-full items-center rounded-md px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => navigateToResult(result.href)}
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium">{result.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{result.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Pesan tidak ditemukan */}
          {showSearchResults && searchQuery.length > 1 && searchResults.length === 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 rounded-md border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-950 z-50">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Tidak ada hasil untuk "{searchQuery}"
              </p>
            </div>
          )}
          
          {showSearchMobile && (
            <Button
              variant="ghost" 
              size="sm"
              className="absolute right-2 top-3.5"
              onClick={() => {
                setShowSearchMobile(false);
                setSearchQuery('');
                setShowSearchResults(false);
              }}
            >
              ✕
            </Button>
          )}
        </div>
        
        {/* Right side: Notifications, Profile */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto">
          {/* Search button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="sm:hidden"
            onClick={() => setShowSearchMobile(true)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Kasir POS Shortcut */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={route('sales.create')}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 h-8 w-8 shadow-sm rounded-md"
                  >
                    <ReceiptText className="h-4 w-4" strokeWidth={2} />
                    <span className="sr-only">Kasir</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Kasir (POS)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Notification Dropdown - selalu terlihat */}
          <Notification 
            notifications={notifications} 
            unreadCount={unreadCount} 
            markAllAsRead={markAllAsRead} 
          />

          {/* Profile Menu - selalu terlihat */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name || "User"} />
                  <AvatarFallback className="text-xs">
                    {auth?.user ? getInitials(auth.user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="p-2">
                <p className="text-sm font-medium">{auth?.user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{auth?.user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}