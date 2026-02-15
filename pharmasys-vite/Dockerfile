# Minimal Dockerfile untuk klien yang belum punya environment

# Stage 1: Build frontend assets
FROM node:18-alpine as frontend-builder

WORKDIR /app

# Copy only package.json and package-lock.json for caching
COPY package.json package-lock.json ./

RUN npm install

# Copy frontend source files
COPY . .

RUN npm run build

# Stage 2: PHP-FPM final image
FROM php:8.2-fpm-alpine

# Install PHP and PostgreSQL dependencies, supervisor, and system utilities
RUN apk add --no-cache \
    bash \
    git \
    curl \
    libzip-dev \
    zip \
    unzip \
    supervisor \
    postgresql-dev \
    oniguruma-dev \
    && docker-php-ext-install pdo pdo_pgsql mbstring zip

# Set working directory
WORKDIR /var/www

# Copy backend source files
COPY . .

# Copy built frontend assets from frontend-builder stage
COPY --from=frontend-builder /app/public ./public

# Install Composer and PHP dependencies
RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
    && php composer-setup.php --install-dir=/usr/bin --filename=composer \
    && php -r "unlink('composer-setup.php');" \
    && composer install --no-dev --optimize-autoloader

# Set permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port 80
EXPOSE 80

# Start supervisor
CMD ["/usr/bin/supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
