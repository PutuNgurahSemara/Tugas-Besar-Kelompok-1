# PharmaSys Docker Setup

Panduan cara menjalankan aplikasi PharmaSys menggunakan Docker.

## Prerequisites

Pastikan komputer client sudah terinstall:
- [Docker](https://www.docker.com/products/docker-desktop) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

## Cara Menjalankan

### 1. Clone/Copy Project ke Laptop Client

Copy semua file project ke laptop, pastikan ada file-file berikut:
- `Dockerfile`
- `docker-compose.yml`
- `nginx.conf`
- `supervisord.conf`
- `.env.docker`

### 2. Setup Environment

Copy file `.env.docker` menjadi `.env`, dan pastikan variabel berikut sudah diatur untuk PostgreSQL:

```bash
DB_CONNECTION=pgsql
DB_HOST=database
DB_PORT=5432
DB_DATABASE=nama_database
DB_USERNAME=nama_user
DB_PASSWORD=password_anda
```

```bash
cp .env.docker .env
```

### 3. Build dan Jalankan Docker

```bash
# Build dan jalankan container
docker-compose up -d --build
```

Tunggu hingga build selesai (pertama kali bisa memakan waktu 5-10 menit).

### 4. Setup Database

Masuk ke container PHP dan jalankan migration:

```bash
# Masuk ke container
docker-compose exec php bash

# Generate app key
php artisan key:generate

# Jalankan migration
php artisan migrate

# (Opsional) Seed data
php artisan db:seed
```

### 5. Akses Aplikasi

Buka browser dan akses:
- **URL**: http://localhost

## Struktur Container

| Service  | Port | Deskripsi          |
|----------|------|--------------------|
| nginx    | 80   | Web Server         |
| php      | 9000 | PHP-FPM            |
| database | 5432 | PostgreSQL 15 (atau latest) |

## Command Berguna

```bash
# Melihat logs
docker-compose logs -f

# Melihat logs service tertentu
docker-compose logs -f nginx
docker-compose logs -f php
docker-compose logs -f database

# Restart service
docker-compose restart php

# Stop container
docker-compose down

# Hapus semua data (termasuk database)
docker-compose down -v

# Eksekusi perintah artisan
docker-compose exec php php artisan list

# Masuk ke container
docker-compose exec php bash
```

## Masalah Umum

### Container tidak bisa start
```bash
# Hapus container dan rebuild
docker-compose down
docker-compose up -d --build
```

### Database connection error
Pastikan container database sudah running:
```bash
docker-compose ps
```

### Permission denied
```bash
docker-compose exec php chown -R www-data:www-data /var/www/storage
docker-compose exec php chmod -R 755 /var/www/storage
```

## Untuk Development

Jika ingin development, mount volume secara live:

```bash
docker-compose up -d
```

Edit file di laptop client dan perubahan akan langsung terlihat.

## Untuk Production

Untuk deployment di client, bisa menggunakan konfigurasi yang lebih secure:
- Set `APP_DEBUG=false` di `.env`
- Gunakan password yang kuat untuk database
- Setup SSL/HTTPS dengan certbot

---

**Catatan**: Jika ingin memindahkan ke laptop, cukup copy folder project lengkap (termasuk folder `.git` jika ada) dan jalankan langkah di atas. Pastikan environment variabel database sudah disesuaikan untuk PostgreSQL seperti `DB_CONNECTION=pgsql` dan port `5432`.
