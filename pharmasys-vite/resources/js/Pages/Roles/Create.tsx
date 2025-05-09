import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from '@/hooks/use-translation';
import { ArrowLeft, Plus } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/components/ui/toast';

// Interface untuk data permission
interface SpatiePermission {
    id: number;
    name: string;
    guard_name: string;
}

interface RoleCreateProps {
    permissions: SpatiePermission[];
}

// Breadcrumb untuk halaman Role Create
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Roles', href: route('roles.index') },
    { title: 'Add Role', href: route('roles.create') },
];

export default function RolesCreate({ permissions = [] }: RoleCreateProps) {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    // Inisialisasi form dengan useForm
    const { data, setData, errors, post, processing } = useForm({
        name: '',
        guard_name: 'web',
        permissions: [] as number[],
    });

    // Handle checkbox change untuk permission
    const handlePermissionChange = (permissionId: number, checked: boolean) => {
        const updatedPermissions = checked
            ? [...selectedPermissions, permissionId]
            : selectedPermissions.filter(id => id !== permissionId);
        
        setSelectedPermissions(updatedPermissions);
        setData('permissions', updatedPermissions);
    };

    // Handle submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        post(route('roles.store'), {
            onSuccess: () => {
                setIsSubmitting(false);
                showToast(
                    t('success'),
                    t('role.created.success'),
                    'success'
                );
                router.visit(route('roles.index'));
            },
            onError: () => {
                setIsSubmitting(false);
                showToast(
                    t('error'),
                    t('role.created.error'),
                    'error'
                );
            }
        });
    };

    // Group permissions by category for better UI
    const groupedPermissions = Array.isArray(permissions) ? permissions.reduce((acc, permission) => {
        const parts = permission.name.split('-');
        const action = parts[0]; // view, create, edit, destroy, etc.
        const resource = parts.slice(1).join('-'); // sales, products, etc.
        
        if (!acc[resource]) {
            acc[resource] = [];
        }
        
        acc[resource].push({
            ...permission,
            action,
        });
        
        return acc;
    }, {} as Record<string, (SpatiePermission & { action: string })[]>) : {};

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('add.role')} />
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">{t('add.role')}</h2>
                <Link href={route('roles.index')}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('back')}
                    </Button>
                </Link>
            </div>
            
            <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('role.basic.info')}</CardTitle>
                            <CardDescription>{t('role.basic.info.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="name">{t('name')}</Label>
                                <Input 
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="admin, manager, cashier, etc."
                                    className={errors.name ? 'border-red-500' : ''}
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name}</p>
                                )}
                            </div>
                            
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="guard_name">{t('guard')}</Label>
                                <select
                                    id="guard_name"
                                    value={data.guard_name}
                                    onChange={(e) => setData('guard_name', e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="web">web</option>
                                    <option value="api">api</option>
                                </select>
                                {errors.guard_name && (
                                    <p className="text-sm text-red-500">{errors.guard_name}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Permissions Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('permissions')}</CardTitle>
                            <CardDescription>{t('role.permissions.desc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {Array.isArray(permissions) && permissions.length > 0 ? (
                                <div className="grid gap-8">
                                    {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                                        <div key={resource} className="space-y-3 border-b pb-6 last:border-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-medium capitalize">{resource}</h3>
                                                <div className="flex items-center gap-4">
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            // Select all permissions in this resource
                                                            const permissionIds = permissions.map(p => p.id);
                                                            const newSelected = [
                                                                ...selectedPermissions.filter(id => 
                                                                    !permissionIds.includes(id)
                                                                ),
                                                                ...permissionIds
                                                            ];
                                                            setSelectedPermissions(newSelected);
                                                            setData('permissions', newSelected);
                                                        }}
                                                    >
                                                        {t('select.all')}
                                                    </Button>
                                                    <Button 
                                                        type="button" 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            // Deselect all permissions in this resource
                                                            const permissionIds = permissions.map(p => p.id);
                                                            const newSelected = selectedPermissions.filter(id => 
                                                                !permissionIds.includes(id)
                                                            );
                                                            setSelectedPermissions(newSelected);
                                                            setData('permissions', newSelected);
                                                        }}
                                                    >
                                                        {t('clear')}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                                {permissions.map(permission => (
                                                    <div 
                                                        key={permission.id} 
                                                        className="flex items-center space-x-2 border p-3 rounded-md hover:bg-accent/50 transition-colors"
                                                    >
                                                        <Checkbox 
                                                            id={`permission-${permission.id}`}
                                                            checked={selectedPermissions.includes(permission.id)}
                                                            onCheckedChange={(checked) => handlePermissionChange(permission.id, !!checked)}
                                                        />
                                                        <Label 
                                                            htmlFor={`permission-${permission.id}`}
                                                            className="cursor-pointer flex-1"
                                                        >
                                                            <span className="capitalize font-medium">{permission.action}</span>
                                                            <span className="text-xs text-muted-foreground block mt-0.5">
                                                                {permission.name}
                                                            </span>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-muted-foreground border rounded-md">
                                    {t('no.permissions.found')}
                                </div>
                            )}
                            
                            {errors.permissions && (
                                <p className="text-sm text-red-500 mt-2">{errors.permissions}</p>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end border-t pt-4">
                            <Button 
                                type="submit" 
                                className="bg-green-600 hover:bg-green-700"
                                disabled={processing || isSubmitting}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                {isSubmitting ? t('saving') : t('create.role')}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
} 