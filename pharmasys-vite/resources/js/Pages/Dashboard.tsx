import { useEffect, useState } from 'react';
// Hapus PlaceholderPattern jika tidak digunakan
// import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, Link, router } from '@inertiajs/react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
// Import ikon dari lucide-react
import { DollarSign, LayoutGrid, Archive, Users, PackageSearch, ShoppingCart, BarChart2, Calendar, Bell, LogOut, Settings, UserCircle, Receipt, ReceiptText } from 'lucide-react';
// Import komponen UI kustom jika ada (misal: Card, Table)
// Ganti dengan import komponen UI Anda jika sudah ada
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Asumsi Anda punya komponen Card
// Kembalikan import komponen Table dari shadcn/ui
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Asumsi Anda punya komponen Table
import { Input } from '@/components/ui/input'; // Asumsi Anda punya komponen Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Asumsi Anda punya komponen Select
import { Button } from '@/components/ui/button'; // Asumsi Anda punya komponen Button
import { ThemeToggle } from '@/components/ThemeToggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Definisikan DashboardProps dengan index signature
interface DashboardProps {
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
  [key: string]: any; // Index signature untuk props dinamis
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
];

export default function Dashboard() {
  const {
    props: {
      todaySales = 0,
      totalCategories = 0,
      expiredMedicines = 0,
      systemUsers = 0,
      recentSales = [],
      salesByCategory = [],
      auth,
    },
  } = usePage<DashboardProps>();

  // State for table pagination and search
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10); // Gunakan state

  // Filter sales based on search term
  const filteredSales = recentSales.filter((sale) =>
    sale.medicine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Pie Chart Data - Sesuaikan warna dengan tema hijau
  const pieChartData = {
    labels: salesByCategory.map((item) => item.label),
    datasets: [
      {
        label: 'Sales by Category', // Lebih deskriptif
        data: salesByCategory.map((item) => item.value),
        backgroundColor: [
          'rgba(22, 163, 74, 0.6)', // Hijau (primary)
          'rgba(34, 197, 94, 0.6)', // Hijau lebih terang
          'rgba(74, 222, 128, 0.6)', // Hijau sangat terang
          'rgba(134, 239, 172, 0.6)', // Hijau pastel
          // Tambahkan warna lain jika kategori > 4
        ],
        borderColor: [
          'rgba(22, 163, 74, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(74, 222, 128, 1)',
          'rgba(134, 239, 172, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Pie Chart Options - Sesuaikan warna teks legend
  const pieChartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const, // Tipe eksplisit
        labels: {
            // Warna teks akan diatur oleh Tailwind dark mode di parent div
            // color: 'currentColor', // Hapus ini jika AppLayout menangani warna teks
        },
      },
       tooltip: {
            bodyColor: '#fff', // Warna teks tooltip body
            titleColor: '#fff', // Warna teks tooltip title
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Background tooltip
        },
    },
  };

  // Fungsi manual untuk toggle tema
  const toggleDarkMode = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('vite-ui-theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('vite-ui-theme', 'dark');
    }
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      router.post(route('logout'));
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex-1 space-y-4 p-4">
        {/* Welcome Message - Reduced spacing */}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          Selamat Datang, {auth?.user?.name || 'Admin'}!
        </h1>

        {/* Top Summary Cards - Gunakan komponen Card */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {/* Card Today's Sales */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rp {todaySales.toLocaleString()}</div>
              {/* <p className="text-xs text-muted-foreground">+20.1% from last month</p> */}
            </CardContent>
          </Card>
          {/* Card Available Categories */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Categories</CardTitle>
              <LayoutGrid className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
               {/* <p className="text-xs text-muted-foreground">+180.1% from last month</p> */}
            </CardContent>
          </Card>
          {/* Card Expired Medicines */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired Medicines</CardTitle>
              <Archive className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredMedicines}</div>
              {/* <p className="text-xs text-muted-foreground">+19% from last month</p> */}
            </CardContent>
          </Card>
           {/* Card System Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Users</CardTitle>
              <Users className="h-5 w-5 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemUsers}</div>
               {/* <p className="text-xs text-muted-foreground">+201 since last hour</p> */}
            </CardContent>
          </Card>
        </div>

        {/* Main Row: Sales Table and Graph */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
          {/* Recent Sales Table - Gunakan komponen Card dan Table shadcn/ui */}
          <Card className="lg:col-span-4">
             <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
             </CardHeader>
             <CardContent>
                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                  {/* Select Items Per Page */}
                  <Select
                     value={String(itemsPerPage)}
                     onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
                     <SelectTrigger className="w-[80px]">
                         <SelectValue placeholder="Limit" />
                     </SelectTrigger>
                     <SelectContent>
                         <SelectItem value="5">5</SelectItem>
                         <SelectItem value="10">10</SelectItem>
                         <SelectItem value="25">25</SelectItem>
                         <SelectItem value="50">50</SelectItem>
                     </SelectContent>
                  </Select>
                  {/* Search Input */}
                  <Input
                     type="text"
                     placeholder="Search medicine..."
                     className="w-full sm:max-w-xs"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                {/* Gunakan struktur Table shadcn/ui */}
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                           <div className="flex items-center space-x-1"> <PackageSearch className="h-4 w-4"/> <span>Medicine</span></div>
                        </TableHead>
                        <TableHead>
                           <div className="flex items-center space-x-1"> <ShoppingCart className="h-4 w-4"/> <span>Qty</span></div>
                        </TableHead>
                        <TableHead>
                           <div className="flex items-center space-x-1"> <DollarSign className="h-4 w-4"/> <span>Price</span></div>
                        </TableHead>
                        <TableHead className="text-right">
                           <div className="flex items-center space-x-1 justify-end"> <Calendar className="h-4 w-4"/> <span>Date</span></div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSales.length > 0 ? (
                        paginatedSales.map((sale, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{sale.medicine}</TableCell>
                            <TableCell>{sale.quantity}</TableCell>
                            <TableCell>Rp {sale.total_price.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{sale.date}</TableCell>
                            {/* Jika perlu tombol action, tambahkan TableCell di sini */}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No sales data available.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-2">
                  <p className="text-sm text-muted-foreground order-2 sm:order-1">
                     Showing{' '}
                     {filteredSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                     {' '}to{' '}
                     {Math.min(currentPage * itemsPerPage, filteredSales.length)}
                     {' '}of{' '}
                     {filteredSales.length} entries
                  </p>
                  <div className="flex space-x-2 order-1 sm:order-2">
                     <Button
                         // Kembalikan variant="outline"
                         // Ganti sementara ke secondary karena linter error
                         variant="secondary" 
                         size="sm"
                         onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                         disabled={currentPage === 1}
                     >
                       Previous
                     </Button>
                     <Button
                         // Kembalikan variant="outline"
                         // Ganti sementara ke secondary karena linter error
                         variant="secondary"
                         size="sm"
                         onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                         disabled={currentPage === totalPages || totalPages === 0}
                     >
                       Next
                     </Button>
                  </div>
                </div>
             </CardContent>
          </Card>

          {/* Graph Report - Gunakan komponen Card */}
          <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle className="flex items-center space-x-1">
                    <BarChart2 className="h-5 w-5" />
                    <span>Sales by Category</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-[300px] w-full">
                {salesByCategory.length > 0 ? (
                  <Pie data={pieChartData} options={pieChartOptions} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-center text-muted-foreground">
                      No data available for Graph Report
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}