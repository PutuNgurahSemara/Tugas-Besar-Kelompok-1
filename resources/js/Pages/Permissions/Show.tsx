import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { ArrowLeft, Check, Plus, X, Search } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

// Interface untuk permission
interface SpatiePermission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
}

// Interface untuk user
interface User {
    id: number;
    name: string;
    email: string;
    has_permission: boolean;
}

interface PermissionShowProps {
    permission: SpatiePermission;
    users: PaginatedResponse<User>;
    availableUsers: { id: number; name: string; email: string }[];
}

const getBreadcrumbs = (name: string): BreadcrumbItem[] => [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Permissions', href: route('permissions.index') },
    { title: name, href: '#' },
];

export default function PermissionShow({ permission, users, availableUsers }: PermissionShowProps) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [selectedUser, setSelectedUser] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Form untuk menambahkan user ke permission
    const { data, setData, post, reset, errors } = useForm({
        user_id: '',
        permission_id: permission.id,
    });

    // Filter users berdasarkan search term
    const filteredUsers = users.data.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Menambahkan user ke permission
    const addUserToPermission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.user_id) return;
        
        setIsSubmitting(true);
        post(route('permissions.assign-user'), {
            onSuccess: () => {
                setIsSubmitting(false);
                reset();
                setSelectedUser("");
                showToast(
                    t('success'),
                    t('permission.assigned.success'),
                    'success'
                );
            },
            onError: () => {
                setIsSubmitting(false);
                showToast(
                    t('error'),
                    t('permission.assigned.error'),
                    'error'
                );
            }
        });
    };

    // Menghapus permission dari user
    const removePermissionFromUser = (userId: number, userName: string) => {
        if (confirm(`${t('confirm.remove.permission')} ${userName}?`)) {
            router.delete(route('permissions.remove-user'), {
                data: {
                    user_id: userId,
                    permission_id: permission.id
                },
                onSuccess: () => {
                    showToast(
                        t('success'),
                        t('permission.removed.success'),
                        'success'
                    );
                },
                onError: () => {
                    showToast(
                        t('error'),
                        t('permission.removed.error'),
                        'error'
                    );
                }
            });
        }
    };

    return (
        <AppLayout breadcrumbs={getBreadcrumbs(permission.name)}>
            <Head title={`${t('permission')}: ${permission.name}`} />
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                    {t('permission')}: {permission.name}
                </h2>
                <Link href={route('permissions.index')}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('back')}
                    </Button>
                </Link>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                {/* Detail Permission Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('permission.details')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('name')}</h3>
                                <p className="mt-1 text-base font-semibold">{permission.name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('guard')}</h3>
                                <p className="mt-1 text-base font-semibold">{permission.guard_name}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('created.date')}</h3>
                                <p className="mt-1 text-base font-semibold">
                                    {new Date(permission.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assign User Form Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('assign.permission')}</CardTitle>
                        <CardDescription>{t('assign.permission.desc')}</CardDescription>
                    </CardHeader>
                    <form onSubmit={addUserToPermission}>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="user_select" className="text-sm font-medium">
                                        {t('select.user')}
                                    </label>
                                    <Select 
                                        value={selectedUser} 
                                        onValueChange={(value) => {
                                            setSelectedUser(value);
                                            setData('user_id', value);
                                        }}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('select.user.placeholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableUsers.map((user) => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.user_id && (
                                        <p className="text-sm text-red-500">{errors.user_id}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button 
                                type="submit" 
                                className="bg-green-600 hover:bg-green-700"
                                disabled={!selectedUser || isSubmitting}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {t('assign')}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* Users with Permission List */}
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <CardTitle>{t('users.with.permission')}</CardTitle>
                        
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={t('search.users')}
                                className="pl-8 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('name')}</TableHead>
                                <TableHead>{t('email')}</TableHead>
                                <TableHead>{t('has.permission')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? 
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.has_permission ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                    <Check className="mr-1 h-3 w-3" />
                                                    {t('has.permission.yes')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                                    <X className="mr-1 h-3 w-3" />
                                                    {t('has.permission.no')}
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {user.has_permission ? (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removePermissionFromUser(user.id, user.name)}
                                                >
                                                    <X className="mr-1 h-4 w-4" />
                                                    {t('remove')}
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => {
                                                        setData('user_id', user.id.toString());
                                                        post(route('permissions.assign-user'));
                                                    }}
                                                >
                                                    <Check className="mr-1 h-4 w-4" />
                                                    {t('assign')}
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                                : searchTerm ? 
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {t('no.search.results')} "{searchTerm}"
                                    </TableCell>
                                </TableRow>
                                : 
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {t('no.users.found')}
                                    </TableCell>
                                </TableRow>
                            }
                        </TableBody>
                    </Table>
                    <Pagination links={users.links} meta={users.meta} className="mt-4" />
                </CardContent>
            </Card>
        </AppLayout>
    );
} 