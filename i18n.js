/**
 * i18n Dine Mouse — bilíngue PT/EN sem reescrever o HTML.
 *
 * Como funciona: o site é escrito em português (idioma-fonte). Quando o usuário
 * escolhe EN, percorremos os nós de texto e trocamos pelo equivalente do
 * dicionário DICT (chave = texto PT exato, sem espaços nas pontas). Voltar para
 * PT restaura o original. Um MutationObserver traduz conteúdo inserido
 * dinamicamente (ex.: cards do portal). Para strings geradas em JS, use window.t().
 *
 * O dicionário fica em i18n-dict.js (window.DINEMOUSE_EN).
 */
(function () {
    const KEY = 'dineMouse_lang';
    const DICT = (window.DINEMOUSE_EN && typeof window.DINEMOUSE_EN === 'object') ? window.DINEMOUSE_EN : {};
    const originals = new WeakMap(); // nó de texto -> valor PT original
    const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA']);

    function getLang() {
        try { return localStorage.getItem(KEY) === 'en' ? 'en' : 'pt'; } catch { return 'pt'; }
    }
    function setLang(l) {
        try { localStorage.setItem(KEY, l === 'en' ? 'en' : 'pt'); } catch { /* ignore */ }
    }

    function translateTextNodes(root, lang) {
        if (!root) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(n) {
                if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                if (n.parentElement && SKIP.has(n.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            },
        });
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        for (const n of nodes) {
            if (!originals.has(n)) originals.set(n, n.nodeValue);
            const raw = originals.get(n);
            // Chave normalizada: sem espaços nas pontas e runs internos viram 1 espaço.
            const coreNorm = raw.trim().replace(/\s+/g, ' ');
            if (lang === 'en' && DICT[coreNorm]) {
                const lead = raw.match(/^\s*/)[0];
                const trail = raw.match(/\s*$/)[0];
                n.nodeValue = lead + DICT[coreNorm] + trail;
            } else {
                n.nodeValue = raw;
            }
        }
    }

    function translateAttr(root, lang, attr, store) {
        root.querySelectorAll('[' + attr + ']').forEach((el) => {
            if (el[store] == null) el[store] = el.getAttribute(attr);
            const pt = el[store] || '';
            const key = pt.trim().replace(/\s+/g, ' ');
            if (!key) return;
            el.setAttribute(attr, lang === 'en' && DICT[key] ? DICT[key] : pt);
        });
    }

    function translateAttrs(root, lang) {
        translateAttr(root, lang, 'placeholder', '__i18nPh');
        translateAttr(root, lang, 'aria-label', '__i18nAria');
        translateAttr(root, lang, 'title', '__i18nTitle');
    }

    function updateToggle(lang) {
        document.querySelectorAll('.lang-toggle').forEach((btn) => {
            btn.textContent = lang === 'en' ? 'PT' : 'EN';
            btn.setAttribute('aria-label', lang === 'en' ? 'Mudar para português' : 'Switch to English');
        });
    }

    function apply(lang) {
        lang = lang === 'en' ? 'en' : 'pt';
        translateTextNodes(document.body, lang);
        translateAttrs(document.body, lang);
        document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
        updateToggle(lang);
    }

    // Tradução de strings geradas em JS.
    window.t = function (pt) {
        const key = String(pt == null ? '' : pt).trim().replace(/\s+/g, ' ');
        return getLang() === 'en' && DICT[key] ? DICT[key] : pt;
    };
    window.i18nApply = function () { apply(getLang()); };
    window.i18nToggle = function () {
        const next = getLang() === 'en' ? 'pt' : 'en';
        setLang(next);
        apply(next);
    };
    window.i18nLang = getLang;

    // Traduz conteúdo inserido dinamicamente (cards do portal, listas, etc.).
    function observe() {
        const mo = new MutationObserver((muts) => {
            if (getLang() !== 'en') return;
            for (const m of muts) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        translateTextNodes(node, 'en');
                        translateAttrs(node, 'en');
                    } else if (node.nodeType === 3 && node.parentElement) {
                        translateTextNodes(node.parentElement, 'en');
                    }
                }
            }
        });
        mo.observe(document.body, { childList: true, subtree: true });
    }

    function init() {
        apply(getLang());
        observe();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
