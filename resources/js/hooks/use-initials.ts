export function useInitials() {
  return (name: string | undefined | null): string => {
    if (!name) return '';
    
    // Split name by spaces
    const nameParts = name.split(' ');
    
    // If only one part, return first letter
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    // Return first letter of first and last name
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(0)}`.toUpperCase();
  };
} 