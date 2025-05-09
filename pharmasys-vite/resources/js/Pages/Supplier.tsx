// resources/js/pages/Supplier.tsx
import { Link } from '@inertiajs/react';
import { Table } from '../components/table';
import { Button } from '../components/ui/button';
import { useState } from 'react'; // Tambahkan impor

const Supplier = () => {
  const [suppliers, setSuppliers] = useState<any[]>([]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Supplier</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dashboard / Supplier</p>
      <Link href="/add-supplier" className="mb-4 inline-block">
        <Button>Add New</Button>
      </Link>
      <Table
        headers={['NAME', 'PHONE', 'EMAIL', 'ADDRESS', 'COMPANY', 'ACTION']}
        data={suppliers}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  );
};

export default Supplier;