/**
 * Estado global de la aplicación
 */
const state = {
    page: {
        title: '',
        blocks: [],
        styles: {
            primaryColor: '#2563eb',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            maxWidth: '',
            padding: '',
            globalCSS: ''
        },
        favicon: ''
    },
    selectedBlockId: null,
    responsiveMode: 'desktop',
    hoverMode: false
};

// Variables globales para drag and drop
let isDraggingBlock = false;
let draggedBlockId = null;
