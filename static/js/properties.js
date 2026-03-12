/**
 * Panel de propiedades de bloques
 */

/**
 * Renderiza el panel de propiedades
 */
function renderProperties() {
    const panel = document.getElementById('propertiesPanel');
    
    if (!panel) return;

    // Determinar si estamos en el editor principal o en un editor de componente
    const isComponentEditor = tabsState && tabsState.activeTabId !== 'main';
    let block = null;
    let selectedBlockId = null;
    
    if (isComponentEditor) {
        // Estamos en un editor de componente
        const editorState = tabsState.componentEditors[tabsState.activeTabId];
        if (!editorState) {
            panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">Selecciona un bloque para editar</p>';
            return;
        }
        selectedBlockId = editorState.selectedBlockId;
        if (selectedBlockId) {
            block = findBlockById(editorState.blocks, selectedBlockId);
        }
    } else {
        // Estamos en el editor principal
        selectedBlockId = state.selectedBlockId;
        if (selectedBlockId) {
            block = findBlockById(state.page.blocks, selectedBlockId);
        }
    }

    // Siempre mostrar la lista global de componentes
    let html = createGlobalComponentList(isComponentEditor);

    // Si no hay bloque seleccionado, mostrar mensaje
    if (!block) {
        if (!html) {
            panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">Selecciona un bloque para editar</p>';
        } else {
            // Añadir mensaje después de la lista de componentes
            html += '<p style="color: var(--text-secondary); font-size: 13px; margin-top: 16px;">Selecciona un bloque para editar sus propiedades</p>';
        }
        panel.innerHTML = html;
        return;
    }

    // Propiedades del bloque seleccionado
    html += `<div class="property-group" style="margin-top: 16px; padding-top: 16px; border-top: 2px solid var(--border);">
        <label class="property-label">Propiedades del Bloque</label>
    </div>`;
    
    html += `<div class="property-group">
        <label class="property-label">Tipo de Bloque</label>
        <input type="text" value="${block.type}" disabled class="property-input" style="background: var(--secondary);">
    </div>`;

    // Añadir propiedades de dimensiones para todos los bloques (excepto icon)
    if (block.type !== 'icon') {
        html += createDimensionProperties(block, isComponentEditor);
    }

    // Añadir propiedades de padding para todos los bloques
    html += createPaddingProperties(block, isComponentEditor);

    // Visibilidad por dispositivo
    html += createVisibilityProperties(block, isComponentEditor);

    // Lista global de componentes personalizados en la página
    html += createGlobalComponentList(isComponentEditor);

    // Visibilidad de componentes hijos (para cualquier bloque con children)
    if (block.children && block.children.length > 0) {
        html += createComponentVisibilityList(block, isComponentEditor);
    }

    // Propiedades específicas por tipo de bloque
    switch (block.type) {
        case 'container':
            html += renderContainerProperties(block);
            break;
        case 'hero':
            html += renderHeroProperties(block);
            break;
        case 'paragraph':
            html += renderParagraphProperties(block);
            break;
        case 'heading':
            html += renderHeadingProperties(block);
            break;
        case 'image':
            html += renderImageProperties(block);
            break;
        case 'icon':
            html += renderIconProperties(block);
            break;
        case 'cards':
            html += renderCardsProperties(block);
            break;
        case 'carousel':
            html += renderCarouselProperties(block);
            break;
        case 'button':
            html += renderButtonProperties(block);
            break;
        case 'divider':
            html += renderDividerProperties(block);
            break;
        case 'flex':
            html += renderFlexProperties(block);
            break;
        case 'grid':
            html += renderGridProperties(block);
            break;
        case 'component':
            html += renderComponentProperties(block);
            break;
    }

    // CSS Personalizado
    html += `<div class="property-group">
        <label class="property-label">CSS Personalizado</label>
        <textarea class="property-textarea" oninput="updateBlockProperty('customCSS', this.value)">${block.customCSS || ''}</textarea>
    </div>`;

    // Interactividad
    html += renderInteractivityProperties(block, isComponentEditor);

    panel.innerHTML = html;
}

/**
 * Crea propiedades de dimensiones
 */
function createDimensionProperties(block, isComponentEditor = false) {
    const mode = state.responsiveMode;
    const widthProp = mode === 'desktop' ? 'width' : `width${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const heightProp = mode === 'desktop' ? 'height' : `height${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

    return `<div class="property-group">
        <label class="property-label">Dimensiones - ${mode === 'desktop' ? '🖥️ Ordenador' : mode === 'tablet' ? '📱 Tablet' : '📲 Móvil'}</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" value="${block[widthProp] || block.width || ''}" class="property-input"
                placeholder="Ancho (px, %)" oninput="updateDimensionProperty('width', this.value, ${isComponentEditor})">
            <input type="text" value="${block[heightProp] || block.height || ''}" class="property-input"
                placeholder="Alto (px, %)" oninput="updateDimensionProperty('height', this.value, ${isComponentEditor})">
        </div>
    </div>`;
}

/**
 * Crea propiedades de padding
 */
function createPaddingProperties(block, isComponentEditor = false) {
    const mode = state.responsiveMode;
    const paddingTopProp = mode === 'desktop' ? 'paddingTop' : `paddingTop${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const paddingRightProp = mode === 'desktop' ? 'paddingRight' : `paddingRight${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const paddingBottomProp = mode === 'desktop' ? 'paddingBottom' : `paddingBottom${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const paddingLeftProp = mode === 'desktop' ? 'paddingLeft' : `paddingLeft${mode.charAt(0).toUpperCase() + mode.slice(1)}`;

    return `<div class="property-group">
        <label class="property-label">Padding - ${mode === 'desktop' ? '🖥️ Ordenador' : mode === 'tablet' ? '📱 Tablet' : '📲 Móvil'}</label>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="number" value="${block[paddingTopProp] || block.paddingTop || ''}" class="property-input"
                placeholder="Top" oninput="updatePaddingProperty('paddingTop', this.value, ${isComponentEditor})">
            <input type="number" value="${block[paddingRightProp] || block.paddingRight || ''}" class="property-input"
                placeholder="Right" oninput="updatePaddingProperty('paddingRight', this.value, ${isComponentEditor})">
            <input type="number" value="${block[paddingBottomProp] || block.paddingBottom || ''}" class="property-input"
                placeholder="Bottom" oninput="updatePaddingProperty('paddingBottom', this.value, ${isComponentEditor})">
            <input type="number" value="${block[paddingLeftProp] || block.paddingLeft || ''}" class="property-input"
                placeholder="Left" oninput="updatePaddingProperty('paddingLeft', this.value, ${isComponentEditor})">
        </div>
    </div>`;
}

/**
 * Crea propiedades de visibilidad por dispositivo
 */
function createVisibilityProperties(block, isComponentEditor = false) {
    return `<div class="property-group" style="border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <label class="property-label">Visibilidad por Dispositivo</label>
        <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" ${block.hiddenDesktop ? 'checked' : ''} onchange="updateHiddenProperty('hiddenDesktop', this.checked, ${isComponentEditor})" style="width: 16px; height: 16px;">
                <span style="font-size: 13px;">🖥️ Ocultar en Ordenador</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" ${block.hiddenTablet ? 'checked' : ''} onchange="updateHiddenProperty('hiddenTablet', this.checked, ${isComponentEditor})" style="width: 16px; height: 16px;">
                <span style="font-size: 13px;">📱 Ocultar en Tablet</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" ${block.hiddenMobile ? 'checked' : ''} onchange="updateHiddenProperty('hiddenMobile', this.checked, ${isComponentEditor})" style="width: 16px; height: 16px;">
                <span style="font-size: 13px;">📲 Ocultar en Móvil</span>
            </label>
        </div>
    </div>`;
}

/**
 * Crea lista de visibilidad de componentes hijos
 */
function createComponentVisibilityList(block, isComponentEditor = false) {
    const components = block.children.filter(child => child.type === 'component');
    if (components.length === 0) return '';

    const listItems = components.map((comp, index) => `
        <div class="component-visibility-item" 
             data-block-id="${comp.id}" 
             data-component-id="${comp.componentId}"
             data-component-name="${escapeHTML(comp.componentName)}"
             style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--secondary); border-radius: 4px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s;"
             onmouseenter="highlightComponent(${comp.id})"
             onmouseleave="unhighlightComponent(${comp.id})">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <span style="font-size: 16px;">🧩</span>
                <span style="font-size: 13px; font-weight: 500;">${escapeHTML(comp.componentName)}</span>
            </div>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;" onclick="event.stopPropagation()">
                <input type="checkbox" 
                    ${comp.hiddenDesktop || comp.hiddenTablet || comp.hiddenMobile ? 'checked' : ''} 
                    onchange="toggleComponentVisibility(${comp.id}, ${isComponentEditor})"
                    style="width: 16px; height: 16px; cursor: pointer;">
                <span style="font-size: 11px; color: var(--text-secondary);">Oculto</span>
            </label>
        </div>
    `).join('');

    return `<div class="property-group" style="border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <label class="property-label" style="display: flex; align-items: center; gap: 6px;">
            <span>📦</span> Componentes en este bloque (${components.length})
        </label>
        <div style="margin-top: 8px;">
            ${listItems}
        </div>
    </div>`;
}

/**
 * Crea lista global de componentes personalizados en la página
 */
function createGlobalComponentList(isComponentEditor = false) {
    // Buscar todos los componentes en la página (recursivamente)
    const allComponents = [];
    const stateObj = isComponentEditor ? 
        tabsState.componentEditors[tabsState.activeTabId] : 
        { blocks: state.page.blocks };
    
    function findComponents(blocks) {
        for (const block of blocks) {
            if (block.type === 'component') {
                allComponents.push(block);
            }
            if (block.children && block.children.length > 0) {
                findComponents(block.children);
            }
        }
    }
    
    findComponents(stateObj.blocks);
    
    if (allComponents.length === 0) return '';
    
    // Determinar qué propiedad hidden usar según el modo responsive
    const mode = state.responsiveMode;
    const hiddenProp = mode === 'desktop' ? 'hiddenDesktop' : mode === 'tablet' ? 'hiddenTablet' : 'hiddenMobile';

    const listItems = allComponents.map((comp) => `
        <div class="component-visibility-item" 
             data-block-id="${comp.id}" 
             data-component-id="${comp.componentId}"
             data-component-name="${escapeHTML(comp.componentName)}"
             style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--secondary); border-radius: 4px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s;"
             onmouseenter="highlightComponent(${comp.id})"
             onmouseleave="unhighlightComponent(${comp.id})">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                <span style="font-size: 16px;">🧩</span>
                <span style="font-size: 13px; font-weight: 500;">${escapeHTML(comp.componentName)}</span>
            </div>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;" onclick="event.stopPropagation()">
                <input type="checkbox" 
                    ${comp[hiddenProp] ? 'checked' : ''} 
                    onchange="toggleComponentVisibility(${comp.id}, ${isComponentEditor})"
                    style="width: 16px; height: 16px; cursor: pointer;">
                <span style="font-size: 11px; color: var(--text-secondary);">Oculto</span>
            </label>
        </div>
    `).join('');

    const modeLabel = mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📲';

    return `<div class="property-group" style="border-bottom: 1px solid var(--border); padding-bottom: 16px;">
        <label class="property-label" style="display: flex; align-items: center; gap: 6px;">
            <span>👁️</span> Componentes en la página ${modeLabel} (${allComponents.length})
        </label>
        <div style="margin-top: 8px; max-height: 300px; overflow-y: auto;">
            ${listItems}
        </div>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">
            💡 Pasa el ratón para resaltar el componente en el canvas
        </p>
    </div>`;
}

/**
 * Propiedades para contenedor
 */
function renderContainerProperties(block) {
    const mode = state.responsiveMode;
    const directionProp = mode === 'desktop' ? 'directionDesktop' : `direction${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const currentDirection = block[directionProp] || block.direction;
    
    return `<div class="property-group">
        <label class="property-label">ID de Sección</label>
        <input type="text" value="${block.sectionId || ''}" class="property-input" placeholder="ej: contacto, servicios" oninput="updateBlockProperty('sectionId', this.value)">
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
            💡 Este ID se usa para el scroll: #${block.sectionId || 'seccion'}
        </p>
    </div>
    <div class="property-group">
        <label class="property-label">Dirección - ${mode === 'desktop' ? '🖥️ Ordenador' : mode === 'tablet' ? '📱 Tablet' : '📲 Móvil'}</label>
        <select class="property-select" onchange="updateDirectionProperty(this.value)">
            <option value="vertical" ${currentDirection === 'vertical' ? 'selected' : ''}>Vertical</option>
            <option value="horizontal" ${currentDirection === 'horizontal' ? 'selected' : ''}>Horizontal</option>
        </select>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
            💡 Cambia según el dispositivo seleccionado
        </p>
    </div>
    <div class="property-group">
        <label style="display: flex; align-items: center; justify-content: space-between;">
            <span class="property-label" style="margin: 0;">Estado Hover</span>
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" ${state.hoverMode ? 'checked' : ''} onchange="toggleHoverMode()"
                    style="width: 36px; height: 20px; margin-right: 8px;">
                <span style="font-size: 11px; color: var(--text-secondary);">${state.hoverMode ? 'ON' : 'OFF'}</span>
            </label>
        </label>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo ${state.hoverMode ? '(Hover)' : ''}</label>
        <div class="color-input">
            <input type="color" value="${state.hoverMode ? (block.hoverBackgroundColor || '#ffffff') : (block.backgroundColor || '#ffffff')}"
                onchange="updateColorProperty('backgroundColor', this.value)">
            <input type="text" value="${state.hoverMode ? (block.hoverBackgroundColor || '#ffffff') : (block.backgroundColor || '#ffffff')}"
                class="property-input" onchange="updateColorProperty('backgroundColor', this.value)">
        </div>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Texto ${state.hoverMode ? '(Hover)' : ''}</label>
        <div class="color-input">
            <input type="color" value="${state.hoverMode ? (block.hoverTextColor || '#1f2937') : (block.textColor || '#1f2937')}"
                onchange="updateColorProperty('textColor', this.value)">
            <input type="text" value="${state.hoverMode ? (block.hoverTextColor || '#1f2937') : (block.textColor || '#1f2937')}"
                class="property-input" onchange="updateColorProperty('textColor', this.value)">
        </div>
    </div>`;
}

/**
 * Propiedades para hero
 */
function renderHeroProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Título</label>
        <input type="text" value="${block.content}" class="property-input" oninput="updateBlockProperty('content', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Subtítulo</label>
        <input type="text" value="${block.subContent}" class="property-input" oninput="updateBlockProperty('subContent', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo</label>
        <div class="color-input">
            <input type="color" value="${block.backgroundColor}" oninput="updateBlockProperty('backgroundColor', this.value)">
            <input type="text" value="${block.backgroundColor}" class="property-input" oninput="updateBlockProperty('backgroundColor', this.value)">
        </div>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Texto</label>
        <div class="color-input">
            <input type="color" value="${block.textColor}" oninput="updateBlockProperty('textColor', this.value)">
            <input type="text" value="${block.textColor}" class="property-input" oninput="updateBlockProperty('textColor', this.value)">
        </div>
    </div>`;
}

/**
 * Propiedades para párrafo
 */
function renderParagraphProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Contenido</label>
        <textarea class="property-textarea" oninput="updateBlockProperty('content', this.value)">${block.content}</textarea>
    </div>`;
}

/**
 * Propiedades para heading
 */
function renderHeadingProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Contenido</label>
        <input type="text" value="${block.content}" class="property-input" oninput="updateBlockProperty('content', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Nivel</label>
        <select class="property-select" oninput="updateBlockProperty('level', this.value)">
            <option value="1" ${block.level === 1 ? 'selected' : ''}>H1</option>
            <option value="2" ${block.level === 2 ? 'selected' : ''}>H2</option>
            <option value="3" ${block.level === 3 ? 'selected' : ''}>H3</option>
            <option value="4" ${block.level === 4 ? 'selected' : ''}>H4</option>
        </select>
    </div>`;
}

/**
 * Propiedades para imagen
 */
function renderImageProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Imagen</label>
        <div style="margin-bottom: 8px;">
            <input type="file" accept="image/*" onchange="handleImageUpload(event)" 
                style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; font-size: 12px;">
        </div>
        ${block.src 
            ? `<img src="${block.src}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border); margin-top: 8px;">` 
            : '<div style="background: var(--secondary); height: 120px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px;">Sin imagen</div>'}
    </div>
    <div class="property-group">
        <label class="property-label">URL de Imagen</label>
        <input type="text" value="${block.src}" class="property-input" placeholder="https://ejemplo.com/imagen.jpg" oninput="updateBlockProperty('src', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Alt Text</label>
        <input type="text" value="${block.alt}" class="property-input" oninput="updateBlockProperty('alt', this.value)">
    </div>`;
}

/**
 * Propiedades para icono
 */
function renderIconProperties(block) {
    const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '💋', '💌', '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💯', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤', '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '👶', '🧒', '👦', '👧', '🧑', '👱', '👨', '🧔', '👨‍🦰', '👨‍🦱', '👨‍🦳', '👨‍🦲', '👩', '👩‍🦰', '🧑‍🦰', '👩‍🦱', '🧑‍🦱', '👩‍🦳', '🧑‍🦳', '👩‍🦲', '🧑‍🦲', '👱‍♀️', '👱‍♂️', '🧓', '👴', '👵', '🙍', '🙍‍♂️', '🙍‍♀️', '🙎', '🙎‍♂️', '🙎‍♀️', '🙅', '🙅‍♂️', '🙅‍♀️', '🙆', '🙆‍♂️', '🙆‍♀️', '💁', '💁‍♂️', '💁‍♀️', '🙋', '🙋‍♂️', '🙋‍♀️', '🧏', '🧏‍♂️', '🧏‍♀️', '🙇', '🙇‍♂️', '🙇‍♀️', '🤦', '🤦‍♂️', '🤦‍♀️', '🤷', '🤷‍♂️', '🤷‍♀️', '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🎄', '🎃', '🎆', '🎇', '🧨', '✨', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅', '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐', '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒', '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️', '🎣', '🤿', '🎽', '🎿', '🛷', '🥌', '🎯', '🪀', '🪁', '🎱', '🔮', '🪄', '🧿', '🎮', '🕹️', '🎰', '🎲', '🧩', '🧸', '🪅', '🪆', '♠️', '♥️', '♦️', '♣️', '♟️', '🃏', '🀄', '🎴', '🎭', '🖼️', '🎨', '🧵', '🪡', '🧶', '🪢', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🛍️', '🎒', '🩴', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '🪖', '⛑️', '📿', '💄', '💍', '💎', '🔇', '🔈', '🔉', '🔊', '📢', '📣', '📯', '🔔', '🔕', '🎼', '🎵', '🎶', '🎙️', '🎚️', '🎛️', '🎤', '🎧', '📻', '🎷', '🪗', '🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '🧮', '🎥', '🎞️', '📽️', '🎬', '📺', '📷', '📸', '📹', '📼', '🔍', '🔎', '🕯️', '💡', '🔦', '🏮', '🪔', '📔', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '🏷️', '💰', '🪙', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️', '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅', '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏', '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🪃', '🏹', '🛡️', '🪚', '🔧', '🪛', '🔩', '⚙️', '🗜️', '⚖️', '🦯', '🔗', '⛓️', '🪝', '🧰', '🧲', '🪜', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🚪', '🛗', '🪞', '🪟', '🛏️', '🛋️', '🪑', '🚽', '🪠', '🚿', '🛁', '🪤', '🪒', '🧴', '🧷', '🧹', '🧺', '🧻', '🪣', '🧼', '🪥', '🧽', '🧯', '🛒', '🚬', '⚰️', '🪦', '⚱️', '🗿', '🪧', '🚰'];
    const mode = state.responsiveMode;
    const fontSizeProp = mode === 'desktop' ? 'fontSize' : `fontSize${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    
    return `<div class="property-group">
        <label class="property-label">Emoji</label>
        <div style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 4px; max-height: 300px; overflow-y: auto; padding: 8px; background: var(--secondary); border-radius: 4px; margin-bottom: 12px;">
            ${emojis.map(emoji => `
                <button type="button" onclick="updateBlockProperty('emoji', '${emoji}')" 
                    style="font-size: 20px; padding: 4px; border: 1px solid ${block.emoji === emoji ? 'var(--primary)' : 'var(--border)'}; 
                    border-radius: 4px; background: ${block.emoji === emoji ? 'var(--primary)' : 'white'}; 
                    color: ${block.emoji === emoji ? 'white' : 'black'}; cursor: pointer;">
                    ${emoji}
                </button>
            `).join('')}
        </div>
    </div>
    <div class="property-group">
        <label class="property-label">Tamaño (px) - ${mode === 'desktop' ? '🖥️ Ordenador' : mode === 'tablet' ? '📱 Tablet' : '📲 Móvil'}</label>
        <input type="number" value="${block[fontSizeProp] || block.fontSize || 48}" class="property-input" 
            oninput="updateIconFontSize(this.value)" placeholder="48">
    </div>
    <div class="property-group">
        <label class="property-label">Color</label>
        <div class="color-input">
            <input type="color" value="${block.color || '#2563eb'}" oninput="updateBlockProperty('color', this.value)">
            <input type="text" value="${block.color || '#2563eb'}" class="property-input" oninput="updateBlockProperty('color', this.value)">
        </div>
    </div>`;
}

/**
 * Propiedades para tarjetas
 */
function renderCardsProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Tarjetas (${block.items.length})</label>
        <div style="margin-bottom: 8px;">
            ${block.items.map((item, idx) => `
                <div class="card-item">
                    <input type="text" class="card-item-input" value="${escapeHTML(item.title)}" 
                        placeholder="Título" oninput="updateCardItem(${idx}, 'title', this.value)">
                    <input type="text" class="card-item-input" value="${escapeHTML(item.description)}" 
                        placeholder="Descripción" oninput="updateCardItem(${idx}, 'description', this.value)">
                    <div class="card-item-buttons">
                        <button class="card-item-btn danger" onclick="deleteCardItem(${idx})">Eliminar</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="property-input" style="background: var(--primary); color: white; padding: 8px; cursor: pointer;" 
            onclick="addCardItem()">+ Añadir Tarjeta</button>
    </div>`;
}

/**
 * Propiedades para carrusel
 */
function renderCarouselProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Slides (${block.slides.length})</label>
        <div style="margin-bottom: 8px;">
            ${block.slides.map((slide, idx) => `
                <div class="carousel-slide">
                    <input type="text" class="carousel-slide-input" value="${escapeHTML(slide.title)}" 
                        placeholder="Título" onchange="updateCarouselSlide(${idx}, 'title', this.value)">
                    <div class="carousel-image-upload">
                        <input type="file" accept="image/*" onchange="handleCarouselImageUpload(${idx}, event)">
                    </div>
                    ${slide.image 
                        ? `<img src="${slide.image}" class="carousel-image-preview" alt="preview">` 
                        : '<div style="background: var(--border); height: 120px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 12px;">Sin imagen</div>'}
                    <input type="text" class="carousel-slide-input" value="${escapeHTML(slide.description || '')}" 
                        placeholder="Descripción" onchange="updateCarouselSlide(${idx}, 'description', this.value)">
                    <div class="carousel-slide-buttons">
                        <button class="carousel-slide-btn danger" onclick="deleteCarouselSlide(${idx})">Eliminar</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <button class="property-input" style="background: var(--primary); color: white; padding: 8px; cursor: pointer;" 
            onclick="addCarouselSlide()">+ Añadir Slide</button>
    </div>`;
}

/**
 * Propiedades para botón
 */
function renderButtonProperties(block) {
    // Obtener todos los contenedores con sectionId para la lista de secciones
    const allBlocks = getAllBlocksFlat(false);
    const containersWithSectionId = allBlocks.filter(b => b.type === 'container' && b.sectionId && b.sectionId.trim() !== '');

    return `<div class="property-group">
        <label style="display: flex; align-items: center; justify-content: space-between;">
            <span class="property-label" style="margin: 0;">Estado Hover</span>
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" ${state.hoverMode ? 'checked' : ''} onchange="toggleHoverMode()"
                    style="width: 36px; height: 20px; margin-right: 8px;">
                <span style="font-size: 11px; color: var(--text-secondary);">${state.hoverMode ? 'ON' : 'OFF'}</span>
            </label>
        </label>
    </div>
    <div class="property-group">
        <label class="property-label">Texto</label>
        <input type="text" value="${block.text}" class="property-input" oninput="updateBlockProperty('text', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Link URL</label>
        <input type="text" value="${block.link}" class="property-input" placeholder="https://ejemplo.com" oninput="updateBlockProperty('link', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Ir a Sección (Scroll)</label>
        <select class="property-select" oninput="updateBlockProperty('scrollToId', this.value)">
            <option value="">-- Ninguna --</option>
            ${containersWithSectionId.map(c => `<option value="${c.sectionId}" ${block.scrollToId === c.sectionId ? 'selected' : ''}>#${c.sectionId}</option>`).join('')}
        </select>
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
            💡 Al hacer click, la página hará scroll a la sección seleccionada
        </p>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo ${state.hoverMode ? '(Hover)' : ''}</label>
        <div class="color-input">
            <input type="color" value="${state.hoverMode ? (block.hoverBackgroundColor || '#2563eb') : (block.backgroundColor || '#2563eb')}"
                oninput="updateColorProperty('backgroundColor', this.value)">
            <input type="text" value="${state.hoverMode ? (block.hoverBackgroundColor || '#2563eb') : (block.backgroundColor || '#2563eb')}"
                class="property-input" oninput="updateColorProperty('backgroundColor', this.value)">
            <button class="property-input" style="width: auto; cursor: pointer;"
                onclick="updateColorProperty('backgroundColor', 'transparent')">Transparente</button>
        </div>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Texto ${state.hoverMode ? '(Hover)' : ''}</label>
        <div class="color-input">
            <input type="color" value="${state.hoverMode ? (block.hoverTextColor || '#ffffff') : (block.textColor || '#ffffff')}"
                oninput="updateColorProperty('textColor', this.value)">
            <input type="text" value="${state.hoverMode ? (block.hoverTextColor || '#ffffff') : (block.textColor || '#ffffff')}"
                class="property-input" oninput="updateColorProperty('textColor', this.value)">
        </div>
    </div>`;
}

/**
 * Propiedades para divisor
 */
function renderDividerProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Color</label>
        <div class="color-input">
            <input type="color" value="${block.borderColor || '#e5e7eb'}" oninput="updateBlockProperty('borderColor', this.value)">
            <input type="text" value="${block.borderColor || '#e5e7eb'}" class="property-input" oninput="updateBlockProperty('borderColor', this.value)">
            <button class="property-input" style="width: auto; cursor: pointer;"
                onclick="updateBlockProperty('borderColor', 'transparent')">Transparente</button>
        </div>
    </div>`;
}

/**
 * Propiedades para flex
 */
function renderFlexProperties(block) {
    const mode = state.responsiveMode;
    const directionProp = mode === 'desktop' ? 'directionDesktop' : `direction${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const justifyContentProp = mode === 'desktop' ? 'justifyContentDesktop' : `justifyContent${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const alignItemsProp = mode === 'desktop' ? 'alignItemsDesktop' : `alignItems${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const flexWrapProp = mode === 'desktop' ? 'flexWrapDesktop' : `flexWrap${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const gapProp = mode === 'desktop' ? 'gapDesktop' : `gap${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    
    const currentDirection = block[directionProp] || block.direction;
    const currentJustifyContent = block[justifyContentProp] || block.justifyContent;
    const currentAlignItems = block[alignItemsProp] || block.alignItems;
    const currentFlexWrap = block[flexWrapProp] || block.flexWrap;
    const currentGap = block[gapProp] || block.gap;
    
    return `<div class="property-group">
        <label class="property-label">Dirección - ${mode === 'desktop' ? '🖥️ Ordenador' : mode === 'tablet' ? '📱 Tablet' : '📲 Móvil'}</label>
        <select class="property-select" onchange="updateFlexDirectionProperty(this.value)">
            <option value="row" ${currentDirection === 'row' ? 'selected' : ''}>Horizontal (Row)</option>
            <option value="column" ${currentDirection === 'column' ? 'selected' : ''}>Vertical (Column)</option>
        </select>
    </div>
    <div class="property-group">
        <label class="property-label">Justificar Contenido - ${mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📲'}</label>
        <select class="property-select" onchange="updateFlexProperty('justifyContent', this.value)">
            <option value="flex-start" ${currentJustifyContent === 'flex-start' ? 'selected' : ''}>Inicio</option>
            <option value="center" ${currentJustifyContent === 'center' ? 'selected' : ''}>Centro</option>
            <option value="flex-end" ${currentJustifyContent === 'flex-end' ? 'selected' : ''}>Fin</option>
            <option value="space-between" ${currentJustifyContent === 'space-between' ? 'selected' : ''}>Entre espacios</option>
            <option value="space-around" ${currentJustifyContent === 'space-around' ? 'selected' : ''}>Alrededor</option>
            <option value="space-evenly" ${currentJustifyContent === 'space-evenly' ? 'selected' : ''}>Uniforme</option>
        </select>
    </div>
    <div class="property-group">
        <label class="property-label">Alinear Elementos - ${mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📲'}</label>
        <select class="property-select" onchange="updateFlexProperty('alignItems', this.value)">
            <option value="flex-start" ${currentAlignItems === 'flex-start' ? 'selected' : ''}>Inicio</option>
            <option value="center" ${currentAlignItems === 'center' ? 'selected' : ''}>Centro</option>
            <option value="flex-end" ${currentAlignItems === 'flex-end' ? 'selected' : ''}>Fin</option>
            <option value="stretch" ${currentAlignItems === 'stretch' ? 'selected' : ''}>Estirar</option>
            <option value="baseline" ${currentAlignItems === 'baseline' ? 'selected' : ''}>Línea base</option>
        </select>
    </div>
    <div class="property-group">
        <label class="property-label">Flex Wrap - ${mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📲'}</label>
        <select class="property-select" onchange="updateFlexProperty('flexWrap', this.value)">
            <option value="nowrap" ${currentFlexWrap === 'nowrap' ? 'selected' : ''}>No envolver</option>
            <option value="wrap" ${currentFlexWrap === 'wrap' ? 'selected' : ''}>Envolver</option>
            <option value="wrap-reverse" ${currentFlexWrap === 'wrap-reverse' ? 'selected' : ''}>Envolver inverso</option>
        </select>
    </div>
    <div class="property-group">
        <label class="property-label">Espacio entre elementos (Gap) - ${mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📲'}</label>
        <input type="number" value="${currentGap || '16'}" class="property-input" onchange="updateFlexProperty('gap', this.value)" placeholder="16">
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo</label>
        <div class="color-input">
            <input type="color" value="${block.backgroundColor || '#ffffff'}" onchange="updateBlockProperty('backgroundColor', this.value)">
            <input type="text" value="${block.backgroundColor || '#ffffff'}" class="property-input" onchange="updateBlockProperty('backgroundColor', this.value)">
        </div>
    </div>`;
}

/**
 * Propiedades para grid
 */
function renderGridProperties(block) {
    const mode = state.responsiveMode;
    const gridTemplateColumnsProp = mode === 'desktop' ? 'gridTemplateColumnsDesktop' : `gridTemplateColumns${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    const gridGapProp = mode === 'desktop' ? 'gridGapDesktop' : `gridGap${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
    
    const currentGridTemplateColumns = block[gridTemplateColumnsProp] || block.gridTemplateColumns;
    const currentGridGap = block[gridGapProp] || block.gridGap;
    
    return `<div class="property-group">
        <label class="property-label">Columnas (grid-template-columns) - ${mode === 'desktop' ? '🖥️ Ordenador' : mode === 'tablet' ? '📱 Tablet' : '📲 Móvil'}</label>
        <input type="text" value="${currentGridTemplateColumns || 'repeat(3, 1fr)'}" class="property-input" onchange="updateGridProperty('gridTemplateColumns', this.value)" placeholder="repeat(3, 1fr)">
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
            💡 Ejemplos: repeat(2, 1fr), repeat(4, 200px), 1fr 2fr 1fr
        </p>
    </div>
    <div class="property-group">
        <label class="property-label">Espacio entre elementos (Gap) - ${mode === 'desktop' ? '🖥️' : mode === 'tablet' ? '📱' : '📲'}</label>
        <input type="number" value="${currentGridGap || '16'}" class="property-input" onchange="updateGridProperty('gridGap', this.value)" placeholder="16">
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo</label>
        <div class="color-input">
            <input type="color" value="${block.backgroundColor || '#ffffff'}" onchange="updateBlockProperty('backgroundColor', this.value)">
            <input type="text" value="${block.backgroundColor || '#ffffff'}" class="property-input" onchange="updateBlockProperty('backgroundColor', this.value)">
        </div>
    </div>`;
}

/**
 * Actualiza propiedad de color con soporte para hover
 */
function updateColorProperty(prop, value) {
    const block = findBlockById(state.page.blocks, state.selectedBlockId);
    if (block) {
        if (state.hoverMode) {
            block[`hover${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = value;
        } else {
            block[prop] = value;
        }
        renderBlocks();
        renderProperties();
    }
}

/**
 * Obtiene el estado actual (principal o componente)
 */
function getCurrentState() {
    const isComponentEditor = tabsState && tabsState.activeTabId !== 'main';
    if (isComponentEditor) {
        const editorState = tabsState.componentEditors[tabsState.activeTabId];
        return { 
            state: editorState.blocks, 
            selectedBlockId: editorState.selectedBlockId,
            isComponent: true,
            editorState: editorState,
            tabId: tabsState.activeTabId
        };
    }
    return { 
        state: state.page.blocks, 
        selectedBlockId: state.selectedBlockId,
        isComponent: false,
        editorState: null,
        tabId: null
    };
}

/**
 * Renderiza bloques según el estado actual
 */
function renderCurrentBlocks() {
    const current = getCurrentState();
    if (current.isComponent) {
        renderComponentEditorBlocks(current.tabId);
    } else {
        renderBlocks();
    }
}

/**
 * Actualiza propiedad de bloque
 */
function updateBlockProperty(prop, value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block) {
        if (prop === 'direction' && block.type === 'container') {
            block.direction = value;
            block.directionDesktop = value;
        } else {
            block[prop] = value;
        }
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties(); // No volver a renderizar el panel tras cada pulsación
    }
}

/**
 * Actualiza propiedad de dirección responsive (container, flex, grid)
 */
function updateDirectionProperty(value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block) {
        const mode = state.responsiveMode;
        const prop = mode === 'desktop' ? 'directionDesktop' : `direction${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[prop] = value;
        // También actualizar direction como fallback para la primera vez
        if (mode === 'desktop') {
            block.direction = value;
        }
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de dirección para flex (row/column)
 */
function updateFlexDirectionProperty(value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && (block.type === 'flex' || block.type === 'grid')) {
        const mode = state.responsiveMode;
        const prop = mode === 'desktop' ? 'directionDesktop' : `direction${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[prop] = value;
        // También actualizar direction como fallback para la primera vez
        if (mode === 'desktop') {
            block.direction = value;
        }
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de flex responsive (justifyContent, alignItems, flexWrap, gap)
 */
function updateFlexProperty(prop, value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && (block.type === 'flex' || block.type === 'grid')) {
        const mode = state.responsiveMode;
        const fullProp = mode === 'desktop' ? `${prop}Desktop` : `${prop}${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[fullProp] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de grid responsive (gridTemplateColumns, gridGap)
 */
function updateGridProperty(prop, value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'grid') {
        const mode = state.responsiveMode;
        const fullProp = mode === 'desktop' ? `${prop}Desktop` : `${prop}${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[fullProp] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de dimensión responsive
 */
function updateDimensionProperty(dim, value, isComponentEditor = false) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block) {
        const mode = state.responsiveMode;
        const prop = mode === 'desktop' ? dim : `${dim}${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[prop] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de padding responsive
 */
function updatePaddingProperty(pad, value, isComponentEditor = false) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block) {
        const mode = state.responsiveMode;
        const prop = mode === 'desktop' ? pad : `${pad}${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[prop] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza tamaño de fuente del icono
 */
function updateIconFontSize(value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'icon') {
        const mode = state.responsiveMode;
        const prop = mode === 'desktop' ? 'fontSize' : `fontSize${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
        block[prop] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de color con soporte para hover
 */
function updateColorProperty(prop, value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block) {
        if (state.hoverMode) {
            block[`hover${prop.charAt(0).toUpperCase() + prop.slice(1)}`] = value;
        } else {
            block[prop] = value;
        }
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza propiedad de visibilidad (hidden)
 */
function updateHiddenProperty(prop, value, isComponentEditor = false) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block) {
        block[prop] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Alterna visibilidad de un componente
 */
function toggleComponentVisibility(blockId, isComponentEditor = false) {
    const current = getCurrentState();
    const block = findBlockById(current.state, blockId);
    
    if (block && block.type === 'component') {
        // Toggle hidden for current responsive mode
        const mode = state.responsiveMode;
        const hiddenProp = mode === 'desktop' ? 'hiddenDesktop' : mode === 'tablet' ? 'hiddenTablet' : 'hiddenMobile';
        
        block[hiddenProp] = !block[hiddenProp];
        
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Resalta un componente en el canvas
 */
function highlightComponent(blockId) {
    const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
    if (blockEl) {
        blockEl.style.transition = 'all 0.2s';
        blockEl.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.5)';
        blockEl.style.transform = 'scale(1.02)';
        blockEl.style.zIndex = '100';
        // Scroll hasta el elemento si no está visible
        blockEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

/**
 * Elimina el resaltado de un componente
 */
function unhighlightComponent(blockId) {
    const blockEl = document.querySelector(`[data-block-id="${blockId}"]`);
    if (blockEl) {
        blockEl.style.boxShadow = '';
        blockEl.style.transform = '';
        blockEl.style.zIndex = '';
    }
}

/**
 * Alterna modo hover
 */
function toggleHoverMode() {
    state.hoverMode = !state.hoverMode;
    renderProperties();
}

/**
 * Añade item a tarjetas
 */
function addCardItem() {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'cards') {
        block.items.push({ title: 'Nueva Tarjeta', description: 'Descripción' });
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        // renderProperties();
    }
}

/**
 * Actualiza item de tarjeta
 */
function updateCardItem(idx, prop, value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'cards') {
        block.items[idx][prop] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        renderProperties();
    }
}

/**
 * Elimina item de tarjeta
 */
function deleteCardItem(idx) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'cards') {
        block.items.splice(idx, 1);
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        renderProperties();
    }
}

/**
 * Añade slide al carrusel
 */
function addCarouselSlide() {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'carousel') {
        block.slides.push({ title: 'Nuevo Slide', image: '', description: '' });
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        renderProperties();
    }
}

/**
 * Actualiza slide del carrusel
 */
function updateCarouselSlide(idx, prop, value) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'carousel') {
        block.slides[idx][prop] = value;
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        renderProperties();
    }
}

/**
 * Elimina slide del carrusel
 */
function deleteCarouselSlide(idx) {
    const current = getCurrentState();
    const block = findBlockById(current.state, current.selectedBlockId);
    if (block && block.type === 'carousel') {
        block.slides.splice(idx, 1);
        if (current.isComponent) {
            current.editorState.dirty = true;
            saveComponentFromEditor(current.tabId);
        } else {
            autoSave();
        }
        renderCurrentBlocks();
        renderProperties();
    }
}

/**
 * Maneja subida de imagen
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const current = getCurrentState();
            const block = findBlockById(current.state, current.selectedBlockId);
            if (block && block.type === 'image') {
                block.src = e.target.result;
                if (current.isComponent) {
                    current.editorState.dirty = true;
                    saveComponentFromEditor(current.tabId);
                } else {
                    autoSave();
                }
                renderCurrentBlocks();
                renderProperties();
            }
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Maneja subida de imagen en carrusel
 */
function handleCarouselImageUpload(idx, event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const current = getCurrentState();
            const block = findBlockById(current.state, current.selectedBlockId);
            if (block && block.type === 'carousel') {
                block.slides[idx]['image'] = e.target.result;
                if (current.isComponent) {
                    current.editorState.dirty = true;
                    saveComponentFromEditor(current.tabId);
                } else {
                    autoSave();
                }
                renderCurrentBlocks();
                renderProperties();
            }
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Propiedades para componente personalizado
 */
function renderComponentProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Nombre del Componente</label>
        <input type="text" value="${block.componentName || ''}" class="property-input" disabled style="background: var(--secondary); font-weight: 600;">
        <p style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
            🧩 Este es un componente personalizado. Para editarlo, ve al botón "Componentes" en la toolbar.
        </p>
    </div>
    <div class="property-group">
        <label class="property-label">Acciones</label>
        <button class="toolbar-btn" onclick="openComponentsModal()" style="width: 100%; margin-bottom: 8px;">📋 Gestionar Componentes</button>
        <button class="toolbar-btn" onclick="convertComponentToBlocks()" style="width: 100%;">🔄 Convertir a Bloques</button>
    </div>`;
}

/**
 * Convierte un componente en bloques normales
 */
function convertComponentToBlocks() {
    const block = findBlockById(state.page.blocks, state.selectedBlockId);
    if (!block || block.type !== 'component') {
        showToast('El bloque seleccionado no es un componente', 'error');
        return;
    }
    
    // Cargar los bloques del componente original
    fetch(`/api/components/${block.componentId}`)
        .then(res => res.json())
        .then(component => {
            const clonedBlocks = cloneBlocksWithNewIds(component.blocks);
            
            // Reemplazar el bloque componente con los bloques internos
            const idx = state.page.blocks.findIndex(b => b.id === block.id);
            if (idx !== -1) {
                state.page.blocks.splice(idx, 1, ...clonedBlocks);
                state.selectedBlockId = null;
                renderBlocks();
                renderProperties();
                showToast('Componente convertido a bloques', 'success');
            }
        })
        .catch(err => {
            console.error('Error loading component:', err);
            showToast('Error al cargar componente', 'error');
        });
}
