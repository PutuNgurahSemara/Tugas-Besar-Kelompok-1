// resources/js/pages/add-product.tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/Textarea';
import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';

const AddProduct = () => {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    harga_beli: '0',
    margin: '0',
    harga: '0',
    description: ''
  });

  const { post, processing, errors } = useForm(formData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Hitung harga jual otomatis saat harga beli atau margin berubah
  useEffect(() => {
    const hargaBeli = parseFloat(formData.harga_beli) || 0;
    const margin = parseFloat(formData.margin) || 0;
    const marginMultiplier = 1 + (margin / 100);
    const hargaJual = Math.round(hargaBeli * marginMultiplier);
    
    setFormData(prev => ({
      ...prev,
      harga: hargaJual.toString()
    }));
  }, [formData.harga_beli, formData.margin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('products.store'), {
      data: formData
    } as any);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Tambah Produk</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dashboard / Produk / Tambah</p>
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Produk *
            </label>
            <Input 
              id="name"
              value={formData.name}
              onChange={handleChange}
              name="name"
              className="w-full" 
              required 
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="harga_beli" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Harga Beli (Rp) *
              </label>
              <Input 
                id="harga_beli"
                type="number"
                min="0"
                value={formData.harga_beli}
                onChange={handleChange}
                name="harga_beli"
                className="w-full"
                required 
              />
              {errors.harga_beli && <p className="mt-1 text-sm text-red-600">{errors.harga_beli}</p>}
            </div>

            <div>
              <label htmlFor="margin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Margin (%)
              </label>
              <Input 
                id="margin"
                type="number"
                min="0"
                step="0.1"
                value={formData.margin}
                onChange={handleChange}
                name="margin"
                className="w-full"
              />
              {errors.margin && <p className="mt-1 text-sm text-red-600">{errors.margin}</p>}
            </div>

            <div>
              <label htmlFor="harga" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Harga Jual (Rp) *
              </label>
              <Input 
                id="harga"
                type="number"
                min="0"
                value={formData.harga}
                name="harga"
                className="w-full bg-gray-100 dark:bg-gray-700"
                readOnly
              />
              {errors.harga && <p className="mt-1 text-sm text-red-600">{errors.harga}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Deskripsi
            </label>
            <Textarea 
              id="description"
              value={formData.description}
              onChange={handleChange}
              name="description"
              className="w-full" 
              rows={4} 
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => window.history.back()}
          >
            Batal
          </Button>
          <Button 
            type="submit" 
            disabled={processing}
          >
            {processing ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;