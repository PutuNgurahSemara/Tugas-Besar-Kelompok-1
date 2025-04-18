
# Laporan Progres Mingguan - Pharmasys
**Kelompok**: 1
**Mitra**: Tiarana Farma
**Pekan ke-**: 9
**Tanggal**: 10/04/2025

## Progress Summary
Pada minggu ini kelompok kami telah membuat Backend dan Frontend aplikasi Pharmasys. Kami juga telah melakukan integrasi antara kedua bagian tersebut.

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


## Gambaran ERD

![alt text](<IMG/ERD Pharmasys.drawio.png>)

---

- ### ⚙️ 2. Backend Skeleton

### Framework: Laravel

### Endpoint yang telah dibuat
| Method | Endpoint                  | Deskripsi                      |
|--------|---------------------------|--------------------------------|
| GET    | `/admin/products`         | Menampilkan daftar produk      |
| POST   | `/admin/products`         | Menambah produk                |
| GET    | `/admin/sales`            | Menampilkan daftar penjualan   |
| POST   | `/admin/sales`            | Menambahkan transaksi penjualan |

Endpoint dapat diakses melalui web route (`web.php`)

---



- ### 🎨 3. Frontend Skeleton

### Framework: React

### Halaman dan Routing:
- `/dashboard` → Menampilkan halaman dashboard kosong
- `/products` → Menampilkan halaman produk kosong

Contoh struktur routing dasar:
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
      </Routes>
    </BrowserRouter>
  );
}
```

> Tampilan UI masih berupa halaman kosong dan akan dikembangkan lebih lanjut pada minggu berikutnya.

---
  
## Challenges & Solutions
- **Challenge 1**: Database sempat mengalami error sehingga tidak terhubung dengan backend dan frontend.
  - **Solution**: Debugging menggunakan AI untuk mendeteksi kesalahan dan memperbaiki error.

## Next Week Plan
- Membuat Auth system
- Membuat beberapa fitur utama
- Melakukan tes internal  

## Contributions
- **Adam Ibnu Ramadhan**: Membuat rancangan DB
- **Muhammad Bagas Setiawan**: Membuat BE dan FE skeleton
- **Putu Ngurah Semara**: Membuat rancangan DB
- **Raisha Alika Irwandira**: ...
- **Rendy Rifandi Kurnia**: ...
