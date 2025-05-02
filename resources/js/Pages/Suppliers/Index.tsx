import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Supplier } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';

interface SuppliersIndexProps {
    suppliers: PaginatedResponse<Supplier>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Suppliers', href: route('suppliers.index') },
];

export default function SuppliersIndex() {
    const { suppliers, flash } = usePage<SuppliersIndexProps>().props;

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
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.data.length > 0 ? (
                                suppliers.data.map((supplier) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-medium">{supplier.name}</TableCell>
                                        <TableCell>{supplier.email || '-'}</TableCell>
                                        <TableCell>{supplier.phone || '-'}</TableCell>
                                        <TableCell>{supplier.company || '-'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Link href={route('suppliers.edit', supplier.id)}>
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </Link>
                                            <Link
                                                href={route('suppliers.destroy', supplier.id)}
                                                method="delete"
                                                as="button"
                                                onBefore={() => confirm('Are you sure?')}
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 text-white px-3 py-2"
                                            >
                                                Delete
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No suppliers found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={suppliers.links} meta={suppliers.meta} className="mt-4"/>
                </CardContent>
            </Card>
        </AppLayout>
    );
} 