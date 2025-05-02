// resources/js/pages/Product.tsx
import { Link } from '@inertiajs/react';
import { Table } from '../components/table';
import { Button } from '../components/ui/button';
import { useState } from 'react'; // Tambahkan impor

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Products</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dashboard / Products</p>
      <Link href="/add-product" className="mb-4 inline-block">
        <Button>Add Product</Button>
      </Link>
      <Table
        headers={['PRODUCT NAME', 'CATEGORY', 'PRICE', 'QUANTITY', 'MARGIN', 'EXPIRY DATE', 'ACTION']}
        data={products}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default Products;