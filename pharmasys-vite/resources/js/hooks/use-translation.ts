import { useEffect, useState } from 'react';

// Data terjemahan untuk semua teks dalam aplikasi
interface Translations {
  [key: string]: {
    id: string;
    en: string;
  };
}

// Data terjemahan untuk semua teks aplikasi
const translations: Translations = {
  // Menu utama
  'dashboard': { id: 'Dashboard', en: 'Dashboard' },
  'categories': { id: 'Kategori', en: 'Categories' },
  'purchase': { id: 'Pembelian', en: 'Purchase' },
  'purchase.list': { id: 'Daftar Pembelian', en: 'Purchase List' },
  'purchase.add': { id: 'Tambah Pembelian', en: 'Add Purchase' },
  'products': { id: 'Produk', en: 'Products' },
  'products.list': { id: 'Daftar Produk', en: 'Product List' },
  'products.add': { id: 'Tambah Produk', en: 'Add Product' },
  'products.expired': { id: 'Obat Kedaluwarsa', en: 'Expired Medicine' },
  'products.outstock': { id: 'Stok Menipis', en: 'Low Stock' },
  'sales': { id: 'Penjualan', en: 'Sales' },
  'sales.transactions': { id: 'Riwayat Penjualan', en: 'Sales History' },
  'sales.pos': { id: 'Kasir', en: 'Cashier' },
  'supplier': { id: 'Supplier', en: 'Supplier' },
  'reports': { id: 'Laporan', en: 'Reports' },
  'reports.sales': { id: 'Riwayat Penjualan', en: 'Sales History' },
  'reports.purchase': { id: 'Laporan Pembelian', en: 'Purchase Report' },
  'access': { id: 'Hak Akses', en: 'Access Rights' },
  'users': { id: 'Pengguna', en: 'Users' },
  'roles': { id: 'Peran', en: 'Roles' },
  'permissions': { id: 'Izin', en: 'Permissions' },
  'settings': { id: 'Pengaturan', en: 'Settings' },
  'profile': { id: 'Profil Pengguna', en: 'User Profile' },
  'app.settings': { id: 'Pengaturan Aplikasi', en: 'App Settings' },
  
  // Tema
  'dark.mode': { id: 'Mode Gelap', en: 'Dark Mode' },
  'light.mode': { id: 'Mode Terang', en: 'Light Mode' },
  
  // Notifikasi
  'low.stock': { id: 'Stok Obat Rendah', en: 'Low Medicine Stock' },
  'new.order': { id: 'Pesanan Baru', en: 'New Order' },
  'payment.received': { id: 'Pembayaran Diterima', en: 'Payment Received' },
  'minutes.ago': { id: 'menit lalu', en: 'minutes ago' },
  'hour.ago': { id: 'jam lalu', en: 'hour ago' },
  
  // Login
  'login': { id: 'Masuk', en: 'Login' },
  'login.credentials': { id: 'Masukkan kredensial Anda untuk mengakses akun', en: 'Enter your credentials to access your account' },
  'email': { id: 'Email', en: 'Email' },
  'password': { id: 'Kata Sandi', en: 'Password' },
  'forgot.password': { id: 'Lupa kata sandi?', en: 'Forgot password?' },
  'remember.me': { id: 'Ingat saya', en: 'Remember me' },
  'no.account': { id: 'Belum punya akun?', en: 'Don\'t have an account?' },
  'contact.admin': { id: 'Hubungi admin', en: 'Contact admin' },
  'demo.credentials': { id: 'Kredensial Demo:', en: 'Demo Credentials:' },
  
  // Kasir
  'products.title': { id: 'Produk', en: 'Products' },
  'search.products': { id: 'Cari produk...', en: 'Search products...' },
  'out.of.stock': { id: 'Stok habis', en: 'Out of stock' },
  'add.to.cart': { id: 'Tambahkan ke keranjang', en: 'Add to cart' },
  'no.image': { id: 'Tidak ada gambar', en: 'No Image' },
  'stock': { id: 'Stok:', en: 'Stock:' },
  'no.products': { id: 'Tidak ada produk ditemukan.', en: 'No products found.' },
  'cart': { id: 'Keranjang', en: 'Cart' },
  'cart.empty': { id: 'Keranjang kosong', en: 'Cart is empty' },
  'item': { id: 'Item', en: 'Item' },
  'qty': { id: 'Jml', en: 'Qty' },
  'subtotal': { id: 'Subtotal', en: 'Subtotal' },
  'del': { id: 'Hapus', en: 'Del' },
  'total': { id: 'Total', en: 'Total' },
  'amount.paid': { id: 'Jumlah Dibayar', en: 'Amount Paid' },
  'enter.amount': { id: 'Masukkan jumlah yang diterima', en: 'Enter amount received' },
  'processing': { id: 'Memproses...', en: 'Processing...' },
  'complete.sale': { id: 'Selesaikan Penjualan', en: 'Complete Sale' },
  'payment.success': { id: 'Pembayaran Berhasil!', en: 'Payment Successful!' },
  'transaction.saved': { id: 'Transaksi penjualan telah disimpan.', en: 'Sales transaction has been saved.' },
  'close': { id: 'Tutup', en: 'Close' },
  'payment.failed': { id: 'Pembayaran Gagal!', en: 'Payment Failed!' },
  'transaction.error': { id: 'Terjadi kesalahan saat memproses transaksi.', en: 'An error occurred while processing the transaction.' },
  
  // Pengaturan
  'general.settings': { id: 'Pengaturan Umum', en: 'General Settings' },
  'general': { id: 'Umum', en: 'General' },
  'appearance': { id: 'Tampilan', en: 'Appearance' },
  'language': { id: 'Bahasa', en: 'Language' },
  'app.config': { id: 'Konfigurasi pengaturan dasar aplikasi PharmaSys', en: 'Configure PharmaSys basic settings' },
  'app.name': { id: 'Nama Aplikasi', en: 'App Name' },
  'app.name.desc': { id: 'Nama untuk aplikasi ini', en: 'Name for this application' },
  'currency': { id: 'Mata Uang', en: 'Currency' },
  'currency.desc': { id: 'Simbol mata uang (contoh: Rp, $, €)', en: 'Currency symbol (example: Rp, $, €)' },
  'logo.favicon': { id: 'Logo & Favicon', en: 'Logo & Favicon' },
  'visual.identity': { id: 'Identitas visual aplikasi', en: 'App visual identity' },
  'upload.logo': { id: 'Upload Logo', en: 'Upload Logo' },
  'logo.size': { id: 'Disarankan ukuran gambar 150px x 150px', en: 'Recommended image size 150px x 150px' },
  'upload.favicon': { id: 'Upload Favicon', en: 'Upload Favicon' },
  'favicon.size': { id: 'Disarankan ukuran gambar 16px x 16px atau 32px x 32px', en: 'Recommended image size 16px x 16px or 32px x 32px' },
  'delete': { id: 'Hapus', en: 'Remove' },
  'language.settings': { id: 'Pengaturan Bahasa', en: 'Language Settings' },
  'language.config': { id: 'Konfigurasi bahasa aplikasi', en: 'Configure application language' },
  'default.language': { id: 'Bahasa Default', en: 'Default Language' },
  'language.main': { id: 'Bahasa utama yang digunakan dalam aplikasi', en: 'Main language used in the application' },
  'indonesian': { id: 'Indonesia', en: 'Indonesian' },
  'english': { id: 'Inggris', en: 'English' },
  'reset': { id: 'Reset', en: 'Reset' },
  'saving': { id: 'Menyimpan...', en: 'Saving...' },
  'save.settings': { id: 'Simpan Pengaturan', en: 'Save Settings' },
  
  // Umum
  'search': { id: 'Cari', en: 'Search' },
  'search.placeholder': { id: 'Cari menu, fitur, halaman...', en: 'Search menus, features, pages...' },
  'search.tip': { id: 'Cari menu atau fitur (contoh: "produk", "kasir", "laporan")', en: 'Search for menus or features (example: "products", "pos", "reports")' },
  'search.results': { id: 'Hasil Pencarian', en: 'Search Results' },
  'no.results': { id: 'Tidak ada hasil untuk', en: 'No results for' },
  'logout': { id: 'Keluar', en: 'Logout' },
  'logout.confirm': { id: 'Apakah Anda yakin ingin keluar?', en: 'Are you sure you want to log out?' },
  
  // Halaman Permission
  'add.permission': { id: 'Tambah Izin', en: 'Add Permission' },
  'name': { id: 'Nama', en: 'Name' },
  'created.date': { id: 'Tanggal Dibuat', en: 'Created Date' },
  'actions': { id: 'Aksi', en: 'Actions' },
  'no.permissions.found': { id: 'Tidak ada izin ditemukan', en: 'No permissions found' },
  'show': { id: 'Tampilkan', en: 'Show' },
  'entries': { id: 'entri', en: 'entries' },
  'permission.deleted': { id: 'Izin Dihapus', en: 'Permission Deleted' },
  'permission.deleted.message': { id: 'Izin berhasil dihapus', en: 'Permission successfully deleted' },
  'error': { id: 'Error', en: 'Error' },
  'permission.delete.error': { id: 'Gagal menghapus izin', en: 'Failed to delete permission' },
  'permission.added': { id: 'Izin Ditambahkan', en: 'Permission Added' },
  'permission.added.message': { id: 'Izin baru berhasil ditambahkan', en: 'New permission successfully added' },
  'permission.updated': { id: 'Izin Diperbarui', en: 'Permission Updated' },
  'permission.updated.message': { id: 'Izin berhasil diperbarui', en: 'Permission successfully updated' },
  'permission.details': { id: 'Detail Izin', en: 'Permission Details' },
  'permission.name.format': { id: 'Format: aksi-modul (contoh: view-users, create-product)', en: 'Format: action-module (example: view-users, create-product)' },
  'guard': { id: 'Guard', en: 'Guard' },
  'save': { id: 'Simpan', en: 'Save' },
  'cancel': { id: 'Batal', en: 'Cancel' },
  'back': { id: 'Kembali', en: 'Back' },
  'edit.permission': { id: 'Edit Izin', en: 'Edit Permission' },
  'edit': { id: 'Edit', en: 'Edit' },
  
  // Permission Show Page
  'permission': { id: 'Izin', en: 'Permission' },
  'users.with.permission': { id: 'Pengguna dengan Izin Ini', en: 'Users with This Permission' },
  'has.permission': { id: 'Memiliki Izin', en: 'Has Permission' },
  'assign.permission': { id: 'Berikan Izin', en: 'Assign Permission' },
  'assign.permission.desc': { id: 'Berikan izin ini ke pengguna', en: 'Assign this permission to a user' },
  'select.user': { id: 'Pilih Pengguna', en: 'Select User' },
  'select.user.placeholder': { id: 'Pilih pengguna...', en: 'Select a user...' },
  'assign': { id: 'Berikan', en: 'Assign' },
  'remove': { id: 'Cabut', en: 'Remove' },
  'no.users.found': { id: 'Tidak ada pengguna ditemukan', en: 'No users found' },
  'confirm.remove.permission': { id: 'Yakin ingin mencabut izin dari', en: 'Are you sure you want to remove this permission from' },
  'permission.assigned.success': { id: 'Izin berhasil diberikan kepada pengguna', en: 'Permission successfully assigned to user' },
  'permission.assigned.error': { id: 'Gagal memberikan izin kepada pengguna', en: 'Failed to assign permission to user' },
  'permission.removed.success': { id: 'Izin berhasil dicabut dari pengguna', en: 'Permission successfully removed from user' },
  'permission.removed.error': { id: 'Gagal mencabut izin dari pengguna', en: 'Failed to remove permission from user' },
  'success': { id: 'Berhasil', en: 'Success' },
  'view': { id: 'Lihat', en: 'View' },
  
  // Dokumentasi Permission
  'permission.info.title': { id: 'Informasi tentang Izin', en: 'About Permissions' },
  'permission.info.description': { id: 'Izin (Permissions) menentukan apa yang dapat dilakukan pengguna di dalam sistem PharmaSys. Berikut adalah beberapa hal penting tentang izin:', en: 'Permissions determine what users can do within the PharmaSys system. Here are some important things about permissions:' },
  'permission.info.item1': { id: 'Izin mengikuti format "aksi-modul", misalnya: view-products, edit-users, create-purchase, dll.', en: 'Permissions follow an "action-module" format, for example: view-products, edit-users, create-purchase, etc.' },
  'permission.info.item2': { id: 'Izin dapat diberikan kepada Peran (Roles), dan Peran diberikan kepada Pengguna.', en: 'Permissions can be assigned to Roles, and Roles are assigned to Users.' },
  'permission.info.item3': { id: 'Pengguna dapat memiliki beberapa izin dari berbagai peran, atau diberikan izin khusus.', en: 'Users can have multiple permissions from various roles, or be granted specific permissions.' },
  'permission.info.footer': { id: 'Pengelolaan izin dengan tepat sangat penting untuk keamanan aplikasi.', en: 'Proper management of permissions is crucial for application security.' },
  
  // User permission status
  'has.permission.yes': { id: 'Memiliki Izin', en: 'Has Permission' },
  'has.permission.no': { id: 'Tidak Memiliki Izin', en: 'No Permission' },
  'search.users': { id: 'Cari pengguna...', en: 'Search users...' },
  'no.search.results': { id: 'Tidak ada hasil untuk', en: 'No results for' },
  
  // Halaman Roles
  'edit.role': { id: 'Edit Peran', en: 'Edit Role' },
  'role.basic.info': { id: 'Informasi Dasar', en: 'Basic Information' },
  'role.basic.info.desc': { id: 'Informasi dasar tentang peran', en: 'Basic information about the role' },
  'role.permissions.desc': { id: 'Pilih izin yang akan diberikan kepada peran ini', en: 'Select permissions to be granted to this role' },
  'save.changes': { id: 'Simpan Perubahan', en: 'Save Changes' },
  'role.updated.success': { id: 'Peran berhasil diperbarui', en: 'Role updated successfully' },
  'role.updated.error': { id: 'Gagal memperbarui peran', en: 'Failed to update role' },
  'add.role': { id: 'Tambah Peran', en: 'Add Role' },
  'create.role': { id: 'Buat Peran', en: 'Create Role' },
  'role.created.success': { id: 'Peran berhasil dibuat', en: 'Role created successfully' },
  'role.created.error': { id: 'Gagal membuat peran', en: 'Failed to create role' },
  'select.all': { id: 'Pilih Semua', en: 'Select All' },
  'clear': { id: 'Bersihkan', en: 'Clear' },
  
  // User Management
  'create.user': { id: 'Buat Pengguna Baru', en: 'Create New User' },
  'add.new.user': { id: 'Tambah pengguna sistem baru', en: 'Add a new system user' },
  'new.password': { id: 'Kata Sandi Baru', en: 'New Password' },
  'confirm.new.password': { id: 'Konfirmasi Kata Sandi Baru', en: 'Confirm New Password' },
  'leave.blank.password': { id: 'Biarkan kosong untuk mempertahankan kata sandi saat ini', en: 'Leave blank to keep current password' },
  'update.user': { id: 'Perbarui Pengguna', en: 'Update User' },
  'save.user': { id: 'Simpan Pengguna', en: 'Save User' },
  'confirm.password': { id: 'Konfirmasi Kata Sandi', en: 'Confirm Password' },
  'assign.roles.to.user': { id: 'Tetapkan peran untuk pengguna ini', en: 'Assign roles to this user' },
  'no.roles.found': { id: 'Tidak ada peran ditemukan', en: 'No roles found' },
  'admin': { id: 'Admin', en: 'Admin' },
  'update.user.details': { id: 'Perbarui detail pengguna', en: 'Update user details' },
  'filter.by.category': { id: 'Filter berdasarkan kategori', en: 'Filter by category' },
  'all': { id: 'Semua', en: 'All' },
  'category': { id: 'Kategori', en: 'Category' },
};

export function useTranslation() {
  const [language, setLanguage] = useState<'id' | 'en'>('id');

  useEffect(() => {
    // Ambil bahasa dari localStorage
    const savedLanguage = localStorage.getItem('pharmasys-lang') as 'id' | 'en';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Fungsi untuk menerjemahkan teks
  const t = (key: string): string => {
    const translation = translations[key];
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    return translation[language];
  };

  // Fungsi untuk mengubah bahasa
  const changeLanguage = (lang: 'id' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('pharmasys-lang', lang);
    
    // Trigger event untuk memberitahu komponen lain bahwa bahasa telah diubah
    window.dispatchEvent(new Event('languageChanged'));
  };

  return { t, language, changeLanguage };
} 