// resources/js/pages/add-product.tsx
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/Textarea';

const AddProduct = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Add Product</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dashboard / Add Product</p>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product *</label>
            <Input className="w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price *</label>
              <Input className="w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Margin (%)*</label>
              <Input className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descriptions *</label>
            <Textarea className="w-full" rows={4} />
          </div>
        </div>
        <Button className="mt-6 w-full">Submit</Button>
      </div>
    </div>
  );
};

export default AddProduct;