// resources/js/Pages/Expired.tsx
import { useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Search } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  discount: number;
  expiry_date: string;
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
  const { props } = usePage<{ products: Product[] }>();
  const { products = [] } = props;
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
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
            Produk Kadaluarsa
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daftar produk yang sudah atau akan segera kadaluarsa
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
                <TableHead className="text-center">Stok</TableHead>
                <TableHead className="text-center">Diskon</TableHead>
                <TableHead className="text-center">Tanggal Kadaluarsa</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => {
                  const daysUntil = getDaysUntilExpiry(product.expiry_date);
                  const isExpired = daysUntil <= 0;
                  const isNearExpiry = daysUntil > 0 && daysUntil <= 30;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                      <TableCell className="text-center">{product.quantity}</TableCell>
                      <TableCell className="text-center">{product.discount}%</TableCell>
                      <TableCell className="text-center">{new Date(product.expiry_date).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Kadaluarsa
                            </span>
                          ) : isNearExpiry ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {daysUntil} hari lagi
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Baik
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    {searchTerm ? (
                      <div className="flex flex-col items-center justify-center">
                        <p>Tidak ada produk yang cocok dengan pencarian: <strong>{searchTerm}</strong></p>
                        <Button 
                          variant="link" 
                          className="mt-2"
                          onClick={() => setSearchTerm('')}
                        >
                          Reset pencarian
                        </Button>
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