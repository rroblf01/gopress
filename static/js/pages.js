/**
 * Gestión de páginas múltiples
 */

/**
 * Carga la lista de páginas en el selector
 */
async function loadPagesList() {
    try {
        const response = await fetch('/api/pages');
        if (!response.ok) throw new Error('Error al cargar páginas');
        
        const pages = await response.json();
        const selector = document.getElementById('pageSelector');
        
        if (!selector) return;
        
        selector.innerHTML = pages.map(page => {
            const isActive = (page.slug === state.currentPageSlug || (page.slug === '/' && !state.currentPageSlug));
            return `<option value="${page.slug}" ${isActive ? 'selected' : ''}>
                ${page.slug === '/' ? '🏠 Inicio' : '📄 ' + (page.title || page.slug)}
            </option>`;
        }).join('');
        
    } catch (error) {
        console.error('Error loading pages:', error);
    }
}

/**
 * Cambia a una página diferente
 */
function switchPage(slug) {
    if (!slug) return;
    
    // Guardar la página actual primero
    savePageData().then(() => {
        // Cargar la nueva página
        loadPageDataBySlug(slug);
    });
}

/**
 * Carga los datos de una página por slug
 */
async function loadPageDataBySlug(slug) {
    try {
        const response = await fetch(`/api/page?slug=${encodeURIComponent(slug)}`);
        if (!response.ok) throw new Error('Error al cargar página');
        
        const data = await response.json();
        
        state.currentPageSlug = data.slug || slug;
        state.page = {
            title: data.title || '',
            blocks: data.blocks || [],
            styles: data.styles || state.page.styles,
            favicon: data.favicon || ''
        };
        
        // Actualizar UI
        document.getElementById('siteTitle').value = data.title || '';
        
        if (data.favicon) {
            const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
            link.rel = 'icon';
            link.href = data.favicon;
            document.head.appendChild(link);
            
            const preview = document.getElementById('faviconPreview');
            preview.src = data.favicon;
            preview.style.display = 'block';
        }
        
        loadGlobalStyles();
        renderBlocks();
        
        // Actualizar selector
        loadPagesList();
        
        showToast(`Página "${data.title || slug}" cargada`, 'success');
        
    } catch (error) {
        console.error('Error loading page:', error);
        showToast('Error al cargar página: ' + error.message, 'error');
    }
}

/**
 * Crea una nueva página
 */
async function createNewPage() {
    const slugInput = document.getElementById('newPageSlug');
    const titleInput = document.getElementById('newPageTitle');
    
    const slug = slugInput.value.trim().toLowerCase();
    const title = titleInput.value.trim();
    
    if (!slug) {
        showToast('El slug es requerido', 'error');
        return;
    }
    
    // Validar slug
    const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
    if (!validSlug && slug !== '/') {
        showToast('Slug inválido. Usa solo letras, números y guiones', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, title: title || slug })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Error al crear página');
        }
        
        showToast('Página creada correctamente', 'success');
        
        // Limpiar inputs
        slugInput.value = '';
        titleInput.value = '';
        
        // Recargar lista y cambiar a la nueva página
        loadPagesList();
        
        // Cerrar modal si está abierto
        closePagesModal();
        
        // Opcional: cargar la nueva página para editar
        if (confirm('¿Quieres editar esta página ahora?')) {
            switchPage(slug);
        }
        
    } catch (error) {
        console.error('Error creating page:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Elimina una página
 */
async function deletePage(id, slug) {
    if (slug === '/') {
        showToast('No se puede eliminar la página principal', 'error');
        return;
    }
    
    if (!confirm(`¿Estás seguro de eliminar la página "${slug}"? Esta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/pages/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || 'Error al eliminar página');
        }
        
        showToast('Página eliminada correctamente', 'success');
        
        // Volver a la página principal
        switchPage('/');
        
        // Recargar lista
        loadPagesList();
        
        // Cerrar modal
        closePagesModal();
        
    } catch (error) {
        console.error('Error deleting page:', error);
        showToast(error.message, 'error');
    }
}

/**
 * Abre el modal de gestión de páginas
 */
function openPagesModal() {
    document.getElementById('pagesModal').classList.add('active');
    loadPagesListForModal();
}

/**
 * Cierra el modal de gestión de páginas
 */
function closePagesModal() {
    document.getElementById('pagesModal').classList.remove('active');
}

/**
 * Carga la lista de páginas para el modal
 */
async function loadPagesListForModal() {
    try {
        const response = await fetch('/api/pages');
        if (!response.ok) throw new Error('Error al cargar páginas');
        
        const pages = await response.json();
        const container = document.getElementById('pagesList');
        
        if (pages.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay páginas creadas</p>';
            return;
        }
        
        container.innerHTML = pages.map(page => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--secondary); border-radius: 6px; margin-bottom: 8px;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px;">
                        ${page.slug === '/' ? '🏠 Inicio' : '📄 ' + (page.title || page.slug)}
                    </div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                        /${page.slug === '/' ? '' : page.slug}
                    </div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="toolbar-btn" onclick="switchPage('${page.slug}')" title="Editar">
                        ✏️ Editar
                    </button>
                    ${page.slug !== '/' ? `
                        <button class="toolbar-btn" onclick="window.open('/${page.slug}', '_blank')" title="Ver">
                            🔗 Ver
                        </button>
                        <button class="toolbar-btn" style="color: var(--danger); border-color: var(--danger);" onclick="deletePage(${page.id}, '${page.slug}')" title="Eliminar">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading pages:', error);
        document.getElementById('pagesList').innerHTML = '<p style="color: var(--danger); text-align: center; padding: 20px;">Error al cargar páginas</p>';
    }
}

/**
 * Guarda los datos de la página actual (sobrescribe según el slug actual)
 */
async function savePageData() {
    const pageData = {
        slug: state.currentPageSlug || '/',
        title: state.page.title,
        blocks: state.page.blocks,
        styles: state.page.styles,
        favicon: state.page.favicon,
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch('/cms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pageData)
        });

        if (response.ok) {
            showToast('Página guardada correctamente', 'success');
            loadPagesList(); // Actualizar selector
        } else {
            showToast('Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}
