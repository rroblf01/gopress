/**
 * Guardar y cargar página
 */

/**
 * Guarda la página actual
 */
async function savePage() {
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

        const responseData = await response.json();

        if (response.ok) {
            showToast('Página guardada correctamente', 'success');
        } else {
            showToast('Error al guardar: ' + (responseData.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('❌ [SAVE] Error:', error);
        showToast('Error de conexión', 'error');
    }
}

/**
 * Carga los datos de la página
 */
function loadPageData() {
    fetch('/api/page')
    .then(res => {
        if (res.status === 404) {
            loadGlobalStyles();
            renderBlocks();
            return null;
        }
        return res.json();
    })
    .then(data => {
        if (!data) return;
        
        if (data.blocks !== undefined) {
            
            // Inicializar propiedades faltantes en los bloques
            const blocks = initializeBlockProperties(data.blocks || []);

            state.page = {
                title: data.title || '',
                blocks: blocks,
                styles: data.styles || state.page.styles,
                favicon: data.favicon || ''
            };

            document.getElementById('siteTitle').value = data.title || '';

            if (data.favicon) {
                // Solo actualizar el preview, no el favicon global
                const preview = document.getElementById('faviconPreview');
                preview.src = data.favicon;
                preview.style.display = 'block';
            }

            loadGlobalStyles();
            renderBlocks();
            showToast('Página cargada', 'success');
            
            loadSiteConfig();
        }
    })
    .catch(err => {
        console.error('Error al cargar página:', err);
    });
}

/**
 * Actualiza el título del sitio
 */
function updateSiteTitle(value) {
    state.page.title = value;
    if (typeof autoSave === 'function') autoSave();
}

/**
 * Actualiza el dominio del sitio
 */
function updateSiteDomain(value) {
    // Guardar en la configuración del sitio
    fetch('/api/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: value })
    })
    .then(res => res.json())
    .then(data => {
        console.log('Dominio actualizado:', data);
        showToast('Dominio actualizado correctamente', 'success');
    })
    .catch(err => {
        console.error('Error al actualizar dominio:', err);
        showToast('Error al actualizar dominio', 'error');
    });
}

/**
 * Carga la configuración del sitio
 */
function loadSiteConfig() {
    fetch('/api/site-config')
    .then(res => res.json())
    .then(config => {
        if (config.domain) {
            document.getElementById('siteDomain').value = config.domain;
        }
    })
    .catch(err => {
        console.error('Error al cargar configuración:', err);
    });
}

/**
 * Actualiza el favicon del sitio
 */
function updateSiteFavicon(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.page.favicon = e.target.result;
            // Solo actualizar el preview, no el favicon global
            const preview = document.getElementById('faviconPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
            // Guardar automáticamente el favicon al cambiar
            if (typeof autoSave === 'function') autoSave();
        };
        reader.readAsDataURL(file);
    }
}
