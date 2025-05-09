// resources/js/pages/out-stock.tsx
import { Table } from '../components/table';

const OutStock = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Out-Stock</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Products / Out-Stock</p>
      <Table
        headers={['BRAND NAME', 'CATEGORY', 'PRICE', 'QUANTITY', 'DISCOUNT', 'EXPIRE', 'ACTION']}
        data={[]}
        onEdit={() => {}} // Akan dihandle di backend
        onDelete={() => {}} // Akan dihandle di backend
      />
    </div>
  );
};

export default OutStock;