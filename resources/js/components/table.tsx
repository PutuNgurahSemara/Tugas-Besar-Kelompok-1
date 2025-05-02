import { Table as ShadcnTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface TableProps {
  headers: string[];
  data: any[];
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  renderCustomRow?: (row: any, index: number) => React.ReactNode;
  renderCustomCell?: (row: any, header: string, index: number) => React.ReactNode;
  showActions?: boolean;
  emptyMessage?: string;
}

export function Table({
  headers,
  data,
  onEdit,
  onDelete,
  renderCustomRow,
  renderCustomCell,
  showActions = true,
  emptyMessage = 'Tidak ada data yang tersedia.'
}: TableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <div className="overflow-x-auto">
        <ShadcnTable>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead key={index} className={index === headers.length - 1 && showActions ? 'text-right' : ''}>
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((row, rowIndex) => {
                if (renderCustomRow) {
                  return renderCustomRow(row, rowIndex);
                }
                
                return (
                  <TableRow key={rowIndex}>
                    {headers.map((header, cellIndex) => {
                      // Last column is for actions
                      if (cellIndex === headers.length - 1 && showActions) {
                        return (
                          <TableCell key={cellIndex} className="text-right">
                            <div className="flex justify-end gap-2">
                              {onEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onEdit(row)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => onDelete(row)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        );
                      }
                      
                      // If renderCustomCell is provided and returns a value, use it
                      if (renderCustomCell) {
                        const customCell = renderCustomCell(row, header, cellIndex);
                        if (customCell) {
                          return (
                            <TableCell key={cellIndex}>{customCell}</TableCell>
                          );
                        }
                      }
                      
                      // Default cell render
                      const key = header.toLowerCase().replace(/\s+/g, '_');
                      return (
                        <TableCell key={cellIndex}>
                          {row[key] !== undefined ? row[key] : row[Object.keys(row)[cellIndex]]}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </ShadcnTable>
      </div>
    </div>
  );
} 