/**
 * Gestión de Pestañas del Editor
 */

// Estado de las pestañas
const tabsState = {
    tabs: [
        { id: 'main', title: 'Editor Web', icon: '📄', type: 'main', closable: false }
    ],
    activeTabId: 'main',
    componentEditors: {} // Almacena el estado de cada editor de componente
};

// Hacer tabsState disponible globalmente
window.tabsState = tabsState;

/**
 * Inicializa el sistema de pestañas
 */
function initTabs() {
    renderTabs();
}

/**
 * Renderiza la barra de pestañas
 */
function renderTabs() {
    const tabsList = document.getElementById('tabsList');
    if (!tabsList) return;

    tabsList.innerHTML = tabsState.tabs.map(tab => {
        const editorState = tabsState.componentEditors[tab.id];
        const hasChanges = editorState && editorState.dirty;

        return `
        <div class="tab-item ${tab.id === tabsState.activeTabId ? 'active' : ''} ${tab.closable ? 'closable' : ''}"
             onclick="switchTab('${tab.id}')" data-tab-id="${tab.id}">
            <span class="tab-item-icon">${tab.icon}</span>
            <span class="tab-item-title" style="pointer-events: none;">${escapeHTML(tab.title)}${hasChanges ? ' •' : ''}</span>
            ${tab.closable ? `<button class="tab-item-close" onclick="closeTab('${tab.id}', event)" title="Cerrar pestaña">×</button>` : ''}
        </div>
    `}).join('');
    
    // Sincronizar con window.tabsState
    window.tabsState = tabsState;
}

/**
 * Cambia a una pestaña
 */
function switchTab(tabId) {
    console.log('switchTab llamado con tabId:', tabId);
    
    // Guardar estado actual antes de cambiar
    saveCurrentEditorState();

    tabsState.activeTabId = tabId;
    window.tabsState.activeTabId = tabId; // Actualizar referencia global
    renderTabs();
    
    // Mostrar el editor correspondiente
    if (tabId === 'main') {
        console.log('Cambiando a Editor Web');
        showMainEditor();
        updateSaveButton('main');
    } else {
        console.log('Cambiando a editor de componente:', tabId);
        showComponentEditor(tabId);
        updateSaveButton('component');
    }
}

/**
 * Actualiza el botón de guardar según la pestaña activa
 */
function updateSaveButton(type) {
    const saveBtn = document.getElementById('saveBtn');
    const saveComponentBtn = document.getElementById('saveComponentBtn');
    
    if (type === 'main') {
        if (saveBtn) saveBtn.style.display = 'block';
        if (saveComponentBtn) saveComponentBtn.style.display = 'none';
    } else {
        if (saveBtn) saveBtn.style.display = 'none';
        if (saveComponentBtn) saveComponentBtn.style.display = 'block';
    }
}

/**
 * Cierra una pestaña
 */
function closeTab(tabId, event) {
    if (event) {
        event.stopPropagation();
    }

    const tab = tabsState.tabs.find(t => t.id === tabId);
    if (!tab || !tab.closable) return;

    // Confirmar si hay cambios sin guardar
    const editorState = tabsState.componentEditors[tabId];
    if (editorState && editorState.dirty) {
        if (!confirm('¿Hay cambios sin guardar en este componente. Deseas cerrar de todas formas?')) {
            return;
        }
    }

    // Eliminar la pestaña
    const index = tabsState.tabs.findIndex(t => t.id === tabId);
    if (index !== -1) {
        tabsState.tabs.splice(index, 1);
    }

    // Eliminar el estado del editor
    delete tabsState.componentEditors[tabId];

    // Si la pestaña cerrada estaba activa, cambiar a la principal
    if (tabsState.activeTabId === tabId) {
        tabsState.activeTabId = 'main';
        window.tabsState.activeTabId = 'main';
        showMainEditor();
    }

    renderTabs();
}

/**
 * Abre una nueva pestaña para editar un componente
 */
function openComponentEditor(componentId, componentName) {
    // Verificar si ya existe una pestaña para este componente
    const existingTab = tabsState.tabs.find(t => t.type === 'component' && t.componentId === componentId);
    if (existingTab) {
        switchTab(existingTab.id);
        return;
    }

    // Crear nueva pestaña
    const tabId = `component-${componentId}-${Date.now()}`;
    const newTab = {
        id: tabId,
        title: `🧩 ${componentName}`,
        icon: '✏️',
        type: 'component',
        componentId: componentId,
        componentName: componentName,
        closable: true
    };

    tabsState.tabs.push(newTab);

    // Inicializar estado del editor
    tabsState.componentEditors[tabId] = {
        componentId: componentId,
        componentName: componentName,
        blocks: [],
        styles: {},
        dirty: false,
        loaded: false
    };

    // Cambiar a la nueva pestaña
    tabsState.activeTabId = tabId;
    window.tabsState.activeTabId = tabId;
    renderTabs();

    // Cargar el componente
    loadComponentForEditor(tabId, componentId);
}

/**
 * Carga un componente para editar
 */
async function loadComponentForEditor(tabId, componentId) {
    try {
        const response = await fetch(`/api/components/${componentId}`);
        if (!response.ok) {
            throw new Error('Error al cargar componente');
        }

        const component = await response.json();

        // Guardar en el estado
        tabsState.componentEditors[tabId].blocks = component.blocks;
        tabsState.componentEditors[tabId].styles = component.styles;
        tabsState.componentEditors[tabId].loaded = true;

        // Mostrar el editor
        showComponentEditor(tabId);
    } catch (error) {
        console.error('Error loading component:', error);
        showToast('Error al cargar componente', 'error');
    }
}

/**
 * Muestra el editor principal
 */
function showMainEditor() {
    const mainEditor = document.getElementById('mainEditor');
    if (!mainEditor) return;

    // Mostrar el canvas principal, ocultar editores de componente
    const canvas = mainEditor.querySelector('.canvas');
    if (canvas) canvas.style.display = 'block';

    const componentEditors = mainEditor.querySelectorAll('.component-editor');
    componentEditors.forEach(el => el.style.display = 'none');
    
    // Forzar redibujado
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

/**
 * Muestra un editor de componente
 */
function showComponentEditor(tabId) {
    const mainEditor = document.getElementById('mainEditor');
    if (!mainEditor) return;
    
    // Ocultar el canvas principal
    const canvas = mainEditor.querySelector('.canvas:first-child');
    if (canvas) canvas.style.display = 'none';
    
    // Ocultar todos los editores de componente
    const componentEditors = mainEditor.querySelectorAll('.component-editor');
    componentEditors.forEach(el => el.style.display = 'none');

    // Mostrar el editor activo o crearlo
    let editorEl = document.getElementById(`editor-${tabId}`);
    if (!editorEl) {
        editorEl = createComponentEditor(tabId);
    }
    if (editorEl) {
        editorEl.style.display = 'block';
        // Renderizar bloques del componente
        renderComponentEditorBlocks(tabId);
    }
}

/**
 * Crea un editor de componente
 */
function createComponentEditor(tabId) {
    const canvasWrapper = document.getElementById('mainEditor');
    if (!canvasWrapper) return null;
    
    const editorEl = document.createElement('div');
    editorEl.id = `editor-${tabId}`;
    editorEl.className = 'component-editor';
    editorEl.style.cssText = 'display: none; width: 100%; height: 100%; overflow-y: auto; padding: 40px 20px; background: #fafbfc;';
    editorEl.innerHTML = `
        <div class="canvas" style="max-width: 900px; margin: 0 auto; background: white; box-shadow: var(--shadow-lg); border-radius: 4px; min-height: 400px;">
            <div class="blocks-container" id="blocks-${tabId}">
                <div class="loading">Cargando componente...</div>
            </div>
        </div>
    `;
    canvasWrapper.appendChild(editorEl);
    return editorEl;
}

/**
 * Renderiza los bloques en un editor de componente
 */
function renderComponentEditorBlocks(tabId) {
    const editorState = tabsState.componentEditors[tabId];
    if (!editorState || !editorState.loaded) return;

    const container = document.getElementById(`blocks-${tabId}`);
    if (!container) return;

    if (editorState.blocks.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>El componente está vacío. Añade bloques para comenzar.</p></div>';
        return;
    }

    // Renderizar bloques (usando la función existente pero con el estado del componente)
    container.innerHTML = editorState.blocks.map(block => createBlockHTML(block)).join('');

    // Añadir eventos de selección
    container.querySelectorAll('.block').forEach(el => {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!e.target.closest('.block-action-btn')) {
                selectComponentBlock(tabId, parseInt(el.dataset.blockId));
            }
        });
    });

    // Añadir eventos de acciones
    container.querySelectorAll('.block-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const blockId = parseInt(btn.closest('.block').dataset.blockId);
            const action = btn.dataset.action;
            if (action === 'delete') deleteComponentBlock(tabId, blockId);
            else if (action === 'duplicate') duplicateComponentBlock(tabId, blockId);
            else if (action === 'up') moveComponentBlock(tabId, blockId, -1);
            else if (action === 'down') moveComponentBlock(tabId, blockId, 1);
        });
    });

    // Configurar drop zones para contenedores dentro del editor de componente
    container.querySelectorAll('.block-container-drop').forEach(dropZone => {
        setupComponentContainerDropZone(tabId, dropZone);
    });

    // Configurar drop zone principal del editor
    container.addEventListener('dragover', (e) => {
        if (e.target.closest('.block-container-drop')) return;
        e.preventDefault();
        const dragSource = e.dataTransfer.getData('application/x-drag-source');
        const componentId = e.dataTransfer.getData('componentId');
        if (dragSource === 'sidebar' || componentId) {
            container.style.background = 'rgba(37, 99, 235, 0.05)';
        }
    });

    container.addEventListener('dragleave', () => {
        container.style.background = '';
    });

    container.addEventListener('drop', (e) => {
        if (e.target.closest('.block-container-drop')) return;
        e.preventDefault();
        container.style.background = '';
        
        const dragSource = e.dataTransfer.getData('application/x-drag-source');
        const componentId = e.dataTransfer.getData('componentId');
        
        if (dragSource === 'sidebar') {
            const blockType = e.dataTransfer.getData('text/plain');
            if (blockType && blockTemplates[blockType]) {
                addBlockToComponentEditor(blockType);
            }
        } else if (componentId) {
            addComponentFromDrag(componentId, null);
        }
    });
}

/**
 * Configura drop zone para contenedores en editor de componente
 */
function setupComponentContainerDropZone(tabId, dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dragSource = e.dataTransfer.getData('application/x-drag-source');
        const componentId = e.dataTransfer.getData('componentId');
        if (dragSource !== 'sidebar' && !componentId) return;

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
        
        dropZone.style.background = '#f0f9ff';
        dropZone.style.borderColor = '#2563eb';

        const parentId = parseInt(dropZone.dataset.parentId);
        const editorState = tabsState.componentEditors[tabId];
        if (!editorState) return;

        if (componentId) {
            // Añadir componente como hijo del contenedor
            addComponentToContainer(editorState, componentId, parentId, tabId);
        } else if (dragSource === 'sidebar') {
            // Añadir bloque como hijo del contenedor
            const blockType = e.dataTransfer.getData('text/plain');
            if (blockType && blockTemplates[blockType]) {
                addBlockToContainer(editorState, blockType, parentId, tabId);
            }
        }
    });
}

/**
 * Añade un bloque a un contenedor en el editor de componente
 */
function addBlockToContainer(editorState, blockType, parentId, tabId) {
    const parent = findBlockById(editorState.blocks, parentId);
    if (parent && parent.type === 'container') {
        const newBlock = JSON.parse(JSON.stringify(blockTemplates[blockType]));
        newBlock.id = Date.now();
        parent.children = parent.children || [];
        parent.children.push(newBlock);
        editorState.dirty = true;
        renderComponentEditorBlocks(tabId);
    }
}

/**
 * Añade un componente a un contenedor en el editor de componente
 */
async function addComponentToContainer(editorState, componentId, parentId, tabId) {
    try {
        const response = await fetch(`/api/components/${componentId}`);
        if (!response.ok) return;
        
        const component = await response.json();
        const parent = findBlockById(editorState.blocks, parentId);
        
        if (parent && parent.type === 'container') {
            const componentBlock = {
                id: Date.now(),
                type: 'component',
                componentName: component.name,
                componentId: component.id,
                customCSS: '',
                widthMobile: '', heightMobile: '',
                widthTablet: '', heightTablet: '',
                widthDesktop: '', heightDesktop: '',
                width: '', height: '',
                hiddenMobile: false, hiddenTablet: false, hiddenDesktop: false,
                paddingTop: '', paddingRight: '', paddingBottom: '', paddingLeft: '',
                paddingTopTablet: '', paddingRightTablet: '', paddingBottomTablet: '', paddingLeftTablet: '',
                paddingTopMobile: '', paddingRightMobile: '', paddingBottomMobile: '', paddingLeftMobile: ''
            };
            parent.children = parent.children || [];
            parent.children.push(componentBlock);
            editorState.dirty = true;
            renderComponentEditorBlocks(tabId);
        }
    } catch (error) {
        console.error('Error adding component to container:', error);
    }
}

/**
 * Selecciona un bloque en el editor de componente
 */
function selectComponentBlock(tabId, blockId) {
    tabsState.componentEditors[tabId].selectedBlockId = blockId;
    renderComponentEditorBlocks(tabId);
    renderProperties();
}

/**
 * Guarda el estado del editor actual
 */
function saveCurrentEditorState() {
    if (tabsState.activeTabId === 'main') {
        // El estado principal ya está en state.page
        return;
    }

    // Para editores de componente, el estado ya está en tabsState.componentEditors
}

/**
 * Guarda un componente desde su editor
 */
async function saveComponentFromEditor(tabId) {
    console.log('saveComponentFromEditor llamado con tabId:', tabId);
    
    const state = window.tabsState || tabsState;
    const editorState = state.componentEditors[tabId];
    
    if (!editorState) {
        console.error('Editor no encontrado para tabId:', tabId);
        showToast('Editor no encontrado', 'error');
        return;
    }

    const componentData = {
        name: editorState.componentName,
        blocks: editorState.blocks,
        styles: editorState.styles
    };
    
    console.log('Guardando componente:', componentData.name);

    try {
        const response = await fetch(`/api/components/${editorState.componentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(componentData)
        });
        
        console.log('Response status:', response.status);

        if (response.ok) {
            editorState.dirty = false;
            showToast('Componente actualizado correctamente', 'success');
            renderTabs(); // Actualizar UI para quitar el indicador de cambios

            // Actualizar la lista de componentes en la sidebar
            loadCustomComponentsList();
        } else {
            const error = await response.json();
            console.error('Error del servidor:', error);
            showToast('Error al guardar componente: ' + (error.error || ''), 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        showToast('Error de conexión', 'error');
    }
}

/**
 * Añade un bloque al editor de componente actual
 */
function addBlockToComponentEditor(type) {
    if (tabsState.activeTabId === 'main') {
        addBlock(type);
        return;
    }

    const editorState = tabsState.componentEditors[tabsState.activeTabId];
    if (!editorState) return;

    const template = JSON.parse(JSON.stringify(blockTemplates[type]));
    template.id = Date.now();
    editorState.blocks.push(template);
    editorState.dirty = true;
    renderComponentEditorBlocks(tabsState.activeTabId);
}

/**
 * Elimina un bloque del editor de componente
 */
function deleteComponentBlock(tabId, blockId) {
    const editorState = tabsState.componentEditors[tabId];
    if (!editorState) return;

    const idx = editorState.blocks.findIndex(b => b.id === blockId);
    if (idx !== -1) {
        editorState.blocks.splice(idx, 1);
        editorState.dirty = true;
        if (editorState.selectedBlockId === blockId) {
            editorState.selectedBlockId = null;
        }
        renderComponentEditorBlocks(tabId);
    }
}

/**
 * Duplica un bloque en el editor de componente
 */
function duplicateComponentBlock(tabId, blockId) {
    const editorState = tabsState.componentEditors[tabId];
    if (!editorState) return;

    const idx = editorState.blocks.findIndex(b => b.id === blockId);
    if (idx !== -1) {
        const copy = JSON.parse(JSON.stringify(editorState.blocks[idx]));
        copy.id = Date.now();
        editorState.blocks.splice(idx + 1, 0, copy);
        editorState.dirty = true;
        renderComponentEditorBlocks(tabId);
    }
}

/**
 * Mueve un bloque en el editor de componente
 */
function moveComponentBlock(tabId, blockId, direction) {
    const editorState = tabsState.componentEditors[tabId];
    if (!editorState) return;

    const idx = editorState.blocks.findIndex(b => b.id === blockId);
    const newIdx = idx + direction;
    if (idx !== -1 && newIdx >= 0 && newIdx < editorState.blocks.length) {
        [editorState.blocks[idx], editorState.blocks[newIdx]] = [editorState.blocks[newIdx], editorState.blocks[idx]];
        editorState.dirty = true;
        renderComponentEditorBlocks(tabId);
    }
}

/**
 * Scroll de las pestañas
 */
function scrollTabs(direction) {
    const tabsList = document.getElementById('tabsList');
    if (!tabsList) return;

    const scrollAmount = 200;
    tabsList.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}
