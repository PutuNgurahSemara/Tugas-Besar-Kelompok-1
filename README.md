# Pharmasys-Vite

Pharmasys-Vite adalah aplikasi web yang dikembangkan menggunakan framework Laravel untuk backend dan React dengan Vite untuk frontend. Aplikasi ini dirancang untuk membantu sebuah apotek dalam mengelola barang keluar dan masuk serta melakukan penjualan.
Terdapat 2 aktor dalam sistem ini yaitu Admin dan Kasir yang mana admin memiliki semua akses dari sistem dan kasir tidak. 

## Fitur Utama
  - ### Sistem autentikasi pengguna (login, register, reset password)
         Manajemen peran (roles) dengan permission-based access control
         Manajemen izin (permissions) untuk mengatur akses ke berbagai fitur sistem
         Pengaturan profil pengguna
  - ### Dashboard Interaktif
         Tampilan penjualan harian
         Statistik jumlah kategori produk
         Monitoring obat kadaluarsa
         Informasi jumlah pengguna sistem
         Daftar penjualan terbaru
         Grafik penjualan berdasarkan kategori
   - ### Manajemen Persediaan/Inventori
         Pengelolaan produk obat (tambah, edit, hapus)
         Pengelolaan kategori produk
         Pengelolaan obat kadaluarsa
         Monitoring persediaan (out of stock)
         Status produk (draft, aktif, tidak aktif)
         Pengelolaan margin harga produk
   - ### Manajemen Pembelian/Pengadaan
         Pencatatan faktur pembelian
         Pengelolaan rincian pembelian
         Pengelolaan jatuh tempo pembayaran
         Pengelolaan pemasok/supplier
         Import data pembelian dari Excel
         Import gambar terkait pembelian
         Fitur unduh template pembelian
   - ### Manajemen Penjualan
         Pencatatan transaksi penjualan
         Fitur keranjang belanja (shopping cart)
         Perhitungan total harga otomatis
         Manajemen metode pembayaran
         Rincian item penjualan
   - ### Sistem Laporan dan Ekspor Data
         Laporan penjualan (harian, bulanan, tahunan)
         Laporan pembelian
         Ekspor laporan dalam format Excel
         Ekspor laporan dalam format PDF
   - ### Notifikasi

         Pengelolaan notifikasi sistem
         Tampilan notifikasi untuk pengguna
   - ### Pengaturan Sistem

         Konfigurasi aplikasi
         Pengaturan tampilan aplikasi
   - ### Fitur Tambahan

         Pengelolaan PBF (Pedagang Besar Farmasi)
         Perhitungan PPN otomatis dalam transaksi pembelian
         Soft delete untuk data penting (tidak benar-benar dihapus dari database)
         UI modern dengan React dan Tailwind CSS
         Manajemen gambar produk
## Teknologi yang Digunakan

### Backend
* **PHP ^8.2**
* **Laravel ^12.0**
* **Inertia.js ^2.0** (untuk menghubungkan backend Laravel dengan frontend React)
* **Laravel Sanctum ^4.1** (untuk autentikasi API)
* **Spatie Laravel Permission ^6.17** (untuk manajemen peran dan izin)
* **Barryvdh Laravel Dompdf ^3.1** (untuk pembuatan PDF)
* **Maatwebsite Excel ^3.1** (untuk impor/ekspor data Excel)
* **Composer** (manajemen dependensi PHP)

### Frontend
* **React ^18.0.0**
* **Vite ^6.0.0** (build tool frontend)
* **TypeScript**
* **Tailwind CSS ^3.4.1** (framework CSS)
* **Headless UI ^2.2.0**, **Radix UI** (komponen UI)
* **Chart.js ^4.4.9**, **React Chartjs 2 ^5.3.0** (untuk pembuatan grafik)
* **ESLint**, **Prettier** (untuk linting dan formatting kode)
* **npm** (manajemen dependensi JavaScript)

### Database
* PostgreSQL

## Struktur Folder Utama

Proyek ini mengikuti struktur folder standar Laravel dengan beberapa penyesuaian untuk integrasi Vite dan React:

```
pharmasys-vite/
├── app/                # Logika inti aplikasi (Controllers, Models, Services, dll.)
├── bootstrap/          # File bootstrap aplikasi
├── config/             # File konfigurasi aplikasi
├── database/           # Migrasi, seeder, dan factory database
├── public/             # Aset publik dan entry point (index.php)
├── resources/
│   ├── css/            # File CSS
│   ├── js/             # Kode JavaScript/TypeScript (React components, pages, dll.)
│   └── views/          # Blade templates (digunakan oleh Inertia)
├── routes/             # Definisi rute aplikasi (web.php, api.php, dll.)
├── storage/            # File yang di-generate framework, cache, log, dll.
├── tests/              # Unit dan Feature tests
├── vendor/             # Dependensi Composer
├── artisan             # Script command-line Laravel
├── composer.json       # Dependensi PHP (Composer)
├── package.json        # Dependensi JavaScript (npm)
├── vite.config.ts      # Konfigurasi Vite
└── tailwind.config.js  # Konfigurasi Tailwind CSS
```

## Instalasi dan Setup

1.  **Clone repository:**
    ```bash
    git clone https://github.com/PutuNgurahSemara/Tugas-Besar-Kelompok-1.git
    cd pharmasys-vite
    ```

2.  **Install dependensi PHP:**
    ```bash
    composer install
    ```

3.  **Install dependensi JavaScript:**
    ```bash
    npm install
    ```

4.  **Buat file `.env`:**
    Salin `.env.example` menjadi `.env`.
    ```bash
    copy .env.example .env
    ```
    Atau jika menggunakan PowerShell:
    ```powershell
    Copy-Item .env.example .env
    ```

5.  **Generate application key:**
    ```bash
    php artisan key:generate
    ```

6.  **Konfigurasi database:**
    Edit file `.env` dan sesuaikan pengaturan database Anda (DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD).

7.  **Jalankan migrasi database:**
    (Jika menggunakan SQLite, pastikan file `database/database.sqlite` sudah ada atau akan dibuat).
    ```bash
    php artisan migrate --seed  # Opsional: --seed untuk menjalankan seeder
    ```

8.  **Build aset frontend:**
    ```bash
    npm run build
    ```

## Menjalankan Aplikasi

### Untuk Pengembangan (dengan hot-reloading):
Skrip `dev` pada `composer.json` menjalankan server PHP, listener antrian, log Pail, dan server Vite secara bersamaan.
```bash
composer run dev
```
Atau, Anda bisa menjalankan server PHP dan Vite secara terpisah:
*   Jalankan server PHP:
    ```bash
    php artisan serve
    ```
*   Jalankan server Vite untuk development:
    ```bash
    npm run dev
    ```

### Untuk Pengembangan dengan Server-Side Rendering (SSR):
```bash
composer run dev:ssr
```

### Untuk Produksi:
1.  Build aset frontend untuk produksi:
    ```bash
    npm run build
    ```
2.  Pastikan web server Anda (misalnya Nginx atau Apache) dikonfigurasi untuk menunjuk ke direktori `public` proyek Laravel Anda.

## Menjalankan Test
```bash
php artisan test
```

## Perintah Berguna Lainnya

*   **Linting & Formatting:**
    ```bash
    npm run lint
    npm run format
    ```
*   **Membersihkan Cache Konfigurasi (jika ada perubahan pada file config):**
    ```bash
    php artisan config:clear
    ```


