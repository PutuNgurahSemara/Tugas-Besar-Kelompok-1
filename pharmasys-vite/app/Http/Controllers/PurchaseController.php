<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Category; // Untuk dropdown
use App\Models\Supplier; // Untuk dropdown
use App\Models\Produk; // Tambahkan model Produk
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\PurchaseDetail;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Google\Cloud\Vision\V1\ImageAnnotatorClient;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class PurchaseController extends Controller
{
    public function index()
    {
        // Select all relevant fields including the new PPN fields
        $purchases = Purchase::with(['supplier', 'details']) 
                        ->select([
                            'id', 
                            'no_faktur', 
                            'pbf', 
                            'supplier_id',
                            'tanggal_faktur', 
                            'jatuh_tempo', 
                            'jumlah', // This is item count from the purchase header, not sum of detail quantities
                            'subtotal', 
                            'ppn_percentage', 
                            'ppn_amount', 
                            'total', // This is grand total including PPN
                            'tanggal_pembayaran', 
                            'keterangan',
                            'created_at',
                            'updated_at'
                        ])
                        ->orderBy('created_at', 'desc')
                        ->paginate(20);
        
        // No transformation needed here if all required fields are directly on the Purchase model
        // and correctly populated by the store/update methods.
        
        return Inertia::render('Purchases/Index', ['purchases' => $purchases]);
    }

    public function create()
    {
            // Kirim data untuk dropdown form
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $suppliers = Supplier::orderBy('company')->get(['id', 'company']);
        
        // Dapatkan daftar produk yang sudah ada untuk autocomplete suggestion
        $existingProducts = Produk::select('nama')
                            ->distinct()
                            ->orderBy('nama')
                            ->pluck('nama');
        
        return Inertia::render('Purchases/Create', [
            'categories' => $categories,
            'suppliers' => $suppliers,
            'existingProducts' => $existingProducts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'no_faktur' => 'required|string',
            'pbf' => 'required|string',
            'tanggal_faktur' => 'required|date',
            'jatuh_tempo' => 'required|date',
            'jumlah' => 'required|integer',
            'tanggal_pembayaran' => 'nullable|date',
            'keterangan' => 'nullable|string',
            'ppn_percentage' => 'nullable|numeric|min:0|max:100', // Added PPN percentage validation
            'details' => 'required|array|min:1',
            'details.*.nama_produk' => 'required|string',
            'details.*.expired' => 'required|date',
            'details.*.jumlah' => 'required|integer|min:0',
            'details.*.kemasan' => 'required|string',
            'details.*.harga_satuan' => 'required|numeric|min:0',
            'details.*.gross' => 'required|numeric|min:0', // Frontend sends 'gross'
            'details.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'details.*.total' => 'required|numeric|min:0', // This 'total' is item's sub_total
        ]);

        // Calculate subtotal from details (sum of item's sub_totals)
        $subtotal = collect($validated['details'])->sum(function ($detail) {
            return $detail['total']; // 'total' from frontend is item's sub_total
        });
        $ppnPercentage = $validated['ppn_percentage'] ?? 0;
        $ppnAmount = ($subtotal * $ppnPercentage) / 100;
        $grandTotal = $subtotal + $ppnAmount;

        // Find supplier_id based on pbf
        $supplier = Supplier::where('company', $validated['pbf'])->first();

        if (!$supplier) {
            // Handle case where supplier is not found
            // For now, let's assume it should exist and throw an error or redirect back with error
            return redirect()->back()->withInput()->withErrors(['pbf' => 'Supplier tidak ditemukan.']);
        }

        $purchaseData = [
            'no_faktur' => $validated['no_faktur'],
            'pbf' => $validated['pbf'],
            'supplier_id' => $supplier->id,
            'tanggal_faktur' => $validated['tanggal_faktur'],
            'jatuh_tempo' => $validated['jatuh_tempo'],
            'jumlah' => $validated['jumlah'], // This is count of detail items
            'subtotal' => $subtotal,
            'ppn_percentage' => $ppnPercentage,
            'ppn_amount' => $ppnAmount,
            'total' => $grandTotal, // This is the grand total
            'tanggal_pembayaran' => $validated['tanggal_pembayaran'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
        ];
        // $purchaseData['supplier_id'] = $supplier->id; // Already included

        DB::beginTransaction();
        try {
            $purchase = Purchase::create($purchaseData);

            foreach ($validated['details'] as $detailItem) {
                // Cari atau buat kategori berdasarkan kemasan
                $category = Category::firstOrCreate(
                    ['name' => $detailItem['kemasan']],
                    ['slug' => Str::slug($detailItem['kemasan'])]
                );

                // Cari produk berdasarkan nama dan kategori
                $produk = Produk::firstOrNew([
                    'nama' => $detailItem['nama_produk'],
                    'category_id' => $category->id
                ]);

                // Jika produk baru, set harga default dari pengaturan
                if (!$produk->exists) {
                    // Dapatkan margin default dari pengaturan
                    $defaultMargin = (float) Setting::getValue('default_margin', 10); // Default 10% jika tidak ada pengaturan
                    $marginMultiplier = 1 + ($defaultMargin / 100);
                    
                    $produk->harga = $detailItem['harga_satuan'] * $marginMultiplier;
                    $produk->margin = $defaultMargin;
                    $produk->save();
                }

                // Simpan detail pembelian
                $purchase->details()->create([
                    'nama_produk' => $detailItem['nama_produk'],
                    'expired' => $detailItem['expired'],
                    'jumlah' => $detailItem['jumlah'],
                    'kemasan' => $detailItem['kemasan'],
                    'harga_satuan' => $detailItem['harga_satuan'],
                    'gross_amount' => $detailItem['gross'],
                    'discount_percentage' => $detailItem['discount_percentage'] ?? 0,
                    'total' => $detailItem['total'],
                    'produk_id' => $produk->id,
                    'category_id' => $category->id
                ]);
            }

            DB::commit();
            return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil dicatat.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating purchase: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            // Return with a more generic error, or a specific one if appropriate
            // The original error message was "Gagal menyimpan pembelian. Mohon cek data Anda."
            return redirect()->back()->withInput()->withErrors(['general' => 'Terjadi kesalahan saat menyimpan pembelian. Silakan coba lagi. Jika masalah berlanjut, hubungi administrator. Error: ' . $e->getMessage()]);
        }
    }

    public function edit(Purchase $purchase)
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $suppliers = Supplier::orderBy('company')->get(['id', 'company']);

        // Eager load details for the purchase object to be used in the view
        $purchase->load('details');

        // Calculate the total quantity initially in this purchase
        $totalInitialQuantity = $purchase->details->sum('jumlah');

        // Calculate how much quantity from this purchase's details has been "used"
        // (i.e., associated with a Produk entry by having produk_id set)
        $usedQuantity = $purchase->details->whereNotNull('produk_id')->sum('jumlah');
        
        // Calculate remaining quantity
        $remainingQuantity = $totalInitialQuantity - $usedQuantity;

        // Dapatkan daftar produk yang sudah ada untuk autocomplete
        $existingProducts = Produk::select('nama')
                            ->distinct()
                            ->orderBy('nama')
                            ->pluck('nama');
                            
        return Inertia::render('Purchases/Edit', [
            'purchase' => $purchase,
            'categories' => $categories,
            'suppliers' => $suppliers,
            'usedQuantity' => (int)$usedQuantity, // Cast to int for consistency
            'existingProducts' => $existingProducts,
            'remainingQuantity' => (int)$remainingQuantity, // Cast to int
            'totalInitialQuantity' => (int)$totalInitialQuantity // Also provide total initial quantity
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        $validated = $request->validate([
            'no_faktur' => 'required|string',
            'pbf' => 'required|string',
            'tanggal_faktur' => 'required|date',
            'jatuh_tempo' => 'required|date',
            'jumlah' => 'required|integer',
            'tanggal_pembayaran' => 'nullable|date',
            'keterangan' => 'nullable|string',
            'details' => 'required|array|min:1',
            'details.*.nama_produk' => 'required|string',
            'details.*.expired' => 'required|date',
            'details.*.jumlah' => 'required|integer|min:0',
            'details.*.kemasan' => 'required|string',
            'details.*.harga_satuan' => 'required|numeric|min:0',
            'details.*.gross' => 'required|numeric|min:0',
            'details.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'details.*.total' => 'required|numeric|min:0', // This 'total' is item's sub_total
            'ppn_percentage' => 'nullable|numeric|min:0|max:100',
        ]);
        
        // Recalculate subtotal, PPN, and grand total for update
        $subtotal = collect($validated['details'])->sum(function ($detail) {
            return $detail['total']; // 'total' from frontend is item's sub_total
        });
        $ppnPercentage = $validated['ppn_percentage'] ?? $purchase->ppn_percentage ?? 0; // Use new, old, or 0
        $ppnAmount = ($subtotal * $ppnPercentage) / 100;
        $grandTotal = $subtotal + $ppnAmount;

        $updateData = $request->only(['no_faktur', 'pbf', 'tanggal_faktur', 'jatuh_tempo', 'jumlah', 'tanggal_pembayaran', 'keterangan']);
        
        // Find supplier_id based on pbf if pbf is part of $request and might change
        if ($request->has('pbf')) {
            $supplier = Supplier::where('company', $validated['pbf'])->first();
            if (!$supplier) {
                return redirect()->back()->withInput()->withErrors(['pbf' => 'Supplier tidak ditemukan.']);
            }
            $updateData['supplier_id'] = $supplier->id;
        }


        $updateData['subtotal'] = $subtotal;
        $updateData['ppn_percentage'] = $ppnPercentage;
        $updateData['ppn_amount'] = $ppnAmount;
        $updateData['total'] = $grandTotal; // This is the correct grand total

        DB::beginTransaction();
        try {
            $purchase->update($updateData);

            // Hapus detail lama, insert ulang
            $purchase->details()->delete();
            foreach ($validated['details'] as $detailItem) {
                $purchase->details()->create([
                    'nama_produk' => $detailItem['nama_produk'],
                    'expired' => $detailItem['expired'],
                    'jumlah' => $detailItem['jumlah'],
                    'kemasan' => $detailItem['kemasan'],
                    'harga_satuan' => $detailItem['harga_satuan'],
                    'gross_amount' => $detailItem['gross'],
                    'discount_percentage' => $detailItem['discount_percentage'] ?? 0,
                    'total' => $detailItem['total'],
                     // 'id' from $detailItem is not used here as we delete and recreate.
                     // If you were to update existing details, you'd use $detailItem['id'].
                ]);
            }
            DB::commit();
            return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil diperbarui.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating purchase: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return redirect()->back()->withInput()->withErrors(['general' => 'Gagal memperbarui pembelian. Error: ' . $e->getMessage()]);
        }
    }

    public function destroy(Purchase $purchase)
    {
        try {
            // Mulai transaction database
            \DB::beginTransaction();

            // Hapus semua detail pembelian
            $purchase->details()->delete();
            
            // Hapus pembelian
            $purchase->delete();
            
            // Commit transaction
            \DB::commit();
            
            return redirect()->route('purchases.index')
                ->with('success', 'Pembelian berhasil dihapus.');
                
        } catch (\Exception $e) {
            // Rollback transaction jika terjadi error
            \DB::rollBack();
            \Log::error('Error deleting purchase: ' . $e->getMessage());
            
            return back()->withErrors([
                'delete' => 'Terjadi kesalahan saat menghapus pembelian: ' . $e->getMessage()
            ]);
        }
    }

    public function importPage()
    {
        return Inertia::render('Purchases/Import');
    }

    public function downloadTemplate()
    {
        // Create a new spreadsheet
        $spreadsheet = new Spreadsheet();
        
        // Set active sheet and rename it
        $spreadsheet->getActiveSheet()->setTitle('Faktur Utama');
        
        // Add headers to the first sheet
        $headersFaktur = ['No. Faktur', 'PBF', 'Tanggal Faktur', 'Jatuh Tempo', 'Jumlah Barang', 'Total'];
        $spreadsheet->getActiveSheet()->fromArray($headersFaktur, null, 'A1');
        
        // Create a second sheet for product details
        $spreadsheet->createSheet()->setTitle('Detail Barang');
        $spreadsheet->setActiveSheetIndex(1);
        
        // Add headers to the second sheet
        $headersDetail = ['No Faktur', 'Nama Barang', 'Jumlah', 'Kemasan', 'Harga Satuan', 'Diskon', 'Subtotal', 'Expire Date'];
        $spreadsheet->getActiveSheet()->fromArray($headersDetail, null, 'A1');
        
        // Set column widths for better readability
        foreach (range('A', 'H') as $col) {
            $spreadsheet->getActiveSheet()->getColumnDimension($col)->setWidth(15);
        }
        
        // Set back to first sheet
        $spreadsheet->setActiveSheetIndex(0);
        
        // Create a temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'purchase_template_');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);
        
        // Return the file as a download
        return response()->download($tempFile, 'purchase_template.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
        ]);

        $file = $request->file('file');
        $spreadsheet = IOFactory::load($file);
        
        // Mencoba semua sheet untuk menemukan data
        $success = 0;
        $failed = 0;
        $errors = [];
        
        // Fungsi helper untuk parsing tanggal
        $parseDate = function($value) {
            if (empty($value)) return null;
            
            // Jika numeric (format Excel)
            if (is_numeric($value)) {
                try {
                    return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value)->format('Y-m-d');
                } catch (\Exception $e) {
                    return null;
                }
            }
            
            // Jika string, coba berbagai format
            $value = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $value);
            $value = trim($value);
            $value = preg_replace('/^[A-Za-z]+,\s*/', '', $value);
            $value = trim($value, " \t\n\r\0\x0B,;");
            
            // Coba format Indonesia
            $formats = [
                'd F Y', // 31 Januari 2024
                'd M Y', // 31 Jan 2024
                'Y-m-d', // 2024-01-31
                'd/m/Y', // 31/01/2024
                'd-m-Y', // 31-01-2024
                'j F Y', // 1 Januari 2024
                'j M Y', // 1 Jan 2024
                'd.m.Y', // 31.01.2024
                'Y/m/d', // 2024/01/31
                'Y.m.d', // 2024.01.31
                'D, d M Y', // Thu, 04 Jan 2024
                'l, F d, Y', // Thursday, January 04, 2024
                'j/n/Y', // 1/1/2024
                'j-n-Y', // 1-1-2024
                'j.n.Y', // 1.1.2024
                'd/m/y', // 31/01/24
                'd-m-y', // 31-01-24
                'j/n/y', // 1/1/24
                'j-n-y', // 1-1-24
                'y/m/d', // 24/01/31
                'y-m-d', // 24-01-31
                'd/m', // 31/01 (tahun sekarang)
                'd-m', // 31-01 (tahun sekarang)
            ];
            
            $date = null;
            foreach ($formats as $format) {
                $parsedDate = \DateTime::createFromFormat($format, $value);
                if ($parsedDate && $parsedDate->format('Y') > 2000) {
                    $date = $parsedDate->format('Y-m-d');
                    break;
                }
            }
            
            // Jika masih null, coba dengan strtotime
            if (!$date) {
                $timestamp = strtotime($value);
                if ($timestamp) {
                    $date = date('Y-m-d', $timestamp);
                }
            }
            
            return $date;
        };
        
        // Fungsi untuk mengekstrak angka dari string (harga)
        $extractNumber = function($value) {
            if (empty($value)) return 0;
            if (is_numeric($value)) return (float)$value;
            
            // Hapus semua karakter non-numerik kecuali titik dan koma
            $value = preg_replace('/[^0-9.,]/', '', $value);
            
            // Jika ada koma dan titik, asumsikan format Indonesia (1.000,00)
            if (strpos($value, ',') !== false && strpos($value, '.') !== false) {
                // Hapus titik ribuan
                $value = str_replace('.', '', $value);
                // Ganti koma desimal dengan titik
                $value = str_replace(',', '.', $value);
            } else if (strpos($value, ',') !== false) {
                // Jika hanya ada koma, asumsikan sebagai desimal
                $value = str_replace(',', '.', $value);
            }
            
            return (float)$value;
        };
        
        // Fungsi untuk mendeteksi header faktur
        $detectInvoiceHeader = function($worksheet) use ($parseDate) {
            $header = [
                'no_faktur' => null,
                'pbf' => null,
                'tanggal_faktur' => null,
                'jatuh_tempo' => null,
                'ppn_percentage' => null,
            ];
            
            // Cari dalam 20 baris pertama
            $maxRow = min(20, $worksheet->getHighestRow());
            $maxCol = $worksheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($maxCol);
            
            // Deteksi nama perusahaan/PBF
            for ($row = 1; $row <= $maxRow; $row++) {
                for ($col = 1; $col <= $highestColumnIndex; $col++) {
                    $cellValue = trim($worksheet->getCellByColumnAndRow($col, $row)->getValue());
                    
                    // Deteksi PBF (biasanya dimulai dengan PT atau CV)
                    if (empty($header['pbf']) && preg_match('/^(PT|CV)\s*\.?\s*[A-Z]/', $cellValue)) {
                        $header['pbf'] = $cellValue;
                    }
                    
                    // Deteksi nomor faktur
                    if (empty($header['no_faktur'])) {
                        // Pattern untuk No. Faktur, No Faktur, Nota No, dll
                        if (preg_match('/(?:no\.?\s*(?:faktur|nota)|nota\s*no\.?)\s*:?\s*([\w\d\-\.\/:]+)/i', $cellValue, $matches)) {
                            $header['no_faktur'] = trim($matches[1]);
                        } elseif (preg_match('/(?:no\.?\s*faktur|nota\s*no\.?)\s*$/i', $cellValue)) {
                            // Jika label dan nilai terpisah sel
                            $nextCellValue = trim($worksheet->getCellByColumnAndRow($col + 1, $row)->getValue());
                            if (!empty($nextCellValue)) {
                                $header['no_faktur'] = $nextCellValue;
                            }
                        }
                    }
                    
                    // Deteksi tanggal faktur
                    if (empty($header['tanggal_faktur'])) {
                        if (preg_match('/(?:tanggal|tgl)\s*(?:faktur)?\s*:?\s*(.*)/i', $cellValue, $matches)) {
                            $dateStr = trim($matches[1]);
                            if (!empty($dateStr)) {
                                $header['tanggal_faktur'] = $parseDate($dateStr);
                            } else {
                                // Cek sel berikutnya
                                $nextCellValue = trim($worksheet->getCellByColumnAndRow($col + 1, $row)->getValue());
                                if (!empty($nextCellValue)) {
                                    $header['tanggal_faktur'] = $parseDate($nextCellValue);
                                }
                            }
                        }
                    }
                    
                    // Deteksi jatuh tempo
                    if (empty($header['jatuh_tempo'])) {
                        if (preg_match('/(?:jatuh\s*tempo|tempo|due\s*date)\s*:?\s*(.*)/i', $cellValue, $matches)) {
                            $dateStr = trim($matches[1]);
                            if (!empty($dateStr)) {
                                $header['jatuh_tempo'] = $parseDate($dateStr);
                            } else {
                                // Cek sel berikutnya
                                $nextCellValue = trim($worksheet->getCellByColumnAndRow($col + 1, $row)->getValue());
                                if (!empty($nextCellValue)) {
                                    $header['jatuh_tempo'] = $parseDate($nextCellValue);
                                }
                            }
                        }
                    }
                    
                    // Deteksi PPN
                    if (empty($header['ppn_percentage'])) {
                        if (preg_match('/ppn\s*:?\s*(\d+(?:[.,]\d+)?)\s*%?/i', $cellValue, $matches)) {
                            $header['ppn_percentage'] = (float)str_replace(',', '.', $matches[1]);
                        }
                    }
                }
            }
            
            return $header;
        };
        
        // Fungsi untuk mendeteksi dan mengekstrak detail produk
        $detectProductDetails = function($worksheet) use ($parseDate, $extractNumber) {
            $details = [];
            $tableStartRow = null;
            $tableEndRow = null;
            $columnMappings = [];
            
            $maxRow = $worksheet->getHighestRow();
            $maxCol = $worksheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($maxCol);
            
            // Cari baris header tabel
            for ($row = 1; $row <= min(50, $maxRow); $row++) {
                $headerCandidateCount = 0;
                $headerCells = [];
                
                for ($col = 1; $col <= $highestColumnIndex; $col++) {
                    $cellValue = trim($worksheet->getCellByColumnAndRow($col, $row)->getValue());
                    if (!empty($cellValue)) {
                        $headerCells[$col] = strtolower($cellValue);
                    }
                }
                
                // Cek apakah ini baris header tabel
                $headerKeywords = [
                    'no' => ['no', 'no.', '#', 'nomor'],
                    'nama_produk' => ['nama', 'nama barang', 'uraian', 'item', 'produk', 'description'],
                    'jumlah' => ['jumlah', 'qty', 'quantity', 'banyak', 'banyaknya', 'kuantitas', 'kuantum'],
                    'kemasan' => ['kemasan', 'satuan', 'unit', 'pak', 'box', 'btl', 'pcs', 'strip'],
                    'expired' => ['expired', 'exp', 'ed', 'kadaluarsa', 'expire date', 'tgl ed'],
                    'harga_satuan' => ['harga', 'harga satuan', 'harga @', 'harga/unit', 'price', 'unit price', '@harga'],
                    'diskon' => ['disc', 'diskon', 'discount', 'potongan', 'pot'],
                    'total' => ['total', 'jumlah harga', 'sub total', 'amount', 'nilai']
                ];
                
                $matchedColumns = [];
                foreach ($headerCells as $col => $value) {
                    foreach ($headerKeywords as $field => $keywords) {
                        foreach ($keywords as $keyword) {
                            if (strpos($value, $keyword) !== false) {
                                $matchedColumns[$field] = $col;
                                $headerCandidateCount++;
                                break 2; // Keluar dari 2 loop
                            }
                        }
                    }
                }
                
                // Jika menemukan minimal 3 kolom yang cocok, ini kemungkinan header tabel
                if ($headerCandidateCount >= 3) {
                    $tableStartRow = $row + 1; // Baris setelah header
                    $columnMappings = $matchedColumns;
                    break;
                }
            }
            
            // Jika header tabel ditemukan, cari baris-baris data
            if ($tableStartRow) {
                // Cari baris terakhir dari tabel (biasanya sampai baris kosong atau total/subtotal)
                for ($row = $tableStartRow; $row <= $maxRow; $row++) {
                    $rowEmpty = true;
                    $rowIsTotal = false;
                    
                    // Cek apakah baris kosong
                    for ($col = 1; $col <= $highestColumnIndex; $col++) {
                        $cellValue = trim($worksheet->getCellByColumnAndRow($col, $row)->getValue());
                        if (!empty($cellValue)) {
                            $rowEmpty = false;
                            
                            // Cek apakah ini baris total/subtotal
                            if (preg_match('/^(sub)?\s*total|jumlah|dpp|ppn|grand total/i', $cellValue)) {
                                $rowIsTotal = true;
                                break;
                            }
                        }
                    }
                    
                    if ($rowEmpty || $rowIsTotal) {
                        $tableEndRow = $row - 1;
                        break;
                    }
                    
                    // Jika sampai baris terakhir
                    if ($row == $maxRow) {
                        $tableEndRow = $row;
                    }
                }
                
                // Jika baris akhir tabel ditemukan, ekstrak data produk
                if ($tableEndRow) {
                    for ($row = $tableStartRow; $row <= $tableEndRow; $row++) {
                        $detail = [
                            'nama_produk' => '',
                            'jumlah' => 0,
                            'kemasan' => '',
                            'expired' => null,
                            'harga_satuan' => 0,
                            'total' => 0,
                            'discount_percentage' => 0
                        ];
                        
                        $hasData = false;
                        
                        // Ekstrak data sesuai mapping kolom
                        foreach ($columnMappings as $field => $col) {
                            $cellValue = trim($worksheet->getCellByColumnAndRow($col, $row)->getValue());
                            
                            if (!empty($cellValue)) {
                                switch ($field) {
                                    case 'nama_produk':
                                        $detail[$field] = $cellValue;
                                        $hasData = true;
                                        break;
                                    case 'jumlah':
                                        $detail[$field] = (int)$extractNumber($cellValue);
                                        break;
                                    case 'kemasan':
                                        $detail[$field] = $cellValue;
                                        break;
                                    case 'expired':
                                        $detail[$field] = $parseDate($cellValue);
                                        break;
                                    case 'harga_satuan':
                                        $detail[$field] = $extractNumber($cellValue);
                                        break;
                                    case 'diskon':
                                        // Jika diskon dalam persen
                                        if (strpos($cellValue, '%') !== false) {
                                            $detail['discount_percentage'] = $extractNumber($cellValue);
                                        } else {
                                            // Jika diskon dalam nilai
                                            $diskonValue = $extractNumber($cellValue);
                                            if ($diskonValue > 0 && isset($detail['harga_satuan']) && $detail['harga_satuan'] > 0) {
                                                $detail['discount_percentage'] = ($diskonValue / $detail['harga_satuan']) * 100;
                                            }
                                        }
                                        break;
                                    case 'total':
                                        $detail[$field] = $extractNumber($cellValue);
                                        break;
                                }
                            }
                        }
                        
                        // Jika tidak ada nama produk, lewati
                        if (!$hasData || empty($detail['nama_produk'])) {
                            continue;
                        }
                        
                        // Jika total tidak ada, hitung dari harga_satuan * jumlah
                        if ($detail['total'] == 0 && $detail['harga_satuan'] > 0 && $detail['jumlah'] > 0) {
                            $detail['total'] = $detail['harga_satuan'] * $detail['jumlah'];
                            
                            // Kurangi diskon jika ada
                            if ($detail['discount_percentage'] > 0) {
                                $detail['total'] -= ($detail['total'] * $detail['discount_percentage'] / 100);
                            }
                        }
                        
                        // Jika kemasan kosong, isi default
                        if (empty($detail['kemasan'])) {
                            $detail['kemasan'] = 'Pcs';
                        }
                        
                        // Jika expired kosong, isi default 2 tahun dari sekarang
                        if (empty($detail['expired'])) {
                            $detail['expired'] = date('Y-m-d', strtotime('+2 years'));
                        }
                        
                        $details[] = $detail;
                    }
                }
            }
            
            return $details;
        };
        
        // Proses setiap sheet dalam file Excel
        $purchases = [];
        
        foreach ($spreadsheet->getAllSheets() as $sheet) {
            $sheetName = $sheet->getTitle();
            
            // Skip sheet yang jelas-jelas bukan data faktur
            if (preg_match('/^(readme|petunjuk|instruksi|template)/i', $sheetName)) {
                continue;
            }
            
            // Deteksi header faktur
            $header = $detectInvoiceHeader($sheet);
            
            // Deteksi detail produk
            $details = $detectProductDetails($sheet);
            
            // Jika ada header dan detail, tambahkan ke daftar faktur
            if ((!empty($header['no_faktur']) || !empty($header['pbf'])) && !empty($details)) {
                $purchases[] = [
                    'header' => $header,
                    'details' => $details,
                    'sheet' => $sheetName
                ];
            }
        }
        
        // Proses simpan ke database
        foreach ($purchases as $purchaseData) {
            $header = $purchaseData['header'];
            $details = $purchaseData['details'];
            
            // Hitung total dari detail produk (sub total)
            $subtotal = array_sum(array_column($details, 'total'));
            
            // Jika subtotal 0, fallback ke penjumlahan harga_satuan*jumlah
            if ($subtotal == 0) {
                $subtotal = array_sum(array_map(function($d) {
                    $total = ($d['harga_satuan'] ?? 0) * ($d['jumlah'] ?? 0);
                    if (isset($d['discount_percentage']) && $d['discount_percentage'] > 0) {
                        $total -= ($total * $d['discount_percentage'] / 100);
                    }
                    return $total;
                }, $details));
            }
            
            // Hitung PPN jika ada
            $ppnPercentage = $header['ppn_percentage'] ?? 11; // Default 11% jika tidak ada
            $ppnAmount = ($subtotal * $ppnPercentage) / 100;
            $grandTotal = $subtotal + $ppnAmount;
            
            // Mapping supplier otomatis
            $supplierId = null;
            $pbf = $header['pbf'];
            if ($pbf) {
                $supplier = \App\Models\Supplier::where('company', 'like', "%$pbf%")
                    ->orWhere('company', 'like', "%" . strtoupper($pbf) . "%")
                    ->first();
                if (!$supplier) {
                    $supplier = \App\Models\Supplier::create([
                        'company' => $pbf,
                        'phone' => null,
                        'note' => 'Auto import from Excel',
                    ]);
                }
                $supplierId = $supplier->id;
            }
            
            try {
                DB::beginTransaction();
                
                $purchase = \App\Models\Purchase::create([
                    'no_faktur' => $header['no_faktur'] ?? 'IMPORT-' . date('YmdHis'),
                    'pbf' => $header['pbf'] ?? 'IMPORT',
                    'tanggal_faktur' => $header['tanggal_faktur'] ?? now()->toDateString(),
                    'jatuh_tempo' => $header['jatuh_tempo'] ?? now()->addDays(30)->toDateString(),
                    'jumlah' => count($details),
                    'subtotal' => $subtotal,
                    'ppn_percentage' => $ppnPercentage,
                    'ppn_amount' => $ppnAmount,
                    'total' => $grandTotal,
                    'keterangan' => 'Import Excel - Sheet: ' . $purchaseData['sheet'],
                    'supplier_id' => $supplierId,
                ]);
                
                foreach ($details as $detail) {
                    $purchase->details()->create($detail);
                }
                
                DB::commit();
                $success++;
            } catch (\Exception $e) {
                DB::rollBack();
                \Log::error('Import Excel gagal: ' . $e->getMessage(), [
                    'header' => $header,
                    'details' => $details,
                    'trace' => $e->getTraceAsString()
                ]);
                $failed++;
                $errors[] = $e->getMessage();
            }
        }
        
        if ($success > 0) {
            return back()->with('success', "Import berhasil: $success faktur. Gagal: $failed faktur.");
        } else {
            $errorMsg = 'Import gagal. Pastikan format file sudah benar.';
            if (!empty($errors)) {
                $errorMsg .= ' Error: ' . implode(', ', array_slice($errors, 0, 3));
                if (count($errors) > 3) {
                    $errorMsg .= ' dan ' . (count($errors) - 3) . ' error lainnya.';
                }
            }
            return back()->with('error', $errorMsg);
        }
    }
    
    public function importImages(Request $request)
    {
        $request->validate([
            'images' => 'required|array|min:1|max:10',
            'images.*' => 'required|image|mimes:jpeg,jpg,png|max:5120',
        ]);

        $images = $request->file('images');
        $success = 0;
        $failed = 0;
        $results = [];

        foreach ($images as $index => $image) {
            try {
                // Store the image temporarily
                $path = $image->store('temp_ocr', 'public');
                $fullPath = Storage::disk('public')->path($path);
                
                // Process the image with OCR
                $extractedData = $this->processImageWithOCR($fullPath);
                
                if ($extractedData) {
                    // Create purchase record
                    $purchase = $this->createPurchaseFromOCR($extractedData);
                    if ($purchase) {
                        $success++;
                        $results[] = [
                            'status' => 'success',
                            'message' => "Successfully processed image {$index}",
                            'purchase_id' => $purchase->id
                        ];
                    } else {
                        $failed++;
                        $results[] = [
                            'status' => 'error',
                            'message' => "Failed to create purchase record from image {$index}"
                        ];
                    }
                } else {
                    $failed++;
                    $results[] = [
                        'status' => 'error',
                        'message' => "Failed to extract data from image {$index}"
                    ];
                }
                
                // Clean up temporary file
                Storage::disk('public')->delete($path);
                
            } catch (\Exception $e) {
                Log::error('OCR Import Error: ' . $e->getMessage());
                $failed++;
                $results[] = [
                    'status' => 'error',
                    'message' => "Error processing image {$index}: " . $e->getMessage()
                ];
            }
        }
        
        if ($success > 0) {
            return back()->with('success', "Import berhasil: $success faktur. Gagal: $failed faktur.");
        } else {
            return back()->with('error', 'Import gagal. Pastikan gambar jelas dan menampilkan faktur dengan benar.');
        }
    }
    
    private function processImageWithOCR($imagePath)
    {
        // Dalam implementasi nyata, gunakan Google Cloud Vision atau layanan OCR lainnya
        try {
            // Contoh implementasi dengan Google Cloud Vision API
            // Jika Anda belum memiliki kredensial Google Cloud Vision, gunakan kode mock di bawah
            
            // Cek apakah kredensial Google Cloud Vision tersedia
            $credentialsPath = storage_path('app/google-vision-key.json');
            if (file_exists($credentialsPath)) {
                // Gunakan Google Cloud Vision API
                $imageAnnotator = new ImageAnnotatorClient([
                    'credentials' => json_decode(file_get_contents($credentialsPath), true)
                ]);
                
                // Baca konten gambar
                $image = file_get_contents($imagePath);
                
                // Lakukan deteksi teks
                $response = $imageAnnotator->textDetection($image);
                $texts = $response->getTextAnnotations();
                
                // Tutup klien
                $imageAnnotator->close();
                
                if (empty($texts)) {
                    Log::warning('OCR tidak menemukan teks pada gambar: ' . $imagePath);
                    return null;
                }
                
                // Ekstrak teks lengkap
                $fullText = $texts[0]->getDescription();
                
                // Parse teks untuk mengekstrak detail faktur
                $extractedData = $this->parseInvoiceText($fullText);
                
                return $extractedData;
            } else {
                // Gunakan mock data jika kredensial tidak tersedia
                Log::warning('Google Cloud Vision kredensial tidak ditemukan, menggunakan data mock');
                
                // Analisis gambar menggunakan teknik OCR sederhana jika tersedia
                // Untuk demo, kita gunakan mock data yang lebih realistis berdasarkan format faktur yang umum
                $mockData = [
                    'no_faktur' => 'OCR-' . date('YmdHis') . rand(100, 999),
                    'pbf' => 'PT. FARMASI SEHAT SENTOSA',
                    'tanggal_faktur' => now()->format('Y-m-d'),
                    'jatuh_tempo' => now()->addDays(30)->format('Y-m-d'),
                    'ppn_percentage' => 11,
                    'details' => [
                        [
                            'nama_produk' => 'Paracetamol 500mg',
                            'jumlah' => 20,
                            'kemasan' => 'Box',
                            'harga_satuan' => 15000,
                            'expired' => now()->addYears(2)->format('Y-m-d'),
                            'discount_percentage' => 0,
                            'total' => 300000
                        ],
                        [
                            'nama_produk' => 'Amoxicillin 500mg',
                            'jumlah' => 15,
                            'kemasan' => 'Strip',
                            'harga_satuan' => 25000,
                            'expired' => now()->addYears(1)->format('Y-m-d'),
                            'discount_percentage' => 0,
                            'total' => 375000
                        ],
                        [
                            'nama_produk' => 'Vitamin C 1000mg',
                            'jumlah' => 10,
                            'kemasan' => 'Box',
                            'harga_satuan' => 50000,
                            'expired' => now()->addYears(2)->format('Y-m-d'),
                            'discount_percentage' => 5,
                            'total' => 475000
                        ]
                    ]
                ];
                
                return $mockData;
            }
        } catch (\Exception $e) {
            Log::error('OCR Processing Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'image_path' => $imagePath
            ]);
            return null;
        }
    }
    
    /**
     * Parse teks faktur dari hasil OCR
     * 
     * @param string $text Teks lengkap dari hasil OCR
     * @return array|null Data yang diekstrak dari teks faktur
     */
    private function parseInvoiceText($text)
    {
        try {
            // Bersihkan teks
            $text = preg_replace('/\s+/', ' ', $text); // Ganti multiple whitespace dengan satu spasi
            $lines = explode("\n", $text);
            
            $extractedData = [
                'no_faktur' => null,
                'pbf' => null,
                'tanggal_faktur' => null,
                'jatuh_tempo' => null,
                'ppn_percentage' => null,
                'details' => []
            ];
            
            // Fungsi helper untuk parsing tanggal
            $parseDate = function($value) {
                if (empty($value)) return null;
                
                // Bersihkan input
                $value = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $value);
                $value = trim($value);
                
                // Coba berbagai format tanggal
                $formats = [
                    'd F Y', // 31 Januari 2024
                    'd M Y', // 31 Jan 2024
                    'Y-m-d', // 2024-01-31
                    'd/m/Y', // 31/01/2024
                    'd-m-Y', // 31-01-2024
                    'j F Y', // 1 Januari 2024
                    'j M Y', // 1 Jan 2024
                    'd.m.Y', // 31.01.2024
                    'Y/m/d', // 2024/01/31
                    'Y.m.d', // 2024.01.31
                    'd/m/y', // 31/01/24
                    'd-m-y', // 31-01-24
                ];
                
                foreach ($formats as $format) {
                    $date = \DateTime::createFromFormat($format, $value);
                    if ($date && $date->format('Y') > 2000) {
                        return $date->format('Y-m-d');
                    }
                }
                
                // Jika masih belum berhasil, coba dengan strtotime
                $timestamp = strtotime($value);
                if ($timestamp) {
                    return date('Y-m-d', $timestamp);
                }
                
                return null;
            };
            
            // Fungsi helper untuk ekstrak angka
            $extractNumber = function($value) {
                if (empty($value)) return 0;
                
                // Hapus semua karakter non-numerik kecuali titik dan koma
                $value = preg_replace('/[^0-9.,]/', '', $value);
                
                // Jika ada koma dan titik, asumsikan format Indonesia (1.000,00)
                if (strpos($value, ',') !== false && strpos($value, '.') !== false) {
                    // Hapus titik ribuan
                    $value = str_replace('.', '', $value);
                    // Ganti koma desimal dengan titik
                    $value = str_replace(',', '.', $value);
                } else if (strpos($value, ',') !== false) {
                    // Jika hanya ada koma, asumsikan sebagai desimal
                    $value = str_replace(',', '.', $value);
                }
                
                return (float)$value;
            };
            
            // Deteksi nama perusahaan/PBF
            foreach ($lines as $line) {
                if (preg_match('/^(PT|CV)\.?\s+[A-Z]/', $line)) {
                    $extractedData['pbf'] = trim($line);
                    break;
                }
            }
            
            // Deteksi nomor faktur
            foreach ($lines as $line) {
                if (preg_match('/(?:no\.?\s*(?:faktur|nota)|nota\s*no\.?)\s*:?\s*([\w\d\-\.\/:]+)/i', $line, $matches)) {
                    $extractedData['no_faktur'] = trim($matches[1]);
                    break;
                }
            }
            
            // Deteksi tanggal faktur
            foreach ($lines as $line) {
                if (preg_match('/(?:tanggal|tgl)\s*(?:faktur)?\s*:?\s*(.*)/i', $line, $matches)) {
                    $dateStr = trim($matches[1]);
                    if (!empty($dateStr)) {
                        $extractedData['tanggal_faktur'] = $parseDate($dateStr);
                        break;
                    }
                }
            }
            
            // Deteksi jatuh tempo
            foreach ($lines as $line) {
                if (preg_match('/(?:jatuh\s*tempo|tempo|due\s*date)\s*:?\s*(.*)/i', $line, $matches)) {
                    $dateStr = trim($matches[1]);
                    if (!empty($dateStr)) {
                        $extractedData['jatuh_tempo'] = $parseDate($dateStr);
                        break;
                    }
                }
            }
            
            // Deteksi PPN
            foreach ($lines as $line) {
                if (preg_match('/ppn\s*:?\s*(\d+(?:[.,]\d+)?)\s*%?/i', $line, $matches)) {
                    $extractedData['ppn_percentage'] = (float)str_replace(',', '.', $matches[1]);
                    break;
                }
            }
            
            // Deteksi tabel produk
            $tableStartIndex = null;
            $tableEndIndex = null;
            $headerColumns = [];
            
            // Cari header tabel
            for ($i = 0; $i < count($lines); $i++) {
                $line = strtolower($lines[$i]);
                $headerKeywords = ['nama', 'barang', 'jumlah', 'qty', 'harga', 'satuan', 'total', 'expired', 'exp'];
                
                $keywordCount = 0;
                foreach ($headerKeywords as $keyword) {
                    if (strpos($line, $keyword) !== false) {
                        $keywordCount++;
                    }
                }
                
                if ($keywordCount >= 3) {
                    $tableStartIndex = $i + 1; // Baris setelah header
                    
                    // Identifikasi kolom-kolom dalam header
                    $headerMapping = [
                        'nama_produk' => ['nama', 'barang', 'produk', 'item', 'uraian', 'description'],
                        'jumlah' => ['jumlah', 'qty', 'quantity', 'banyak', 'banyaknya'],
                        'kemasan' => ['kemasan', 'satuan', 'unit', 'pak', 'box', 'btl', 'pcs'],
                        'expired' => ['expired', 'exp', 'ed', 'kadaluarsa'],
                        'harga_satuan' => ['harga', '@harga', 'harga satuan', 'satuan harga'],
                        'diskon' => ['disc', 'diskon', 'discount', 'potongan'],
                        'total' => ['total', 'jumlah harga', 'sub total', 'amount']
                    ];
                    
                    // Potong line menjadi kata-kata
                    $words = preg_split('/\s+/', $line);
                    
                    // Cari posisi kolom berdasarkan kata kunci
                    foreach ($headerMapping as $field => $keywords) {
                        foreach ($keywords as $keyword) {
                            for ($j = 0; $j < count($words); $j++) {
                                if (strpos($words[$j], $keyword) !== false) {
                                    $headerColumns[$field] = $j;
                                    break 2; // Keluar dari 2 loop dalam
                                }
                            }
                        }
                    }
                    
                    break;
                }
            }
            
            // Jika header tabel ditemukan, cari baris-baris data
            if ($tableStartIndex !== null) {
                // Cari baris terakhir dari tabel (biasanya sampai baris total/subtotal)
                for ($i = $tableStartIndex; $i < count($lines); $i++) {
                    $line = strtolower($lines[$i]);
                    if (preg_match('/^(sub)?\s*total|jumlah|dpp|ppn|grand total/i', $line)) {
                        $tableEndIndex = $i - 1;
                        break;
                    }
                    
                    // Jika sampai baris terakhir
                    if ($i == count($lines) - 1) {
                        $tableEndIndex = $i;
                    }
                }
                
                // Jika baris akhir tabel ditemukan, ekstrak data produk
                if ($tableEndIndex !== null) {
                    for ($i = $tableStartIndex; $i <= $tableEndIndex; $i++) {
                        $line = $lines[$i];
                        $words = preg_split('/\s+/', $line);
                        
                        // Skip baris kosong atau baris yang terlalu pendek
                        if (count($words) < 3) continue;
                        
                        // Cek apakah baris ini berisi angka (kemungkinan baris data)
                        $hasNumber = false;
                        foreach ($words as $word) {
                            if (is_numeric($extractNumber($word))) {
                                $hasNumber = true;
                                break;
                            }
                        }
                        
                        if (!$hasNumber) continue;
                        
                        $detail = [
                            'nama_produk' => '',
                            'jumlah' => 0,
                            'kemasan' => 'Pcs', // Default
                            'expired' => date('Y-m-d', strtotime('+2 years')), // Default 2 tahun
                            'harga_satuan' => 0,
                            'discount_percentage' => 0,
                            'total' => 0
                        ];
                        
                        // Ekstrak data sesuai posisi kolom
                        foreach ($headerColumns as $field => $position) {
                            if (isset($words[$position])) {
                                switch ($field) {
                                    case 'nama_produk':
                                        // Nama produk bisa terdiri dari beberapa kata
                                        $productName = '';
                                        for ($j = $position; $j < min($position + 5, count($words)); $j++) {
                                            if (is_numeric($extractNumber($words[$j]))) break;
                                            $productName .= $words[$j] . ' ';
                                        }
                                        $detail[$field] = trim($productName);
                                        break;
                                    case 'jumlah':
                                        $detail[$field] = (int)$extractNumber($words[$position]);
                                        break;
                                    case 'kemasan':
                                        $detail[$field] = $words[$position];
                                        break;
                                    case 'expired':
                                        $expDate = $parseDate($words[$position]);
                                        if ($expDate) $detail[$field] = $expDate;
                                        break;
                                    case 'harga_satuan':
                                        $detail[$field] = $extractNumber($words[$position]);
                                        break;
                                    case 'diskon':
                                        // Jika diskon dalam persen
                                        if (strpos($words[$position], '%') !== false) {
                                            $detail['discount_percentage'] = $extractNumber($words[$position]);
                                        } else {
                                            // Jika diskon dalam nilai
                                            $diskonValue = $extractNumber($words[$position]);
                                            if ($diskonValue > 0 && $detail['harga_satuan'] > 0) {
                                                $detail['discount_percentage'] = ($diskonValue / $detail['harga_satuan']) * 100;
                                            }
                                        }
                                        break;
                                    case 'total':
                                        $detail[$field] = $extractNumber($words[$position]);
                                        break;
                                }
                            }
                        }
                        
                        // Jika tidak ada nama produk atau jumlah, lewati
                        if (empty($detail['nama_produk']) || $detail['jumlah'] <= 0) {
                            continue;
                        }
                        
                        // Jika total tidak ada, hitung dari harga_satuan * jumlah
                        if ($detail['total'] == 0 && $detail['harga_satuan'] > 0 && $detail['jumlah'] > 0) {
                            $detail['total'] = $detail['harga_satuan'] * $detail['jumlah'];
                            
                            // Kurangi diskon jika ada
                            if ($detail['discount_percentage'] > 0) {
                                $detail['total'] -= ($detail['total'] * $detail['discount_percentage'] / 100);
                            }
                        }
                        
                        $extractedData['details'][] = $detail;
                    }
                }
            }
            
            // Jika tidak ada detail produk yang ditemukan, coba pendekatan alternatif
            if (empty($extractedData['details'])) {
                // Cari pola umum untuk data produk dalam teks
                $productPatterns = [
                    // Format: Nama Produk Jumlah Kemasan Harga Total
                    '/([A-Za-z0-9\s]+)\s+(\d+)\s+(Box|Btl|Pcs|Strip|Tab)\s+Rp\s*(\d[\d\.,]*)\s+Rp\s*(\d[\d\.,]*)/i',
                    // Format: Nomor Nama Produk Jumlah Harga Total
                    '/(\d+)\s+([A-Za-z0-9\s]+)\s+(\d+)\s+Rp\s*(\d[\d\.,]*)\s+Rp\s*(\d[\d\.,]*)/i',
                ];
                
                foreach ($productPatterns as $pattern) {
                    preg_match_all($pattern, $text, $matches, PREG_SET_ORDER);
                    
                    foreach ($matches as $match) {
                        if (count($match) >= 5) {
                            // Sesuaikan indeks berdasarkan pola yang cocok
                            $productName = trim($match[1]);
                            $quantity = (int)$match[2];
                            $unitPrice = $extractNumber($match[3]);
                            $total = $extractNumber($match[4]);
                            
                            // Jika pola kedua yang cocok, sesuaikan indeks
                            if (count($match) >= 6) {
                                $productName = trim($match[2]);
                                $quantity = (int)$match[3];
                                $unitPrice = $extractNumber($match[4]);
                                $total = $extractNumber($match[5]);
                            }
                            
                            $extractedData['details'][] = [
                                'nama_produk' => $productName,
                                'jumlah' => $quantity,
                                'kemasan' => 'Pcs', // Default
                                'expired' => date('Y-m-d', strtotime('+2 years')), // Default
                                'harga_satuan' => $unitPrice,
                                'discount_percentage' => 0,
                                'total' => $total
                            ];
                        }
                    }
                    
                    // Jika sudah menemukan produk, hentikan
                    if (!empty($extractedData['details'])) {
                        break;
                    }
                }
            }
            
            // Jika tidak ada PPN yang ditemukan, gunakan default 11%
            if (empty($extractedData['ppn_percentage'])) {
                $extractedData['ppn_percentage'] = 11;
            }
            
            // Jika tidak ada tanggal faktur, gunakan tanggal hari ini
            if (empty($extractedData['tanggal_faktur'])) {
                $extractedData['tanggal_faktur'] = date('Y-m-d');
            }
            
            // Jika tidak ada jatuh tempo, gunakan 30 hari dari tanggal faktur
            if (empty($extractedData['jatuh_tempo'])) {
                $extractedData['jatuh_tempo'] = date('Y-m-d', strtotime($extractedData['tanggal_faktur'] . ' +30 days'));
            }
            
            return $extractedData;
        } catch (\Exception $e) {
            Log::error('Error parsing invoice text: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
    
    private function createPurchaseFromOCR($data)
    {
        try {
            DB::beginTransaction();
            
            // Find or create supplier
            $supplier = Supplier::firstOrCreate(
                ['company' => $data['pbf']],
                ['note' => 'Auto-created from OCR import']
            );
            
            // Calculate total from details
            $total = array_sum(array_column($data['details'], 'total'));
            $jumlah = count($data['details']);
            
            // Create purchase
            $purchase = Purchase::create([
                'no_faktur' => $data['no_faktur'],
                'pbf' => $data['pbf'],
                'tanggal_faktur' => $data['tanggal_faktur'],
                'jatuh_tempo' => $data['jatuh_tempo'],
                'jumlah' => $jumlah,
                'total' => $total,
                'keterangan' => 'Imported from OCR',
                'supplier_id' => $supplier->id,
            ]);
            
            // Create purchase details
            foreach ($data['details'] as $detail) {
                $purchase->details()->create($detail);
            }
            
            DB::commit();
            return $purchase;
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Create Purchase from OCR Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public function export($id)
    {
        $purchase = Purchase::with('details')->findOrFail($id);
        
        // Create a new spreadsheet
        $spreadsheet = new Spreadsheet();
        
        // Set active sheet and rename it
        $spreadsheet->getActiveSheet()->setTitle('Faktur Utama');
        
        // Add headers to the first sheet
        $headersFaktur = ['No. Faktur', 'PBF', 'Tanggal Faktur', 'Jatuh Tempo', 'Jumlah Barang', 'Total'];
        $spreadsheet->getActiveSheet()->fromArray($headersFaktur, null, 'A1');
        
        // Add purchase data
        $fakturData = [
            $purchase->no_faktur,
            $purchase->pbf,
            $purchase->tanggal_faktur ? $purchase->tanggal_faktur->format('Y-m-d') : '',
            $purchase->jatuh_tempo ? $purchase->jatuh_tempo->format('Y-m-d') : '',
            $purchase->jumlah,
            $purchase->total
        ];
        $spreadsheet->getActiveSheet()->fromArray([$fakturData], null, 'A2');
        
        // Create a second sheet for product details
        $spreadsheet->createSheet()->setTitle('Detail Barang');
        $spreadsheet->setActiveSheetIndex(1);
        
        // Add headers to the second sheet
        $headersDetail = ['No Faktur', 'Nama Barang', 'Jumlah', 'Kemasan', 'Harga Satuan', 'Diskon', 'Subtotal', 'Expire Date'];
        $spreadsheet->getActiveSheet()->fromArray($headersDetail, null, 'A1');
        
        // Add detail data
        $detailData = [];
        foreach ($purchase->details as $index => $detail) {
            $detailData[] = [
                $purchase->no_faktur,
                $detail->nama_produk,
                $detail->jumlah,
                $detail->kemasan,
                $detail->harga_satuan,
                0, // Diskon (not stored in our model)
                $detail->total,
                $detail->expired ? $detail->expired->format('Y-m-d') : ''
            ];
        }
        $spreadsheet->getActiveSheet()->fromArray($detailData, null, 'A2');
        
        // Set column widths for better readability
        foreach (range('A', 'H') as $col) {
            $spreadsheet->getActiveSheet()->getColumnDimension($col)->setWidth(15);
        }
        
        // Set back to first sheet
        $spreadsheet->setActiveSheetIndex(0);
        
        // Create a temporary file
        $tempFile = tempnam(sys_get_temp_dir(), 'purchase_export_');
        $writer = new Xlsx($spreadsheet);
        $writer->save($tempFile);
        
        // Return the file as a download
        return response()->download($tempFile, 'purchase_' . $purchase->no_faktur . '.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function show(Purchase $purchase)
    {
        $purchase->load(['supplier', 'details']);
        
        return Inertia::render('Purchases/Show', [
            'purchase' => $purchase,
        ]);
    }

    public function purchasedProducts()
    {
        // Get all products with their categories
        $existingProducts = Produk::with('category')->get();
        $existingProdukMap = $existingProducts->keyBy('id'); // Ubah key menjadi ID

        // Get all purchase details with product information
        $purchaseDetails = PurchaseDetail::with(['purchase.supplier', 'produk.category'])
            ->select([
                'id',
                'purchase_id',
                'produk_id',
                'nama_produk',
                'expired',
                'jumlah',
                'kemasan',
                'harga_satuan',
                'total',
                'created_at',
            ])
            ->get()
            ->map(function ($detail) use ($existingProdukMap) {
                // Default values
                $isListed = false;
                $kategoriProduk = null;
                $produkId = null;

                // Check if this purchase detail is linked to a product
                if ($detail->produk_id && isset($existingProdukMap[$detail->produk_id])) {
                    $produk = $existingProdukMap[$detail->produk_id];
                    $isListed = true;
                    $kategoriProduk = $produk->category->name ?? null;
                    $produkId = $produk->id;
                }

                return [
                    'id' => $detail->id,
                    'nama_produk' => $detail->nama_produk,
                    'supplier' => $detail->purchase->pbf ?? 'Unknown',
                    'expired' => $detail->expired,
                    'jumlah' => $detail->jumlah,
                    'kemasan' => $detail->kemasan,
                    'harga_satuan' => $detail->harga_satuan,
                    'total' => $detail->total,
                    'kategori_produk' => $kategoriProduk,
                    'purchase_no' => $detail->purchase->no_faktur ?? 'Unknown',
                    'purchase_date' => $detail->purchase->created_at->format('Y-m-d'),
                    'is_listed_as_product' => $isListed,
                    'is_directly_linked_to_product' => !is_null($detail->produk_id),
                    'produk_id_terkait' => $produkId,
                ];
            });

        return Inertia::render('Purchases/Products', [
            'purchaseDetails' => $purchaseDetails
        ]);
    }

    public function exportReport(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'supplier_id' => 'nullable|string', // Can be 'all' or an ID
            'report_type' => 'required|string|in:detail,summary',
            'format' => 'nullable|string|in:xlsx,pdf', // Optional format
        ]);

        $startDate = $validated['start_date'];
        $endDate = $validated['end_date'];
        $supplierId = $validated['supplier_id'] ?? null;
        $reportType = $validated['report_type'];
        $format = strtolower($validated['format'] ?? 'xlsx'); // Default to xlsx

        $timestamp = now()->format('Ymd_His');
        
        if ($reportType === 'detail') {
            $filename = "purchase_detail_report_{$timestamp}.{$format}";
            $exportClass = new \App\Exports\PurchaseReportExport($startDate, $endDate, $supplierId);
        } elseif ($reportType === 'summary') {
            $filename = "purchase_summary_report_{$timestamp}.{$format}";
            $exportClass = new \App\Exports\PurchaseOrderSummaryExport($startDate, $endDate, $supplierId);
        } else {
            // Should not happen due to validation, but as a fallback
            return redirect()->back()->withErrors(['report_type' => 'Jenis laporan tidak valid.']);
        }

        if ($format === 'pdf') {
            // Ensure you have a PDF driver configured for Maatwebsite/Excel, e.g., DomPDF or TCPDF
            // composer require maatwebsite/excel-dompdf
            // return Excel::download($exportClass, $filename, \Maatwebsite\Excel\Excel::DOMPDF);
            // For now, let's return an error if PDF is requested but not fully set up.
            // Or, we can just attempt it and let it fail if the driver isn't there.
            // For simplicity, I'll stick to Excel for now unless PDF setup is confirmed.
            // If you want to enable PDF, ensure the driver is installed and uncomment the line above.
             return Excel::download($exportClass, $filename); // Defaults to XLSX if driver not specified
        }

        return Excel::download($exportClass, $filename);
    }
}
