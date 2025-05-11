// Placeholder Page for Roles
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Role } from '@/types'; // Added Role
import { Head, Link, usePage, router } from '@inertiajs/react'; // Added router
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react'; // Added useState
import { ActionButton } from '@/components/action-button'; // Added ActionButton
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'; // Added DeleteConfirmationDialog
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2
import { FlashMessage } from '@/components/flash-message';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

// Using Role type from @/types
interface RolesIndexProps {
    roles: PaginatedResponse<Role & { permissions_count?: number; created_at: string }>; // Ensure Role has these if needed, or adjust
    [key: string]: any; // Add index signature
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Roles', href: route('roles.index') },
];

export default function RolesIndex() {
    const { roles, flash } = usePage<RolesIndexProps>().props;
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        roleId: 0,
        roleName: '',
    });

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({
            isOpen: true,
            roleId: id,
            roleName: name,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('roles.destroy', deleteDialog.roleId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, roleId: 0, roleName: '' });
            },
            onError: () => {
                setDeleteDialog({ isOpen: false, roleId: 0, roleName: '' });
            }
        });
    };

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
                                    <TableCell>{(role as any).permissions_count ?? '-'}</TableCell> 
                                    <TableCell>{(role as any).created_at ? format(new Date((role as any).created_at), 'dd MMM yyyy') : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <ActionButton
                                                icon={Edit}
                                                tooltip="Edit Role"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.visit(route('roles.edit', role.id))}
                                            />
                                            {/* Add condition to prevent deleting essential roles if necessary */}
                                            <ActionButton
                                                icon={Trash2}
                                                tooltip="Delete Role"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteClick(role.id, role.name)}
                                            />
                                        </div>
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
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, roleId: 0, roleName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete Role"
                description={`Are you sure you want to delete the role "${deleteDialog.roleName}"? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
