/**
 * Vista previa y modales
 */

/**
 * Abre el modal de vista previa
 */
function openPreviewModal() {
    window.open('/preview', '_blank');
}

/**
 * Cierra el modal de vista previa
 */
function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('active');
}

/**
 * Renderiza la vista previa de un bloque para el modal
 */
function renderBlockPreview(block) {
    const blockClass = `block-${block.id}`;
    const cssId = `css-preview-${block.id}`;
    let html = '';

    const responsiveCSS = generateResponsiveCSS(block);
    const directionCSS = generateDirectionCSS(block);
    const allCSS = responsiveCSS + directionCSS;

    if (block.type === 'container') {
        const childrenHtml = (block.children && block.children.length > 0)
            ? block.children.map(child => renderBlockPreview(child)).join('')
            : '';
        html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
            <div class="${blockClass}" style="background: ${block.backgroundColor || 'transparent'}; color: ${block.textColor || 'inherit'}; padding: 12px; border-radius: 4px; margin-bottom: 24px;">
                ${childrenHtml}
            </div>`;
    } else {
        switch (block.type) {
            case 'hero':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <div class="${blockClass}" style="background: ${block.backgroundColor}; color: ${block.textColor}; padding: 40px; border-radius: 4px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin-bottom: 24px;">
                        <h1 style="font-size: 36px; margin-bottom: 12px;">${escapeHTML(block.content)}</h1>
                        <p style="font-size: 18px;">${escapeHTML(block.subContent)}</p>
                    </div>`;
                break;
            
            case 'heading':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <h2 class="${blockClass}" style="margin-bottom: 16px;">${escapeHTML(block.content)}</h2>`;
                break;
            
            case 'paragraph':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <p class="${blockClass}" style="line-height: 1.8; margin-bottom: 16px;">${escapeHTML(block.content)}</p>`;
                break;
            
            case 'image':
                html = block.src 
                    ? `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                        <img class="${blockClass}" src="${block.src}" alt="${block.alt}" style="border-radius: 4px; object-fit: cover; margin-bottom: 24px;">`
                    : '';
                break;
            
            case 'icon': {
                const mode = state.responsiveMode;
                const fontSizeProp = mode === 'desktop' ? 'fontSize' : `fontSize${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
                const iconSize = block[fontSizeProp] || block.fontSize || '48';
                const iconColor = block.color || '#2563eb';
                
                let iconCSS = `${block.customCSS || ''}`;
                if (block.paddingTop || block.paddingRight || block.paddingBottom || block.paddingLeft) {
                    iconCSS += ` padding: ${block.paddingTop || 0}px ${block.paddingRight || 0}px ${block.paddingBottom || 0}px ${block.paddingLeft || 0}px;`;
                }
                
                html = `<style id="${cssId}">.${blockClass} { ${iconCSS} font-size: ${iconSize}px !important; color: ${iconColor} !important; display: inline-block !important; } </style>
                    <span class="${blockClass}">${block.emoji || '😀'}</span>`;
                break;
            }
            
            case 'cards':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <div class="${blockClass}" style="display: grid; grid-template-columns: repeat(${Math.min(block.items.length, 3)}, 1fr); gap: 24px; margin-bottom: 24px;">
                        ${block.items.map(item => `
                            <div style="border: 1px solid #e5e7eb; padding: 20px; border-radius: 4px;">
                                <h3 style="margin-bottom: 8px; font-size: 18px;">${escapeHTML(item.title)}</h3>
                                <p>${escapeHTML(item.description)}</p>
                            </div>
                        `).join('')}
                    </div>`;
                break;
            
            case 'carousel':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <div class="${blockClass}" style="margin-bottom: 24px;">
                        <style>
                            .carousel-container { display: flex; gap: 16px; overflow-x: auto; padding: 16px 0; scroll-behavior: smooth; }
                            .carousel-item { flex: 0 0 350px; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            .carousel-item img { width: 100%; height: 250px; object-fit: cover; }
                            .carousel-item-content { padding: 16px; }
                            .carousel-item h3 { margin-bottom: 8px; font-size: 18px; color: #1f2937; }
                            .carousel-item p { color: #6b7280; font-size: 14px; }
                        </style>
                        <div class="carousel-container">
                            ${block.slides.map(slide => `
                                <div class="carousel-item">
                                    ${slide.image 
                                        ? `<img src="${slide.image}" alt="${slide.title}">` 
                                        : '<div style="width: 100%; height: 250px; background: #e5e7eb; display: flex; align-items: center; justify-content: center; color: #6b7280;">Sin imagen</div>'}
                                    <div class="carousel-item-content">
                                        <h3>${escapeHTML(slide.title)}</h3>
                                        ${slide.description ? `<p>${escapeHTML(slide.description)}</p>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
                break;
            
            case 'button':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <a class="${blockClass}" href="${block.link}" style="display: inline-block; padding: 12px 24px; background: ${block.backgroundColor}; color: ${block.textColor}; border: none; border-radius: 4px; cursor: pointer; font-weight: 500; text-decoration: none; margin-bottom: 16px;">
                        ${escapeHTML(block.text)}
                    </a>`;
                break;
            
            case 'divider':
                html = `<style id="${cssId}">${block.customCSS} ${allCSS}</style>
                    <hr class="${blockClass}" style="border: none; border-top: 1px solid ${block.borderColor || 'transparent'}; background: ${block.borderColor || 'transparent'}; margin: 32px 0;">`;
                break;
        }
    }
    
    return html;
}

/**
 * Cambia el modo responsive (desktop/tablet/mobile)
 */
function setResponsiveMode(mode) {
    state.responsiveMode = mode;
    
    document.querySelectorAll('.responsive-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.device === mode);
    });
    
    const canvasWrapper = document.querySelector('.canvas-wrapper');
    canvasWrapper.classList.remove('desktop', 'tablet', 'mobile');
    canvasWrapper.classList.add(mode);
    
    renderBlocks();
    renderProperties();
}

/**
 * Cambia entre tabs del panel derecho
 */
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tab + 'Panel').classList.add('active');
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
}
