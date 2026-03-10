/**
 * Inicialización de la aplicación
 */

// Estado de los sidebars
let sidebarState = {
    leftHidden: false,
    rightHidden: false
};

// Debounce para auto-guardado
let autoSaveTimeout = null;

/**
 * Auto-guardado con debounce
 */
function autoSave() {
    if (autoSaveTimeout) clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        savePage();
    }, 1000); // Guardar 1 segundo después de la última modificación
}

/**
 * Configura los event listeners globales
 */
function setupEventListeners() {
    document.getElementById('previewBtn').addEventListener('click', openPreviewModal);
    document.getElementById('templatesBtn').addEventListener('click', openTemplatesModal);
    document.getElementById('componentsBtn').addEventListener('click', openComponentsModal);
    document.getElementById('goToWebBtn').addEventListener('click', () => {
        window.open('/', '_blank');
    });
}

/**
 * Alterna la visibilidad de un sidebar
 */
function toggleSidebar(side) {
    const container = document.querySelector('.editor-container');
    const sidebar = document.getElementById(side === 'left' ? 'sidebarLeft' : 'sidebarRight');
    const showBtn = document.getElementById(side === 'left' ? 'showLeftSidebar' : 'showRightSidebar');
    
    if (side === 'left') {
        sidebarState.leftHidden = !sidebarState.leftHidden;
        sidebar.classList.toggle('collapsed', sidebarState.leftHidden);
        container.classList.toggle('sidebar-left-hidden', sidebarState.leftHidden);
        showBtn.classList.toggle('visible', sidebarState.leftHidden);
    } else {
        sidebarState.rightHidden = !sidebarState.rightHidden;
        sidebar.classList.toggle('collapsed', sidebarState.rightHidden);
        container.classList.toggle('sidebar-right-hidden', sidebarState.rightHidden);
        showBtn.classList.toggle('visible', sidebarState.rightHidden);
    }
    
    // Actualizar clase para ambos ocultos
    if (sidebarState.leftHidden && sidebarState.rightHidden) {
        container.classList.add('both-sidebars-hidden');
    } else {
        container.classList.remove('both-sidebars-hidden');
    }
    
    // Forzar redibujado del canvas
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 300);
}

/**
 * Inicializa el editor cuando el DOM está listo
 */
function initializeEditor() {
    loadPageData();
    setupDragAndDrop();
    setupEventListeners();
    setResponsiveMode('desktop');
    loadCustomComponentsList(); // Cargar componentes personalizados al inicio
    initTabs(); // Inicializar sistema de pestañas
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initializeEditor);
