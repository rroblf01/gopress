/**
 * Gestión de Componentes Personalizados
 */

/**
 * Abre el modal de componentes
 */
function openComponentsModal() {
    document.getElementById('componentsModal').classList.add('active');
    loadComponentsList();
}

/**
 * Cierra el modal de componentes
 */
function closeComponentsModal() {
    document.getElementById('componentsModal').classList.remove('active');
}

/**
 * Carga la lista de componentes
 */
async function loadComponentsList() {
    const listEl = document.getElementById('componentsList');
    listEl.innerHTML = '<div class="loading">Cargando componentes...</div>';

    try {
        const response = await fetch('/api/components');
        const components = await response.json();

        if (components.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay componentes guardados. Crea uno desde el canvas.</p>';
            return;
        }

        listEl.innerHTML = components.map(c => `
            <div class="component-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; background: white;">
                <div>
                    <strong style="font-size: 14px;">${escapeHTML(c.name)}</strong>
                    <div style="font-size: 11px; color: var(--text-secondary);">${new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="toolbar-btn" onclick="useComponent(${c.id})" title="Usar componente">📦 Usar</button>
                    <button class="toolbar-btn" onclick="editComponent(${c.id})" title="Editar componente">✏️</button>
                    <button class="toolbar-btn" onclick="deleteComponent(${c.id})" title="Eliminar componente" style="color: var(--danger);">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar componentes</p>';
        console.error('Error loading components:', error);
    }
}

/**
 * Guarda el bloque seleccionado como componente
 */
async function saveBlockAsComponent() {
    const nameInput = document.getElementById('componentNameInput');
    const name = nameInput.value.trim();

    if (!name) {
        showToast('Introduce un nombre para el componente', 'error');
        return;
    }

    let componentBlocks = [];
    let componentStyles = state.page.styles;

    if (state.selectedBlockId) {
        const block = findBlockById(state.page.blocks, state.selectedBlockId);
        if (!block) {
            showToast('Bloque no encontrado', 'error');
            return;
        }

        // Si es un contenedor, flex o grid, guardamos solo sus hijos como componente
        if ((block.type === 'container' || block.type === 'flex' || block.type === 'grid') && block.children) {
            componentBlocks = block.children;
        } else {
            componentBlocks = [block];
        }
    } else {
        // Si no hay bloque seleccionado, crear un contenedor vacío por defecto
        const defaultContainer = JSON.parse(JSON.stringify(blockTemplates.container));
        defaultContainer.id = Date.now();
        defaultContainer.children = [];
        componentBlocks = [defaultContainer];
    }

    const componentData = {
        name: name,
        blocks: componentBlocks,
        styles: componentStyles
    };

    try {
        const response = await fetch('/api/components', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(componentData)
        });

        if (response.ok) {
            showToast('Componente guardado correctamente', 'success');
            nameInput.value = '';
            loadComponentsList();
            loadCustomComponentsList(); // Actualizar lista en sidebar
        } else {
            showToast('Error al guardar componente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

/**
 * Usa un componente (lo añade al canvas)
 */
async function useComponent(id) {
    try {
        const response = await fetch(`/api/components/${id}`);
        if (!response.ok) {
            const error = await response.json();
            showToast(`Error: ${error.error || 'Error al cargar componente'}`, 'error');
            return;
        }

        const component = await response.json();

        // Crear un bloque de tipo "component" que referencia al componente
        const componentBlock = {
            id: Date.now(),
            type: 'component',
            componentName: component.name,
            componentId: component.id,
            customCSS: '',
            widthMobile: '',
            heightMobile: '',
            widthTablet: '',
            heightTablet: '',
            widthDesktop: '',
            heightDesktop: '',
            width: '',
            height: '',
            hiddenMobile: false,
            hiddenTablet: false,
            hiddenDesktop: false,
            paddingTop: '',
            paddingRight: '',
            paddingBottom: '',
            paddingLeft: '',
            paddingTopTablet: '',
            paddingRightTablet: '',
            paddingBottomTablet: '',
            paddingLeftTablet: '',
            paddingTopMobile: '',
            paddingRightMobile: '',
            paddingBottomMobile: '',
            paddingLeftMobile: ''
        };

        // Añadir el bloque al canvas
        state.page.blocks.push(componentBlock);

        renderBlocks();
        autoSave();
        closeComponentsModal();
        showToast('Componente añadido al canvas', 'success');
    } catch (error) {
        console.error('Error loading component:', error);
        showToast('Error al cargar componente', 'error');
    }
}

/**
 * Edita un componente existente
 */
async function editComponent(id) {
    try {
        const response = await fetch(`/api/components/${id}`);
        if (!response.ok) {
            const error = await response.json();
            showToast(`Error: ${error.error || 'Error al cargar componente'}`, 'error');
            return;
        }

        const component = await response.json();
        
        // Abrir modal de edición
        openEditComponentModal(id, component);
    } catch (error) {
        console.error('Error loading component:', error);
        showToast('Error al cargar componente', 'error');
    }
}

/**
 * Abre el modal de edición de componente
 */
function openEditComponentModal(id, component) {
    closeComponentsModal();
    
    const modal = document.getElementById('editComponentModal');
    document.getElementById('editComponentId').value = id;
    document.getElementById('editComponentName').value = component.name;
    
    // Guardar referencia al componente actual
    window.currentEditComponent = component;
    
    modal.classList.add('active');
}

/**
 * Cierra el modal de edición de componente
 */
function closeEditComponentModal() {
    document.getElementById('editComponentModal').classList.remove('active');
    window.currentEditComponent = null;
}

/**
 * Guarda los cambios de un componente
 */
async function updateComponent() {
    const id = parseInt(document.getElementById('editComponentId').value);
    const name = document.getElementById('editComponentName').value.trim();
    
    if (!name) {
        showToast('Introduce un nombre para el componente', 'error');
        return;
    }

    const component = window.currentEditComponent;
    if (!component) {
        showToast('Componente no encontrado', 'error');
        return;
    }

    const componentData = {
        name: name,
        blocks: component.blocks,
        styles: component.styles
    };

    try {
        const response = await fetch(`/api/components/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(componentData)
        });

        if (response.ok) {
            showToast('Componente actualizado correctamente', 'success');
            closeEditComponentModal();
            openComponentsModal(); // Recargar lista
        } else {
            showToast('Error al actualizar componente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

/**
 * Elimina un componente
 */
async function deleteComponent(id) {
    if (!confirm('¿Estás seguro de eliminar este componente? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/components/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Componente eliminado correctamente', 'success');
            loadComponentsList();
            loadCustomComponentsList(); // Actualizar lista en sidebar
        } else {
            showToast('Error al eliminar componente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

/**
 * Carga la lista de componentes personalizados en la sidebar
 */
async function loadCustomComponentsList() {
    const container = document.getElementById('customComponentsList');
    if (!container) return;
    
    container.innerHTML = '<div style="font-size: 11px; color: var(--text-secondary); padding: 10px;">Cargando...</div>';

    try {
        const response = await fetch('/api/components');
        const components = await response.json();

        if (components.length === 0) {
            container.innerHTML = '<div style="font-size: 11px; color: var(--text-secondary); padding: 10px;">No hay componentes</div>';
            return;
        }

        container.innerHTML = components.map(c => `
            <div class="component-item" style="display: flex; gap: 4px; margin-bottom: 4px;">
                <button class="component-btn" draggable="true" data-component-id="${c.id}" data-component-name="${escapeHTML(c.name)}" title="Arrastra para usar" style="flex: 1;">
                    🧩 ${escapeHTML(c.name)}
                </button>
                <button class="toolbar-btn" onclick="openComponentEditor(${c.id}, '${escapeHTML(c.name)}')" title="Editar componente" style="padding: 8px;">✏️</button>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<div style="font-size: 11px; color: var(--danger); padding: 10px;">Error al cargar</div>';
        console.error('Error loading custom components:', error);
    }
}

/**
 * Añade un componente al canvas desde el drag
 */
async function addComponentFromDrag(componentId, dropTarget) {
    
    try {
        const response = await fetch(`/api/components/${componentId}`);
        if (!response.ok) {
            console.error('Error al cargar componente, status:', response.status);
            showToast('Error al cargar componente', 'error');
            return;
        }

        const component = await response.json();

        // Crear un bloque de tipo "component" que referencia al componente
        const componentBlock = {
            id: Date.now(),
            type: 'component',
            componentName: component.name,
            componentId: component.id,
            customCSS: '',
            widthMobile: '',
            heightMobile: '',
            widthTablet: '',
            heightTablet: '',
            widthDesktop: '',
            heightDesktop: '',
            width: '',
            height: '',
            hiddenMobile: false,
            hiddenTablet: false,
            hiddenDesktop: false,
            paddingTop: '',
            paddingRight: '',
            paddingBottom: '',
            paddingLeft: '',
            paddingTopTablet: '',
            paddingRightTablet: '',
            paddingBottomTablet: '',
            paddingLeftTablet: '',
            paddingTopMobile: '',
            paddingRightMobile: '',
            paddingBottomMobile: '',
            paddingLeftMobile: ''
        };

        // Verificar si estamos en el editor principal o en un editor de componente
        const tabsStateLocal = window.tabsState || tabsState;
        const isComponentEditor = tabsStateLocal && tabsStateLocal.activeTabId !== 'main';

        if (isComponentEditor) {
            // Estamos en un editor de componente
            const editorState = tabsStateLocal.componentEditors[tabsStateLocal.activeTabId];
            if (editorState) {
                editorState.blocks.push(componentBlock);
                editorState.dirty = true;
                renderComponentEditorBlocks(tabsStateLocal.activeTabId);
                saveComponentFromEditor(tabsStateLocal.activeTabId);
            } else {
                console.error('editorState no encontrado para tabId:', tabsStateLocal.activeTabId);
            }
        } else {
            // Estamos en el editor principal
            // Si hay un target de drop (contenedor, flex o grid), añadir como hijo
            if (dropTarget && dropTarget.dataset.parentId) {
                const parentId = parseInt(dropTarget.dataset.parentId);
                const parent = findBlockById(state.page.blocks, parentId);
                if (parent && (parent.type === 'container' || parent.type === 'flex' || parent.type === 'grid')) {
                    parent.children = parent.children || [];
                    parent.children.push(componentBlock);
                }
            } else {
                // Añadir al root
                state.page.blocks.push(componentBlock);
            }
            renderBlocks();
            autoSave();
        }

        showToast('Componente añadido', 'success');
    } catch (error) {
        console.error('Error adding component:', error);
        showToast('Error al añadir componente', 'error');
    }
}
