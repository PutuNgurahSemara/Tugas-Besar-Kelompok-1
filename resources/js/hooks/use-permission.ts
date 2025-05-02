import { usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';

/**
 * Hook untuk memeriksa apakah pengguna memiliki izin tertentu
 */
export function usePermission() {
  const { auth } = usePage<SharedData>().props;

  /**
   * Memeriksa apakah pengguna memiliki role tertentu
   */
  const hasRole = (role: string): boolean => {
    try {
      if (!auth || !auth.user || !auth.user.roles) {
        return false;
      }

      // Pastikan roles adalah array
      const roles = Array.isArray(auth.user.roles) ? auth.user.roles : [];
      return roles.some((userRole: any) => userRole.name === role);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  };

  /**
   * Memeriksa apakah pengguna memiliki izin tertentu
   */
  const hasPermission = (permission: string): boolean => {
    try {
      if (!auth || !auth.user) {
        return false;
      }

      // Periksa dari property permissions_list langsung
      if (auth.user.permissions_list && Array.isArray(auth.user.permissions_list)) {
        return auth.user.permissions_list.includes(permission);
      }

      // Jika tidak ditemukan, cek di roles.permissions
      if (auth.user.roles && Array.isArray(auth.user.roles)) {
        // Iterasi semua role untuk mencari permission
        return auth.user.roles.some(role => 
          role.permissions && 
          Array.isArray(role.permissions) && 
          role.permissions.some(p => p.name === permission)
        );
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  /**
   * Memeriksa apakah pengguna memiliki akses ke fitur tertentu
   * berdasarkan role atau permission
   */
  const hasAccess = (permission: string): boolean => {
    try {
      // Super Admin selalu memiliki akses ke semua fitur
      if (hasRole('super-admin')) {
        return true;
      }

      // Admin juga memiliki akses penuh
      if (hasRole('admin')) {
        return true;
      }

      return hasPermission(permission);
    } catch (error) {
      console.error('Error checking access:', error);
      return false;
    }
  };

  return {
    hasRole,
    hasPermission,
    hasAccess
  };
} 