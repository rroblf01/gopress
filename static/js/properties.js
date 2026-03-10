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
        if (!selectedBlockId) {
            panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">Selecciona un bloque para editar</p>';
            return;
        }
        block = findBlockById(editorState.blocks, selectedBlockId);
    } else {
        // Estamos en el editor principal
        if (!state.selectedBlockId) {
            panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">Selecciona un bloque para editar</p>';
            return;
        }
        selectedBlockId = state.selectedBlockId;
        block = findBlockById(state.page.blocks, selectedBlockId);
    }
    
    if (!block) {
        panel.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">Bloque no encontrado</p>';
        return;
    }

    let html = `<div class="property-group">
        <label class="property-label">Tipo de Bloque</label>
        <input type="text" value="${block.type}" disabled class="property-input" style="background: var(--secondary);">
    </div>`;

    // Añadir propiedades de dimensiones para todos los bloques (excepto icon)
    if (block.type !== 'icon') {
        html += createDimensionProperties(block, isComponentEditor);
    }

    // Añadir propiedades de padding para todos los bloques
    html += createPaddingProperties(block, isComponentEditor);

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
        case 'component':
            html += renderComponentProperties(block);
            break;
    }

    // CSS Personalizado
    html += `<div class="property-group">
        <label class="property-label">CSS Personalizado</label>
        <textarea class="property-textarea" onchange="updateBlockProperty('customCSS', this.value)">${block.customCSS || ''}</textarea>
    </div>`;

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
                placeholder="Ancho (px, %)" onchange="updateDimensionProperty('width', this.value, ${isComponentEditor})">
            <input type="text" value="${block[heightProp] || block.height || ''}" class="property-input"
                placeholder="Alto (px, %)" onchange="updateDimensionProperty('height', this.value, ${isComponentEditor})">
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
                placeholder="Top" onchange="updatePaddingProperty('paddingTop', this.value, ${isComponentEditor})">
            <input type="number" value="${block[paddingRightProp] || block.paddingRight || ''}" class="property-input"
                placeholder="Right" onchange="updatePaddingProperty('paddingRight', this.value, ${isComponentEditor})">
            <input type="number" value="${block[paddingBottomProp] || block.paddingBottom || ''}" class="property-input"
                placeholder="Bottom" onchange="updatePaddingProperty('paddingBottom', this.value, ${isComponentEditor})">
            <input type="number" value="${block[paddingLeftProp] || block.paddingLeft || ''}" class="property-input"
                placeholder="Left" onchange="updatePaddingProperty('paddingLeft', this.value, ${isComponentEditor})">
        </div>
    </div>`;
}

/**
 * Propiedades para contenedor
 */
function renderContainerProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Dirección base (Ordenador)</label>
        <select class="property-select" onchange="updateBlockProperty('direction', this.value)">
            <option value="vertical" ${block.direction === 'vertical' ? 'selected' : ''}>Vertical</option>
            <option value="horizontal" ${block.direction === 'horizontal' ? 'selected' : ''}>Horizontal</option>
        </select>
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
        <input type="text" value="${block.content}" class="property-input" onchange="updateBlockProperty('content', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Subtítulo</label>
        <input type="text" value="${block.subContent}" class="property-input" onchange="updateBlockProperty('subContent', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo</label>
        <div class="color-input">
            <input type="color" value="${block.backgroundColor}" onchange="updateBlockProperty('backgroundColor', this.value)">
            <input type="text" value="${block.backgroundColor}" class="property-input" onchange="updateBlockProperty('backgroundColor', this.value)">
        </div>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Texto</label>
        <div class="color-input">
            <input type="color" value="${block.textColor}" onchange="updateBlockProperty('textColor', this.value)">
            <input type="text" value="${block.textColor}" class="property-input" onchange="updateBlockProperty('textColor', this.value)">
        </div>
    </div>`;
}

/**
 * Propiedades para párrafo
 */
function renderParagraphProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Contenido</label>
        <textarea class="property-textarea" onchange="updateBlockProperty('content', this.value)">${block.content}</textarea>
    </div>`;
}

/**
 * Propiedades para heading
 */
function renderHeadingProperties(block) {
    return `<div class="property-group">
        <label class="property-label">Contenido</label>
        <input type="text" value="${block.content}" class="property-input" onchange="updateBlockProperty('content', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Nivel</label>
        <select class="property-select" onchange="updateBlockProperty('level', this.value)">
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
        <input type="text" value="${block.src}" class="property-input" placeholder="https://ejemplo.com/imagen.jpg" onchange="updateBlockProperty('src', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Alt Text</label>
        <input type="text" value="${block.alt}" class="property-input" onchange="updateBlockProperty('alt', this.value)">
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
            onchange="updateIconFontSize(this.value)" placeholder="48">
    </div>
    <div class="property-group">
        <label class="property-label">Color</label>
        <div class="color-input">
            <input type="color" value="${block.color || '#2563eb'}" onchange="updateBlockProperty('color', this.value)">
            <input type="text" value="${block.color || '#2563eb'}" class="property-input" onchange="updateBlockProperty('color', this.value)">
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
                        placeholder="Título" onchange="updateCardItem(${idx}, 'title', this.value)">
                    <input type="text" class="card-item-input" value="${escapeHTML(item.description)}" 
                        placeholder="Descripción" onchange="updateCardItem(${idx}, 'description', this.value)">
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
        <input type="text" value="${block.text}" class="property-input" onchange="updateBlockProperty('text', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Link</label>
        <input type="text" value="${block.link}" class="property-input" onchange="updateBlockProperty('link', this.value)">
    </div>
    <div class="property-group">
        <label class="property-label">Color de Fondo ${state.hoverMode ? '(Hover)' : ''}</label>
        <div class="color-input">
            <input type="color" value="${state.hoverMode ? (block.hoverBackgroundColor || '#2563eb') : (block.backgroundColor || '#2563eb')}" 
                onchange="updateColorProperty('backgroundColor', this.value)">
            <input type="text" value="${state.hoverMode ? (block.hoverBackgroundColor || '#2563eb') : (block.backgroundColor || '#2563eb')}" 
                class="property-input" onchange="updateColorProperty('backgroundColor', this.value)">
            <button class="property-input" style="width: auto; cursor: pointer;" 
                onclick="updateColorProperty('backgroundColor', 'transparent')">Transparente</button>
        </div>
    </div>
    <div class="property-group">
        <label class="property-label">Color de Texto ${state.hoverMode ? '(Hover)' : ''}</label>
        <div class="color-input">
            <input type="color" value="${state.hoverMode ? (block.hoverTextColor || '#ffffff') : (block.textColor || '#ffffff')}" 
                onchange="updateColorProperty('textColor', this.value)">
            <input type="text" value="${state.hoverMode ? (block.hoverTextColor || '#ffffff') : (block.textColor || '#ffffff')}" 
                class="property-input" onchange="updateColorProperty('textColor', this.value)">
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
            <input type="color" value="${block.borderColor || '#e5e7eb'}" onchange="updateBlockProperty('borderColor', this.value)">
            <input type="text" value="${block.borderColor || '#e5e7eb'}" class="property-input" onchange="updateBlockProperty('borderColor', this.value)">
            <button class="property-input" style="width: auto; cursor: pointer;" 
                onclick="updateBlockProperty('borderColor', 'transparent')">Transparente</button>
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
        renderProperties();
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
        renderProperties();
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
        renderProperties();
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
        renderProperties();
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
        renderProperties();
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
        renderProperties();
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
