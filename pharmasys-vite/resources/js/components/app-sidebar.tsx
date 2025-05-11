// resources/js/components/app-sidebar.tsx
import { Link, usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { type NavItem, type SharedData } from '@/types';
import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import AppLogo from './app-logo';
import { 
  LayoutGrid, Folder, ShoppingCart, Package, DollarSign, 
  User, BookOpen, Settings, ClipboardList, LogOut, X, ChevronLeft,
  UserCircle, Moon, Sun, ChevronRight, ChevronDown, Menu as MenuIcon,
  Globe
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/hooks/use-translation';
import { usePermission } from '@/hooks/use-permission';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const [breakpoint, setBreakpoint] = useState<'mobile'|'tablet'|'desktop'>('desktop');
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { auth } = usePage<SharedData>().props;
  const getInitials = useInitials();
  const { t, language, changeLanguage } = useTranslation();
  const { hasPermission, hasRole, hasAccess } = usePermission();

  // Definisi menu berdasarkan bahasa saat ini dan hak akses pengguna
  const mainNavItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: route('dashboard'),
      icon: LayoutGrid,
    },
    // Item menu kategori hanya ditampilkan jika pengguna memiliki hak akses
    hasAccess('view-category') ? {
      title: t('categories'),
      href: route('categories.index'),
      icon: Folder,
    } : null,
    // Item menu pembelian 
    hasAccess('view-purchase') ? {
      title: t('purchase'),
      href: route('purchases.index'),
      icon: ShoppingCart,
      submenu: [
        {
          title: t('purchase.list'),
          href: route('purchases.index'),
        },
        hasAccess('create-purchase') ? {
          title: t('purchase.add'),
          href: route('purchases.create'),
        } : null,
        {
          title: 'Gudang',
          href: route('purchases.products'),
        }
      ].filter(Boolean) as NavItem[],
    } : null,
    // Item menu produk
    hasAccess('view-products') ? {
      title: t('products'),
      href: route('produk.index'),
      icon: Package,
      submenu: [
        {
          title: t('products.list'),
          href: route('produk.index'),
        },
        hasAccess('create-product') ? {
          title: t('products.add'),
          href: route('produk.create'),
        } : null,
        hasAccess('view-expired-products') ? {
          title: t('products.expired'),
          href: route('produk.expired'),
        } : null,
        hasAccess('view-outstock-products') ? {
          title: t('products.outstock'),
          href: route('produk.outstock'),
        } : null
      ].filter(Boolean) as NavItem[],
    } : null,
    // Item menu penjualan
    hasAccess('view-sales') ? {
      title: t('sales'),
      href: route('sales.index'),
      icon: DollarSign,
      submenu: [
        {
          title: t('sales.transactions'),
          href: route('sales.index'),
        },
        hasAccess('create-sale') ? {
          title: t('sales.pos'),
          href: route('sales.create'),
        } : null
      ].filter(Boolean) as NavItem[],
    } : null,
    // Item menu supplier
    hasAccess('view-supplier') ? {
      title: t('supplier'),
      href: route('suppliers.index'),
      icon: User,
    } : null,
    // Item menu laporan
    hasAccess('view-reports') ? {
      title: t('reports'),
      href: route('reports.sales'),
      icon: ClipboardList,
      submenu: [
        {
          title: t('reports.sales'),
          href: route('reports.sales'),
        },
        {
          title: t('reports.purchase'),
          href: route('reports.purchase'),
        }
      ],
    } : null,
    // Item menu hak akses (hanya untuk admin)
    hasAccess('view-access-control') ? {
      title: t('access'),
      href: '#',
      icon: BookOpen,
      submenu: [
        hasAccess('view-users') ? {
          title: t('users'),
          href: route('users.index'),
        } : null,
        hasAccess('view-role') ? {
          title: t('roles'),
          href: route('roles.index'),
        } : null,
        hasAccess('view-permission') ? {
          title: t('permissions'),
          href: route('permissions.index'),
        } : null
      ].filter(Boolean) as NavItem[],
    } : null,
  ].filter(Boolean) as NavItem[]; // Filter null items

  const secondaryNavItems: NavItem[] = [
    {
      title: t('settings'),
      href: route('settings.index'),
      icon: Settings,
      submenu: [
        {
          title: t('profile'),
          href: route('profile.edit'),
        },
        hasAccess('view-settings') ? {
          title: t('app.settings'),
          href: route('settings.index'),
        } : null
      ].filter(Boolean) as NavItem[],
    },
  ];

  // Deteksi breakpoint dan perangkat
  useEffect(() => {
    setMounted(true);
    
    // Deteksi tema
    const isSystemDarkMode = document.documentElement.classList.contains('dark');
    setIsDarkMode(isSystemDarkMode);
    applyThemeToSidebar(isSystemDarkMode);
    
    // Deteksi tema dari localStorage juga
    const savedTheme = localStorage.getItem('vite-ui-theme');
    if (savedTheme) {
      const isDark = savedTheme === 'dark';
      setIsDarkMode(isDark);
      applyThemeToSidebar(isDark);
    }
    
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint('mobile');
      } else if (width >= 640 && width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
        // Auto open sidebar on desktop
        setIsOpen(true);
      }
    };

    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Listen untuk event perubahan bahasa
    const handleLanguageChange = () => {
      // Re-render sidebar saat bahasa berubah
      setMounted(prevState => !prevState);
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, [setIsOpen]);
  
  // Function untuk mengaplikasikan tema ke sidebar
  const applyThemeToSidebar = (isDark: boolean) => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      if (isDark) {
        sidebar.classList.add('dark-theme');
        sidebar.classList.remove('light-theme');
      } else {
        sidebar.classList.add('light-theme');
        sidebar.classList.remove('dark-theme');
      }
    }
  };

  // Perbaikan: daripada mengandalkan mounted, gunakan clientSide rendering
  if (typeof window === 'undefined') {
    return null;
  }

  // Fungsi untuk toggle dark mode
  const toggleDarkMode = () => {
    // Toggle class pada document
    document.documentElement.classList.toggle('dark');
    
    // Update state
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Simpan ke localStorage
    localStorage.setItem('vite-ui-theme', newDarkMode ? 'dark' : 'light');
    
    // Aplikasikan tema ke sidebar
    applyThemeToSidebar(newDarkMode);
  };
  
  // Fungsi untuk mengubah bahasa
  const handleChangeLanguage = (lang: 'id' | 'en') => {
    changeLanguage(lang);
  };

  // Fungsi untuk logout
  const handleLogout = () => {
    if (confirm(t('logout.confirm'))) {
      router.post(route('logout'));
    }
  };
  
  // Toggle expand/collapse submenu
  const toggleSubmenu = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title) 
        : [...prev, title]
    );
  };
  
  // Check if submenu is expanded
  const isExpanded = (title: string) => {
    return expandedItems.includes(title);
  };
  
  // Dynamic sidebar classes based on breakpoint and open state
  const sidebarClasses = cn(
    'fixed left-0 top-0 h-screen bg-gray-900 text-gray-100 overflow-hidden border-r shadow-lg flex flex-col z-40 transition-all duration-300 ease-in-out sidebar [perspective:800px]',
    // Width classes berdasarkan state dan breakpoint
    {
      // Desktop/tablet collapsed (ikon saja)
      'w-16': !isOpen && breakpoint !== 'mobile',
      // Desktop/tablet expanded (full sidebar)
      'w-64': isOpen && breakpoint !== 'mobile',
      // Mobile - full width saat terbuka
      'w-3/4 max-w-xs': breakpoint === 'mobile',
    },
    // Position classes
    {
      // Desktop dan tablet - selalu visible (sesuai state collapsed/expanded)
      'translate-x-0': (isOpen || breakpoint !== 'mobile'),
      // Mobile - slide out ketika tertutup
      '-translate-x-full': !isOpen && breakpoint === 'mobile',
    },
    // Tema classes
    isDarkMode ? 'dark-theme' : 'light-theme'
  );

  // Overlay for mobile
  const overlayClasses = cn(
    'fixed inset-0 bg-black/50 z-30 transition-opacity',
    {
      'opacity-100 pointer-events-auto': isOpen && breakpoint === 'mobile',
      'opacity-0 pointer-events-none': !isOpen || breakpoint !== 'mobile',
    }
  );

  // Fungsi untuk menentukan apakah rute aktif
  const isActive = (href: string) => {
    // Dapatkan bagian rute saat ini, contoh: 'categories.index'
    const currentRoute = route().current() || '';
    
    // Periksa apakah rute saat ini sama dengan href yang diberikan
    if (currentRoute === href.toString()) {
      return true;
    }
    
    // Cek juga rute berbasis nama (misalnya 'categories.index' dimulai dengan 'categories')
    if (href.toString().includes('.')) {
      const baseRoute = href.toString().split('.')[0];
      return currentRoute.startsWith(baseRoute);
    }
    
    return false;
  };

  // Hamburger menu untuk mobile (fixed position)
  const fixedHamburgerButton = !isOpen && breakpoint === 'mobile' && (
    <Button
      variant="default"
      size="icon"
      className="fixed top-3 left-3 z-50 rounded-lg shadow-md"
      onClick={() => setIsOpen(true)}
    >
      <MenuIcon className="h-5 w-5" />
    </Button>
  );

  // Toggle button untuk semua ukuran layar
  const sidebarToggleBtn = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "absolute top-3 right-3 text-gray-300 hover:text-white z-50",
        isOpen ? "" : "left-auto right-auto mx-auto"
      )}
      onClick={() => setIsOpen(!isOpen)}
    >
      {isOpen ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <MenuIcon className="h-5 w-5" />
      )}
    </Button>
  );

  // Render main navigation item
  const renderNavItem = (item: NavItem) => {
    // Submenu item handling
    if (item.submenu) {
      // Menggunakan tampilan accordion untuk semua device (mobile & desktop)
      return (
        <div key={item.title} className="mb-0.5">
          {isOpen || breakpoint === 'mobile' ? (
            // Expanded sidebar view
            <div>
              <button
                onClick={() => toggleSubmenu(item.title)}
                className={cn(
                  'flex items-center justify-between w-full rounded-md text-sm font-medium transition-all duration-200 ease-in-out py-2',
                  isActive(item.href.toString())
                    ? 'bg-green-600 text-white border-l-4 border-green-400 pl-2 pr-3 scale-100' // Active state
                    : 'text-gray-300 px-3 hover:bg-gray-800 hover:text-white hover:scale-105 hover:-translate-y-px hover:rotate-y-1', // Non-active state with hover
                )}
              >
                <div className="flex items-center">
                  {item.icon && <Icon iconNode={item.icon} className="h-5 w-5 shrink-0 mr-3" />}
                  <span className="transition-opacity duration-200">{item.title}</span>
                </div>
                {isExpanded(item.title) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
              
              {/* Render submenu accordion */}
              {isExpanded(item.title) && (
                <div className="ml-8 pl-3 border-l border-gray-700 mt-1 mb-2 space-y-1">
                  {item.submenu.map((subItem, index) => (
                    <Link
                      key={`${item.title}-sub-${index}`}
                      href={subItem.href}
                      className={cn(
                        'flex items-center rounded-md text-sm transition-all duration-200 ease-in-out py-2',
                        isActive(subItem.href.toString())
                          ? 'bg-green-600 text-white font-medium border-l-4 border-green-400 pl-2 pr-3 scale-100' // Active state
                          : 'text-gray-400 px-3 hover:bg-gray-700 hover:text-white hover:scale-105 hover:-translate-y-px hover:translate-x-1', // Non-active state with hover
                      )}
                    >
                      <span className="block transform transition-transform duration-200 ease-in-out group-hover:translate-x-0.5">{subItem.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Icon-only collapsed view
            <div className="relative group"> {/* Added group for tooltip positioning */}
              <Link
                href={item.href}
                className={cn(
                  'flex items-center rounded-md text-sm font-medium transition-all duration-150 ease-in-out',
                  isActive(item.href.toString()) 
                    ? 'bg-green-600 text-white' // Active state for collapsed
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white', // Non-active hover for collapsed
                  'justify-center p-2'
                )}
              >
                {item.icon && (
                  <Icon 
                    iconNode={item.icon} 
                    className="h-5 w-5 shrink-0 transition-transform duration-150 ease-in-out group-hover:scale-110" 
                  />
                )}
              </Link>
              {/* Tooltip for collapsed view */}
              <div className={cn(
                "absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1",
                "bg-gray-700 text-white text-xs rounded-md shadow-lg",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 whitespace-nowrap",
                "pointer-events-none" // Prevent tooltip from capturing mouse events
              )}>
                {item.title}
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Regular item without submenu
    return (
      <div key={item.title} className="mb-0.5">
        <Link
          href={item.href}
          className={cn(
            'flex items-center rounded-md text-sm font-medium transition-all duration-200 ease-in-out relative group', // Added relative group
            isActive(item.href.toString())
              ? 'bg-green-600 text-white border-l-4 border-green-400 scale-100' // Active state (expanded)
              : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105 hover:-translate-y-px hover:rotate-y-1', // Non-active state with hover (expanded)
            (isOpen || breakpoint === 'mobile')
              ? (isActive(item.href.toString()) ? 'pl-2 pr-3 py-2' : 'px-3 py-2') // Padding for expanded
              : cn( // Classes for collapsed view
                  'justify-center p-2',
                  isActive(item.href.toString())
                    ? 'bg-green-600 text-white border-l-4 border-green-500' // Active state (collapsed)
                    : 'hover:bg-gray-700' // Non-active hover for collapsed
                ) 
          )}
        >
          {item.icon && (
            <Icon 
              iconNode={item.icon} 
              className={cn(
                "h-5 w-5 shrink-0 transition-transform duration-150 ease-in-out", 
                (isOpen || breakpoint === 'mobile') ? "mr-3" : "group-hover:scale-110" // Scale icon on hover only when collapsed
              )}
            />
          )}
          {(isOpen || breakpoint === 'mobile') && (
            <span className="transition-opacity duration-200">{item.title}</span>
          )}
          {/* Tooltip for collapsed regular items */}
          {!(isOpen || breakpoint === 'mobile') && (
            <div className={cn(
              "absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1",
              "bg-gray-700 text-white text-xs rounded-md shadow-lg",
              "opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300 whitespace-nowrap",
              "pointer-events-none"
            )}>
              {item.title}
            </div>
          )}
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* Background overlay for mobile */}
      <div 
        className={overlayClasses} 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      
      {/* Fixed hamburger button for mobile */}
      {fixedHamburgerButton}
      
      <div className={sidebarClasses}>
        {/* Header dengan toggle button */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800 h-14 shrink-0 relative">
          <Link href="/dashboard" className="flex items-center">
            <AppLogo className="text-white" size="sm" showText={isOpen} isCollapsed={!isOpen} />
          </Link>
          
          {/* Tombol toggle selalu terlihat */}
          {sidebarToggleBtn}
        </div>
        
        {/* Navigation - perbaiki spacing */}
        <div className="flex-1 py-2 overflow-y-auto">
          {/* Main Nav */}
          <div className="px-2 space-y-0.5">
            {mainNavItems.map(renderNavItem)}
          </div>
          
          {/* Secondary Nav */}
          <div className={cn("px-2 pt-2 border-t border-gray-800 mt-2", !isOpen && breakpoint !== 'mobile' ? "flex flex-col items-center" : "")}>
            {secondaryNavItems.map(renderNavItem)}
            
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex items-center rounded-md text-sm font-medium transition-colors mt-1',
                    'hover:bg-gray-800 hover:text-white text-gray-300',
                    isOpen || breakpoint === 'mobile' ? 'px-3 py-3 w-full justify-between' : 'justify-center p-3 w-full'
                  )}
                >
                  <div className="flex items-center">
                    <Globe className={cn("h-5 w-5 shrink-0", isOpen || breakpoint === 'mobile' ? "mr-3" : "")} />
                    {(isOpen || breakpoint === 'mobile') && (
                      <span className="transition-opacity duration-200">
                        {language === 'id' ? t('indonesian') : t('english')}
                      </span>
                    )}
                  </div>
                  {(isOpen || breakpoint === 'mobile') && <ChevronRight className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 text-gray-100 border-gray-700">
                <DropdownMenuItem 
                  className={cn(
                    'cursor-pointer',
                    language === 'id' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                  )}
                  onClick={() => handleChangeLanguage('id')}
                >
                  {t('indonesian')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className={cn(
                    'cursor-pointer',
                    language === 'en' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                  )}
                  onClick={() => handleChangeLanguage('en')}
                >
                  {t('english')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Theme Toggle Button */}
            <button
              className={cn(
                'flex items-center rounded-md text-sm font-medium transition-colors mt-1',
                'hover:bg-gray-800 hover:text-white text-gray-300',
                isOpen || breakpoint === 'mobile' ? 'px-3 py-3' : 'justify-center p-3 w-full'
              )}
              onClick={toggleDarkMode}
            >
              {isDarkMode ? 
                <Sun className={cn("h-5 w-5 shrink-0", isOpen || breakpoint === 'mobile' ? "mr-3" : "")} /> : 
                <Moon className={cn("h-5 w-5 shrink-0", isOpen || breakpoint === 'mobile' ? "mr-3" : "")} />
              }
              {(isOpen || breakpoint === 'mobile') && (
                <span className="transition-opacity duration-200">
                  {isDarkMode ? t('light.mode') : t('dark.mode')}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Footer with User Profile */}
        {auth?.user && (
          <div className="p-3 border-t border-gray-800 mt-auto">
            {isOpen || breakpoint === 'mobile' ? (
              <div className="flex items-center p-2 rounded-md hover:bg-gray-800 transition-colors">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                  <AvatarFallback className="text-xs bg-gray-700 text-gray-200">
                    {getInitials(auth.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{auth.user.name}</p>
                  <p className="text-xs text-gray-400 truncate">{auth.user.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                  <AvatarFallback className="text-xs bg-gray-700 text-gray-200">
                    {getInitials(auth.user.name)}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-white"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
