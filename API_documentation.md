# Dokumentasi API Pharmasys-Vite

## Gambaran Umum

Dokumen ini menyediakan dokumentasi lengkap untuk API Pharmasys-Vite, sebuah API untuk sistem manajemen apotek. API ini memungkinkan pengguna yang terautentikasi untuk berinteraksi dengan notifikasi dan mengakses informasi pengguna.

## URL Dasar

Semua endpoint API menggunakan URL dasar berikut:

```
/api
```

## Autentikasi

Sebagian besar endpoint API memerlukan autentikasi menggunakan Laravel Sanctum. Cara mengautentikasi:

1. Pengguna harus terlebih dahulu login melalui antarmuka web
2. Autentikasi berbasis sesi kemudian akan berfungsi untuk permintaan API

> **Catatan Penting**: Fitur otentikasi seperti login, registrasi, reset password, dan verifikasi email **tidak** diimplementasikan sebagai API endpoints. Fitur-fitur ini menggunakan rute web Laravel tradisional melalui Inertia.js dan didefinisikan dalam `routes/auth.php`. Saat pengguna berhasil login melalui antarmuka web, mereka mendapatkan session yang valid yang kemudian dapat digunakan untuk mengakses endpoint API.

## Format Respons Standar

### Respons Sukses

```json
{
  "status": "success",
  "data": { ... } // Objek data opsional
}
```

### Respons Error

```json
{
  "status": "error",
  "message": "Deskripsi error"
}
```

## Endpoint API

### Pengguna

#### Mendapatkan Pengguna Terautentikasi

Mengembalikan informasi pengguna yang saat ini terautentikasi.

- **URL**: `/user`
- **Metode**: `GET`
- **Autentikasi diperlukan**: Ya (Sanctum)
- **Header**:
  - Content-Type: application/json
  - Accept: application/json

**Contoh Respons**:

```json
{
  "id": 1,
  "name": "Pengguna Contoh",
  "email": "pengguna@contoh.com",
  "email_verified_at": "2023-01-01T00:00:00.000000Z",
  "created_at": "2023-01-01T00:00:00.000000Z",
  "updated_at": "2023-01-01T00:00:00.000000Z"
}
```

### Notifikasi

#### Mendapatkan Semua Notifikasi

Mengambil semua notifikasi untuk pengguna yang terautentikasi.

- **URL**: `/notifications`
- **Metode**: `GET`
- **Autentikasi diperlukan**: Ya (Web)
- **Header**:
  - Content-Type: application/json
  - Accept: application/json

**Contoh Respons**:

```json
[
  {
    "id": 1,
    "title": "Pesanan Baru",
    "description": "Pesanan baru telah dibuat",
    "time": "2 jam yang lalu",
    "unread": true,
    "type": "order",
    "link": "/orders/123"
  },
  {
    "id": 2,
    "title": "Peringatan Stok Rendah",
    "description": "Produk XYZ hampir habis stoknya",
    "time": "1 hari yang lalu",
    "unread": false,
    "type": "inventory",
    "link": "/inventory/xyz"
  }
]
```

#### Menandai Notifikasi Sebagai Telah Dibaca

Menandai notifikasi tertentu sebagai telah dibaca. Jika tidak ada ID yang diberikan, semua notifikasi akan ditandai sebagai telah dibaca.

- **URL**: `/notifications/mark-read/{id?}`
- **Metode**: `POST`
- **Autentikasi diperlukan**: Ya (Web)
- **Parameter URL**:
  - `id` (opsional): ID notifikasi yang akan ditandai sebagai telah dibaca

**Contoh Respons (Sukses)**:

```json
{
  "status": "success"
}
```

**Contoh Respons (Error)**:

```json
{
  "status": "error",
  "message": "Notifikasi tidak ditemukan"
}
```

#### Menghapus Notifikasi

Menghapus notifikasi tertentu.

- **URL**: `/notifications/{id}`
- **Metode**: `DELETE`
- **Autentikasi diperlukan**: Ya (Web)
- **Parameter URL**:
  - `id`: ID notifikasi yang akan dihapus

**Contoh Respons (Sukses)**:

```json
{
  "status": "success"
}
```

**Contoh Respons (Error)**:

```json
{
  "status": "error",
  "message": "Notifikasi tidak ditemukan"
}
```

## Kode Error

API ini menggunakan kode status HTTP standar:

- `200 OK`: Permintaan berhasil
- `401 Unauthorized`: Autentikasi gagal
- `403 Forbidden`: Pengguna yang terautentikasi tidak memiliki izin
- `404 Not Found`: Sumber daya yang diminta tidak ditemukan
- `422 Unprocessable Entity`: Data permintaan gagal validasi
- `500 Internal Server Error`: Terjadi kesalahan server

## Pembatasan Rate

Permintaan API dibatasi untuk mencegah penyalahgunaan. Secara default, rute API dibatasi hingga 60 permintaan per menit per pengguna.

## Pengembangan API di Masa Depan

Dokumentasi API ini mencakup endpoint yang ada saat ini. Seiring dengan pengembangan sistem Pharmasys-Vite, endpoint tambahan akan ditambahkan untuk:

1. **Manajemen Produk** - Operasi CRUD untuk produk apotek
2. **Manajemen Inventaris** - Pelacakan dan pembaruan stok
3. **Operasi Penjualan** - Pemrosesan penjualan dan pengambilan data penjualan
4. **Manajemen Pembelian** - Pengelolaan pesanan supplier
5. **Pembuatan Laporan** - Mengakses laporan sistem dalam berbagai format
6. **API Otentikasi** - Implementasi endpoint API untuk login, pendaftaran, dan manajemen sesi

> **Catatan tentang Otentikasi**: Saat ini, fitur otentikasi seperti login, pendaftaran, dan reset password menggunakan rute web Laravel tradisional, bukan endpoint API. Jika Anda perlu mengintegrasikan aplikasi eksternal yang membutuhkan API otentikasi, pertimbangkan untuk mengimplementasikan endpoint API khusus untuk otentikasi di masa depan.

Silakan merujuk ke versi dokumentasi ini di masa depan saat fitur-fitur tersebut diimplementasikan.
