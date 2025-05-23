import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type User, type Role } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react'; // Added router
import { Plus, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2
import { useState } from 'react'; // Added useState
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { ActionButton } from '@/components/action-button'; // Added ActionButton
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'; // Added DeleteConfirmationDialog

interface UserWithRoles extends User {
    roles: Role[];
    created_at?: string; // Ensure created_at is part of the type if used directly
}

interface UsersIndexProps {
    users: PaginatedResponse<UserWithRoles>;
    auth: { user: User }; // For checking current user ID
    [key: string]: any; // Add index signature
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Users', href: route('users.index') },
];

export default function UsersIndex() {
    const { users: usersData, flash, auth } = usePage<UsersIndexProps>().props;
    const getInitials = useInitials();
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        userId: 0,
        userName: '',
    });

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({
            isOpen: true,
            userId: id,
            userName: name,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('users.destroy', deleteDialog.userId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, userId: 0, userName: '' });
            },
            onError: () => {
                setDeleteDialog({ isOpen: false, userId: 0, userName: '' });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>Manage system users and their roles.</CardDescription>
                        </div>
                        <Link href={route('users.create')}>
                            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add User</Button>
                        </Link>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Select defaultValue="10">
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue placeholder="10" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">entries</span>
                        </div>
                        <div className="w-full max-w-sm">
                            <Input type="search" placeholder="Search users..." />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Created date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {usersData.data.length > 0 ? (
                                usersData.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar ? `/storage/${user.avatar}`: undefined} alt={user.name} />
                                                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                                </Avatar>
                                                <span>{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>{user.roles?.map(role => role.name).join(', ') || '-'}</TableCell>
                                        <TableCell>{user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButton
                                                    icon={Edit}
                                                    tooltip="Edit User"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('users.edit', user.id))}
                                                />
                                                {user.id !== auth.user.id && ( // Prevent deleting self
                                                    <ActionButton
                                                        icon={Trash2}
                                                        tooltip="Delete User"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(user.id, user.name)}
                                                    />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={usersData.links} meta={usersData.meta} className="mt-4"/>
                </CardContent>
            </Card>
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, userId: 0, userName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete User"
                description={`Are you sure you want to delete the user "${deleteDialog.userName}"? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
