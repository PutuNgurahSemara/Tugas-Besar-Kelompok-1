<?php

namespace App\Exports;

use App\Models\Purchase;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray; // Changed FromCollection to FromArray
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles; // For basic styling
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet; // For styling
use Illuminate\Support\Facades\DB; // Keep for now, might not be needed if fully Eloquent

class PurchaseReportExport implements FromArray, WithTitle, WithStyles // Removed WithHeadings
{
    protected $startDate;
    protected $endDate;
    protected $supplierId;
    // companyName removed as title will be static or based on actual supplier if one is selected.

    public function __construct($startDate, $endDate, $supplierId = null)
    {
        $this->startDate = Carbon::parse($startDate);
        $this->endDate = Carbon::parse($endDate);
        $this->supplierId = $supplierId;
    }

    public function array(): array
    {
        $exportData = [];

        $query = Purchase::with(['supplier', 'details'])
            ->whereBetween('tanggal_faktur', [$this->startDate->toDateString(), $this->endDate->toDateString()]);

        if ($this->supplierId && $this->supplierId !== 'all' && $this->supplierId !== '') {
            $query->where('supplier_id', $this->supplierId);
        }
        
        // Order by supplier then by invoice date for grouping
        $purchases = $query->orderBy(function($q) {
            $q->from('suppliers')->whereColumn('suppliers.id', 'purchases.supplier_id')->select('suppliers.company');
        })->orderBy('tanggal_faktur')->orderBy('id')->get();

        if ($purchases->isEmpty()) {
            $exportData[] = ['Tidak ada data pembelian untuk periode dan supplier yang dipilih.'];
            return $exportData;
        }
        
        $currentSupplierName = null;
        $invoiceCounter = 0; // For "No. Urut"

        foreach ($purchases as $purchase) {
            $invoiceCounter++;
            // Supplier Header (only if changed or first one)
            // For simplicity in this pass, we'll repeat supplier info if it's a single supplier export.
            // If multiple suppliers, this logic would show it once per supplier.
            // The image shows it repeated per invoice if it's the same supplier.
            if ($this->supplierId && $this->supplierId !== 'all' && $this->supplierId !== '') { // Only show if specific supplier selected
                 if ($currentSupplierName !== ($purchase->supplier->company ?? 'N/A')) {
                    if ($currentSupplierName !== null) { $exportData[] = []; } // Spacer if new supplier
                    $currentSupplierName = $purchase->supplier->company ?? 'N/A';
                    $exportData[] = [$currentSupplierName];
                    $exportData[] = [$purchase->supplier->address ?? 'Alamat Supplier Tidak Tersedia'];
                    // Assuming city is part of address or not separately available.
                    $exportData[] = ['Telp.' . ($purchase->supplier->phone ?? 'No. Telp Tidak Tersedia')];
                    $exportData[] = []; // Blank line
                 }
            } else { // For "All Suppliers", show supplier name per invoice block
                if ($currentSupplierName !== ($purchase->supplier->company ?? 'N/A')) {
                     if ($currentSupplierName !== null) { $exportData[] = []; $exportData[] = [];} // Extra spacer
                    $currentSupplierName = $purchase->supplier->company ?? 'N/A';
                    $exportData[] = ["Supplier: " . $currentSupplierName]; // Indicate supplier
                    // Optionally add address/phone here too if desired for "all suppliers" mode
                    $exportData[] = []; 
                }
            }


            // Invoice Info from image
            $exportData[] = ['No. Faktur:', $purchase->no_faktur, null, null, null, 'No. Urut', $invoiceCounter];
            $exportData[] = [null, null, null, null, null, 'Tanggal Faktur', $purchase->tanggal_faktur ? Carbon::parse($purchase->tanggal_faktur)->format('d F Y') : '-'];
            $exportData[] = [null, null, null, null, null, 'Tanggal Jatuh Tempo', $purchase->jatuh_tempo ? Carbon::parse($purchase->jatuh_tempo)->format('d F Y') : '-'];
            $exportData[] = []; // Blank line

            // Item Table Headers
            $exportData[] = ['NO', 'URAIAN', 'QTY', 'ED', 'SATUAN', 'HARGA', 'DISCOUNT', 'JUMLAH'];
            
            $itemNumber = 0;
            $invoiceItemTotalSum = 0;

            foreach ($purchase->details as $detail) {
                $itemNumber++;
                // Ensure $detail->jumlah is treated as a number, defaulting to 0 if null/non-numeric
                $qty = (isset($detail->jumlah) && is_numeric($detail->jumlah)) ? intval($detail->jumlah) : 0;
                
                $harga = (isset($detail->harga_satuan) && is_numeric($detail->harga_satuan)) ? floatval($detail->harga_satuan) : 0;
                // detail->total should be item_total_after_item_discount. If not reliable, calculate.
                $itemJumlah = (isset($detail->total) && is_numeric($detail->total)) ? floatval($detail->total) : ($qty * $harga);
                $invoiceItemTotalSum += $itemJumlah;

                $exportData[] = [
                    $itemNumber, // NO
                    $detail->nama_produk ?? '-', // URAIAN
                    $qty, // QTY
                    $detail->expired ? Carbon::parse($detail->expired)->format('d/m/Y') : '-', // ED
                    $detail->kemasan ?? '-', // SATUAN
                    $harga, // HARGA
                    0.00, // DISCOUNT (item level)
                    $itemJumlah, // JUMLAH (item total)
                ];
            }

            // Invoice Subtotal Section
            $exportData[] = [null, null, null, null, null, null, 'Total', $invoiceItemTotalSum];
            $invoiceDiscount = 0.00; // Placeholder for overall invoice discount
            $exportData[] = [null, null, null, null, null, null, 'Discount', $invoiceDiscount];
            $ppn = (isset($purchase->ppn_amount) && is_numeric($purchase->ppn_amount)) ? floatval($purchase->ppn_amount) : 0;
            $exportData[] = [null, null, null, null, null, null, 'PPN', $ppn];
            // Grand Total: sum of item totals - invoice discount + PPN. Or use purchase->total if reliable.
            $grandTotal = $invoiceItemTotalSum - $invoiceDiscount + $ppn;
            // As a check, $purchase->total should ideally be equal to this $grandTotal.
            // Using $purchase->total directly if it's deemed more accurate (e.g. includes other charges/discounts not itemized)
            // $grandTotal = (isset($purchase->total) && is_numeric($purchase->total)) ? floatval($purchase->total) : $grandTotal;
            $exportData[] = [null, null, null, null, null, null, 'Grand Total', $grandTotal];
            
            $exportData[] = []; // Blank line separator
            $exportData[] = []; // Another blank line for more space
        }
        return $exportData;
    }
    
    public function styles(Worksheet $sheet)
    {
        // More specific styling would be needed here to match the image (merging, borders, etc.)
        // This is a placeholder for more advanced styling.
        $headerStyle = ['font' => ['bold' => true]];
        $rightAlign = ['alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT]];

        // Example: Bold specific headers like "NO", "URAIAN", etc.
        // And right-align numeric columns like QTY, HARGA, JUMLAH
        // This requires knowing the exact row numbers, which is complex with dynamic data.
        // A simpler approach is to style all cells in certain columns if possible, or use events.

        // Auto-size columns
        for ($i = 'A'; $i <= 'H'; $i++) {
            $sheet->getColumnDimension($i)->setAutoSize(true);
        }
        
        // Example: Style rows containing "PT." or "CV." as merged and bold (Supplier Name)
        // Style rows that are item headers ("NO", "URAIAN", ...)
        $currentRow = 1;
        foreach ($sheet->getRowIterator() as $row) {
            $cellValueA = $sheet->getCell('A'.$currentRow)->getValue();
            $cellValueG = $sheet->getCell('G'.$currentRow)->getValue();

            if (is_string($cellValueA) && (str_starts_with($cellValueA, 'PT.') || str_starts_with($cellValueA, 'CV.'))) {
                $sheet->mergeCells('A'.$currentRow.':H'.$currentRow);
                $sheet->getStyle('A'.$currentRow)->applyFromArray($headerStyle);
            } elseif (is_string($cellValueA) && strtoupper($cellValueA) === 'NO' && is_string($sheet->getCell('B'.$currentRow)->getValue()) && strtoupper($sheet->getCell('B'.$currentRow)->getValue()) === 'URAIAN') {
                 $sheet->getStyle('A'.$currentRow.':H'.$currentRow)->applyFromArray($headerStyle);
            } elseif (is_string($cellValueG) && in_array(strtoupper($cellValueG), ['TOTAL', 'DISCOUNT', 'PPN', 'GRAND TOTAL'])) {
                $sheet->getStyle('G'.$currentRow.':H'.$currentRow)->applyFromArray($headerStyle);
                $sheet->getStyle('H'.$currentRow)->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1);
            }
             // Apply number format for QTY, HARGA, JUMLAH columns if they contain numbers
            if (is_numeric($sheet->getCell('C'.$currentRow)->getValue())) $sheet->getStyle('C'.$currentRow)->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER); // QTY
            if (is_numeric($sheet->getCell('F'.$currentRow)->getValue())) $sheet->getStyle('F'.$currentRow)->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1); // HARGA
            if (is_numeric($sheet->getCell('H'.$currentRow)->getValue())) $sheet->getStyle('H'.$currentRow)->getNumberFormat()->setFormatCode(\PhpOffice\PhpSpreadsheet\Style\NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1); // JUMLAH

            $currentRow++;
        }
        return [];
    }

    public function title(): string
    {
        return 'Laporan Pembelian';
    }
}
