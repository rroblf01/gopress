/**
 * Renderizado y gestión de bloques
 */

/**
 * Añade un nuevo bloque
 */
function addBlock(type, parentId = null) {
    if (!type || !blockTemplates[type]) {
        console.error('Tipo de bloque no válido:', type);
        return;
    }

    const template = JSON.parse(JSON.stringify(blockTemplates[type]));
    template.id = Date.now();
    
    if (parentId) {
        const parent = findBlockById(state.page.blocks, parentId);
        if (parent && parent.type === 'container') {
            parent.children = parent.children || [];
            parent.children.push(template);
        }
    } else {
        state.page.blocks.push(template);
    }
    renderBlocks();
}

/**
 * Mueve un bloque a un contenedor
 */
function moveBlockToContainer(blockId, parentId) {
    let blockToRemove = null;

    const rootIndex = state.page.blocks.findIndex(b => b.id === blockId);
    if (rootIndex !== -1) {
        blockToRemove = state.page.blocks.splice(rootIndex, 1)[0];
    } else {
        blockToRemove = findAndRemoveBlockFromChildren(state.page.blocks, blockId);
    }

    if (blockToRemove) {
        const parent = findBlockById(state.page.blocks, parentId);
        if (parent && parent.type === 'container') {
            parent.children = parent.children || [];
            parent.children.push(blockToRemove);
            renderBlocks();
        }
    }
}

/**
 * Mueve un bloque al nivel raíz
 */
function moveBlockToRoot(blockId) {
    let blockToRemove = findAndRemoveBlockFromChildren(state.page.blocks, blockId);

    if (!blockToRemove) {
        const rootIndex = state.page.blocks.findIndex(b => b.id === blockId);
        if (rootIndex !== -1) return; // Ya está en root
        return;
    }

    state.page.blocks.push(blockToRemove);
    renderBlocks();
}

/**
 * Busca y elimina un bloque de los children
 */
function findAndRemoveBlockFromChildren(blocks, blockId) {
    for (const block of blocks) {
        if (block.type === 'container' && block.children) {
            const childIndex = block.children.findIndex(b => b.id === blockId);
            if (childIndex !== -1) {
                return block.children.splice(childIndex, 1)[0];
            }
            const found = findAndRemoveBlockFromChildren(block.children, blockId);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Elimina un bloque
 */
function deleteBlock(blockId) {
    const idx = state.page.blocks.findIndex(b => b.id === blockId);
    if (idx !== -1) {
        state.page.blocks.splice(idx, 1);
        if (state.selectedBlockId === blockId) state.selectedBlockId = null;
        renderBlocks();
        renderProperties();
        return;
    }

    deleteBlockFromChildren(state.page.blocks, blockId);
    if (state.selectedBlockId === blockId) state.selectedBlockId = null;
    renderBlocks();
    renderProperties();
}

function deleteBlockFromChildren(blocks, blockId) {
    for (const block of blocks) {
        if (block.type === 'container' && block.children) {
            const childIdx = block.children.findIndex(b => b.id === blockId);
            if (childIdx !== -1) {
                block.children.splice(childIdx, 1);
                return true;
            }
            if (deleteBlockFromChildren(block.children, blockId)) return true;
        }
    }
    return false;
}

/**
 * Duplica un bloque
 */
function duplicateBlock(blockId) {
    const idx = state.page.blocks.findIndex(b => b.id === blockId);
    if (idx !== -1) {
        const block = state.page.blocks[idx];
        const copy = JSON.parse(JSON.stringify(block));
        copy.id = Date.now();
        state.page.blocks.splice(idx + 1, 0, copy);
        renderBlocks();
        return;
    }

    duplicateBlockFromChildren(state.page.blocks, blockId);
    renderBlocks();
}

function duplicateBlockFromChildren(blocks, blockId) {
    for (const block of blocks) {
        if (block.type === 'container' && block.children) {
            const childIdx = block.children.findIndex(b => b.id === blockId);
            if (childIdx !== -1) {
                const copy = JSON.parse(JSON.stringify(block.children[childIdx]));
                copy.id = Date.now();
                block.children.splice(childIdx + 1, 0, copy);
                return true;
            }
            if (duplicateBlockFromChildren(block.children, blockId)) return true;
        }
    }
    return false;
}

/**
 * Mueve un bloque arriba/abajo
 */
function moveBlock(blockId, direction) {
    const idx = state.page.blocks.findIndex(b => b.id === blockId);
    const newIdx = idx + direction;
    
    if (idx !== -1 && newIdx >= 0 && newIdx < state.page.blocks.length) {
        [state.page.blocks[idx], state.page.blocks[newIdx]] = [state.page.blocks[newIdx], state.page.blocks[idx]];
        renderBlocks();
        renderProperties();
        return;
    }

    moveBlockFromChildren(state.page.blocks, blockId, direction);
    renderBlocks();
    renderProperties();
}

function moveBlockFromChildren(blocks, blockId, direction) {
    for (const block of blocks) {
        if (block.type === 'container' && block.children) {
            const childIdx = block.children.findIndex(b => b.id === blockId);
            if (childIdx !== -1) {
                const newIdx = childIdx + direction;
                if (newIdx >= 0 && newIdx < block.children.length) {
                    [block.children[childIdx], block.children[newIdx]] = [block.children[newIdx], block.children[childIdx]];
                    return true;
                }
            }
            if (moveBlockFromChildren(block.children, blockId, direction)) return true;
        }
    }
    return false;
}

/**
 * Selecciona un bloque
 */
function selectBlock(blockId) {
    state.selectedBlockId = blockId;
    renderBlocks();
    renderProperties();
}

/**
 * Renderiza todos los bloques
 */
function renderBlocks() {
    const container = document.getElementById('blocksContainer');

    if (state.page.blocks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Arrastra bloques aquí para comenzar</p></div>';
        return;
    }

    container.innerHTML = state.page.blocks.map(block => createBlockHTML(block)).join('');

    // Eventos para selección de bloques
    document.querySelectorAll('.block').forEach(el => {
        el.addEventListener('click', (e) => {
            if (draggedBlockId) {
                e.stopPropagation();
                return;
            }
            e.stopPropagation();
            if (!e.target.closest('.block-action-btn')) {
                selectBlock(parseInt(el.dataset.blockId));
            }
        });
    });

    // Eventos para acciones de bloques (todos, incluyendo dentro de contenedores)
    document.querySelectorAll('.block-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const blockElement = btn.closest('.block');
            const blockId = parseInt(blockElement.dataset.blockId);
            const action = btn.dataset.action;
            if (action === 'delete') deleteBlock(blockId);
            else if (action === 'duplicate') duplicateBlock(blockId);
            else if (action === 'up') moveBlock(blockId, -1);
            else if (action === 'down') moveBlock(blockId, 1);
        });
    });

    // Eventos para drop zones de contenedores
    document.querySelectorAll('.block-container-drop').forEach(dropZone => {
        setupContainerDropZone(dropZone);
    });
}

/**
 * Configura una drop zone de contenedor
 */
function setupContainerDropZone(dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dragSource = e.dataTransfer.getData('application/x-drag-source');
        const componentId = e.dataTransfer.getData('componentId');
        if (dragSource !== 'sidebar' && dragSource !== 'existing-block' && !componentId) return;

        e.dataTransfer.dropEffect = dragSource === 'sidebar' || componentId ? 'copy' : 'move';
        dropZone.style.background = '#e0f2fe';
        dropZone.style.borderColor = '#0284c7';
    });

    dropZone.addEventListener('dragleave', (e) => {
        if (e.target === dropZone) {
            dropZone.style.background = '#f0f9ff';
            dropZone.style.borderColor = '#2563eb';
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dragSource = e.dataTransfer.getData('application/x-drag-source');
        const componentId = e.dataTransfer.getData('componentId');
        if (dragSource !== 'sidebar' && dragSource !== 'existing-block' && !componentId) return;

        dropZone.style.background = '#f0f9ff';
        dropZone.style.borderColor = '#2563eb';

        const parentId = parseInt(dropZone.dataset.parentId);

        if (componentId) {
            // Es un componente personalizado
            addComponentFromDrag(componentId, dropZone);
        } else if (dragSource === 'sidebar') {
            const blockType = e.dataTransfer.getData('text/plain');
            if (blockType && blockTemplates[blockType]) {
                addBlock(blockType, parentId);
            }
        } else {
            const blockId = parseInt(e.dataTransfer.getData('blockId'));
            if (blockId && parentId) {
                const parentBlock = findBlockById(state.page.blocks, parentId);
                if (parentBlock && parentBlock.children) {
                    const alreadyInContainer = parentBlock.children.some(b => b.id === blockId);
                    if (!alreadyInContainer) {
                        moveBlockToContainer(blockId, parentId);
                    }
                } else {
                    moveBlockToContainer(blockId, parentId);
                }
            }
        }
    });

    dropZone.addEventListener('click', (e) => {
        if (e.target.closest('.block')) return;
        e.stopPropagation();
        const parentId = parseInt(dropZone.dataset.parentId);
        selectBlock(parentId);
    });
}

/**
 * Crea el HTML de un bloque
 */
function createBlockHTML(block) {
    let preview = '';
    const blockClass = `block-${block.id}`;
    const cssId = `css-${block.id}`;

    const responsiveCSS = generateResponsiveCSS(block);
    const directionCSS = generateDirectionCSS(block);
    const allCSS = responsiveCSS + directionCSS;

    const currentDirection = getCurrentDirection(block);
    const isHidden = getIsHidden(block);
    const directionStyle = currentDirection ? `flex-direction: ${currentDirection === 'horizontal' ? 'row' : 'column'};` : '';

    if (block.type === 'container') {
        const childrenContent = (block.children && block.children.length > 0)
            ? block.children.map(child => createBlockHTML(child)).join('')
            : '<div style="display: flex; align-items: center; justify-content: center; min-height: 80px; color:#94a3b8;font-size:13px; border: 2px dashed #cbd5e1; border-radius: 8px; margin: 8px;">📦 Arrastra bloques aquí</div>';

        preview = `
            <style id="${cssId}">
                .${blockClass} { ${block.customCSS} ${allCSS} }
                .${blockClass} .block-container-drop {
                    border: 2px dashed #2563eb !important;
                    margin-bottom: 8px;
                    background: #f0f9ff !important;
                    padding: 16px;
                    min-height: 100px;
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                .${blockClass} .block-container-drop:hover {
                    background: #e0f2fe !important;
                    border-color: #0284c7 !important;
                }
                ${isHidden ? `.${blockClass} { opacity: 0.3 !important; }` : ''}
            </style>
            <div class="${blockClass} block-container-drop" data-parent-id="${block.id}" style="min-height:100px; margin-bottom: 8px; padding: 16px; display: flex; flex-wrap: wrap; ${directionStyle} gap: 12px;">${childrenContent}</div>`;
    } else {
        preview = createBlockPreviewHTML(block, allCSS);
    }

    return `<div class="block ${state.selectedBlockId === block.id ? 'selected' : ''}" data-block-id="${block.id}" data-block-type="${block.type}" draggable="true">
        <div class="block-header">
            <span class="block-type">${block.type}</span>
            <div class="block-actions">
                <button class="block-action-btn" data-action="up" title="Subir">↑</button>
                <button class="block-action-btn" data-action="down" title="Bajar">↓</button>
                <button class="block-action-btn" data-action="duplicate" title="Duplicar">⎘</button>
                <button class="block-action-btn danger" data-action="delete" title="Eliminar">🗑️</button>
            </div>
        </div>
        <div style="margin-top: 12px;">${preview}</div>
    </div>`;
}

/**
 * Crea el HTML de preview para bloques individuales
 */
function createBlockPreviewHTML(block, allCSS) {
    const blockClass = `block-${block.id}`;
    const cssId = `css-${block.id}`;

    switch (block.type) {
        case 'hero':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} background: ${block.backgroundColor || 'transparent'}; color: ${block.textColor || '#1f2937'}; }</style>
                <div class="${blockClass}" style="padding: 20px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <h1 style="font-size: 28px; margin-bottom: 10px;">${escapeHTML(block.content)}</h1>
                    <p>${escapeHTML(block.subContent)}</p>
                </div>`;
        
        case 'heading':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} color: ${block.textColor || '#1f2937'}; }</style>
                <h2 class="${blockClass}" style="margin: 16px 0;">${escapeHTML(block.content)}</h2>`;
        
        case 'paragraph':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} color: ${block.textColor || '#1f2937'}; }</style>
                <p class="${blockClass}" style="line-height: 1.6; margin: 12px 0;">${escapeHTML(block.content)}</p>`;
        
        case 'image':
            return block.src 
                ? `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                   <img class="${blockClass}" src="${block.src}" alt="${block.alt}" style="border-radius: 4px; max-width: 100%;">`
                : `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                   <div class="${blockClass}" style="background: var(--secondary); padding: 40px; text-align: center; border-radius: 4px; color: var(--text-secondary);">Sin imagen</div>`;
        
        case 'icon': {
            const mode = state.responsiveMode;
            const fontSizeProp = mode === 'desktop' ? 'fontSize' : `fontSize${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
            const iconSize = block[fontSizeProp] || block.fontSize || '48';
            const iconColor = block.color || '#2563eb';
            
            let iconCSS = `${block.customCSS || ''}`;
            if (block.paddingTop || block.paddingRight || block.paddingBottom || block.paddingLeft) {
                iconCSS += ` padding: ${block.paddingTop || 0}px ${block.paddingRight || 0}px ${block.paddingBottom || 0}px ${block.paddingLeft || 0}px;`;
            }
            
            return `<style id="${cssId}">.${blockClass} { ${iconCSS} font-size: ${iconSize}px !important; color: ${iconColor} !important; display: inline-block !important; } </style>
                <span class="${blockClass}">${block.emoji || '😀'}</span>`;
        }
        
        case 'cards':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <div class="${blockClass}" style="background: var(--secondary); padding: 20px; border-radius: 4px; text-align: center;">
                    Tarjetas (${block.items.length})
                </div>`;
        
        case 'carousel':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <div class="${blockClass}" style="background: var(--secondary); padding: 20px; border-radius: 4px; text-align: center;">
                    Carrusel (${block.slides.length} slides)
                </div>`;
        
        case 'button':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} background: ${block.backgroundColor || 'transparent'}; color: ${block.textColor || '#ffffff'}; }</style>
                <button class="${blockClass}" style="padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                    ${escapeHTML(block.text)}
                </button>`;
        
        case 'divider':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <hr class="${blockClass}" style="border: none; border-top: 1px solid ${block.borderColor || 'transparent'}; margin: 20px 0; background: ${block.borderColor || 'transparent'};">`;

        case 'component':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <div class="${blockClass}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px; text-align: center; color: white;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🧩</div>
                    <div style="font-size: 16px; font-weight: 600;">${escapeHTML(block.componentName || 'Componente')}</div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">Componente personalizado</div>
                </div>`;

        default:
            return '';
    }
}
