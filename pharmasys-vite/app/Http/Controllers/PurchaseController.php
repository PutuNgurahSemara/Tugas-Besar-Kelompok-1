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
        $purchases = Purchase::with(['category', 'supplier', 'details'])
                        ->orderBy('created_at', 'desc')
                        ->paginate(20);

        // Cek jika koleksi tidak kosong sebelum method_exists
        $collection = $purchases->getCollection();
        if ($collection->isNotEmpty() && method_exists($collection->first(), 'products')) {
        $purchases->getCollection()->transform(function ($purchase) {
                $purchase->available_quantity = (int)($purchase->quantity ?? 0) - (int)($purchase->used_quantity ?? 0);
            return $purchase;
        });
        }
        
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
            'details' => 'required|array|min:1',
            'details.*.nama_produk' => 'required|string',
            'details.*.expired' => 'required|date',
            'details.*.jumlah' => 'required|integer',
            'details.*.kemasan' => 'required|string',
            'details.*.harga_satuan' => 'required|numeric',
            'details.*.total' => 'required|numeric',
        ]);

        // Hitung total dari details
        $total = collect($validated['details'])->sum('total');
        $validated['total'] = $total;

        // Find supplier_id based on pbf
        $supplier = Supplier::where('company', $validated['pbf'])->first();

        if (!$supplier) {
            // Handle case where supplier is not found
            // For now, let's assume it should exist and throw an error or redirect back with error
            return redirect()->back()->withInput()->withErrors(['pbf' => 'Supplier tidak ditemukan.']);
        }

        $purchaseData = $validated;
        $purchaseData['supplier_id'] = $supplier->id;

        DB::beginTransaction();
        try {
            $purchase = Purchase::create($purchaseData);

            foreach ($validated['details'] as $detail) {
                // Ensure produk_id is null if not provided, or handle linking existing products if necessary
                $detailData = $detail;
                if (!isset($detailData['produk_id'])) {
                    // If you have a system to link to existing Produk by name, you could do it here.
                    // For now, assuming produk_id is not part of this specific form's direct input for new purchases.
                    // It's fillable in PurchaseDetail, so it might be set in other contexts or if 'nama_produk' implies an existing one.
                }
                $purchase->details()->create($detailData);
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
            'details.*.jumlah' => 'required|integer',
            'details.*.kemasan' => 'required|string',
            'details.*.harga_satuan' => 'required|numeric',
            'details.*.total' => 'required|numeric',
        ]);
        
        // Hitung total dari details
        $total = collect($validated['details'])->sum('total');
        $validated['total'] = $total;

        $purchase->update($validated);

        // Hapus detail lama, insert ulang
        $purchase->details()->delete();
        foreach ($validated['details'] as $detail) {
            $purchase->details()->create($detail);
        }

        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil diperbarui.');
    }

    public function destroy(Purchase $purchase)
    {
        // Check if any purchase details are associated with products
        $usedDetails = $purchase->details()->whereNotNull('produk_id')->count();
        
        if ($usedDetails > 0) {
            return back()->withErrors([
                'delete' => 'Tidak dapat menghapus pembelian ini karena sudah digunakan untuk produk. Hapus produk terkait terlebih dahulu.'
            ]);
        }
        
        // Delete purchase details first
        $purchase->details()->delete();
        
        // Then delete the purchase
        $purchase->delete();
        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil dihapus.');
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
        $data = Excel::toArray([], $file)[0];

        $purchases = [];
        $currentHeader = [];
        $currentDetails = [];
        $collectingDetails = false;
        $success = 0;
        $failed = 0;
        $rowNumber = 0;

        // Fungsi bantu parsing tanggal format Excel (lebih kuat)
        function parseExcelDate($str) {
            // Jika numeric (serial Excel)
            if (is_numeric($str)) {
                try {
                    return \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($str)->format('Y-m-d');
                } catch (\Exception $e) {
                    return null;
                }
            }
            // Jika string
            $str = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $str);
            $str = trim($str);
            $str = preg_replace('/^[A-Za-z]+,\s*/', '', $str);
            $str = trim($str, " \t\n\r\0\x0B,;");
            $timestamp = strtotime($str);
            if ($timestamp) {
                return date('Y-m-d', $timestamp);
            }
            return null;
        }

        foreach ($data as $row) {
            $rowNumber++;
            // Skip baris kosong
            if (count(array_filter($row, fn($v) => trim($v) !== '')) === 0) continue;

            $rowString = implode(' ', $row);

            // Deteksi header faktur baru (lebih toleran)
            if (preg_grep('/no\.? faktur/i', array_map('strtolower', $row))) {
                if ($currentHeader && $currentDetails) {
                    $purchases[] = [
                        'header' => $currentHeader,
                        'details' => $currentDetails
                    ];
                }
                $currentHeader = [
                    'no_faktur' => null,
                    'pbf' => null,
                    'tanggal_faktur' => null,
                    'jatuh_tempo' => null,
                ];
                $currentDetails = [];
                $collectingDetails = false;
            }
            // Ambil header
            foreach ($row as $i => $cell) {
                // Ambil No Faktur
                if (is_string($cell) && stripos($cell, 'No. Faktur') !== false) {
                    $currentHeader['no_faktur'] = trim(str_ireplace('No. Faktur :', '', $cell));
                }
                // Ambil Tanggal Faktur
                if (is_string($cell) && stripos($cell, 'Tanggal:') !== false) {
                    // Ambil value setelah titik dua
                    $tgl = trim(explode(':', $cell, 2)[1] ?? '');
                    // Jika kosong, coba ambil dari kolom setelah label
                    if ($tgl === '' && isset($row[$i+1])) {
                        $tgl = trim($row[$i+1]);
                    }
                    \Log::info('Tanggal Faktur Excel', ['raw' => $tgl]);
                    $currentHeader['tanggal_faktur'] = parseExcelDate($tgl);
                }
                // Ambil Jatuh Tempo
                if (is_string($cell) && stripos($cell, 'Jatuh Tempo:') !== false) {
                    $tgl = trim(explode(':', $cell, 2)[1] ?? '');
                    if ($tgl === '' && isset($row[$i+1])) {
                        $tgl = trim($row[$i+1]);
                    }
                    \Log::info('Jatuh Tempo Excel', ['raw' => $tgl]);
                    $currentHeader['jatuh_tempo'] = parseExcelDate($tgl);
                }
                // Ambil PBF
                if (is_string($cell) && stripos($cell, 'PT.') !== false) {
                    $currentHeader['pbf'] = trim($cell);
                }
            }
            // Deteksi awal tabel produk (lebih toleran)
            if (isset($row[0]) && strtolower(trim($row[0])) === 'jumlah') {
                $collectingDetails = true;
                continue;
            }
            // Ambil detail produk
            if ($collectingDetails && isset($row[0]) && is_numeric($row[0])) {
                \Log::info('Row detail produk', ['row' => $row]);
                $expired = null;
                if (!empty($row[3])) {
                    if (is_numeric($row[3])) {
                        $expired = \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[3])->format('Y-m-d');
                    } else {
                        $expired = \DateTime::createFromFormat('y/m/d', $row[3]) ?: \DateTime::createFromFormat('d/m/y', $row[3]);
                        if ($expired) $expired = $expired->format('Y-m-d');
                        else $expired = null;
                    }
                }
                $hargaSatuan = isset($row[4]) ? (float) preg_replace('/[^\d.]/', '', str_replace([','], ['.'], $row[4])) : 0;
                $total = isset($row[7]) ? (float) preg_replace('/[^\d.]/', '', str_replace([','], ['.'], $row[7])) : 0;
                $currentDetails[] = [
                    'jumlah' => (int) $row[0],
                    'kemasan' => $row[1] ?? '',
                    'nama_produk' => $row[2] ?? '',
                    'expired' => $expired,
                    'harga_satuan' => $hargaSatuan,
                    'total' => $total,
                ];
            }
            // Stop collecting detail jika baris kosong atau DPP/PPN/Harus Dibayar
            if ($collectingDetails && (empty($row[0]) || preg_match('/dpp|ppn|harus dibayar/i', $rowString))) {
                $collectingDetails = false;
            }
        }
        // Simpan faktur terakhir
        if ($currentHeader && $currentDetails) {
            $purchases[] = [
                'header' => $currentHeader,
                'details' => $currentDetails
            ];
        }

        // Proses simpan ke database
        foreach ($purchases as $purchaseData) {
            $header = $purchaseData['header'];
            $details = $purchaseData['details'];
            // Hitung total dari detail produk (sub total)
            $total = array_sum(array_column($details, 'total'));
            // Jika total 0, fallback ke penjumlahan harga_satuan*jumlah
            if ($total == 0) {
                $total = array_sum(array_map(function($d) {
                    return ($d['harga_satuan'] ?? 0) * ($d['jumlah'] ?? 0);
                }, $details));
            }
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
                        'note' => 'Auto import',
                    ]);
                }
                $supplierId = $supplier->id;
            }
            try {
                $purchase = \App\Models\Purchase::create([
                    'no_faktur' => $header['no_faktur'] ?? 'IMPORT',
                    'pbf' => $header['pbf'] ?? 'IMPORT',
                    'tanggal_faktur' => $header['tanggal_faktur'] ?? now()->toDateString(),
                    'jatuh_tempo' => $header['jatuh_tempo'] ?? now()->toDateString(),
                    'jumlah' => count($details),
                    'total' => $total,
                    'keterangan' => 'Import Excel',
                    'supplier_id' => $supplierId,
                ]);
                foreach ($details as $detail) {
                    $purchase->details()->create($detail);
                }
                $success++;
            } catch (\Exception $e) {
                \Log::error('Import gagal di baris ' . $rowNumber . ': ' . $e->getMessage());
                $failed++;
            }
        }
        if ($success > 0) {
            return back()->with('success', "Import berhasil: $success faktur. Gagal: $failed faktur.");
        } else {
            return back()->with('error', 'Import gagal. Pastikan format file sudah benar.');
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
        // This is a placeholder for actual OCR implementation
        // In a real implementation, you would use Google Cloud Vision or another OCR service
        
        // For demonstration purposes, we'll return a mock result
        // In production, replace this with actual OCR processing
        
        try {
            // Mock OCR result - in production, replace with actual OCR API call
            $mockData = [
                'no_faktur' => 'OCR-' . rand(1000, 9999),
                'pbf' => 'PBF Farmasi ' . rand(1, 5),
                'tanggal_faktur' => now()->subDays(rand(1, 30))->format('Y-m-d'),
                'jatuh_tempo' => now()->addDays(rand(30, 60))->format('Y-m-d'),
                'details' => [
                    [
                        'nama_produk' => 'Paracetamol 500mg',
                        'jumlah' => rand(10, 100),
                        'kemasan' => 'Box',
                        'harga_satuan' => rand(5000, 15000),
                        'expired' => now()->addYears(2)->format('Y-m-d'),
                        'total' => rand(50000, 150000)
                    ],
                    [
                        'nama_produk' => 'Amoxicillin 500mg',
                        'jumlah' => rand(10, 100),
                        'kemasan' => 'Strip',
                        'harga_satuan' => rand(10000, 20000),
                        'expired' => now()->addYears(1)->format('Y-m-d'),
                        'total' => rand(100000, 200000)
                    ]
                ]
            ];
            
            return $mockData;
            
            /* 
            // Example of how to implement with Google Cloud Vision API
            // Uncomment and modify this code when you have the API set up
            
            $imageAnnotator = new ImageAnnotatorClient([
                'credentials' => json_decode(file_get_contents(storage_path('app/google-vision-key.json')), true)
            ]);
            
            // Read image content
            $image = file_get_contents($imagePath);
            
            // Perform text detection
            $response = $imageAnnotator->textDetection($image);
            $texts = $response->getTextAnnotations();
            
            // Close the client
            $imageAnnotator->close();
            
            if (empty($texts)) {
                return null;
            }
            
            // Extract the full text
            $fullText = $texts[0]->getDescription();
            
            // Parse the text to extract invoice details
            // This would require custom logic based on your invoice format
            $extractedData = $this->parseInvoiceText($fullText);
            
            return $extractedData;
            */
        } catch (\Exception $e) {
            Log::error('OCR Processing Error: ' . $e->getMessage());
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
        $existingProdukNames = Produk::pluck('nama')->unique()->toArray();

        // Get all purchase details with product information
        $purchaseDetails = PurchaseDetail::with(['purchase.supplier'])
            ->select([
                'id',
                'purchase_id',
                'produk_id', // Include produk_id to know if this batch is directly linked
                'nama_produk',
                'expired',
                'jumlah',
                'kemasan',
                'harga_satuan',
                'total'
            ])
        ->orderBy('expired')
        ->get()
        ->map(function ($detail) use ($existingProdukNames) { // Added: use ($existingProdukNames)
            return [
                'id' => $detail->id,
                    'nama_produk' => $detail->nama_produk,
                    'supplier' => $detail->purchase->supplier->company ?? 'Unknown',
                    'expired' => $detail->expired ? $detail->expired->format('Y-m-d') : null,
                    'jumlah' => $detail->jumlah,
                    'kemasan' => $detail->kemasan,
                    'harga_satuan' => $detail->harga_satuan,
                    'total' => $detail->total,
                'purchase_no' => $detail->purchase->no_faktur ?? 'Unknown',
                'purchase_date' => $detail->purchase->created_at->format('Y-m-d'),
                'is_listed_as_product' => in_array($detail->nama_produk, $existingProdukNames),
                'is_directly_linked_to_product' => !is_null($detail->produk_id),
            ];
        });

        return Inertia::render('Purchases/Products', [ // Assuming view is Purchases/Products.tsx
            'purchaseDetails' => $purchaseDetails
        ]);
    }
}
