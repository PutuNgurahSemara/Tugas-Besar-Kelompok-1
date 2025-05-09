// resources/js/Pages/Expired.tsx
import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ActionButton } from '@/components/action-button';
import { AlertTriangle, Search, Eye } from 'lucide-react';

interface Product {
  id: number;
  nama: string;
  category: {
    name: string;
  };
  harga: number;
  expiry_statuses: {
    expired?: number;
    near_expiry?: number;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Products',
    href: '/products',
  },
  {
    title: 'Expired',
    href: '/products/expired',
  },
];

export default function Expired() {
  const { props } = usePage<{ produk: { data: Product[] } }>();
  const { produk } = props;
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter products based on search term
  const filteredProducts = produk.data.filter(product => 
    product.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Expired Products" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
            Produk Kadaluarsa & Mendekati Kadaluarsa
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daftar produk yang sudah kadaluarsa atau akan kadaluarsa dalam 30 hari
          </p>
        </div>
        
        <div className="w-full md:w-auto flex">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Cari produk..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-center">Status Kadaluarsa</TableHead>
                <TableHead className="text-center">Jumlah Kadaluarsa</TableHead>
                <TableHead className="text-center">Jumlah Mendekati</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <TableRow key={product.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{product.nama}</TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell className="text-right">{formatCurrency(product.harga)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {product.expiry_statuses.expired && product.expiry_statuses.expired > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Sudah Kadaluarsa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Mendekati Kadaluarsa
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {product.expiry_statuses.expired || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.expiry_statuses.near_expiry || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <ActionButton
                          icon={Eye}
                          tooltip="Lihat detail"
                          variant="ghost"
                          onClick={() => router.visit(route('produk.show', product.id))}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {searchTerm ? (
                      <div className="flex flex-col items-center justify-center">
                        <p>Tidak ada produk yang cocok dengan pencarian: <strong>{searchTerm}</strong></p>
                        <ActionButton
                          icon={Search}
                          tooltip="Reset pencarian"
                          variant="link"
                          onClick={() => setSearchTerm('')}
                          showText
                        >
                          Reset pencarian
                        </ActionButton>
                      </div>
                    ) : (
                      <p>Tidak ada produk yang kadaluarsa atau akan segera kadaluarsa.</p>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}