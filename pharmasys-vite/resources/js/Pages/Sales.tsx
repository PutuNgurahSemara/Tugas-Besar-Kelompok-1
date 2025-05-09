// resources/js/pages/sales.tsx
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLayout from '../Layouts/AppLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function Sales() {
  return (
    <AppLayout>
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle>Sales</CardTitle>
              <CardDescription>Manage your sales transactions</CardDescription>
            </div>
            <Link href={route('sales.create')}>
              <Button><Plus className="mr-2 h-4 w-4" /> New Sale</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No sales records found. Create a new sale to get started.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}