// Placeholder Page for Permissions
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse } from '@/types'; // Tambah Permission jika sudah ada
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { Plus, Edit, Trash2, Eye } from 'lucide-react'; // Added Eye
import { FlashMessage } from '@/components/flash-message';
import { format } from 'date-fns'; // Import format
import { useTranslation } from '@/hooks/use-translation';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { useToast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { ActionButton } from '@/components/action-button'; // Added ActionButton
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'; // Added DeleteConfirmationDialog
import type { Permission } from '@/types'; // Using Permission type from global types

interface PermissionsIndexProps {
    permissions: PaginatedResponse<Permission & { guard_name: string; created_at: string }>; // Use global Permission type
    [key: string]: any; // Add index signature
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Permissions', href: route('permissions.index') },
];

export default function PermissionsIndex() {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { permissions, flash } = usePage<PermissionsIndexProps>().props;
    const [searchTerm, setSearchTerm] = useState('');
    // const [entriesPerPage, setEntriesPerPage] = useState('10'); // This state is not used for pagination control in the provided code
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        permissionId: 0,
        permissionName: '',
    });

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({
            isOpen: true,
            permissionId: id,
            permissionName: name,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('permissions.destroy', deleteDialog.permissionId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, permissionId: 0, permissionName: '' });
                showToast(
                    t('permission.deleted'),
                    t('permission.deleted.message'),
                    'success'
                );
            },
            onError: () => {
                setDeleteDialog({ isOpen: false, permissionId: 0, permissionName: '' });
                showToast(
                    t('error'),
                    t('permission.delete.error'),
                    'error'
                );
            }
        });
    };
    
    // Filter permissions berdasarkan search term dan kategori
    const filteredPermissions = permissions.data.filter(permission => {
        const nameMatches = permission.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!selectedCategory) return nameMatches;
        
        const category = getPermissionCategory(permission.name);
        return nameMatches && category === selectedCategory;
    });

    // Get permission category from permission name
    const getPermissionCategory = (permissionName: string): string => {
        const parts = permissionName.split('-');
        if (parts.length > 1) {
            return parts.slice(1).join('-');
        }
        return 'other';
    };

    // Get unique categories to display as filter badges
    const categories = useMemo(() => {
        const categoriesSet = new Set<string>();
        permissions.data.forEach(permission => {
            const category = getPermissionCategory(permission.name);
            categoriesSet.add(category);
        });
        return Array.from(categoriesSet).sort();
    }, [permissions.data]);

    // Get color class for category badge
    const getCategoryColor = (category: string): string => {
        const colorMap: Record<string, string> = {
            'sales': 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-800/20 dark:text-blue-300',
            'category': 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800/20 dark:text-green-300',
            'products': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800/20 dark:text-purple-300',
            'product': 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-800/20 dark:text-purple-300',
            'purchase': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-800/20 dark:text-yellow-300',
            'supplier': 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-800/20 dark:text-indigo-300',
            'reports': 'bg-pink-100 text-pink-800 hover:bg-pink-200 dark:bg-pink-800/20 dark:text-pink-300',
            'users': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800/20 dark:text-red-300',
            'user': 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800/20 dark:text-red-300',
            'role': 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-800/20 dark:text-orange-300',
            'permission': 'bg-teal-100 text-teal-800 hover:bg-teal-200 dark:bg-teal-800/20 dark:text-teal-300',
            'settings': 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800/20 dark:text-gray-300',
            'expired-products': 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-800/20 dark:text-rose-300',
            'outstock-products': 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800/20 dark:text-amber-300',
            'access-control': 'bg-violet-100 text-violet-800 hover:bg-violet-200 dark:bg-violet-800/20 dark:text-violet-300',
            'app': 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-800/20 dark:text-emerald-300',
            'db': 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200 dark:bg-cyan-800/20 dark:text-cyan-300',
        };
        
        return colorMap[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800/20 dark:text-gray-300';
    };

    // Get action for the permission (view, create, edit, delete, etc)
    const getPermissionAction = (permissionName: string): string => {
        const parts = permissionName.split('-');
        if (parts.length > 0) {
            return parts[0];
        }
        return permissionName;
    };

    // handleDelete is replaced by handleDeleteClick and handleDeleteConfirm

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('permissions')} />
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">{t('permissions')}</h2>
                <Link href={route('permissions.create')}>
                    <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('add.permission')}
                    </Button>
                </Link>
            </div>
            
            {/* Dokumentasi Permission Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-blue-700 dark:text-blue-300 text-lg flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 16v-4"></path>
                            <path d="M12 8h.01"></path>
                        </svg>
                        {t('permission.info.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-blue-700 dark:text-blue-300 mb-2">
                        {t('permission.info.description')}
                    </p>
                    <ul className="list-disc pl-5 text-blue-700 dark:text-blue-300 text-sm">
                        <li className="mb-1">{t('permission.info.item1')}</li>
                        <li className="mb-1">{t('permission.info.item2')}</li>
                        <li className="mb-1">{t('permission.info.item3')}</li>
                    </ul>
                    <p className="text-blue-700 dark:text-blue-300 text-sm mt-2">
                        {t('permission.info.footer')}
                    </p>
                </CardContent>
            </Card>
            
            {/* Category Filter Badges */}
            <div className="mb-4">
                <h3 className="text-sm font-medium mb-2">{t('filter.by.category')}:</h3>
                <div className="flex flex-wrap gap-2">
                    <Badge 
                        className={`cursor-pointer ${!selectedCategory ? 'bg-primary' : 'bg-secondary/80'}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        {t('all')}
                    </Badge>
                    {categories.map(category => (
                        <Badge 
                            key={category}
                            className={`cursor-pointer ${selectedCategory === category ? getCategoryColor(category) : 'bg-secondary/80'}`}
                            onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                        >
                            {category}
                        </Badge>
                    ))}
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                            {/* Show entries select can be re-added if pagination logic is updated to use it */}
                            {/* <span>{t('show')}</span>
                            <select 
                                className="border rounded p-1"
                                value={entriesPerPage} // This state is not currently used for pagination
                                onChange={(e) => setEntriesPerPage(e.target.value)}
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span>{t('entries')}</span> */}
                        </div>
                        <div className="flex items-center gap-2 ml-auto"> {/* Moved search to the right */}
                            <span>{t('search')}:</span>
                            <Input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-[200px]"
                            />
                        </div>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer">{t('name')} ↕</TableHead>
                                <TableHead className="cursor-pointer">{t('category')}</TableHead>
                                <TableHead className="cursor-pointer">{t('created.date')} ↕</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPermissions.length > 0 ? 
                                filteredPermissions.map(permission => (
                                    <TableRow key={permission.id}>
                                        <TableCell className="font-medium">
                                            <Link
                                                href={route('permissions.show', permission.id)}
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {permission.name}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getCategoryColor(getPermissionCategory(permission.name))}>
                                                    {getPermissionCategory(permission.name)}
                                                </Badge>
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                    {getPermissionAction(permission.name)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {format(new Date(permission.created_at), 'EEE MMM yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <ActionButton
                                                    icon={Eye}
                                                    tooltip={t('view')}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('permissions.show', permission.id))}
                                                />
                                                <ActionButton
                                                    icon={Edit}
                                                    tooltip={t('edit')}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('permissions.edit', permission.id))}
                                                />
                                                <ActionButton
                                                    icon={Trash2}
                                                    tooltip={t('delete')}
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(permission.id, permission.name)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            : 
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        {searchTerm || selectedCategory ? t('no.search.results') : t('no.permissions.found')}
                                    </TableCell>
                                </TableRow>
                            }
                        </TableBody>
                    </Table>
                    <Pagination links={permissions.links} meta={permissions.meta} className="mt-4" />
                </CardContent>
            </Card>
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, permissionId: 0, permissionName: '' })}
                onConfirm={handleDeleteConfirm}
                title={t('delete.permission')}
                description={
                    deleteDialog.permissionName
                        ? `${t('delete.permission.confirm.prefix')} "${deleteDialog.permissionName}"? ${t('delete.permission.confirm.suffix')}`
                        : t('delete.permission.confirm.generic')
                }
            />
        </AppLayout>
    );
}
