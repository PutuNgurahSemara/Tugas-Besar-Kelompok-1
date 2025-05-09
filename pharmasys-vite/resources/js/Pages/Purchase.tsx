// resources/js/Pages/Purchase.tsx
import { useState, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/table';
import { Plus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ActionButton } from '@/components/action-button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Plus, Edit, Trash2, FileSpreadsheet, Eye } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importAlert, setImportAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    purchaseId: 0,
    purchaseNumber: '',
  });

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setImportAlert(null);
    router.post(route('purchases.import'), formData, {
      forceFormData: true,
      onSuccess: () => setImportAlert({ type: 'success', message: 'Import berhasil!' }),
      onError: () => setImportAlert({ type: 'error', message: 'Import gagal. Pastikan format file sudah benar.' }),
    });
  };

  const handleDelete = (id: number, number: string) => {
    setDeleteDialog({
      isOpen: true,
      purchaseId: id,
      purchaseNumber: number,
    });
  };

  const handleDeleteConfirm = () => {
    router.delete(route('purchases.destroy', deleteDialog.purchaseId), {
      onSuccess: () => {
        setDeleteDialog({ isOpen: false, purchaseId: 0, purchaseNumber: '' });
      },
    });
  };

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
      <Head title="Purchases" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold">Pembelian</h1>

        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            icon={FileSpreadsheet}
            tooltip="Export data pembelian"
            variant="outline"
            onClick={() => window.location.href = route('purchases.export')}
          >
            Export
          </ActionButton>

          <ActionButton
            icon={Plus}
            tooltip="Tambah pembelian baru"
            onClick={() => router.visit(route('purchases.create'))}
          >
            Tambah Pembelian
          </ActionButton>
        </div>
      </div>

      {importAlert && (
        <Alert variant={importAlert.type === 'success' ? 'default' : 'destructive'} className="mt-4">
          <AlertTitle>{importAlert.type === 'success' ? 'Sukses' : 'Gagal'}</AlertTitle>
          <AlertDescription>{importAlert.message}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Faktur</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="w-[140px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchases.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.no_faktur}</TableCell>
                <TableCell>{purchase.supplier?.name || '-'}</TableCell>
                <TableCell>{formatCurrency(purchase.total)}</TableCell>
                <TableCell>{formatDate(purchase.tanggal)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <ActionButton
                      icon={Eye}
                      tooltip="Lihat detail"
                      variant="ghost"
                      onClick={() => router.visit(route('purchases.show', purchase.id))}
                    />
                    <ActionButton
                      icon={Edit}
                      tooltip="Edit pembelian"
                      variant="ghost"
                      onClick={() => router.visit(route('purchases.edit', purchase.id))}
                    />
                    <ActionButton
                      icon={Trash2}
                      tooltip="Hapus pembelian"
                      variant="ghost"
                      onClick={() => handleDelete(purchase.id, purchase.no_faktur)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {purchases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Tidak ada data pembelian. Silakan tambahkan pembelian baru.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, purchaseId: 0, purchaseNumber: '' })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Pembelian"
        description={`Apakah Anda yakin ingin menghapus pembelian dengan nomor faktur "${deleteDialog.purchaseNumber}"?`}
      />
    </AppLayout>
  );
}