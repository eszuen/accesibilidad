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
        if (!document.getElementById('unam-font-awesome-css')) {
            const fa = document.createElement('link');
            fa.id = 'unam-font-awesome-css';
            fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
            head.appendChild(fa);
        }


        // OpenDyslexic Font CDN
        if (!document.getElementById('unam-open-dyslexic-css')) {
            const od = document.createElement('link');
            od.id = 'unam-open-dyslexic-css';
            od.rel = 'stylesheet';
            od.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.css';
            head.appendChild(od);
        }
    }


    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'unam-accessibility-styles';
        style.textContent = `
            @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
            @import url('https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.css');


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
                border: 1px
