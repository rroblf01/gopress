/**
 * Funcionalidad de interactividad entre elementos
 * Permite que un elemento cambie el hidden de otro al hacer click
 */

/**
 * Renderiza la sección de interactividad en el panel de propiedades
 */
function renderInteractivityProperties(block, isComponentEditor = false) {
    // Obtener todos los bloques disponibles
    const allBlocks = getAllBlocksFlat(isComponentEditor);

    // Filtrar el bloque actual de la lista
    const availableBlocks = allBlocks.filter(b => b.id !== block.id);

    if (availableBlocks.length === 0) {
        return `<div class="property-group" style="border-top: 2px solid var(--border); padding-top: 16px;">
            <label class="property-label">⚡ Interactividad</label>
            <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
                Añade más bloques para configurar interactividad
            </p>
        </div>`;
    }

    // Encontrar el bloque target seleccionado
    const targetBlock = block.toggleTargetId ? allBlocks.find(b => b.id === block.toggleTargetId) : null;

    let html = `<div class="property-group" style="border-top: 2px solid var(--border); padding-top: 16px;">
        <label class="property-label">⚡ Interactividad</label>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">
            Al hacer click en este elemento, se mostrará/ocultará el elemento seleccionado:
        </p>

        <div style="margin-top: 12px;">
            <label class="property-label" style="font-size: 12px;">Elemento a mostrar/ocultar:</label>
            <div style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: 4px; margin-top: 8px;">
                <div style="padding: 8px; background: var(--secondary); border-bottom: 1px solid var(--border);">
                    <span style="font-size: 11px; color: var(--text-secondary);">Pasa el ratón para resaltar en el editor</span>
                </div>
                ${availableBlocks.map(b => `
                    <div style="padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.2s;"
                         onmouseenter="highlightBlock(${b.id})"
                         onmouseleave="unhighlightBlock(${b.id})"
                         onclick="setToggleTarget(${block.id}, ${b.id}, ${isComponentEditor})"
                         onmouseover="this.style.background='#e0f2fe'"
                         onmouseout="this.style.background='${block.toggleTargetId === b.id ? '#fef3c7' : 'transparent'}'"
                         ${block.toggleTargetId === b.id ? 'style="background: #fef3c7;"' : ''}>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 13px;">${escapeHTML(getBlockDisplayName(b))}</span>
                            ${block.toggleTargetId === b.id ? '<span style="font-size: 16px;">✓</span>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${targetBlock ? `
            <div style="margin-top: 12px; padding: 12px; background: var(--secondary); border-radius: 6px; border: 1px solid var(--border);">
                <div style="font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px;">
                    🔗 Configuración actual:
                </div>
                <div style="font-size: 13px;">
                    <span style="color: var(--primary); font-weight: 500;">${escapeHTML(getBlockDisplayName(block))}</span>
                    <span style="margin: 0 8px; color: var(--text-secondary);">→</span>
                    <span style="color: var(--primary); font-weight: 500;">${escapeHTML(getBlockDisplayName(targetBlock))}</span>
                </div>
                <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">
                    💡 Al hacer click en "${escapeHTML(getBlockDisplayName(block))}", se alternará la visibilidad de "${escapeHTML(getBlockDisplayName(targetBlock))}"
                </p>
            </div>
        ` : ''}
    </div>`;

    return html;
}

/**
 * Obtiene todos los bloques en formato plano (recursivo)
 */
function getAllBlocksFlat(isComponentEditor = false) {
    const blocks = isComponentEditor ? 
        tabsState.componentEditors[tabsState.activeTabId]?.blocks : 
        state.page.blocks;
    
    const result = [];
    
    function flatten(blocksArray) {
        for (const block of blocksArray) {
            result.push(block);
            if (block.children && block.children.length > 0) {
                flatten(block.children);
            }
        }
    }
    
    flatten(blocks);
    return result;
}

/**
 * Obtiene un nombre legible para un bloque
 */
function getBlockDisplayName(block) {
    const typeNames = {
        container: '📦 Contenedor',
        hero: '🎨 Hero',
        paragraph: '📝 Párrafo',
        heading: '📌 Encabezado',
        image: '🖼️ Imagen',
        icon: '😊 Icono',
        cards: '🎴 Tarjetas',
        carousel: '🎠 Carrusel',
        button: '🔘 Botón',
        divider: '─ Divisor',
        component: '🧩 Componente'
    };
    
    let name = typeNames[block.type] || block.type;
    
    if (block.type === 'heading' && block.content) {
        name += `: ${block.content.substring(0, 20)}${block.content.length > 20 ? '...' : ''}`;
    } else if (block.type === 'paragraph' && block.content) {
        name += `: ${block.content.substring(0, 20)}${block.content.length > 20 ? '...' : ''}`;
    } else if (block.type === 'button' && block.text) {
        name += `: ${block.text}`;
    } else if (block.type === 'component' && block.componentName) {
        name = `🧩 ${block.componentName}`;
    } else if (block.type === 'image' && block.alt) {
        name += `: ${block.alt}`;
    } else if (block.type === 'icon' && block.emoji) {
        name += ` ${block.emoji}`;
    }
    
    return name;
}

/**
 * Establece el bloque target para el toggle
 */
function setToggleTarget(blockId, targetId, isComponentEditor = false) {
    const current = getCurrentState();
    const block = findBlockById(current.state, blockId);
    
    if (block) {
        block.toggleTargetId = targetId ? parseInt(targetId) : null;
        
        if (isComponentEditor) {
            tabsState.componentEditors[tabsState.activeTabId].dirty = true;
            saveComponentFromEditor(tabsState.activeTabId);
        } else {
            autoSave();
        }
        
        renderProperties();
        renderCurrentBlocks();
    }
}

/**
 * Resalta un bloque en el canvas (al pasar el ratón por la lista)
 */
function highlightBlock(blockId) {
    // Eliminar highlight previo
    document.querySelectorAll('.block-highlighted').forEach(el => {
        el.classList.remove('block-highlighted');
    });
    
    // Añadir highlight al nuevo bloque
    const blockEl = document.querySelector(`.block[data-block-id="${blockId}"]`);
    if (blockEl) {
        blockEl.classList.add('block-highlighted');
        blockEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

/**
 * Elimina el highlight de un bloque
 */
function unhighlightBlock(blockId) {
    const blockEl = document.querySelector(`.block[data-block-id="${blockId}"]`);
    if (blockEl) {
        blockEl.classList.remove('block-highlighted');
    }
}

// Añadir estilos CSS para highlight
const interactivityStyles = document.createElement('style');
interactivityStyles.textContent = `
    .block-highlighted {
        outline: 3px solid #f59e0b !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.5) !important;
    }

    .component-visibility-item:hover {
        background: #fef3c7 !important;
        border: 1px solid #f59e0b !important;
    }
`;
document.head.appendChild(interactivityStyles);
