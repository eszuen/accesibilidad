(function() {
    // Evitar doble inyección del widget en la misma página
    if (window.UNAM_ACCESSIBILITY_LOADED) return;
    window.UNAM_ACCESSIBILITY_LOADED = true;

    // Estado global de accesibilidad
    let currentFontSize = 100;
    let isDyslexicFont = false;
    let isLineSpacing = false;
    let isMagnifierActive = false;
    let isRulerActive = false;
    let isBigCursor = false;
    let isLinksHighlighted = false;
    let currentTheme = 'default';
    let synth = window.speechSynthesis;

    function loadDependencies() {
        const head = document.head || document.getElementsByTagName('head')[0];

        // Font Awesome Icons CDN
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link');
            fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            head.appendChild(fa);
        }

        // OpenDyslexic Font CDN
        if (!document.querySelector('link[href*="open-dyslexic"]')) {
            const od = document.createElement('link');
            od.rel = 'stylesheet';
            od.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.css';
            head.appendChild(od);
        }
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'unam-accessibility-styles';
        style.textContent = `
            /* Isolación de controles del Widget */
            #unam-accessibility-header, #accessibility-panel, #open-accessibility-btn {
                font-size: 14px !important;
                line-height: 1.4 !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                box-sizing: border-box !important;
                zoom: 1 !important;
            }

            #unam-accessibility-header *, #accessibility-panel *, #open-accessibility-btn * {
                box-sizing: border-box !important;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            }

            /* Garantizar la posición fija permanente de la barra superior */
            #unam-accessibility-header {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                width: 100% !important;
                height: 48px !important;
                background-color: #0f172a !important;
                color: #ffffff !important;
                z-index: 999980 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 0 16px !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
                border-bottom: 1px solid #1e293b !important;
            }

            /* Empujar el contenido original hacia abajo */
            body.unam-accessibility-active {
                padding-top: 48px !important;
            }

            .unam-hdr-title {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                font-weight: 700 !important;
                color: #f1f5f9 !important;
            }

            .unam-hdr-controls {
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
            }

            /* Botones genéricos de la interfaz */
            .unam-btn {
                border: none !important;
                outline: none !important;
                cursor: pointer !important;
                border-radius: 6px !important;
                padding: 6px 12px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                transition: all 0.2s ease !important;
                background-color: #1e293b !important;
                color: #e2e8f0 !important;
            }
            .unam-btn:hover {
                background-color: #334155 !important;
            }

            .unam-btn-gold {
                background-color: #f59e0b !important;
                color: #020617 !important;
                font-weight: 700 !important;
            }
            .unam-btn-gold:hover {
                background-color: #d97706 !important;
            }

            .unam-btn-blue {
                background-color: #1d4ed8 !important;
                color: #ffffff !important;
                font-weight: 700 !important;
            }
            .unam-btn-blue:hover {
                background-color: #1e40af !important;
            }

            .unam-btn-group {
                display: flex !important;
                align-items: center !important;
                background-color: #1e293b !important;
                border: 1px solid #334155 !important;
                border-radius: 6px !important;
                padding: 2px !important;
            }
            .unam-btn-group button {
                background: transparent !important;
                border: none !important;
                color: #cbd5e1 !important;
                padding: 4px 8px !important;
                cursor: pointer !important;
                font-weight: 600 !important;
                border-radius: 4px !important;
            }
            .unam-btn-group button:hover {
                background-color: #334155 !important;
                color: #ffffff !important;
            }

            /* Botón Flotante Inferior */
            #open-accessibility-btn {
                position: fixed !important;
                bottom: 24px !important;
                right: 24px !important;
                z-index: 999990 !important;
                background-color: #00468B !important;
                color: #ffffff !important;
                width: 56px !important;
                height: 56px !important;
                border-radius: 50% !important;
                border: none !important;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3) !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                font-size: 24px !important;
                transition: transform 0.2s ease, background-color 0.2s ease !important;
            }
            #open-accessibility-btn:hover {
                transform: scale(1.1) !important;
                background-color: #003569 !important;
            }

            /* Panel Lateral Deslizante */
            #accessibility-panel {
                position: fixed !important;
                top: 0 !important;
                right: 0 !important;
                width: 360px !important;
                max-width: 100vw !important;
                height: 100vh !important;
                background-color: #ffffff !important;
                box-shadow: -5px 0 30px rgba(0,0,0,0.25) !important;
                z-index: 999999 !important;
                transform: translateX(100%) !important;
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                overflow-y: auto !important;
                color: #334155 !important;
            }

            #accessibility-panel.panel-open {
                transform: translateX(0) !important;
            }

            .unam-panel-header {
                background-color: #00468B !important;
                color: #ffffff !important;
                padding: 16px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 10 !important;
            }

            .unam-panel-body {
                padding: 20px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 20px !important;
            }

            .unam-section-title {
                font-size: 11px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                color: #64748b !important;
                font-weight: 700 !important;
                margin-bottom: 10px !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
            }

            .unam-grid-3 {
                display: grid !important;
                grid-template-columns: repeat(3, 1fr) !important;
                gap: 8px !important;
            }

            .unam-grid-2 {
                display: grid !important;
                grid-template-columns: repeat(2, 1fr) !important;
                gap: 8px !important;
            }

            .unam-card-btn {
                background-color: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 10px !important;
                padding: 10px !important;
                text-align: center !important;
                cursor: pointer !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #1e293b !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                gap: 4px !important;
                transition: all 0.2s ease !important;
            }
            .unam-card-btn:hover {
                background-color: #eff6ff !important;
                border-color: #3b82f6 !important;
                color: #1d4ed8 !important;
            }

            .unam-toggle-btn {
                width: 100% !important;
                background-color: #f8fafc !important;
                border: 1px solid #e2e8f0 !important;
                border-radius: 10px !important;
                padding: 10px 12px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #1e293b !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                cursor: pointer !important;
                transition: background-color 0.2s ease !important;
                margin-bottom: 8px !important;
            }
            .unam-toggle-btn:hover {
                background-color: #f1f5f9 !important;
            }

            .unam-badge {
                font-size: 10px !important;
                padding: 2px 8px !important;
                border-radius: 4px !important;
                font-weight: 700 !important;
                background-color: #cbd5e1 !important;
                color: #334155 !important;
            }
            .unam-badge.active {
                background-color: #10b981 !important;
                color: #ffffff !important;
            }

            /* Temas y Filtros Visuales Excluyendo la Interfaz del Widget */
            body.theme-high-contrast *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *) {
                background-color: #000000 !important;
                color: #FFFF00 !important;
                border-color: #FFFF00 !important;
            }
            body.theme-high-contrast a:not(#unam-accessibility-header *):not(#accessibility-panel *) {
                color: #00FFFF !important;
                text-decoration: underline !important;
            }
            body.theme-dark *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *) {
                background-color: #121212 !important;
                color: #E0E0E0 !important;
            }
            body.theme-grayscale *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *) {
                filter: grayscale(100%) !important;
            }
            body.theme-invert *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *) {
                filter: invert(100%) hue-rotate(180deg) !important;
            }

            /* Tipografía para Dislexia en la página */
            .font-dyslexic *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *) {
                font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important;
            }

            /* Cursor Gigante */
            .big-cursor, .big-cursor * {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="%2300468B" stroke="%23ffffff" stroke-width="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>'), auto !important;
            }

            /* Resaltado de Enlaces */
            .highlight-links a:not(#unam-accessibility-header *):not(#accessibility-panel *) {
                background-color: #fef08a !important;
                color: #000000 !important;
                font-weight: bold !important;
                padding: 2px 4px !important;
                border-radius: 4px !important;
                text-decoration: underline !important;
            }

            /* Regla de Lectura */
            #reading-ruler {
                position: fixed;
                pointer-events: none;
                width: 100%;
                height: 32px;
                background: rgba(255, 235, 59, 0.35);
                border-top: 2px solid #d97706;
                border-bottom: 2px solid #d97706;
                z-index: 999990;
                display: none;
                transform: translateY(-50%);
            }

            /* Lupa Virtual */
            #magnifier-glass {
                position: fixed;
                width: 190px;
                height: 190px;
                border: 3px solid #00468B;
                border-radius: 50%;
                cursor: none;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                pointer-events: none;
                z-index: 1000000;
                background-color: #ffffff;
                overflow: hidden;
                align-items: center;
                justify-content: center;
                text-align: center;
                line-height: 1.3;
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    function injectHTML() {
        const body = document.body;
        body.classList.add('unam-accessibility-active');

        // Elementos auxiliares (Regla y Lupa)
        const helperElements = `
            <div id="reading-ruler"></div>
            <div id="magnifier-glass"></div>
        `;
        body.insertAdjacentHTML('afterbegin', helperElements);

        // Barra Superior Fija
        const topHeader = `
            <header id="unam-accessibility-header">
                <div class="unam-hdr-title">
                    <i class="fa-solid fa-universal-access" style="color: #f59e0b; font-size: 18px;"></i>
                    <span>Herramientas de Accesibilidad</span>
                </div>
                <div class="unam-hdr-controls">
                    <div class="unam-btn-group">
                        <button type="button" id="btn-font-plus" title="Aumentar letra">A+</button>
                        <button type="button" id="btn-font-minus" title="Reducir letra">A-</button>
                        <button type="button" id="btn-font-reset" title="Restablecer tamaño"><i class="fa-solid fa-rotate-left"></i></button>
                    </div>
                    <button type="button" id="btn-quick-contrast" class="unam-btn unam-btn-gold">
                        <i class="fa-solid fa-circle-half-stroke"></i>
                        <span>Alto Contraste</span>
                    </button>
                    <button type="button" id="btn-quick-magnifier" class="unam-btn">
                        <i class="fa-solid fa-magnifying-glass" style="color: #f59e0b;"></i>
                        <span>Lupa</span>
                    </button>
                    <button type="button" id="btn-open-panel-top" class="unam-btn unam-btn-blue">
                        <i class="fa-solid fa-sliders"></i>
                        <span>Más Opciones</span>
                    </button>
                </div>
            </header>
        `;
        body.insertAdjacentHTML('afterbegin', topHeader);

        // Botón Flotante Inferior Derecho
        const floatingButton = `
            <button id="open-accessibility-btn" type="button" aria-label="Abrir opciones de accesibilidad">
                <i class="fa-solid fa-universal-access"></i>
            </button>
        `;

        // Panel Lateral Deslizante
        const lateralPanel = `
            <div id="accessibility-panel">
                <div class="unam-panel-header">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fa-solid fa-universal-access" style="font-size: 22px; color: #f59e0b;"></i>
                        <div>
                            <div style="font-weight: 700; font-size: 15px;">Panel de Accesibilidad</div>
                            <div style="font-size: 11px; opacity: 0.8;">ADSDD - UNAM</div>
                        </div>
                    </div>
                    <button type="button" id="btn-close-panel" style="background: transparent; border: none; color: white; font-size: 20px; cursor: pointer;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="unam-panel-body">
                    <div>
                        <div class="unam-section-title"><i class="fa-solid fa-font" style="color:#00468B;"></i> Texto y Lectura</div>
                        <div class="unam-grid-3" style="margin-bottom: 10px;">
                            <button type="button" id="panel-font-plus" class="unam-card-btn"><i class="fa-solid fa-magnifying-glass-plus" style="font-size: 16px;"></i><span>Aumentar</span></button>
                            <button type="button" id="panel-font-minus" class="unam-card-btn"><i class="fa-solid fa-magnifying-glass-minus" style="font-size: 16px;"></i><span>Reducir</span></button>
                            <button type="button" id="panel-font-reset" class="unam-card-btn"><i class="fa-solid fa-rotate-left" style="font-size: 16px;"></i><span>Normal</span></button>
                        </div>
                        <div>
                            <button type="button" id="btn-dyslexia" class="unam-toggle-btn">
                                <span><i class="fa-solid fa-book-open" style="color:#00468B; margin-right:6px;"></i> Fuente para Dislexia</span>
                                <span id="badge-dyslexia" class="unam-badge">NO</span>
                            </button>
                            <button type="button" id="btn-spacing" class="unam-toggle-btn">
                                <span><i class="fa-solid fa-arrows-up-down" style="color:#00468B; margin-right:6px;"></i> Espaciado Interlineal</span>
                                <span id="badge-spacing" class="unam-badge">NO</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <div class="unam-section-title"><i class="fa-solid fa-circle-half-stroke" style="color:#00468B;"></i> Contraste y Pantalla</div>
                        <div class="unam-grid-2" style="margin-bottom: 8px;">
                            <button type="button" id="theme-default" class="unam-card-btn">Normal</button>
                            <button type="button" id="theme-high-contrast" class="unam-card-btn" style="background:#000; color:#ff0; border-color:#ff0;">Alto Contraste</button>
                            <button type="button" id="theme-dark" class="unam-card-btn" style="background:#1e293b; color:#fff;">Modo Oscuro</button>
                            <button type="button" id="theme-grayscale" class="unam-card-btn">Escala Grises</button>
                        </div>
                        <button type="button" id="theme-invert" class="unam-toggle-btn" style="justify-content: center; gap: 8px;">
                            <i class="fa-solid fa-arrows-rotate" style="color:#00468B;"></i> Invertir Colores
                        </button>
                    </div>
                    <div>
                        <div class="unam-section-title"><i class="fa-solid fa-eye" style="color:#00468B;"></i> Apoyo Visual y Lupa</div>
                        <div>
                            <button type="button" id="btn-magnifier" class="unam-toggle-btn">
                                <span><i class="fa-solid fa-magnifying-glass" style="color:#00468B; margin-right:6px;"></i> Lupa Virtual Interactiva</span>
                                <span id="badge-magnifier" class="unam-badge">NO</span>
                            </button>
                            <button type="button" id="btn-ruler" class="unam-toggle-btn">
                                <span><i class="fa-solid fa-ruler-horizontal" style="color:#00468B; margin-right:6px;"></i> Regla de Lectura Visual</span>
                                <span id="badge-ruler" class="unam-badge">NO</span>
                            </button>
                            <button type="button" id="btn-cursor" class="unam-toggle-btn">
                                <span><i class="fa-solid fa-arrow-pointer" style="color:#00468B; margin-right:6px;"></i> Cursor Gigante UNAM</span>
                                <span id="badge-cursor" class="unam-badge">NO</span>
                            </button>
                            <button type="button" id="btn-links" class="unam-toggle-btn">
                                <span><i class="fa-solid fa-link" style="color:#00468B; margin-right:6px;"></i> Resaltar Enlaces</span>
                                <span id="badge-links" class="unam-badge">NO</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <div class="unam-section-title"><i class="fa-solid fa-volume-high" style="color:#00468B;"></i> Lectura en Voz Alta</div>
                        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; padding:12px;">
                            <p style="font-size:11px; color:#1e3a8a; margin: 0 0 8px 0;">Selecciona texto en la página y haz clic en <strong>Leer</strong>:</p>
                            <div style="display:flex; gap:8px;">
                                <button type="button" id="btn-read-text" class="unam-btn unam-btn-blue" style="flex:1; justify-content:center;"><i class="fa-solid fa-play"></i> Leer Texto</button>
                                <button type="button" id="btn-stop-text" class="unam-btn" style="background:#e11d48; color:white;"><i class="fa-solid fa-stop"></i> Detener</button>
                            </div>
                        </div>
                    </div>
                    <button type="button" id="btn-reset-all" class="unam-toggle-btn" style="justify-content:center; color:#e11d48; background:#fff1f2; border-color:#fecdd3; font-weight:700;">
                        <i class="fa-solid fa-rotate" style="margin-right:6px;"></i> Restablecer Ajustes
                    </button>
                </div>
            </div>
        `;

        body.insertAdjacentHTML('beforeend', floatingButton);
        body.insertAdjacentHTML('beforeend', lateralPanel);
    }

    function attachEventListeners() {
        const body = document.body;
        const panel = document.getElementById('accessibility-panel');
        const glass = document.getElementById('magnifier-glass');
        const ruler = document.getElementById('reading-ruler');

        function togglePanel() {
            if (panel) panel.classList.toggle('panel-open');
        }

        // FUNCIÓN DE ZOOM CORREGIDA
        function applyFontSize(size) {
            currentFontSize = size;
            let fontStyle = document.getElementById('unam-font-size-override');
            if (!fontStyle) {
                fontStyle = document.createElement('style');
                fontStyle.id = 'unam-font-size-override';
                document.head.appendChild(fontStyle);
            }

            if (currentFontSize === 100) {
                fontStyle.textContent = '';
                return;
            }

            const factor = currentFontSize / 100;
            // Forzar el redimensionamiento en todos los elementos del sitio excluyendo los controles del Widget
            fontStyle.textContent = `
                body *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *):not(#magnifier-glass):not(#reading-ruler) {
                    zoom: ${factor} !important;
                }
            `;
        }

        function changeFontSize(step) {
            let newSize = currentFontSize + (step * 10);
            newSize = Math.min(Math.max(newSize, 80), 180);
            applyFontSize(newSize);
        }

        function resetFontSize() {
            applyFontSize(100);
        }

        function updateBadge(id, state) {
            const badge = document.getElementById(id);
            if (!badge) return;
            badge.textContent = state ? 'SÍ' : 'NO';
            if (state) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        }

        function toggleDyslexia() {
            isDyslexicFont = !isDyslexicFont;
            isDyslexicFont ? body.classList.add('font-dyslexic') : body.classList.remove('font-dyslexic');
            updateBadge('badge-dyslexia', isDyslexicFont);
        }

        function toggleSpacing() {
            isLineSpacing = !isLineSpacing;
            let spacingStyle = document.getElementById('unam-spacing-override');
            if (!spacingStyle) {
                spacingStyle = document.createElement('style');
                spacingStyle.id = 'unam-spacing-override';
                document.head.appendChild(spacingStyle);
            }

            if (isLineSpacing) {
                spacingStyle.textContent = `
                    body *:not(#unam-accessibility-header):not(#unam-accessibility-header *):not(#accessibility-panel):not(#accessibility-panel *):not(#open-accessibility-btn):not(#open-accessibility-btn *) {
                        line-height: 2 !important;
                        letter-spacing: 0.08em !important;
                    }
                `;
            } else {
                spacingStyle.textContent = '';
            }
            updateBadge('badge-spacing', isLineSpacing);
        }

        function setTheme(theme) {
            body.classList.remove('theme-high-contrast', 'theme-dark', 'theme-grayscale', 'theme-invert');
            currentTheme = theme;
            if (theme !== 'default') body.classList.add(`theme-${theme}`);
        }

        function toggleMagnifier() {
            isMagnifierActive = !isMagnifierActive;
            glass.style.display = isMagnifierActive ? 'flex' : 'none';
            updateBadge('badge-magnifier', isMagnifierActive);
        }

        function moveMagnifier(e) {
            if (!isMagnifierActive) return;
            const x = e.clientX;
            const y = e.clientY;
            glass.style.left = (x - glass.offsetWidth / 2) + 'px';
            glass.style.top = (y - glass.offsetHeight / 2) + 'px';

            const target = document.elementFromPoint(x, y);
            if (target && target !== glass && !glass.contains(target)) {
                const text = target.innerText || target.alt || target.ariaLabel || '';
                if (text) {
                    glass.innerText = text.substring(0, 90) + (text.length > 90 ? '...' : '');
                    glass.style.padding = '12px';
                    glass.style.fontSize = '16px';
                    glass.style.fontWeight = 'bold';
                    glass.style.color = '#00468B';
                }
            }
        }

        function toggleRuler() {
            isRulerActive = !isRulerActive;
            ruler.style.display = isRulerActive ? 'block' : 'none';
            updateBadge('badge-ruler', isRulerActive);
        }

        function moveRuler(e) {
            if (isRulerActive) ruler.style.top = e.clientY + 'px';
        }

        function toggleCursor() {
            isBigCursor = !isBigCursor;
            isBigCursor ? body.classList.add('big-cursor') : body.classList.remove('big-cursor');
            updateBadge('badge-cursor', isBigCursor);
        }

        function toggleLinks() {
            isLinksHighlighted = !isLinksHighlighted;
            isLinksHighlighted ? body.classList.add('highlight-links') : body.classList.remove('highlight-links');
            updateBadge('badge-links', isLinksHighlighted);
        }

        function readSelectedText() {
            if (synth && synth.speaking) synth.cancel();
            let text = window.getSelection().toString().trim();
            if (!text) text = document.title || "Página actual";
            if ('speechSynthesis' in window && text) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'es-MX';
                synth.speak(utterance);
            }
        }

        function stopSpeech() {
            if (synth && synth.speaking) synth.cancel();
        }

        function resetAll() {
            resetFontSize();
            setTheme('default');
            stopSpeech();
            if (isDyslexicFont) toggleDyslexia();
            if (isLineSpacing) toggleSpacing();
            if (isMagnifierActive) toggleMagnifier();
            if (isRulerActive) toggleRuler();
            if (isBigCursor) toggleCursor();
            if (isLinksHighlighted) toggleLinks();
        }

        // Asignación de eventos mouse y botones
        document.addEventListener('mousemove', moveMagnifier);
        document.addEventListener('mousemove', moveRuler);

        document.getElementById('open-accessibility-btn').onclick = togglePanel;
        document.getElementById('btn-close-panel').onclick = togglePanel;
        document.getElementById('btn-open-panel-top').onclick = togglePanel;

        document.getElementById('btn-font-plus').onclick = () => changeFontSize(1);
        document.getElementById('panel-font-plus').onclick = () => changeFontSize(1);
        document.getElementById('btn-font-minus').onclick = () => changeFontSize(-1);
        document.getElementById('panel-font-minus').onclick = () => changeFontSize(-1);
        document.getElementById('btn-font-reset').onclick = resetFontSize;
        document.getElementById('panel-font-reset').onclick = resetFontSize;

        document.getElementById('btn-quick-contrast').onclick = () => setTheme(currentTheme === 'high-contrast' ? 'default' : 'high-contrast');
        document.getElementById('btn-quick-magnifier').onclick = toggleMagnifier;

        document.getElementById('btn-dyslexia').onclick = toggleDyslexia;
        document.getElementById('btn-spacing').onclick = toggleSpacing;

        document.getElementById('theme-default').onclick = () => setTheme('default');
        document.getElementById('theme-high-contrast').onclick = () => setTheme('high-contrast');
        document.getElementById('theme-dark').onclick = () => setTheme('dark');
        document.getElementById('theme-grayscale').onclick = () => setTheme('grayscale');
        document.getElementById('theme-invert').onclick = () => setTheme('invert');

        document.getElementById('btn-magnifier').onclick = toggleMagnifier;
        document.getElementById('btn-ruler').onclick = toggleRuler;
        document.getElementById('btn-cursor').onclick = toggleCursor;
        document.getElementById('btn-links').onclick = toggleLinks;

        document.getElementById('btn-read-text').onclick = readSelectedText;
        document.getElementById('btn-stop-text').onclick = stopSpeech;
        document.getElementById('btn-reset-all').onclick = resetAll;
    }

    function init() {
        loadDependencies();
        injectStyles();
        injectHTML();
        attachEventListeners();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
