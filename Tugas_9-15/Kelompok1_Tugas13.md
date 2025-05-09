# Laporan Progres Mingguan - Pharmasys

**Kelompok**: 1

**Nama anggota kelompok:**
- Adam Ibnu Ramadhan (10231003)
- Muhammad Bagas Setiawan (10231061)
- Putu Ngurah Semara (10231075)
- Raisha Alika Irwandira (10231077)
- Rendy Rifandi Kurnia (10231081)

**Mitra**: Tiarana Farma

**Pekan ke-**: 12

**Tanggal**: 1/05/2025

## Progress Summary


## Accomplished Tasks

---

- ### Menyelesaikan Fitur Pada Role Kasir

    Pada minggu ini kami berhasil menyelesaikan fitur untuk role kasir sehingga pada akun kasir dapat melakukan penjualan. Fitur ini meliputi memilih produk yang dipilih pelanggan dan menambahkan dalam keranjang yang kemudian akan ditotal untuk menampilkan harga yang harus dibayarkan pelanggan; Tampilan dashboard yang menunjukkan pie chart dari penjualan, List produk yang baru baru terjual, dan jumlah produk yang expired; Akun kasir juga bisa melakukan perubahan pada foto profilenya untuk menyesuaikan dengan kemauannya. 
---

- ### Menambahkan Fitur Yang Ada Pada Role Admin 
     Sebelumnya pada role admin hanya bisa melakukan CRUD produk obat namun sekarang kami menambahkan fitur seperti supplier untuk menentukan obat yang akan di restock, Report untuk menampilkan laporan penghasilan selama kurun waktu tertentu, access controll untuk mengubah akses dari suatu akun kasir agar dapat menggunakan fitur lain yang ada, User dimana admin dapat menghapus akun akun yang ada, Profile dimana admin bisa mengubah foto profilenya, dan Setting untuk mengatur tampilan aplikasi

---


- ### Memperbaiki Fitur Yang Ada Pada Role Admin 
     Sebelumnya pada role admin terdapat fitur fitur yang baru ditambahkan dan mengalami error saat kami melakukan demo dengan stakeholder seperti fitur supplier yang tidak terhubung dengan database, dan lain lain


---

- ### Melakukan Testing Dengan Mitra
  Minggu ini kami melakukan testing bersama dengan mitra dimana sempat terjadi error pada fitur yang belum kami selesaikan. Dari pihak mitra meminta untuk menambahkan beberapa perubahan pada beberapa fitur yang mana dirasa kurang sesuai dengan yang dibutuhkan

---

## Test Case
| ID Test Case | Deskripsi                         | Langkah Uji                                                                 | Data Uji                        | Output Diharapkan                        | Hasil Aktual | Status |
|--------------|-----------------------------------|-----------------------------------------------------------------------------|----------------------------------|-------------------------------------------|---------------|--------|
| 1        | Menambahkan Category           | 1. Buka halaman Categories <br> 2. Tekan tombol Add Category <br> 3. Ketik nama kategori baru <br> 4. Tekan tombol Save Change | Vitamin <br> | Data Category baru dapat masuk ke dalam database dan muncul pada tabel            | Sesuai       | Pass   |
| 2        |  Menambahkan Supplier       | 1. Buka halaman supplier <br> 2. Tekan tombol Add New <br> 3. Isi data dari suuplier yang diperlukan <br> 4. Tekan submit  | Name: Ican CodeWW <br> Email: mahasiswaSI@itk.ac.id <br> Phone: 085433535365 <br> Company: SukaTani.net <br> Address: jl sadaw <br> product: Vitamin <br> Comment: Apa aja yang penting ok | Data supplier baru ditambahkan dalam tabel dan database        | Sesuai       | Pass   |
| 3        | Melihat Sale Report         | 1. Buka halaman sale report pada dropdown Report <br> 2. Klik tombol “Generate Report” <br> 3. Isi tanggal awal hingga akhir yang ingin dicek <br> 4. Klik Submit | From: 01/04/2025 <br> To: 02/05/2025 | Menampilkan data penjualan dalam bentuk tabel   | Sesuai       | Pass   |



## Challenges & Solutions
- **Challenge 1**: Kurangnya partisipasi anggota lain dalam pengerjaan proyek
  - **Solution**: Mengerjakan sebisa mungkin dengan sumber daya manusia yang ada untuk menyelesaikan projek.

## Next Week Plan
- Memperbaiki fitur yang sudah ada
- Melakukan perbaikan UI
- Melakukan Unit Test
- Melakukan pengujuian dengan mitra

## Contributions
- **Adam Ibnu Ramadhan**: Mengerjakan perbaikan fitur sebelumnya
- **Muhammad Bagas Setiawan**:  Mengerjakan fitur lanjutan
- **Putu Ngurah Semara**: Mengubah tampilan pada beberapa halaman 
- **Raisha Alika Irwandira**:  Menghubungi mitra
- **Rendy Rifandi Kurnia**: Menghubungi mitra

## Screenshoot
### Fitur Supplier
![alt text](IMG/Supplier.png)
### Fitur Report
![alt text](IMG/Sales.png)
### Fitur Access Controll
![alt text](IMG/Access%20Controll.png)
### Fitur User
![alt text](IMG/User.png)
### Fitur Profile
![alt text](IMG/Profile.png)
### Fitur Setting
![alt text](IMG/Setting.png)
### Dokumentasi Bersama Mitra
![alt text](IMG/DokumentasiMitra.jpeg)

### test case
- ### TC1
  - ### Langkah 1 dan 2
  ![alt text](IMG/cate.png)
  - ### Langkah 3 dan 4
  ![alt text](<IMG/Add Cate.png>)
  - ### Hasil
  ![alt text](IMG/hasilTC1.png)


- ### TC2
  - ### Langkah 1 dan 2
  ![alt text](IMG/supp.png)
  - ### Langkah 3 dan 4
  ![alt text](IMG/crtsupp.png)
  - ### Hasil
  ![alt text](IMG/hasilTC2.png)

- ### TC3 
  - ### Langkah 1 dan 2
  ![alt text](IMG/Report.png)
  - ### Langkah 3 dan 4
  ![alt text](IMG/addrept.png)
  - ### Hasil
  ![alt text](IMG/hasilTC3.png)