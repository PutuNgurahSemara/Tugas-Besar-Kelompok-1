import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Supplier } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react'; // Added router
import { Plus, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2
import { FaWhatsapp } from 'react-icons/fa';
import { useState } from 'react'; // Added useState
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { ActionButton } from '@/components/action-button'; // Added ActionButton
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'; // Added DeleteConfirmationDialog

interface SuppliersIndexProps {
    suppliers: PaginatedResponse<Supplier>;
    [key: string]: any; // Add index signature for PageProps compatibility
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Suppliers', href: route('suppliers.index') },
];

export default function SuppliersIndex() {
    const { suppliers, flash } = usePage<SuppliersIndexProps>().props;
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        supplierId: 0,
        supplierName: '',
    });

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({
            isOpen: true,
            supplierId: id,
            supplierName: name,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('suppliers.destroy', deleteDialog.supplierId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, supplierId: 0, supplierName: '' });
            },
            onError: () => {
                setDeleteDialog({ isOpen: false, supplierId: 0, supplierName: '' });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Suppliers</CardTitle>
                            <CardDescription>Manage your suppliers.</CardDescription>
                        </div>
                        <Link href={route('suppliers.create')}>
                            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Supplier</Button>
                        </Link>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nama Perusahaan</TableHead>
                                <TableHead>No. WhatsApp</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.data.length > 0 ? (
                                suppliers.data.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.company}</TableCell>
                                        <TableCell>
                                            {supplier.phone ? (
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 underline"
                                                    >
                                                        {supplier.phone}
                                                    </a>
                                                    <a
                                                        href={`https://wa.me/${supplier.phone.replace(/[^0-9]/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs"
                                                        title="Hubungi via WhatsApp"
                                                    >
                                                        <FaWhatsapp className="mr-1" /> Hubungi
                                                    </a>
                                                </div>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell>{supplier.note || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButton
                                                    icon={Edit}
                                                    tooltip="Edit Supplier"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('suppliers.edit', supplier.id))}
                                                />
                                                <ActionButton
                                                    icon={Trash2}
                                                    tooltip="Delete Supplier"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(supplier.id, supplier.company)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No suppliers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={suppliers.links} meta={suppliers.meta} className="mt-4"/>
                </CardContent>
            </Card>
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, supplierId: 0, supplierName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete Supplier"
                description={`Are you sure you want to delete the supplier "${deleteDialog.supplierName}"? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
