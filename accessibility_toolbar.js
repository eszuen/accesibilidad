(function() {
    // Evitar doble inyección del widget
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

        // Font Awesome Icons
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const fa = document.createElement('link');
            fa.rel = 'stylesheet';
            fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
            head.appendChild(fa);
        }

        // OpenDyslexic Font
        if (!document.querySelector('link[href*="open-dyslexic"]')) {
            const od = document.createElement('link');
            od.rel = 'stylesheet';
            od.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/open-dyslexic.css';
            head.appendChild(od);
        }

        // Tailwind CSS (si no existe previamente)
        if (!window.tailwind && !document.querySelector('script[src*="tailwindcss"]')) {
            const tw = document.createElement('script');
            tw.src = 'https://cdn.tailwindcss.com';
            head.appendChild(tw);
        }
    }

    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'unam-accessibility-styles';
        style.textContent = `
            /* Aislamos la barra y el panel para que no cambien de tamaño con el zoom del texto */
            #unam-accessibility-header, #accessibility-panel, #open-accessibility-btn {
                font-size: 16px !important;
            }

            /* Estilos y Reglas Globales de Accesibilidad */
            .theme-high-contrast, .theme-high-contrast * {
                background-color: #000000 !important;
                color: #FFFF00 !important;
                border-color: #FFFF00 !important;
            }
            .theme-high-contrast a {
                color: #00FFFF !important;
                text-decoration: underline !important;
            }
            .theme-dark {
                background-color: #121212 !important;
                color: #E0E0E0 !important;
            }
            .theme-dark h1, .theme-dark h2, .theme-dark p, .theme-dark span, .theme-dark li {
                color: #F1F5F9 !important;
            }
            .theme-grayscale {
                filter: grayscale(100%) !important;
            }
            .theme-invert {
                filter: invert(100%) hue-rotate(180deg) !important;
            }
            .font-dyslexic, .font-dyslexic * {
                font-family: 'OpenDyslexic', 'Comic Sans MS', sans-serif !important;
            }
            .big-cursor, .big-cursor * {
                cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="%2300468B" stroke="%23ffffff" stroke-width="2"><path d="M3 3l7 18 3-7 7-3L3 3z"/></svg>'), auto !important;
            }
            .highlight-links a {
                background-color: #fef08a !important;
                color: #000000 !important;
                font-weight: bold !important;
                padding: 2px 4px !important;
                border-radius: 4px !important;
                text-decoration: underline !important;
            }
            #reading-ruler {
                position: fixed;
                pointer-events: none;
                width: 100%;
                height: 32px;
                background: rgba(255, 235, 59, 0.35);
                border-top: 2px solid #d97706;
                border-bottom: 2px solid #d97706;
                z-index: 999999;
                display: none;
                transform: translateY(-50%);
            }
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
            .panel-slide {
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
        `;
        document.head.appendChild(style);
    }

    function injectHTML() {
        const body = document.body;

        // Regla de lectura y lupa
        const helperElements = `
            <div id="reading-ruler"></div>
            <div id="magnifier-glass"></div>
        `;
        body.insertAdjacentHTML('afterbegin', helperElements);

        // Barra Superior
        const topHeader = `
            <header id="unam-accessibility-header" class="w-full bg-slate-900 text-white shadow-lg sticky top-0 z-40 border-b border-slate-800">
                <div class="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
                    <div class="flex items-center gap-2.5 font-bold tracking-wide">
                        <i class="fa-solid fa-universal-access text-amber-400 text-lg"></i>
                        <span class="hidden sm:inline text-slate-200">Herramientas de Accesibilidad</span>
                        <span class="sm:hidden text-slate-200">Accesibilidad</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-2">
                        <div class="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
                            <button type="button" id="btn-font-plus" class="px-2.5 py-1 hover:bg-slate-700 rounded text-xs font-semibold text-slate-200" title="Aumentar letra">A+</button>
                            <button type="button" id="btn-font-minus" class="px-2.5 py-1 hover:bg-slate-700 rounded text-xs font-semibold text-slate-200" title="Reducir letra">A-</button>
                            <button type="button" id="btn-font-reset" class="px-2 py-1 hover:bg-slate-700 rounded text-xs text-slate-400" title="Restablecer tamaño"><i class="fa-solid fa-rotate-left"></i></button>
                        </div>
                        <button type="button" id="btn-quick-contrast" class="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg transition text-xs flex items-center gap-1.5 shadow-sm">
                            <i class="fa-solid fa-circle-half-stroke"></i>
                            <span>Alto Contraste</span>
                        </button>
                        <button type="button" id="btn-quick-magnifier" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition">
                            <i class="fa-solid fa-magnifying-glass text-amber-400"></i>
                            <span class="hidden sm:inline">Lupa</span>
                        </button>
                        <button type="button" id="btn-open-panel-top" class="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-600 font-bold text-white rounded-lg transition text-xs flex items-center gap-1.5 shadow">
                            <i class="fa-solid fa-sliders"></i>
                            <span>Más Opciones</span>
                        </button>
                    </div>
                </div>
            </header>
        `;
        body.insertAdjacentHTML('afterbegin', topHeader);

        // Botón Flotante
        const floatingButton = `
            <button id="open-accessibility-btn" type="button"
                    class="fixed bottom-6 right-6 z-[999999] bg-[#00468B] hover:bg-[#003569] text-white p-4 rounded-full shadow-2xl flex items-center justify-center focus:ring-4 focus:ring-blue-300 focus:outline-none transition-transform hover:scale-110"
                    aria-label="Abrir opciones de accesibilidad">
                <i class="fa-solid fa-universal-access text-2xl"></i>
            </button>
        `;

        // Panel Lateral
        const lateralPanel = `
            <div id="accessibility-panel" class="fixed top-0 right-0 h-full w-full sm:w-96 bg-white dark:bg-slate-900 shadow-2xl z-[999999] transform translate-x-full panel-slide overflow-y-auto border-l border-slate-200 dark:border-slate-800">
                <div class="bg-[#00468B] text-white p-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
                    <div class="flex items-center gap-2.5">
                        <i class="fa-solid fa-universal-access text-2xl text-amber-400"></i>
                        <div>
                            <h2 class="font-bold text-base leading-tight">Panel de Accesibilidad</h2>
                            <p class="text-[11px] text-blue-200">ADSDD - UNAM</p>
                        </div>
                    </div>
                    <button type="button" id="btn-close-panel" class="text-white hover:bg-blue-800 p-2 rounded-lg text-xl transition" aria-label="Cerrar panel">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="p-5 space-y-6">
                    <div>
                        <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-font text-blue-600"></i> Texto y Lectura
                        </h3>
                        <div class="grid grid-cols-3 gap-2 mb-3">
                            <button type="button" id="panel-font-plus" class="p-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-center font-bold text-xs border flex flex-col items-center gap-1 transition">
                                <i class="fa-solid fa-magnifying-glass-plus text-base"></i><span>Aumentar</span>
                            </button>
                            <button type="button" id="panel-font-minus" class="p-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-center font-bold text-xs border flex flex-col items-center gap-1 transition">
                                <i class="fa-solid fa-magnifying-glass-minus text-base"></i><span>Reducir</span>
                            </button>
                            <button type="button" id="panel-font-reset" class="p-3 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-center font-bold text-xs border flex flex-col items-center gap-1 transition">
                                <i class="fa-solid fa-rotate-left text-base"></i><span>Normal</span>
                            </button>
                        </div>
                        <div class="space-y-2">
                            <button type="button" id="btn-dyslexia" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition">
                                <span><i class="fa-solid fa-book-open mr-2 text-blue-600"></i> Fuente para Dislexia</span>
                                <span id="badge-dyslexia" class="text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700">NO</span>
                            </button>
                            <button type="button" id="btn-spacing" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition">
                                <span><i class="fa-solid fa-arrows-up-down mr-2 text-blue-600"></i> Espaciado Interlineal</span>
                                <span id="badge-spacing" class="text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700">NO</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-circle-half-stroke text-blue-600"></i> Contraste y Pantalla
                        </h3>
                        <div class="grid grid-cols-2 gap-2 mb-2">
                            <button type="button" id="theme-default" class="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold border flex items-center gap-2">
                                <span class="w-3.5 h-3.5 rounded-full bg-white border border-slate-400"></span> Normal
                            </button>
                            <button type="button" id="theme-high-contrast" class="p-2.5 bg-black text-amber-300 hover:bg-slate-900 rounded-xl text-xs font-semibold border border-amber-400 flex items-center gap-2">
                                <span class="w-3.5 h-3.5 rounded-full bg-amber-300 border border-black"></span> Alto Contraste
                            </button>
                            <button type="button" id="theme-dark" class="p-2.5 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-semibold border flex items-center gap-2">
                                <span class="w-3.5 h-3.5 rounded-full bg-slate-900 border"></span> Modo Oscuro
                            </button>
                            <button type="button" id="theme-grayscale" class="p-2.5 bg-slate-300 text-slate-800 hover:bg-slate-400 rounded-xl text-xs font-semibold border flex items-center gap-2">
                                <span class="w-3.5 h-3.5 rounded-full bg-slate-500"></span> Escala Grises
                            </button>
                        </div>
                        <button type="button" id="theme-invert" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition">
                            <i class="fa-solid fa-arrows-rotate text-blue-600"></i> Invertir Colores
                        </button>
                    </div>
                    <div>
                        <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-eye text-blue-600"></i> Apoyo Visual y Lupa
                        </h3>
                        <div class="space-y-2">
                            <button type="button" id="btn-magnifier" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition">
                                <span><i class="fa-solid fa-magnifying-glass mr-2 text-blue-600"></i> Lupa Virtual Interactiva</span>
                                <span id="badge-magnifier" class="text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700">NO</span>
                            </button>
                            <button type="button" id="btn-ruler" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition">
                                <span><i class="fa-solid fa-ruler-horizontal mr-2 text-blue-600"></i> Regla de Lectura Visual</span>
                                <span id="badge-ruler" class="text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700">NO</span>
                            </button>
                            <button type="button" id="btn-cursor" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition">
                                <span><i class="fa-solid fa-arrow-pointer mr-2 text-blue-600"></i> Cursor Gigante UNAM</span>
                                <span id="badge-cursor" class="text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700">NO</span>
                            </button>
                            <button type="button" id="btn-links" class="w-full p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition">
                                <span><i class="fa-solid fa-link mr-2 text-blue-600"></i> Resaltar Enlaces</span>
                                <span id="badge-links" class="text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700">NO</span>
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 flex items-center gap-2">
                            <i class="fa-solid fa-volume-high text-blue-600"></i> Lectura en Voz Alta
                        </h3>
                        <div class="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2.5">
                            <p class="text-xs text-blue-900 leading-relaxed">
                                Selecciona texto en la página y haz clic en <strong>Leer</strong>:
                            </p>
                            <div class="flex gap-2">
                                <button type="button" id="btn-read-text" class="flex-1 bg-[#00468B] hover:bg-blue-800 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition">
                                    <i class="fa-solid fa-play"></i> Leer Texto
                                </button>
                                <button type="button" id="btn-stop-text" class="bg-rose-600 hover:bg-rose-700 text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition">
                                    <i class="fa-solid fa-stop"></i> Detener
                                </button>
                            </div>
                        </div>
                    </div>
                    <button type="button" id="btn-reset-all" class="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 flex items-center justify-center gap-2 transition">
                        <i class="fa-solid fa-rotate"></i> Restablecer Ajustes
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
            if (panel) panel.classList.toggle('translate-x-full');
        }

        function applyFontSize(size) {
            currentFontSize = size;
            // Modificar tanto html como body garantiza compatibilidad con Tailwind CSS / rem / px
            document.documentElement.style.fontSize = `${currentFontSize}%`;
            body.style.fontSize = `${currentFontSize}%`;
        }

        function changeFontSize(step) {
            let newSize = currentFontSize + (step * 10);
            newSize = Math.min(Math.max(newSize, 80), 180); // Límite entre 80% y 180%
            applyFontSize(newSize);
        }

        function resetFontSize() {
            applyFontSize(100);
        }

        function updateBadge(id, state) {
            const badge = document.getElementById(id);
            if (!badge) return;
            badge.textContent = state ? 'SÍ' : 'NO';
            badge.className = state
                ? 'text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-bold'
                : 'text-[10px] px-2 py-0.5 rounded bg-slate-300 text-slate-700';
        }

        function toggleDyslexia() {
            isDyslexicFont = !isDyslexicFont;
            isDyslexicFont ? body.classList.add('font-dyslexic') : body.classList.remove('font-dyslexic');
            updateBadge('badge-dyslexia', isDyslexicFont);
        }

        function toggleSpacing() {
            isLineSpacing = !isLineSpacing;
            body.style.lineHeight = isLineSpacing ? '2.2' : 'normal';
            body.style.letterSpacing = isLineSpacing ? '0.08em' : 'normal';
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

        // Binds
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
