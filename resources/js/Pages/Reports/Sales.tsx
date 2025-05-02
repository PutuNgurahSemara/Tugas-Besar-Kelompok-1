// Placeholder Page
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Download, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrasi komponen ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Definisikan tipe untuk data yang diterima dari backend
interface SalesReportProps {
  sales: {
    data: Array<{
      id: number;
      total_price: number;
      created_at: string;
      user: {
        name: string;
      };
      items: Array<{
        quantity: number;
        produk: {
          nama: string;
          harga: number;
        };
      }>;
    }>;
    links: any[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
  };
  filters: {
    start_date: string;
    end_date: string;
  };
  chartData: {
    dailySales: Array<{
      date: string;
      total: number;
    }>;
    categorySales: Array<{
      name: string;
      total_quantity: number;
    }>;
  };
  summary: {
    total_sales: number;
    total_transactions: number;
    avg_transaction: number;
    top_product: {
      nama: string;
      total_quantity: number;
    } | null;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Reports', href: '#' },
    { title: 'Sales Report', href: route('reports.sales') },
];

export default function SalesReport() {
    const { sales, filters, chartData, summary } = usePage<SalesReportProps>().props;
    
    const [startDate, setStartDate] = useState<string>(filters.start_date || '');
    const [endDate, setEndDate] = useState<string>(filters.end_date || '');
    
    // Fungsi untuk memfilter laporan berdasarkan tanggal
    const filterReport = () => {
        router.get(route('reports.sales'), {
            start_date: startDate || '',
            end_date: endDate || '',
        }, {
            preserveState: true,
            replace: true,
        });
    };
    
    // Fungsi untuk export ke Excel
    const exportToExcel = () => {
        window.location.href = route('reports.sales.export.excel', {
            start_date: startDate || '',
            end_date: endDate || '',
        });
    };
    
    // Fungsi untuk export ke PDF
    const exportToPdf = () => {
        window.location.href = route('reports.sales.export.pdf', {
            start_date: startDate || '',
            end_date: endDate || '',
        });
    };
    
    // Data untuk Line Chart - Daily Sales
    const lineChartData = {
        labels: chartData.dailySales.map(item => format(new Date(item.date), 'dd MMM')),
        datasets: [
            {
                label: 'Penjualan Harian',
                data: chartData.dailySales.map(item => item.total),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                tension: 0.1,
            },
        ],
    };
    
    // Data untuk Pie Chart - Category Sales
    const pieChartData = {
        labels: chartData.categorySales.map(item => item.name),
        datasets: [
            {
                label: 'Penjualan Berdasarkan Kategori',
                data: chartData.categorySales.map(item => item.total_quantity),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Report" />
            <div className="space-y-6">
                {/* Filter Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Laporan</CardTitle>
                        <CardDescription>Pilih rentang tanggal untuk melihat laporan penjualan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Mulai</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full md:w-48"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tanggal Akhir</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full md:w-48"
                                />
                            </div>
                            
                            <Button type="button" onClick={filterReport}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Terapkan Filter
                            </Button>

                            <div className="flex gap-2 ml-auto">
                                <Button variant="outline" onClick={exportToExcel}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                                <Button variant="outline" onClick={exportToPdf}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export PDF
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {summary.total_sales.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_transactions}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Rata-rata Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {summary.avg_transaction.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Produk Terlaris</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.top_product ? summary.top_product.nama : "-"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {summary.top_product ? `${summary.top_product.total_quantity} unit terjual` : "Tidak ada data"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Penjualan Harian</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Penjualan per Kategori</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <Pie 
                                data={pieChartData} 
                                options={{ 
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'right',
                                        }
                                    }
                                }} 
                            />
                        </CardContent>
                    </Card>
                </div>
                
                {/* Sales Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Transaksi Penjualan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Transaksi</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kasir</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sales.data.length > 0 ? (
                                    sales.data.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-medium">{sale.id}</TableCell>
                                            <TableCell>{format(new Date(sale.created_at), 'dd MMM yyyy, HH:mm')}</TableCell>
                                            <TableCell>{sale.user?.name || '-'}</TableCell>
                                            <TableCell>
                                                {sale.items.slice(0, 2).map(item => 
                                                    item.produk.nama + ` (${item.quantity})`
                                                ).join(', ')}
                                                {sale.items.length > 2 ? ' ...' : ''}
                                            </TableCell>
                                            <TableCell className="text-right">Rp {sale.total_price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                            Tidak ada data penjualan untuk periode ini
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        <Pagination links={sales.links} meta={sales.meta} className="mt-4" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 