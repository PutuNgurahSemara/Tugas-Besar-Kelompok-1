// resources/js/Pages/Purchase.tsx
import { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/table';
import { Plus } from 'lucide-react';

interface Purchase {
  id: number;
  medicine_name: string;
  category: string;
  supplier: string;
  purchase_cost: number;
  quantity: number;
  expire_date: string;
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Purchase',
    href: '/purchases',
  },
];

export default function Purchase() {
  const { props } = usePage<{ purchases: Purchase[] }>();
  const { purchases = [] } = props;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  // Custom cell renderer
  const renderCustomCell = (row: Purchase, header: string, index: number) => {
    if (header === 'PURCHASE COST') {
      return formatCurrency(row.purchase_cost);
    }
    
    if (header === 'EXPIRE DATE') {
      return new Date(row.expire_date).toLocaleDateString('id-ID');
    }
    
    return null;
  };
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Purchase" />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Pembelian
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manajemen pembelian produk dari supplier
          </p>
        </div>
        
        <Link href={route('purchases.create')}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Tambah Pembelian</span>
          </Button>
        </Link>
      </div>
      
      <Table
        headers={['NAMA OBAT', 'KATEGORI', 'SUPPLIER', 'HARGA BELI', 'JUMLAH', 'TANGGAL KADALUARSA', 'AKSI']}
        data={purchases}
        renderCustomCell={renderCustomCell}
        onEdit={(row) => {
          window.location.href = route('purchases.edit', row.id);
        }}
        onDelete={(row) => {
          if (confirm('Apakah Anda yakin ingin menghapus data pembelian ini?')) {
            window.location.href = route('purchases.destroy', row.id);
          }
        }}
        emptyMessage="Belum ada data pembelian. Silakan tambahkan pembelian baru."
      />
    </AppLayout>
  );
}