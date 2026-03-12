/**
 * Funciones utilitarias
 */

/**
 * Escapa caracteres HTML para prevenir XSS
 */
function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Muestra una notificación toast
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Busca un bloque por ID en el árbol de bloques
 */
function findBlockById(blocks, id) {
    for (const block of blocks) {
        if (block.id === id) return block;
        // Buscar recursivamente en container, flex y grid
        if ((block.type === 'container' || block.type === 'flex' || block.type === 'grid') && block.children) {
            const found = findBlockById(block.children, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Inicializa propiedades faltantes en los bloques cargados
 */
function initializeBlockProperties(blocks) {
    blocks.forEach(block => {
        // Inicializar padding si no existe
        if (block.paddingTop === undefined) block.paddingTop = '';
        if (block.paddingRight === undefined) block.paddingRight = '';
        if (block.paddingBottom === undefined) block.paddingBottom = '';
        if (block.paddingLeft === undefined) block.paddingLeft = '';
        if (block.paddingTopTablet === undefined) block.paddingTopTablet = '';
        if (block.paddingRightTablet === undefined) block.paddingRightTablet = '';
        if (block.paddingBottomTablet === undefined) block.paddingBottomTablet = '';
        if (block.paddingLeftTablet === undefined) block.paddingLeftTablet = '';
        if (block.paddingTopMobile === undefined) block.paddingTopMobile = '';
        if (block.paddingRightMobile === undefined) block.paddingRightMobile = '';
        if (block.paddingBottomMobile === undefined) block.paddingBottomMobile = '';
        if (block.paddingLeftMobile === undefined) block.paddingLeftMobile = '';
        // Inicializar hover si no existe
        if (block.hoverBackgroundColor === undefined) block.hoverBackgroundColor = '';
        if (block.hoverTextColor === undefined) block.hoverTextColor = '';
        // Migrar 'id' a 'sectionId' para contenedores (cambio de nombre de propiedad)
        // Si block.id es string, era el ID de sección definido por el usuario
        if (block.type === 'container' && typeof block.id === 'string') {
            block.sectionId = block.id;
            block.id = Date.now() + Math.random(); // Generar nuevo ID interno
        }
        // Inicializar sectionId si no existe (para contenedores)
        if (block.type === 'container' && block.sectionId === undefined) {
            block.sectionId = '';
        }
        // Inicializar scrollToId si no existe (para botones)
        if (block.type === 'button' && block.scrollToId === undefined) {
            block.scrollToId = '';
        }
    });
    return blocks;
}

/**
 * Clona bloques con nuevos IDs
 */
function cloneBlocksWithNewIds(blocks) {
    return blocks.map(block => {
        const newBlock = JSON.parse(JSON.stringify(block));
        newBlock.id = Date.now() + Math.random();
        
        if (block.children && block.children.length > 0) {
            newBlock.children = cloneBlocksWithNewIds(block.children);
        }
        
        return newBlock;
    });
}
