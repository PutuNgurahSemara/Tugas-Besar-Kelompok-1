// resources/js/pages/sales.tsx
import { Link } from '@inertiajs/react';
import { Table } from '../components/table';
import { Button } from '../components/ui/button';

const Sales = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Sales</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dashboard / Sales</p>
      <Link href="/add-sale" className="mb-4 inline-block">
        <Button>Add Sale</Button>
      </Link>
      <Table
        headers={['MEDICINE NAME', 'QUANTITY', 'TOTAL PRICE', 'DATE', 'ACTION']}
        data={[]}
        onEdit={() => {}} // Akan dihandle di backend
        onDelete={() => {}} // Akan dihandle di backend
      />
    </div>
  );
};

export default Sales;