import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types/inertia'; // Use PageProps from inertia.ts directly

export function useAuth() {
    const { props } = usePage<PageProps>();
    const auth = props.auth; // Access the auth object from page props

    // Ensure auth and user are defined, and roles is an array of strings
    const roles = auth?.user?.roles ?? []; // This is string[] based on inertia.ts

    // Function to check if the user has a specific role
    const hasRole = (roleName: string): boolean => {
        // Check if the roles array includes the role name
        return roles.includes(roleName);
    };

    // Note: The 'can' function based on direct permissions is removed
    // as permissions are not directly available on auth.user in PageProps.
    // Permission checking might need to be based on roles or handled differently.

    return {
        user: auth?.user, // Return the user object (typed as per inertia.ts)
        roles,            // Return the list of role names (string[])
        hasRole,          // Return the role checking function
        isAuthenticated: !!auth?.user, // Boolean check if user is logged in
    };
}
