
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
        // Soporte para container, flex y grid
        if (parent && (parent.type === 'container' || parent.type === 'flex' || parent.type === 'grid')) {
            parent.children = parent.children || [];
            parent.children.push(template);
        }
    } else {
        state.page.blocks.push(template);
    }    
    renderBlocks();
    autoSave();
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
        // Soporte para container, flex y grid
        if (parent && (parent.type === 'container' || parent.type === 'flex' || parent.type === 'grid')) {
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
        if ((block.type === 'container' || block.type === 'flex' || block.type === 'grid') && block.children) {
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
        autoSave();
        return;
    }

    deleteBlockFromChildren(state.page.blocks, blockId);
    if (state.selectedBlockId === blockId) state.selectedBlockId = null;
    renderBlocks();
    autoSave();
}

function deleteBlockFromChildren(blocks, blockId) {
    for (const block of blocks) {
        if ((block.type === 'container' || block.type === 'flex' || block.type === 'grid') && block.children) {
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
        autoSave();
        return;
    }

    duplicateBlockFromChildren(state.page.blocks, blockId);
    renderBlocks();
    autoSave();
}

function duplicateBlockFromChildren(blocks, blockId) {
    for (const block of blocks) {
        if ((block.type === 'container' || block.type === 'flex' || block.type === 'grid') && block.children) {
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
        autoSave();
        return;
    }

    moveBlockFromChildren(state.page.blocks, blockId, direction);
    renderBlocks();
    autoSave();
}

function moveBlockFromChildren(blocks, blockId, direction) {
    for (const block of blocks) {
        if ((block.type === 'container' || block.type === 'flex' || block.type === 'grid') && block.children) {
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
    renderProperties(); // Mostrar el panel de propiedades al seleccionar un bloque
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

    // Eventos para selección de bloques (todos, incluyendo hijos dentro de contenedores)
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

    // Eventos para dropzones de flex y grid
    document.querySelectorAll('.flexgrid-dropzone').forEach(dropZone => {
        // Evitar listeners duplicados usando un flag en el elemento
        if (dropZone._flexGridListenerConfigured) return;
        dropZone._flexGridListenerConfigured = true;
        
        dropZone.addEventListener('dragover', (e) => {
            // Encontrar el dropzone más interno usando elementFromPoint
            const elem = document.elementFromPoint(e.clientX, e.clientY);
            const innermostDropZone = elem?.closest('.flexgrid-dropzone');

            // Solo el dropzone más interno debe procesar
            if (innermostDropZone !== dropZone) {
                return;
            }

            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            // Encontrar el dropzone más interno usando elementFromPoint
            const elem = document.elementFromPoint(e.clientX, e.clientY);
            const innermostDropZone = elem?.closest('.flexgrid-dropzone');

            // Solo el dropzone más interno debe procesar
            if (innermostDropZone !== dropZone) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');

            const ptId = parseInt(dropZone.dataset.parentId);
            const ds = e.dataTransfer.getData('application/x-drag-source');
            const bt = e.dataTransfer.getData('text/plain');
            const componentId = e.dataTransfer.getData('componentId');

            // Manejar bloques de la sidebar
            if (ds === 'sidebar' && bt && window.blockTemplates && blockTemplates[bt]) {
                addBlock(bt, ptId);
            }
            // Manejar componentes personalizados
            else if (componentId) {
                addComponentFromDrag(componentId, dropZone);
            }
        });
    });

    // Eventos para dropzones de contenedores - detectar el dropzone más interno usando e.target
    document.querySelectorAll('.block-container-drop[data-drop-type="container"]').forEach(dropZone => {
        // Evitar listeners duplicados usando un flag en el elemento
        if (dropZone._containerListenerConfigured) return;
        dropZone._containerListenerConfigured = true;
        
        dropZone.addEventListener('dragover', (e) => {
            // Encontrar el contenedor más interno desde e.target
            const innermostContainer = e.target.closest('.block-container-drop[data-drop-type="container"]');

            // Si el contenedor más interno no es este, dejar que el más interno lo maneje
            if (innermostContainer && innermostContainer !== dropZone) {
                return;
            }

            // Verificar si hay un dropzone de flex/grid BAJO EL CURSOR usando elementFromPoint
            const elem = document.elementFromPoint(e.clientX, e.clientY);
            const flexGridTarget = elem?.closest('.flexgrid-dropzone');
            
            // Si hay un flex/grid bajo el cursor y es más interno que este contenedor, dejar que lo maneje
            if (flexGridTarget && flexGridTarget !== dropZone && dropZone.contains(flexGridTarget)) {
                return; // Dejar que el flex/grid lo maneje
            }

            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            
            // Encontrar el contenedor más interno desde e.target
            const innermostContainer = e.target.closest('.block-container-drop[data-drop-type="container"]');


            // Si el contenedor más interno no es este, dejar que el más interno lo maneje
            if (innermostContainer && innermostContainer !== dropZone) {
                return;
            }

            // Verificar si hay un dropzone de flex/grid BAJO EL CURSOR usando elementFromPoint
            const elem = document.elementFromPoint(e.clientX, e.clientY);
            const flexGridTarget = elem?.closest('.flexgrid-dropzone');

            // Si hay un flex/grid bajo el cursor y es más interno que este contenedor, dejar que lo maneje
            if (flexGridTarget && flexGridTarget !== dropZone && dropZone.contains(flexGridTarget)) {
                return;
            }

            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');

            const ptId = parseInt(dropZone.dataset.parentId);
            const ds = e.dataTransfer.getData('application/x-drag-source');
            const bt = e.dataTransfer.getData('text/plain');
            const bid = parseInt(e.dataTransfer.getData('blockId'));
            const componentId = e.dataTransfer.getData('componentId');

            if (ds === 'sidebar' && bt && window.blockTemplates && blockTemplates[bt]) {
                addBlock(bt, ptId);
            } else if (ds === 'existing-block' && bid) {
                moveBlockToContainer(bid, ptId);
            } else if (componentId) {
                addComponentFromDrag(componentId, dropZone);
            }
        });
    });

    // No llamar a renderProperties() aquí para evitar perder el foco en los inputs
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
    const flexCSS = generateFlexCSS(block);
    const gridCSS = generateGridCSS(block);
    const allCSS = responsiveCSS + directionCSS + flexCSS + gridCSS;

    const isHidden = getIsHidden(block);
    const hiddenStyle = isHidden ? 'display: none;' : '';

    if (block.type === 'container') {
        const childrenContent = (block.children && block.children.length > 0)
            ? block.children.map(child => createBlockHTML(child)).join('')
            : '<div style="display: flex; align-items: center; justify-content: center; min-height: 80px; color:#94a3b8;font-size:13px; border: 2px dashed #cbd5e1; border-radius: 8px; margin: 8px; pointer-events: none;">📦 Arrastra bloques aquí</div>';

        const sectionIdAttr = block.sectionId && block.sectionId.trim() !== '' ? `id="${block.sectionId}"` : '';
        const sectionIdLabel = block.sectionId && block.sectionId.trim() !== '' ? `data-section-id="${block.sectionId}"` : '';
        const sectionIdBadge = block.sectionId && block.sectionId.trim() !== ''
            ? `<div style="position: absolute; top: -10px; right: 10px; background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">#${block.sectionId}</div>`
            : '';

        preview = `
            <style id="${cssId}">
                .${blockClass} { ${block.customCSS} ${allCSS} }
                .${blockClass}.block-container-drop {
                    border: 2px dashed transparent !important;
                    margin-bottom: 8px;
                    background: transparent !important;
                    padding: 16px;
                    min-height: 100px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    pointer-events: auto !important;
                    box-sizing: border-box !important;
                    position: relative !important;
                }
                /* El contenido interior (incluyendo contenedores hijos) SIEMPRE puede recibir eventos */
                .${blockClass}.block-container-drop > * {
                    pointer-events: auto !important;
                    position: relative !important;
                    z-index: 2 !important;
                }
                /* Durante drag-over, resaltar pero sin bloquear hijos */
                .${blockClass}.block-container-drop.drag-over {
                    background: rgba(224, 242, 254, 0.5) !important;
                    border: 2px solid #0284c7 !important;
                    outline: 3px solid #93c5fd !important;
                    outline-offset: 2px !important;
                }
                ${isHidden ? `.${blockClass} { opacity: 0.3 !important; }` : ''}
            </style>
            <div class="${blockClass} block-container-drop"
                data-parent-id="${block.id}"
                data-drop-type="container"
                ${sectionIdAttr}
                ${sectionIdLabel}
                style="position: relative; min-height:100px; margin-bottom: 8px; padding: 16px; display: flex; gap: 12px; ${hiddenStyle}">
                ${sectionIdBadge}${childrenContent}
            </div>`;
    } else if (block.type === 'flex' || block.type === 'grid') {
        // Flex y Grid usan su propio dropzone con clase específica
        preview = createBlockPreviewHTML(block, allCSS, isHidden);
    } else {
        preview = createBlockPreviewHTML(block, allCSS, isHidden);
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
function createBlockPreviewHTML(block, allCSS, isHidden = false) {
    const blockClass = `block-${block.id}`;
    const cssId = `css-${block.id}`;
    const hiddenStyle = isHidden ? 'display: none;' : '';

    switch (block.type) {
        case 'hero':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} background: ${block.backgroundColor || 'transparent'}; color: ${block.textColor || '#1f2937'}; }</style>
                <div class="${blockClass}" style="padding: 20px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; ${hiddenStyle}">
                    <h1 style="font-size: 28px; margin-bottom: 10px;">${escapeHTML(block.content)}</h1>
                    <p>${escapeHTML(block.subContent)}</p>
                </div>`;

        case 'heading':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} color: ${block.textColor || '#1f2937'}; }</style>
                <h2 class="${blockClass}" style="margin: 16px 0; ${hiddenStyle}">${escapeHTML(block.content)}</h2>`;

        case 'paragraph':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} color: ${block.textColor || '#1f2937'}; }</style>
                <p class="${blockClass}" style="line-height: 1.6; margin: 12px 0; ${hiddenStyle}">${escapeHTML(block.content)}</p>`;

        case 'image':
            return block.src
                ? `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                   <img class="${blockClass}" src="${block.src}" alt="${block.alt}" style="border-radius: 4px; max-width: 100%; ${hiddenStyle}">`
                : `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                   <div class="${blockClass}" style="background: var(--secondary); padding: 40px; text-align: center; border-radius: 4px; color: var(--text-secondary); ${hiddenStyle}">Sin imagen</div>`;

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
                <span class="${blockClass}" style="${hiddenStyle}">${block.emoji || '😀'}</span>`;
        }

        case 'cards':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <div class="${blockClass}" style="background: var(--secondary); padding: 20px; border-radius: 4px; text-align: center; ${hiddenStyle}">
                    Tarjetas (${block.items.length})
                </div>`;

        case 'carousel':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <div class="${blockClass}" style="background: var(--secondary); padding: 20px; border-radius: 4px; text-align: center; ${hiddenStyle}">
                    Carrusel (${block.slides.length} slides)
                </div>`;

        case 'button':
            const scrollAttr = block.scrollToId ? `onclick="scrollToSection('${block.scrollToId}')"` : '';
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} background: ${block.backgroundColor || 'transparent'}; color: ${block.textColor || '#ffffff'}; }</style>
                <button class="${blockClass}" style="padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; ${hiddenStyle}" ${scrollAttr}>
                    ${escapeHTML(block.text)}
                </button>`;

        case 'divider':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <hr class="${blockClass}" style="border: none; border-top: 1px solid ${block.borderColor || 'transparent'}; margin: 20px 0; background: ${block.borderColor || 'transparent'}; ${hiddenStyle}">`;

        case 'flex': {
            const childrenContent = (block.children && block.children.length > 0)
                ? block.children.map(child => createBlockHTML(child)).join('')
                : '<div class="flex-empty-placeholder" style="display: flex; align-items: center; justify-content: center; min-height: 150px; color:#94a3b8;font-size:13px; border: 2px dashed #cbd5e1; border-radius: 8px; pointer-events: none;">📦 Arrastra bloques aquí</div>';

            // Obtener valores actuales según modo responsive
            const currentDirection = block.direction || 'row';
            const currentJustifyContent = block.justifyContent || 'center';
            const currentAlignItems = block.alignItems || 'center';
            const currentFlexWrap = block.flexWrap || 'nowrap';
            const currentGap = block.gap || '16';

            return `<style id="${cssId}">
                .${blockClass} {
                    ${block.customCSS}
                    ${allCSS}
                    display: flex !important;
                    flex-direction: ${currentDirection === 'column' ? 'column' : 'row'} !important;
                    justify-content: ${currentJustifyContent} !important;
                    align-items: ${currentAlignItems} !important;
                    gap: ${currentGap}px !important;
                    flex-wrap: ${currentFlexWrap} !important;
                    background: ${block.backgroundColor || 'transparent'};
                    color: ${block.textColor || '#1f2937'};
                    min-height: 150px !important;
                }
                /* Por defecto, el dropzone puede recibir eventos de drag */
                .${blockClass}-dropzone {
                    pointer-events: auto !important;
                    border: 2px dashed transparent !important;
                    background: transparent !important;
                    padding: 16px;
                    min-height: 150px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: block !important;
                    width: 100%;
                    box-sizing: border-box;
                    position: relative !important;
                    z-index: 10 !important;
                }
                /* Borde visual usando pseudo-elemento - SIN pointer-events para no bloquear hijos */
                .${blockClass}-dropzone::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border: 2px dashed #2563eb;
                    border-radius: 8px;
                    pointer-events: none !important;
                    z-index: 1;
                }
                /* Durante drag-over, el dropzone se resalta */
                .${blockClass}-dropzone.drag-over::before {
                    background: rgba(224, 242, 254, 0.3) !important;
                    border-color: #0284c7 !important;
                    outline: 3px solid #93c5fd !important;
                    outline-offset: 2px !important;
                }
                /* Los bloques hijos siempre pueden recibir eventos */
                .${blockClass}-dropzone > .block {
                    width: 100%;
                    flex-shrink: 0;
                    margin-bottom: 16px;
                    pointer-events: auto !important;
                    position: relative !important;
                    z-index: 5 !important;
                }
                .${blockClass}-dropzone > .block * {
                    pointer-events: auto !important;
                }
                /* IMPORTANTE: Los contenedores hijos dentro de flex/grid también reciben eventos */
                .${blockClass}-dropzone .block-container-drop {
                    pointer-events: auto !important;
                    z-index: 200 !important;
                    position: relative !important;
                }
                /* IMPORTANTE: Los dropzones flex/grid hijos también reciben eventos */
                .${blockClass}-dropzone .flexgrid-dropzone {
                    pointer-events: auto !important;
                    z-index: 100 !important;
                    min-height: 150px !important;
                    display: block !important;
                    position: relative !important;
                    padding: 16px !important;
                    box-sizing: border-box !important;
                }
                /* Borde visual para el dropzone - siempre visible */
                .${blockClass}-dropzone .flexgrid-dropzone::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border: 2px dashed #2563eb;
                    border-radius: 8px;
                    pointer-events: none !important;
                    z-index: 0;
                }
                /* El placeholder dentro de flex/grid NO recibe eventos - deja que el dropzone los reciba */
                .${blockClass}-dropzone .flex-empty-placeholder {
                    pointer-events: none !important;
                    min-height: 120px !important;
                }
                /* Los bloques hijos dentro del dropzone deben permitir que el dropzone sea el target */
                .${blockClass}-dropzone .flexgrid-dropzone > .block {
                    pointer-events: auto !important;
                    position: relative !important;
                    z-index: 5 !important;
                }
                ${isHidden ? `.${blockClass} { opacity: 0.3 !important; }` : ''}
            </style>
            <div class="${blockClass}"
                style="position: relative; min-height: 150px; ${hiddenStyle}">
                <div class="${blockClass}-dropzone flexgrid-dropzone"
                    data-parent-id="${block.id}"
                    data-block-type="flex"
                    style="min-height: 150px; display: block; position: relative;">
                    ${childrenContent}
                </div>
            </div>`;
        }

        case 'grid': {
            const childrenContent = (block.children && block.children.length > 0)
                ? block.children.map(child => createBlockHTML(child)).join('')
                : '<div class="flex-empty-placeholder" style="display: flex; align-items: center; justify-content: center; min-height: 150px; color:#94a3b8;font-size:13px; border: 2px dashed #cbd5e1; border-radius: 8px; pointer-events: none;">📦 Arrastra bloques aquí</div>';

            // Obtener valores actuales según modo responsive
            const currentGridTemplateColumns = block.gridTemplateColumns || 'repeat(3, 1fr)';
            const currentGridGap = block.gridGap || '16';

            return `<style id="${cssId}">
                .${blockClass} {
                    ${block.customCSS}
                    ${allCSS}
                    display: grid !important;
                    grid-template-columns: ${currentGridTemplateColumns} !important;
                    gap: ${currentGridGap}px !important;
                    background: ${block.backgroundColor || 'transparent'};
                    color: ${block.textColor || '#1f2937'};
                    min-height: 150px !important;
                }
                /* Por defecto, el dropzone puede recibir eventos de drag */
                .${blockClass}-dropzone {
                    pointer-events: auto !important;
                    border: 2px dashed transparent !important;
                    background: transparent !important;
                    padding: 16px;
                    min-height: 150px;
                    border-radius: 8px;
                    transition: all 0.2s;
                    display: block !important;
                    width: 100%;
                    box-sizing: border-box;
                    position: relative !important;
                    z-index: 10 !important;
                }
                /* Borde visual usando pseudo-elemento - SIN pointer-events para no bloquear hijos */
                .${blockClass}-dropzone::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border: 2px dashed #2563eb;
                    border-radius: 8px;
                    pointer-events: none !important;
                    z-index: 1;
                }
                /* Durante drag-over, el dropzone se resalta */
                .${blockClass}-dropzone.drag-over::before {
                    background: rgba(224, 242, 254, 0.3) !important;
                    border-color: #0284c7 !important;
                    outline: 3px solid #93c5fd !important;
                    outline-offset: 2px !important;
                }
                /* Los bloques hijos siempre pueden recibir eventos */
                .${blockClass}-dropzone > .block {
                    width: 100%;
                    flex-shrink: 0;
                    margin-bottom: 16px;
                    pointer-events: auto !important;
                    position: relative !important;
                    z-index: 5 !important;
                }
                .${blockClass}-dropzone > .block * {
                    pointer-events: auto !important;
                }
                /* IMPORTANTE: Los contenedores hijos dentro de flex/grid también reciben eventos */
                .${blockClass}-dropzone .block-container-drop {
                    pointer-events: auto !important;
                    z-index: 200 !important;
                    position: relative !important;
                }
                /* IMPORTANTE: Los dropzones flex/grid hijos también reciben eventos */
                .${blockClass}-dropzone .flexgrid-dropzone {
                    pointer-events: auto !important;
                    z-index: 100 !important;
                    min-height: 150px !important;
                    display: block !important;
                    position: relative !important;
                    padding: 16px !important;
                    box-sizing: border-box !important;
                }
                /* Borde visual para el dropzone - siempre visible */
                .${blockClass}-dropzone .flexgrid-dropzone::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    border: 2px dashed #2563eb;
                    border-radius: 8px;
                    pointer-events: none !important;
                    z-index: 0;
                }
                /* El placeholder dentro de flex/grid NO recibe eventos - deja que el dropzone los reciba */
                .${blockClass}-dropzone .flex-empty-placeholder {
                    pointer-events: none !important;
                    min-height: 120px !important;
                }
                /* Los bloques hijos dentro del dropzone deben permitir que el dropzone sea el target */
                .${blockClass}-dropzone .flexgrid-dropzone > .block {
                    pointer-events: auto !important;
                    position: relative !important;
                    z-index: 5 !important;
                }
                ${isHidden ? `.${blockClass} { opacity: 0.3 !important; }` : ''}
            </style>
            <div class="${blockClass}"
                style="position: relative; min-height: 150px; ${hiddenStyle}">
                <div class="${blockClass}-dropzone flexgrid-dropzone"
                    data-parent-id="${block.id}"
                    data-block-type="grid"
                    style="min-height: 150px; display: block; position: relative;">
                    ${childrenContent}
                </div>
            </div>`;
        }

        case 'component':
            return `<style id="${cssId}">.${blockClass} { ${block.customCSS} ${allCSS} }</style>
                <div class="${blockClass}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; border-radius: 8px; text-align: center; color: white; ${hiddenStyle}">
                    <div style="font-size: 24px; margin-bottom: 8px;">🧩</div>
                    <div style="font-size: 16px; font-weight: 600;">${escapeHTML(block.componentName || 'Componente')}</div>
                    <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">Componente personalizado</div>
                </div>`;

        default:
            return '';
    }
}

/**
 * Función para hacer scroll suave a una sección
 */
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Exponer funciones globalmente
window.addBlock = addBlock;
window.moveBlockToContainer = moveBlockToContainer;
window.blockTemplates = blockTemplates;
window.createBlockHTML = createBlockHTML;
window.createBlockPreviewHTML = createBlockPreviewHTML;
