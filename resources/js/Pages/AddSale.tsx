// resources/js/pages/add-sale.tsx
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const AddSale = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Edit Sale</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Dashboard / Edit Sale</p>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product *</label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Product" />
              </SelectTrigger>
              <SelectContent>
                {/* Data produk akan diambil dari backend */}
                <SelectItem value="placeholder">Loading...</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <Input className="w-full" />
          </div>
        </div>
        <Button className="mt-6 w-full">Save Changes</Button>
      </div>
    </div>
  );
};

export default AddSale;