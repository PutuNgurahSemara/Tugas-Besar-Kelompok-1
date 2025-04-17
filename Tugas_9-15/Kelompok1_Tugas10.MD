
# Laporan Progres Mingguan - Pharmasys
**Kelompok**: 1
**Mitra**: Tiarana Farma
**Pekan ke-**: 9
**Tanggal**: 10/04/2025

## Progress Summary
Pada minggu ini kelompok kami berhasil telah melakukan wawancara dengan mitra dan juga mendapatkan informasi yang cukup untuk mengetahui fitur fitur yang dibutuhkan.

## Accomplished Tasks
- ### ERD
    # 📘 ERD dan Struktur Database PharmaSys

Sistem Informasi Manajemen Apotek untuk **Tiarana Farma**

---

## 🧍‍♂️ USER

Mewakili pengguna sistem, yaitu Admin dan Kasir.

| Kolom     | Tipe Data | Keterangan                      |
|-----------|-----------|---------------------------------|
| user_id   | int       | Primary Key                    |
| fullname  | string    | Nama lengkap pengguna          |
| email     | string    | Email login                    |
| password  | string    | Password terenkripsi           |
| role      | string    | 'admin' atau 'kasir'           |

Relasi:
- USER → 1-to-many → PEMBELIAN
- USER → 1-to-many → PENJUALAN

---

## 🗂️ KATEGORI_PRODUK

Kategori dari produk atau obat.

| Kolom        | Tipe Data | Keterangan            |
|--------------|-----------|-----------------------|
| kategori_id  | int       | Primary Key          |
| nama_kategori| string    | Nama kategori produk |

Relasi:
- KATEGORI_PRODUK → 1-to-many → PRODUK

---

## 💊 PRODUK

Informasi tentang obat atau barang apotek.

| Kolom        | Tipe Data | Keterangan                         |
|--------------|-----------|------------------------------------|
| produk_id    | int       | Primary Key                       |
| nama_produk  | string    | Nama produk                       |
| kategori_id  | int       | Foreign Key → KATEGORI_PRODUK     |
| stok         | int       | Jumlah stok tersedia              |
| harga_beli   | float     | Harga beli dari supplier          |
| harga_jual   | float     | Harga jual ke pelanggan           |
| tgl_expired  | date      | Tanggal kedaluwarsa               |
| ppn          | float     | Persentase pajak (0.11 misalnya)  |
| laba         | float     | Persentase keuntungan             |

Relasi:
- PRODUK → many-to-one → KATEGORI_PRODUK
- PRODUK → many-to-many → PENJUALAN via DETAIL_PENJUALAN
- PRODUK → many-to-many → PEMBELIAN

---

## 🚚 SUPPLIER

Informasi pemasok produk.

| Kolom         | Tipe Data | Keterangan           |
|---------------|-----------|----------------------|
| supplier_id   | int       | Primary Key         |
| nama_supplier | string    | Nama supplier       |
| kontak        | string    | Nomor/Email kontak  |
| alamat        | string    | Alamat lengkap      |

Relasi:
- SUPPLIER → 1-to-many → PEMBELIAN

---

## 🧾 PEMBELIAN

Transaksi pembelian barang dari supplier oleh admin.

| Kolom        | Tipe Data | Keterangan                    |
|--------------|-----------|-------------------------------|
| pembelian_id | int       | Primary Key                  |
| produk_id    | int       | Foreign Key → PRODUK         |
| supplier_id  | int       | Foreign Key → SUPPLIER       |
| user_id      | int       | Foreign Key → USER (Admin)   |
| jumlah       | int       | Jumlah barang dibeli         |
| total_harga  | float     | Total harga                  |
| tanggal      | date      | Tanggal pembelian            |

---

## 💵 PENJUALAN

Transaksi penjualan barang oleh kasir.

| Kolom        | Tipe Data | Keterangan                  |
|--------------|-----------|-----------------------------|
| penjualan_id | int       | Primary Key                |
| user_id      | int       | Foreign Key → USER (Kasir) |
| tanggal      | date      | Tanggal transaksi          |
| total_harga  | float     | Jumlah total transaksi     |

---

## 🧾 DETAIL_PENJUALAN

Detail dari setiap produk dalam transaksi penjualan.

| Kolom         | Tipe Data | Keterangan                    |
|---------------|-----------|-------------------------------|
| detail_id     | int       | Primary Key                  |
| penjualan_id  | int       | Foreign Key → PENJUALAN      |
| produk_id     | int       | Foreign Key → PRODUK         |
| jumlah        | int       | Jumlah produk dijual         |
| harga_satuan  | float     | Harga per item               |
| subtotal      | float     | harga_satuan × jumlah        |

---

## 💳 PEMBAYARAN

Data pembayaran dari pelanggan atas transaksi.

| Kolom             | Tipe Data | Keterangan                      |
|-------------------|-----------|---------------------------------|
| pembayaran_id     | int       | Primary Key                    |
| penjualan_id      | int       | Foreign Key → PENJUALAN        |
| metode_pembayaran | string    | Tunai / Transfer / e-Wallet    |
| total_pembayaran  | float     | Jumlah dibayarkan              |
| struk             | string    | (opsional) nama file bukti     |

---

## ⚙️ KONFIGURASI

Pengaturan global sistem apotek.

| Kolom          | Tipe Data | Keterangan              |
|----------------|-----------|-------------------------|
| konfigurasi_id | int       | Primary Key            |
| nama_apotek    | string    | Nama apotek            |
| alamat         | string    | Alamat apotek          |
| pajak_persen   | float     | PPN default (ex: 0.11) |

---

## 🔗 Relasi Utama

- USER (1) → (N) PEMBELIAN
- USER (1) → (N) PENJUALAN
- KATEGORI_PRODUK (1) → (N) PRODUK
- PRODUK (1) → (N) PEMBELIAN
- PRODUK (1) → (N) DETAIL_PENJUALAN
- SUPPLIER (1) → (N) PEMBELIAN
- PENJUALAN (1) → (1) PEMBAYARAN
- PENJUALAN (1) → (N) DETAIL_PENJUALAN


Gambaran ERD
![alt text](<IMG/ERD Pharmasys.drawio.png>)

---

- ### Membuat kasaran mockup aplikasi


- ### Menentukan teknologi yang akan digunakan
  
## Challenges & Solutions
- **Challenge 1**: Kurang memahami cara menghubungkan database lokal dari PC 1 ke PC lain
  - **Solution**: Masih mencari cara dengan menonton video tutorial dan membaca dokumentasi resmi dari MySQL.
- **Challenge 2**: Kurang memahami penggunaan framework Laravel 
  - **Solution**: Membaca dokumentasi yang ada dan mencari tutorial dari sumber manapun

## Next Week Plan
- Membuat ERD (Entity Relationship Diagram)
- Membuat BE skeleton
- Membuat FE skeleton

## Contributions
- **Adam Ibnu Ramadhan**: Melakukan wawancara, Mencari cara untuk menghubungkan database lokal dari PC 1 ke PC lain
- **Muhammad Bagas Setiawan**: Melakukan wawancara, Membuat mockup
- **Putu Ngurah Semara**: Melakukan wawancara, Membuat laporan
- **Raisha Alika Irwandira**: Melakukan wawancara, Membuat surat mitra dan melakukan notulensi
- **Rendy Rifandi Kurnia**: Melakukan wawancara, Mencari cara untuk menghubungkan database lokal dari PC 1 ke PC lain
## Screenshots / Demo
[Sertakan screenshot atau link demo aplikasi minggu ini]