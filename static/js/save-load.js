/**
 * Guardar y cargar página
 */

/**
 * Guarda la página actual
 */
async function savePage() {
    const pageData = {
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
        } else {
            showToast('Error al guardar', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
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
            showToast('Página cargada', 'success');
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
            const link = document.querySelector('link[rel="icon"]') || document.createElement('link');
            link.rel = 'icon';
            link.href = e.target.result;
            document.head.appendChild(link);
            
            const preview = document.getElementById('faviconPreview');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}
