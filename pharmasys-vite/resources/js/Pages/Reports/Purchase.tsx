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

interface PurchaseReportProps {
  purchases: {
    data: Array<{
      id: number;
      no_faktur: string;
      pbf: string;
      tanggal_faktur: string;
      details: Array<{
        nama_produk: string;
        jumlah: number;
        harga_satuan: number;
        total: number;
      }>;
      supplier?: {
        name: string;
      };
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
    supplier_id: string | null;
  };
  suppliers: Array<{
    id: number;
    name: string;
  }>;
  chartData: {
    dailyPurchases: Array<{
      date: string;
      total: number;
    }>;
    supplierPurchases: Array<{
      name: string;
      total: number;
    }>;
  };
  summary: {
    total_purchases: number;
    total_transactions: number;
    avg_transaction: number;
    top_supplier: {
      name: string;
      total_amount: number;
    } | null;
  };
  [key: string]: any; // Add index signature for PageProps compatibility
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Reports', href: '#' },
    { title: 'Purchase Report', href: route('reports.purchase') },
];

export default function PurchaseReport() {
    const { purchases, filters, suppliers, chartData, summary } = usePage<PurchaseReportProps>().props;
    
    const [startDate, setStartDate] = useState<string>(filters.start_date || '');
    const [endDate, setEndDate] = useState<string>(filters.end_date || '');
    const [supplierId, setSupplierId] = useState<string>(
        filters.supplier_id ? String(filters.supplier_id) : 'all'
    );
    const [reportType, setReportType] = useState<'detail' | 'summary'>('detail'); // State for report type
    
    const filterReport = () => {
        router.get(route('reports.purchase'), {
            start_date: startDate || '',
            end_date: endDate || '',
            supplier_id: supplierId === 'all' ? null : supplierId,
        }, {
            preserveState: true,
            replace: true,
        });
    };
    
    const exportToExcel = () => {
        const params: any = {
            start_date: startDate || '',
            end_date: endDate || '',
            report_type: reportType,
        };
        if (supplierId && supplierId !== 'all') {
            params.supplier_id = supplierId;
        }
        window.location.href = route('reports.purchase.export.excel', params);
    };
    
    const exportToPdf = () => {
        const params: any = {
            start_date: startDate || '',
            end_date: endDate || '',
            report_type: reportType,
        };
        if (supplierId && supplierId !== 'all') {
            params.supplier_id = supplierId;
        }
        window.location.href = route('reports.purchase.export.pdf', params);
    };
    
    const lineChartData = {
        labels: chartData.dailyPurchases.map(item => format(new Date(item.date), 'dd MMM')),
        datasets: [
            {
                label: 'Pembelian Harian',
                data: chartData.dailyPurchases.map(item => item.total),
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                tension: 0.1,
            },
        ],
    };
    
    const barChartData = {
        labels: chartData.supplierPurchases.map(item => item.name),
        datasets: [
            {
                label: 'Pembelian per Supplier',
                data: chartData.supplierPurchases.map(item => item.total),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1,
            },
        ],
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchase Report" />
            <div className="space-y-6">
                {/* Filter Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filter Laporan</CardTitle>
                        <CardDescription>Pilih rentang tanggal dan supplier untuk melihat laporan pembelian</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
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
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Supplier</label>
                                <Select value={supplierId} onValueChange={setSupplierId}>
                                    <SelectTrigger className="w-full md:w-48">
                                        <SelectValue placeholder="Semua Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Supplier</SelectItem>
                                        {suppliers.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-sm font-medium">Jenis Laporan</label>
                                <Select value={reportType} onValueChange={(value) => setReportType(value as 'detail' | 'summary')}>
                                    <SelectTrigger className="w-full md:w-48">
                                        <SelectValue placeholder="Pilih Jenis Laporan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="detail">Detail Pembelian</SelectItem>
                                        <SelectItem value="summary">Ringkasan Pembelian</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <Button onClick={filterReport} className="self-end">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Terapkan Filter
                            </Button>

                            <div className="flex gap-2 ml-auto self-end">
                                <Button variant="secondary" onClick={exportToExcel}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export Excel
                                </Button>
                                <Button variant="secondary" onClick={exportToPdf}>
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
                            <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Rp {summary.total_purchases.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</div>
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
                            <CardTitle className="text-sm font-medium">Supplier Terbanyak</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {summary.top_supplier ? summary.top_supplier.name : "-"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {summary.top_supplier ? `Rp ${summary.top_supplier.total_amount.toLocaleString('id-ID')}` : "Tidak ada data"}
                            </p>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pembelian Harian</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Pembelian per Supplier</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <Bar 
                                data={barChartData} 
                                options={{ 
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            display: false,
                                        }
                                    }
                                }} 
                            />
                        </CardContent>
                    </Card>
                </div>
                
                {/* Purchase Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Daftar Transaksi Pembelian</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No Faktur</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchases.data.length > 0 ? (
                                    purchases.data.map((purchase) => {
                                        const totalPrice = purchase.details.reduce((sum, detail) => sum + detail.total, 0);
                                        const productList = purchase.details.map(d => `${d.nama_produk} (${d.jumlah})`).join(", ");
                                        
                                        return (
                                            <TableRow key={purchase.id}>
                                                <TableCell className="font-medium">{purchase.no_faktur}</TableCell>
                                                <TableCell>{format(new Date(purchase.tanggal_faktur), 'dd MMM yyyy')}</TableCell>
                                                <TableCell>{purchase.supplier?.name || purchase.pbf}</TableCell>
                                                <TableCell>{productList}</TableCell>
                                                <TableCell className="text-right">Rp {totalPrice.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                            Tidak ada data pembelian untuk periode ini
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        
                        <Pagination links={purchases.links} meta={purchases.meta} className="mt-4" />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
