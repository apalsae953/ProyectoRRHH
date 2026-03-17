/**
 * Enmascara un DNI para mostrar solo los últimos 4 caracteres y la letra.
 * Ejemplo: 12345678X -> ****5678X
 * @param {string} dni 
 * @returns {string}
 */
export const maskDni = (dni) => {
    if (!dni) return '';
    const cleanDni = dni.trim();
    if (cleanDni.length <= 4) return cleanDni;
    
    const visiblePart = cleanDni.slice(-5);
    const maskedPart = '*'.repeat(cleanDni.length - 5);
    
    return maskedPart + visiblePart;
};
