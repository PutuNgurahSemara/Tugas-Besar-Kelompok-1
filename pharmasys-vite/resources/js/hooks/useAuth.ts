import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types/inertia';

export function useAuth() {
    const { props } = usePage<PageProps>();
    const auth = props.auth; // Access the auth object from page props

    // Cek apakah roles adalah array atau string atau tipe lain
    let roles: string[] = [];
    
    if (auth?.user?.roles) {
        console.log('Raw roles data:', auth.user.roles);

        // Cek apakah roles sudah dalam bentuk array
        if (Array.isArray(auth.user.roles)) {
            roles = auth.user.roles;
        } 
        // Cek apakah roles berupa string (untuk single role)
        else if (typeof auth.user.roles === 'string') {
            roles = [auth.user.roles];
        }
        // Jika roles adalah objek (mungkin format Laravel)
        else if (typeof auth.user.roles === 'object') {
            try {
                // Coba ekstrak nama role dari objek
                roles = Object.values(auth.user.roles)
                    .filter(role => role && typeof role === 'object' && 'name' in role)
                    .map(role => (role as any).name);
                
                // Jika tidak berhasil mengekstrak role, periksa format lain
                if (roles.length === 0) {
                    // Alternatif: mungkin roles adalah object dengan property khusus
                    const userRoles = (auth.user as any).user_roles || [];
                    if (Array.isArray(userRoles)) {
                        roles = userRoles
                            .filter(r => r && typeof r === 'object' && r.role && typeof r.role === 'object' && 'name' in r.role)
                            .map(r => r.role.name);
                    }
                }
            } catch (e) {
                console.error('Error parsing roles:', e);
            }
        }
    }

    // Cek jika admin berada di role ID 1 (sering terjadi di Laravel)
    // Atau jika email berakhiran @admin
    const isLikelyAdmin = auth?.user?.id === 1 || auth?.user?.email?.includes('admin');

    // Function to check if the user has a specific role
    const hasRole = (roleName: string): boolean => {
        if (roleName.toLowerCase() === 'admin') {
            // Cek apakah pengguna memiliki peran admin
            return isLikelyAdmin || roles.some(role => 
                typeof role === 'string' && 
                (role.toLowerCase() === 'admin' || role.toLowerCase().includes('admin'))
            );
        }

        // Untuk role lain, cek apakah ada dalam array roles
        return roles.some(role => 
            typeof role === 'string' && 
            role.toLowerCase() === roleName.toLowerCase()
        );
    };

    return {
        user: auth?.user,
        roles,
        hasRole,
        isAuthenticated: !!auth?.user,
        isAdmin: isLikelyAdmin || hasRole('admin') // Memudahkan pengecekan admin
    };
}
