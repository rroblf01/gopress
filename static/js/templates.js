/**
 * Gestión de plantillas
 */

/**
 * Abre el modal de plantillas
 */
function openTemplatesModal() {
    document.getElementById('templatesModal').classList.add('active');
    loadTemplatesList();
}

/**
 * Cierra el modal de plantillas
 */
function closeTemplatesModal() {
    document.getElementById('templatesModal').classList.remove('active');
}

/**
 * Carga la lista de plantillas
 */
async function loadTemplatesList() {
    const listEl = document.getElementById('templatesList');
    listEl.innerHTML = '<div class="loading">Cargando plantillas...</div>';

    try {
        const response = await fetch('/api/templates');
        const templates = await response.json();

        if (templates.length === 0) {
            listEl.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No hay plantillas guardadas</p>';
            return;
        }

        listEl.innerHTML = templates.map(t => `
            <div class="template-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; background: white;">
                <div>
                    <strong style="font-size: 14px;">${escapeHTML(t.name)}</strong>
                    <div style="font-size: 11px; color: var(--text-secondary);">${new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="toolbar-btn" onclick="loadTemplate(${t.id})" title="Cargar plantilla">📂 Cargar</button>
                    <button class="toolbar-btn" onclick="deleteTemplate(${t.id})" title="Eliminar plantilla" style="color: var(--danger);">🗑️</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        listEl.innerHTML = '<p style="text-align: center; color: var(--danger);">Error al cargar plantillas</p>';
        console.error('Error loading templates:', error);
    }
}

/**
 * Guarda la página actual como plantilla
 */
async function saveCurrentAsTemplate() {
    const nameInput = document.getElementById('templateNameInput');
    const name = nameInput.value.trim();

    if (!name) {
        showToast('Introduce un nombre para la plantilla', 'error');
        return;
    }

    const pageData = {
        title: state.page.title,
        blocks: state.page.blocks,
        styles: state.page.styles,
        favicon: state.page.favicon,
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, ...pageData })
        });

        if (response.ok) {
            showToast('Plantilla guardada correctamente', 'success');
            nameInput.value = '';
            loadTemplatesList();
        } else {
            showToast('Error al guardar plantilla', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}

/**
 * Carga una plantilla
 */
async function loadTemplate(id) {
    // Doble confirmación
    if (!confirm('¿Estás seguro de cargar esta plantilla? Se perderá todo el contenido actual.')) {
        return;
    }
    if (!confirm('⚠️ CONFIRMACIÓN: Esta acción reemplazará todo tu trabajo actual. ¿Continuar?')) {
        return;
    }

    try {
        const response = await fetch(`/api/templates/${id}`);
        if (!response.ok) {
            const error = await response.json();
            showToast(`Error: ${error.error || 'Error al cargar plantilla'}`, 'error');
            return;
        }

        const pageData = await response.json();

        state.page = {
            title: pageData.title || '',
            blocks: pageData.blocks || [],
            styles: pageData.styles || state.page.styles,
            favicon: pageData.favicon || ''
        };

        document.getElementById('siteTitle').value = pageData.title || '';

        if (pageData.favicon) {
            let link = document.querySelector('link[rel="icon"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = pageData.favicon;
            const preview = document.getElementById('faviconPreview');
            if (preview) {
                preview.src = pageData.favicon;
                preview.style.display = 'block';
            }
        }

        loadGlobalStyles();
        renderBlocks();
        closeTemplatesModal();
        showToast('Plantilla cargada correctamente', 'success');
    } catch (error) {
        console.error('Error loading template:', error);
        showToast('Error al cargar plantilla', 'error');
    }
}

/**
 * Elimina una plantilla
 */
async function deleteTemplate(id) {
    if (!confirm('¿Estás seguro de eliminar esta plantilla? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Plantilla eliminada correctamente', 'success');
            loadTemplatesList();
        } else {
            showToast('Error al eliminar plantilla', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error de conexión', 'error');
    }
}
