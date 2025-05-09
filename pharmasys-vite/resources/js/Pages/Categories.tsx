// resources/js/pages/categories.tsx
import { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ActionButton } from '@/components/action-button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Edit, Trash2, FolderPlus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  created_at: string;
}

interface CategoriesProps {
  categories: Category[];
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Categories',
    href: '/categories',
  },
];

export default function Categories() {
  const { props } = usePage<{ categories: Category[] }>();
  const { categories = [] } = props;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    categoryId: 0,
    categoryName: '',
  });

  const handleSaveCategory = () => {
    if (editingCategory) {
      router.put(`/categories/${editingCategory.id}`, { name: categoryName }, {
        onSuccess: () => {
          setCategoryName('');
          setEditingCategory(null);
          setIsDialogOpen(false);
        },
      });
    } else {
      router.post('/categories', { name: categoryName }, {
        onSuccess: () => {
          setCategoryName('');
          setIsDialogOpen(false);
        },
      });
    }
  };

  const handleEditClick = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (categoryId: number, categoryName: string) => {
    setDeleteDialog({
      isOpen: true,
      categoryId,
      categoryName,
    });
  };

  const handleDeleteConfirm = () => {
    router.delete(`/categories/${deleteDialog.categoryId}`, {
      onSuccess: () => {
        setDeleteDialog({ isOpen: false, categoryId: 0, categoryName: '' });
      },
    });
  };

  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Categories" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Kategori
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <ActionButton
              icon={FolderPlus}
              tooltip="Tambah kategori baru"
              showText
              variant="default"
            >
              Tambah Kategori
            </ActionButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium mb-2">
                Nama Kategori
              </label>
              <Input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Masukkan nama kategori"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <ActionButton variant="outline">Batal</ActionButton>
              </DialogClose>
              <ActionButton onClick={handleSaveCategory} disabled={!categoryName.trim()}>
                {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </ActionButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Dibuat</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{formattedDate(category.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ActionButton
                        icon={Edit}
                        tooltip="Edit kategori"
                        variant="ghost"
                        onClick={() => handleEditClick(category)}
                      />
                      <ActionButton
                        icon={Trash2}
                        tooltip="Hapus kategori"
                        variant="ghost"
                        onClick={() => handleDeleteClick(category.id, category.name)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  Tidak ada kategori. Silakan tambahkan kategori baru.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, categoryId: 0, categoryName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Hapus Kategori"
        description={`Apakah Anda yakin ingin menghapus kategori "${deleteDialog.categoryName}"? Semua produk yang terkait dengan kategori ini akan kehilangan kategorinya.`}
      />
    </AppLayout>
  );
}

// Tambahkan layout dan breadcrumbs di Laravel controller