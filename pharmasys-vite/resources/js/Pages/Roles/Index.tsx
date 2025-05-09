// Placeholder Page for Roles
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse } from '@/types'; // Tambah Role jika sudah ada
import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { Plus } from 'lucide-react';
import { FlashMessage } from '@/components/flash-message';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Ganti any dengan tipe Role jika sudah ada (termasuk permissions_count atau permissions)
interface SpatieRole { 
    id: number;
    name: string;
    permissions_count?: number; // Jika pakai withCount
    permissions?: { id: number; name: string }[]; // Jika pakai with
    created_at: string; // atau Date
}

interface RolesIndexProps {
    roles: PaginatedResponse<SpatieRole>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Roles', href: route('roles.index') },
];

export default function RolesIndex() {
    const { roles, flash } = usePage<RolesIndexProps>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                         <div>
                            <CardTitle>Roles</CardTitle>
                            <CardDescription>Manage user roles and their permissions.</CardDescription>
                         </div>
                         <Link href={route('roles.create')}> {/* Arahkan ke create */} 
                            <Button size="sm"><Plus className="mr-2 h-4 w-4"/>Add Role</Button>
                         </Link>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                     <Table>
                         <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Permissions Count</TableHead> 
                                <TableHead>Created Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                         <TableBody>
                            {roles.data.length > 0 ? 
                                roles.data.map(role => (
                                <TableRow key={role.id}>
                                    <TableCell>{role.id}</TableCell>
                                    <TableCell className="font-medium">{role.name}</TableCell>
                                    <TableCell>{role.permissions_count ?? '-'}</TableCell>
                                    <TableCell>{role.created_at ? format(new Date(role.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Link 
                                        href={route('roles.edit', role.id)}
                                        className={cn(
                                            buttonVariants({ variant: "outline", size: "sm" }),
                                            "bg-blue-500 hover:bg-blue-600 text-white"
                                        )}
                                        >
                                        Edit
                                        </Link>
                                        <Link
                                        href={route('roles.destroy', role.id)}
                                        method="delete"
                                        as="button"
                                        onBefore={() => confirm('Are you sure you want to delete this role?')}
                                        className={cn(
                                            "bg-red-500 hover:bg-red-600 text-white inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium"
                                        )}
                                        >
                                        Delete
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                            : 
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No roles found.
                                </TableCell>
                            </TableRow>
                            }
                         </TableBody>
                     </Table>
                     <Pagination links={roles.links} meta={roles.meta} className="mt-4"/>
                </CardContent>
            </Card>
        </AppLayout>
    );
} 