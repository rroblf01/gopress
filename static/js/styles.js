/**
 * Generación de estilos CSS para bloques
 */

/**
 * Genera CSS responsive para un bloque
 */
function generateResponsiveCSS(block) {
    let css = '';
    const blockClass = `block-${block.id}`;

    // Desktop (base) - Colores base
    let baseStyles = [];
    if (block.backgroundColor) baseStyles.push(`background: ${block.backgroundColor}`);
    if (block.textColor) baseStyles.push(`color: ${block.textColor}`);

    if (baseStyles.length > 0) {
        css += `.${blockClass} { ${baseStyles.join('; ')}; } `;
    }

    // Dimensiones Desktop
    let desktopStyles = [];
    if (block.widthDesktop && block.widthDesktop !== '' && block.widthDesktop !== 'auto') desktopStyles.push(`width: ${block.widthDesktop}`);
    if (block.heightDesktop && block.heightDesktop !== '' && block.heightDesktop !== 'auto') desktopStyles.push(`height: ${block.heightDesktop}`);
    if (block.width && block.width !== '' && block.width !== 'auto') desktopStyles.push(`width: ${block.width}`);
    if (block.height && block.height !== '' && block.height !== 'auto') desktopStyles.push(`height: ${block.height}`);

    if (desktopStyles.length > 0) {
        css += `.${blockClass} { ${desktopStyles.join('; ')}; } `;
    }

    // Tablet (769px - 1024px)
    let tabletStyles = [];
    if (block.widthTablet && block.widthTablet !== '' && block.widthTablet !== 'auto') tabletStyles.push(`width: ${block.widthTablet}`);
    if (block.heightTablet && block.heightTablet !== '' && block.heightTablet !== 'auto') tabletStyles.push(`height: ${block.heightTablet}`);

    if (tabletStyles.length > 0) {
        css += `@media (max-width: 1024px) and (min-width: 769px) { .${blockClass} { ${tabletStyles.join('; ')}; } } `;
    }

    // Mobile (<= 768px)
    let mobileStyles = [];
    if (block.widthMobile && block.widthMobile !== '' && block.widthMobile !== 'auto') mobileStyles.push(`width: ${block.widthMobile}`);
    if (block.heightMobile && block.heightMobile !== '' && block.heightMobile !== 'auto') mobileStyles.push(`height: ${block.heightMobile}`);

    if (mobileStyles.length > 0) {
        css += `@media (max-width: 768px) { .${blockClass} { ${mobileStyles.join('; ')}; } } `;
    }

    // Hover styles
    if (block.hoverBackgroundColor || block.hoverTextColor) {
        css += `.${blockClass}:hover { `;
        if (block.hoverBackgroundColor) css += `background: ${block.hoverBackgroundColor} !important; `;
        if (block.hoverTextColor) css += `color: ${block.hoverTextColor} !important; `;
        css += `} `;
    }

    // Padding Desktop (base)
    if (block.paddingTop || block.paddingRight || block.paddingBottom || block.paddingLeft) {
        css += `.${blockClass} { padding: ${block.paddingTop || 0}px ${block.paddingRight || 0}px ${block.paddingBottom || 0}px ${block.paddingLeft || 0}px; } `;
    }

    // Padding responsive - Tablet
    const paddingTopTablet = block.paddingTopTablet || block.paddingTop;
    const paddingRightTablet = block.paddingRightTablet || block.paddingRight;
    const paddingBottomTablet = block.paddingBottomTablet || block.paddingBottom;
    const paddingLeftTablet = block.paddingLeftTablet || block.paddingLeft;
    if (paddingTopTablet || paddingRightTablet || paddingBottomTablet || paddingLeftTablet) {
        css += `@media (max-width: 1024px) and (min-width: 769px) { .${blockClass} { padding: ${paddingTopTablet || 0}px ${paddingRightTablet || 0}px ${paddingBottomTablet || 0}px ${paddingLeftTablet || 0}px; } } `;
    }

    // Padding responsive - Mobile
    const paddingTopMobile = block.paddingTopMobile || block.paddingTop;
    const paddingRightMobile = block.paddingRightMobile || block.paddingRight;
    const paddingBottomMobile = block.paddingBottomMobile || block.paddingBottom;
    const paddingLeftMobile = block.paddingLeftMobile || block.paddingLeft;
    if (paddingTopMobile || paddingRightMobile || paddingBottomMobile || paddingLeftMobile) {
        css += `@media (max-width: 768px) { .${blockClass} { padding: ${paddingTopMobile || 0}px ${paddingRightMobile || 0}px ${paddingBottomMobile || 0}px ${paddingLeftMobile || 0}px; } } `;
    }

    // Hidden por dispositivo
    if (block.hiddenDesktop) {
        css += `@media (min-width: 1025px) { .${blockClass} { display: none !important; } } `;
    }
    if (block.hiddenTablet) {
        css += `@media (max-width: 1024px) and (min-width: 769px) { .${blockClass} { display: none !important; } } `;
    }
    if (block.hiddenMobile) {
        css += `@media (max-width: 768px) { .${blockClass} { display: none !important; } } `;
    }

    return css;
}

/**
 * Genera CSS para la dirección flex de contenedores
 */
function generateDirectionCSS(block) {
    if (block.type !== 'container') return '';

    let css = '';
    const blockClass = `block-${block.id}`;

    // Dirección base (desktop)
    const baseDirection = block.directionDesktop || block.direction;
    if (baseDirection) {
        css += `.${blockClass} { display: flex; flex-direction: ${baseDirection === 'horizontal' ? 'row' : 'column'}; gap: 12px; } `;
    } else {
        css += `.${blockClass} { display: flex; flex-direction: column; gap: 12px; } `;
    }

    // Tablet
    if (block.directionTablet) {
        css += `@media (min-width: 769px) and (max-width: 1024px) { .${blockClass} { flex-direction: ${block.directionTablet === 'horizontal' ? 'row' : 'column'}; } } `;
    }

    // Mobile
    if (block.directionMobile) {
        css += `@media (max-width: 768px) { .${blockClass} { flex-direction: ${block.directionMobile === 'horizontal' ? 'row' : 'column'}; } } `;
    }

    return css;
}

/**
 * Genera CSS responsive para flex (direction, justifyContent, alignItems, flexWrap, gap)
 */
function generateFlexCSS(block) {
    if (block.type !== 'flex' && block.type !== 'grid') return '';

    let css = '';
    const blockClass = `block-${block.id}`;

    // Dirección base (desktop)
    const baseDirection = block.directionDesktop || block.direction;
    const baseJustifyContent = block.justifyContentDesktop || block.justifyContent;
    const baseAlignItems = block.alignItemsDesktop || block.alignItems;
    const baseFlexWrap = block.flexWrapDesktop || block.flexWrap;
    const baseGap = block.gapDesktop || block.gap;

    let baseStyles = [];
    if (baseDirection) baseStyles.push(`flex-direction: ${baseDirection === 'row' ? 'row' : 'column'}`);
    if (baseJustifyContent) baseStyles.push(`justify-content: ${baseJustifyContent}`);
    if (baseAlignItems) baseStyles.push(`align-items: ${baseAlignItems}`);
    if (baseFlexWrap) baseStyles.push(`flex-wrap: ${baseFlexWrap}`);
    if (baseGap) baseStyles.push(`gap: ${baseGap}px`);

    if (baseStyles.length > 0) {
        css += `.${blockClass} { ${baseStyles.join('; ')}; } `;
    }

    // Tablet
    let tabletStyles = [];
    if (block.directionTablet) tabletStyles.push(`flex-direction: ${block.directionTablet === 'row' ? 'row' : 'column'}`);
    if (block.justifyContentTablet) tabletStyles.push(`justify-content: ${block.justifyContentTablet}`);
    if (block.alignItemsTablet) tabletStyles.push(`align-items: ${block.alignItemsTablet}`);
    if (block.flexWrapTablet) tabletStyles.push(`flex-wrap: ${block.flexWrapTablet}`);
    if (block.gapTablet) tabletStyles.push(`gap: ${block.gapTablet}px`);

    if (tabletStyles.length > 0) {
        css += `@media (min-width: 769px) and (max-width: 1024px) { .${blockClass} { ${tabletStyles.join('; ')}; } } `;
    }

    // Mobile
    let mobileStyles = [];
    if (block.directionMobile) mobileStyles.push(`flex-direction: ${block.directionMobile === 'row' ? 'row' : 'column'}`);
    if (block.justifyContentMobile) mobileStyles.push(`justify-content: ${block.justifyContentMobile}`);
    if (block.alignItemsMobile) mobileStyles.push(`align-items: ${block.alignItemsMobile}`);
    if (block.flexWrapMobile) mobileStyles.push(`flex-wrap: ${block.flexWrapMobile}`);
    if (block.gapMobile) mobileStyles.push(`gap: ${block.gapMobile}px`);

    if (mobileStyles.length > 0) {
        css += `@media (max-width: 768px) { .${blockClass} { ${mobileStyles.join('; ')}; } } `;
    }

    return css;
}

/**
 * Genera CSS responsive para grid (gridTemplateColumns, gridGap)
 */
function generateGridCSS(block) {
    if (block.type !== 'grid') return '';

    let css = '';
    const blockClass = `block-${block.id}`;

    // Grid Template Columns base (desktop)
    const baseGridTemplateColumns = block.gridTemplateColumnsDesktop || block.gridTemplateColumns;
    const baseGridGap = block.gridGapDesktop || block.gridGap;

    let baseStyles = [];
    if (baseGridTemplateColumns) baseStyles.push(`grid-template-columns: ${baseGridTemplateColumns}`);
    if (baseGridGap) baseStyles.push(`gap: ${baseGridGap}px`);

    if (baseStyles.length > 0) {
        css += `.${blockClass} { ${baseStyles.join('; ')}; } `;
    }

    // Tablet
    let tabletStyles = [];
    if (block.gridTemplateColumnsTablet) tabletStyles.push(`grid-template-columns: ${block.gridTemplateColumnsTablet}`);
    if (block.gridGapTablet) tabletStyles.push(`gap: ${block.gridGapTablet}px`);

    if (tabletStyles.length > 0) {
        css += `@media (min-width: 769px) and (max-width: 1024px) { .${blockClass} { ${tabletStyles.join('; ')}; } } `;
    }

    // Mobile
    let mobileStyles = [];
    if (block.gridTemplateColumnsMobile) mobileStyles.push(`grid-template-columns: ${block.gridTemplateColumnsMobile}`);
    if (block.gridGapMobile) mobileStyles.push(`gap: ${block.gridGapMobile}px`);

    if (mobileStyles.length > 0) {
        css += `@media (max-width: 768px) { .${blockClass} { ${mobileStyles.join('; ')}; } } `;
    }

    return css;
}

/**
 * Obtiene la dirección actual según el modo responsive
 */
function getCurrentDirection(block) {
    if (block.type !== 'container' && block.type !== 'flex' && block.type !== 'grid') return '';
    const mode = state.responsiveMode;
    if (mode === 'mobile' && block.directionMobile) return block.directionMobile;
    if (mode === 'tablet' && block.directionTablet) return block.directionTablet;
    return block.directionDesktop || block.direction;
}

/**
 * Obtiene si el bloque está oculto en el modo actual
 */
function getIsHidden(block) {
    const mode = state.responsiveMode;
    if (mode === 'mobile') return block.hiddenMobile;
    if (mode === 'tablet') return block.hiddenTablet;
    return block.hiddenDesktop;
}

/**
 * Actualiza estilos globales de la página
 */
function updateGlobalStyle(prop, value) {
    state.page.styles[prop] = value;
    if (prop === 'primaryColor') {
        document.getElementById('primaryColorText').value = value;
        document.getElementById('primaryColor').value = value;
    } else if (prop === 'backgroundColor') {
        document.getElementById('backgroundColorText').value = value;
        document.getElementById('backgroundColor').value = value;
    } else if (prop === 'textColor') {
        document.getElementById('textColorText').value = value;
        document.getElementById('textColor').value = value;
    }
}

/**
 * Carga los estilos globales en el panel
 */
function loadGlobalStyles() {
    const styles = state.page.styles;
    document.getElementById('primaryColor').value = styles.primaryColor || '#2563eb';
    document.getElementById('primaryColorText').value = styles.primaryColor || '#2563eb';
    document.getElementById('backgroundColor').value = styles.backgroundColor || '#ffffff';
    document.getElementById('backgroundColorText').value = styles.backgroundColor || '#ffffff';
    document.getElementById('textColor').value = styles.textColor || '#1f2937';
    document.getElementById('textColorText').value = styles.textColor || '#1f2937';
    document.getElementById('fontFamily').value = styles.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    document.getElementById('maxWidth').value = styles.maxWidth || '';
    document.getElementById('padding').value = styles.padding || '';
    document.getElementById('globalCSS').value = styles.globalCSS || '';
}
