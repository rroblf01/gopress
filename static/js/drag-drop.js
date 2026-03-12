/**
 * Configura los eventos de drag and drop
 */
function setupDragAndDrop() {
    const blocksContainer = document.getElementById('blocksContainer');

    // Configurar drag en los botones de la sidebar para añadir nuevos bloques
    document.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('text/plain', btn.dataset.blockType);
            e.dataTransfer.setData('blockType', btn.dataset.blockType);
            e.dataTransfer.setData('application/x-drag-source', 'sidebar');
        });
    });

    // Configurar drag en componentes personalizados
    document.addEventListener('dragstart', handleComponentDragStartGlobal);

    // Configurar drag en bloques existentes para moverlos
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);

    // Drag over en el canvas principal (solo para root level, no para dropzones)
    blocksContainer.addEventListener('dragover', handleCanvasDragOver);
    blocksContainer.addEventListener('dragleave', handleCanvasDragLeave);
    blocksContainer.addEventListener('drop', handleCanvasDrop);
}

/**
 * Maneja el drag start de componentes personalizados (global)
 */
function handleComponentDragStartGlobal(e) {
    const componentBtn = e.target.closest('.component-btn');
    if (componentBtn && componentBtn.dataset.componentId) {
        
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('componentId', componentBtn.dataset.componentId);
        e.dataTransfer.setData('componentName', componentBtn.dataset.componentName);
        e.dataTransfer.setData('application/x-drag-source', 'component');
    }
}

/**
 * Maneja el inicio del drag
 */
function handleDragStart(e) {
    const block = e.target.closest('.block');
    if (block && !e.target.closest('.block-action-btn')) {
        isDraggingBlock = true;
        draggedBlockId = block.dataset.blockId;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/x-drag-source', 'existing-block');
        e.dataTransfer.setData('blockId', block.dataset.blockId);
        
        // Crear una imagen de drag más clara
        const dragImage = block.cloneNode(true);
        dragImage.style.position = 'absolute';
        dragImage.style.top = '-1000px';
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 20, 20);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    }
}

/**
 * Maneja el fin del drag
 */
function handleDragEnd() {
    isDraggingBlock = false;
    draggedBlockId = null;
}

/**
 * Maneja drag over en el canvas
 */
function handleCanvasDragOver(e) {
    // Si estamos dentro de un block-container-drop, no interferir - que lo maneje su propio handler
    const containerDrop = e.target.closest('.block-container-drop');
    if (containerDrop) {
        return;
    }
    
    // Si estamos sobre una dropzone de flex/grid, no hacer nada - que lo maneje su propio handler
    const flexGridDropzone = e.target.closest('[class*="-dropzone"]');
    if (flexGridDropzone) {
        return;
    }

    // Solo permitir drop desde la sidebar o bloques existentes o componentes
    const dragSource = e.dataTransfer.getData('application/x-drag-source');
    const componentId = e.dataTransfer.getData('componentId');

    if (dragSource !== 'sidebar' && dragSource !== 'existing-block' && dragSource !== 'component' && !componentId) {
        return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = dragSource === 'sidebar' || dragSource === 'component' ? 'copy' : 'move';
    document.getElementById('blocksContainer').style.background = 'rgba(37, 99, 235, 0.05)';
}

/**
 * Maneja drag leave en el canvas
 */
function handleCanvasDragLeave() {
    document.getElementById('blocksContainer').style.background = '';
}

/**
 * Maneja drop en el canvas
 */
function handleCanvasDrop(e) {
    // Si el drop es en una dropzone de contenedor, no hacer nada - que lo maneje su propio handler
    const containerDrop = e.target.closest('.block-container-drop');
    if (containerDrop) {
        return;
    }

    // Si el drop es en una dropzone de flex/grid, no hacer nada
    const flexGridDropzone = e.target.closest('.flexgrid-dropzone');
    if (flexGridDropzone) {
        return;
    }

    // Solo procesar si es desde la sidebar o bloque existente o componente
    const dragSource = e.dataTransfer.getData('application/x-drag-source');
    const componentId = e.dataTransfer.getData('componentId');

    if (dragSource !== 'sidebar' && dragSource !== 'existing-block' && !componentId) {
        return;
    }

    e.preventDefault();
    document.getElementById('blocksContainer').style.background = '';

    if (componentId) {
        // Es un componente personalizado - verificar si estamos en editor principal o de componente
        const tabsStateLocal = window.tabsState || tabsState;
        if (tabsStateLocal && tabsStateLocal.activeTabId !== 'main') {
            // Estamos en un editor de componente
            addComponentFromDrag(componentId, null);
        } else {
            // Estamos en el editor principal
            addComponentFromDrag(componentId, null);
        }
    } else if (dragSource === 'sidebar') {
        // Añadir nuevo bloque desde sidebar
        const blockType = e.dataTransfer.getData('text/plain');
        if (blockType && blockTemplates[blockType]) {
            // Verificar si estamos en el editor principal o en un editor de componente
            const tabsStateLocal = window.tabsState || tabsState;
            if (tabsStateLocal && tabsStateLocal.activeTabId === 'main') {
                addBlock(blockType);
            } else if (tabsStateLocal && tabsStateLocal.activeTabId !== 'main') {
                addBlockToComponentEditor(blockType);
            }
        }
    } else {
        // Mover bloque existente al root level
        const blockId = parseInt(e.dataTransfer.getData('blockId'));
        if (blockId) {
            moveBlockToRoot(blockId);
        }
    }
}
