import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Category } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react'; // Added router
import { Plus, Edit, Trash2 } from 'lucide-react'; // Added Edit, Trash2
import { useState } from 'react'; // Added useState

import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/action-button'; // Added ActionButton
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'; // Added DeleteConfirmationDialog
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination'; // Asumsi ada komponen pagination
import { FlashMessage } from '@/components/flash-message'; // Asumsi ada komponen flash message

interface CategoriesIndexProps {
    categories: PaginatedResponse<Category>;
    [key: string]: any; // Add index signature
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Categories', href: route('categories.index') },
];

export default function CategoriesIndex() {
    const { categories, flash } = usePage<CategoriesIndexProps>().props;
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        categoryId: 0,
        categoryName: '',
    });

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({
            isOpen: true,
            categoryId: id,
            categoryName: name,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('categories.destroy', deleteDialog.categoryId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, categoryId: 0, categoryName: '' });
                // Optionally, show a success toast here if you have a toast system
            },
            onError: () => {
                // Optionally, show an error toast here
                setDeleteDialog({ isOpen: false, categoryId: 0, categoryName: '' });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Categories</CardTitle>
                            <CardDescription>Manage your product categories.</CardDescription>
                        </div>
                        <Link href={route('categories.create')}>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Category
                            </Button>
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
                                <TableHead className="w-[150px] text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.data.length > 0 ? (
                                categories.data.map((category) => (
                                    <TableRow key={category.id}>
                                        <TableCell>{category.id}</TableCell>
                                        <TableCell className="font-medium">{category.name}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <ActionButton
                                                    icon={Edit}
                                                    tooltip="Edit Category"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('categories.edit', category.id))}
                                                />
                                                <ActionButton
                                                    icon={Trash2}
                                                    tooltip="Delete Category"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(category.id, category.name)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No categories found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={categories.links} meta={categories.meta} className="mt-4"/>
                </CardContent>
            </Card>
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, categoryId: 0, categoryName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete Category"
                description={`Are you sure you want to delete the category "${deleteDialog.categoryName}"? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
