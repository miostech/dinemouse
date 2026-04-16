/**
 * Gera páginas HTML do blog a partir de scripts/blog-posts-data.mjs
 * e reescreve blog/index.html + sitemap.xml com todos os URLs.
 * Uso: node scripts/generate-blog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NEW_POSTS, EXISTING_INDEX } from './blog-posts-data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/** Converte **negrito** do markdown leve em <strong>; escapa o restante. */
function escapeHtmlWithBold(s) {
    const str = String(s);
    let out = '';
    let i = 0;
    const len = str.length;
    while (i < len) {
        const open = str.indexOf('**', i);
        if (open === -1) {
            out += escapeHtml(str.slice(i));
            break;
        }
        out += escapeHtml(str.slice(i, open));
        const close = str.indexOf('**', open + 2);
        if (close === -1) {
            out += escapeHtml(str.slice(open));
            break;
        }
        out += '<strong>' + escapeHtml(str.slice(open + 2, close)) + '</strong>';
        i = close + 2;
    }
    return out;
}

function escapeJsonLdString(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const NAV = `    <nav class="navbar">
        <div class="container">
            <div class="logo">
                <a href="/" class="logo-link"><span class="logo-text">Dine Mouse</span></a>
            </div>
            <ul class="nav-menu">
                <li><a href="/#problema">Como funciona</a></li>
                <li><a href="/#planos">Planos</a></li>
                <li><a href="/#parques">Parques</a></li>
                <li><a href="/#faq">FAQ</a></li>
                <li><a href="/blog/">Blog</a></li>
                <li><a href="/#ajuda">Ajuda</a></li>
                <li><a href="/#contato">Contato</a></li>
            </ul>
            <a class="cta-nav" href="/portal">Portal do cliente</a>
            <button class="menu-toggle" type="button" aria-label="Menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </nav>`;

const FOOTER = `    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-brand">
                    <h3>Dine Mouse</h3>
                    <p>Concierge gastronômico premium</p>
                </div>
                <div class="footer-links">
                    <div class="footer-column">
                        <h4>Links</h4>
                        <ul>
                            <li><a href="/#planos">Planos</a></li>
                            <li><a href="/blog/">Blog</a></li>
                            <li><a href="/#contato">Contato</a></li>
                        </ul>
                    </div>
                    <div class="footer-column">
                        <h4>Legal</h4>
                        <ul>
                            <li><a href="/politica-privacidade.html">Política de Privacidade</a></li>
                            <li><a href="/termos-uso.html">Termos de Serviço</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="footer-disclaimer">
                <p>Dine Mouse é um serviço independente de concierge gastronômico. Não somos afiliados à Disney ou a qualquer parque temático.</p>
            </div>
            <div class="footer-copyright">
                <p>&copy; 2026 Dine Mouse. Todos os direitos reservados.</p>
            </div>
        </div>
    </footer>
    <script src="/script.js"></script>`;

function renderArticle(post, titleMap) {
    const canonical = `https://www.dinemouse.com/blog/${post.slug}/`;
    const breadcrumb = post.breadcrumb || post.title.slice(0, 40);
    const relatedItems = post.related
        .map((slug) => {
            const t = titleMap[slug];
            if (!t) return '';
            return `                        <li><a href="/blog/${slug}/">${escapeHtml(t)}</a></li>`;
        })
        .filter(Boolean)
        .join('\n');

    const sectionsHtml = post.sections
        .map((sec) => {
            const ps = sec.paragraphs
                .map((p) => `                <p>${escapeHtmlWithBold(p)}</p>`)
                .join('\n');
            return `                <h2>${escapeHtmlWithBold(sec.h2)}</h2>\n${ps}`;
        })
        .join('\n\n');

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: post.date,
        dateModified: post.date,
        author: { '@type': 'Organization', name: 'Dine Mouse' },
        publisher: { '@type': 'Organization', name: 'Dine Mouse', url: 'https://www.dinemouse.com' },
        description: post.metaDesc,
        keywords: post.keywords,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    };

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${escapeHtml(post.metaDesc)}">
    <title>${escapeHtml(post.title)} | Dine Mouse</title>
    <link rel="canonical" href="${canonical}">
    <link rel="icon" type="image/png" href="/favicon.png" sizes="512x512">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
    <link rel="stylesheet" href="/blog.css">
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(post.title)}">
    <meta property="og:description" content="${escapeHtml(post.metaDesc)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:site_name" content="Dine Mouse">
    <meta property="og:locale" content="pt_BR">
    <meta property="og:image" content="https://www.dinemouse.com/logoDine.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta property="article:published_time" content="${post.date}">
    <script type="application/ld+json">
    ${JSON.stringify(jsonLd, null, 4)}
    </script>
</head>
<body>
${NAV}

    <main class="blog-page">
        <div class="blog-container">
            <nav class="breadcrumb" aria-label="Navegação do blog">
                <a href="/blog/">Blog</a> · ${escapeHtml(breadcrumb)}
            </nav>

            <article class="post-article" itemscope itemtype="https://schema.org/BlogPosting">
                <h1 itemprop="headline">${escapeHtml(post.title)}</h1>
                <p class="post-meta">
                    <time datetime="${post.date}" itemprop="datePublished">${post.dateLabel}</time>
                    · ${escapeHtml(post.geoLabel || 'Walt Disney World')}
                </p>

                <p>${escapeHtmlWithBold(post.lead)}</p>

${sectionsHtml}

                <section class="post-related" aria-labelledby="related-${post.slug}">
                    <h2 id="related-${post.slug}">Artigos relacionados</h2>
                    <ul>
${relatedItems}
                    </ul>
                </section>

                <div class="post-cta">
                    <h2>Alertas e concierge Dine Mouse</h2>
                    <p>Monitoramento de vagas e reservas nos restaurantes mais disputados - em português, para a sua viagem a Orlando.</p>
                    <div class="btn-row">
                        <a class="btn btn-primary" href="/#alertas">Quero alertas</a>
                        <a class="btn btn-secondary" href="/#concierge">Concierge</a>
                    </div>
                </div>

                <p class="post-disclaimer">O Dine Mouse é um serviço independente e não é afiliado à The Walt Disney Company. Marcas de terceiros (incl. nomes de serviços de alerta) pertencem aos respetivos proprietários; comparações são informativas.</p>
            </article>
        </div>
    </main>

${FOOTER}
</body>
</html>
`;
}

function main() {
    const titleMap = {};
    for (const e of EXISTING_INDEX) titleMap[e.slug] = e.title;
    for (const p of NEW_POSTS) titleMap[p.slug] = p.title;

    for (const post of NEW_POSTS) {
        const dir = path.join(ROOT, 'blog', post.slug);
        fs.mkdirSync(dir, { recursive: true });
        const html = renderArticle(post, titleMap);
        fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
        console.log('Wrote', post.slug);
    }

    const allForIndex = [
        ...EXISTING_INDEX.map((e) => ({ ...e, isExisting: true })),
        ...NEW_POSTS.map((p) => ({
            slug: p.slug,
            title: p.title,
            date: p.date,
            dateLabel: p.dateLabel,
            excerpt: p.excerpt,
        })),
    ].sort((a, b) => b.date.localeCompare(a.date));

    const blogPostJson = allForIndex
        .map(
            (e) => `            {
                "@type": "BlogPosting",
                "headline": "${escapeJsonLdString(e.title)}",
                "url": "https://www.dinemouse.com/blog/${e.slug}/"
            }`
        )
        .join(',\n');

    const cardsHtml = allForIndex
        .map(
            (e) => `                <a class="blog-card" href="/blog/${e.slug}/">
                    <time datetime="${e.date}">${e.dateLabel}</time>
                    <h2>${escapeHtml(e.title)}</h2>
                    <p>${escapeHtml(e.excerpt)}</p>
                    <span class="read-more">Ler artigo →</span>
                </a>`
        )
        .join('\n');

    const indexPath = path.join(ROOT, 'blog', 'index.html');
    let indexHtml = fs.readFileSync(indexPath, 'utf8');
    const startMarker = '            <div class="blog-list">';
    const endMarker = '            </div>\n\n            <div class="post-cta"';
    const i0 = indexHtml.indexOf(startMarker);
    const i1 = indexHtml.indexOf(endMarker);
    if (i0 === -1 || i1 === -1) throw new Error('blog/index.html markers not found');
    indexHtml =
        indexHtml.slice(0, i0 + startMarker.length) +
        '\n' +
        cardsHtml +
        '\n' +
        indexHtml.slice(i1);

    indexHtml = indexHtml.replace(
        /"blogPost": \[[\s\S]*?\n        \]/m,
        `"blogPost": [\n${blogPostJson}\n        ]`
    );
    if (!indexHtml.includes(allForIndex[0].slug)) throw new Error('blogPost JSON replace failed');

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('Updated blog/index.html');

    const sitemapPath = path.join(ROOT, 'sitemap.xml');
    const blogPostUrls = allForIndex
        .map(
            (e) => `    <url>
        <loc>https://www.dinemouse.com/blog/${e.slug}/</loc>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>`
        )
        .join('\n');

    const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://www.dinemouse.com/</loc>
        <changefreq>weekly</changefreq>
        <priority>1</priority>
    </url>
    <url>
        <loc>https://www.dinemouse.com/blog/</loc>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
${blogPostUrls}
    <url>
        <loc>https://www.dinemouse.com/portal</loc>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
    <url>
        <loc>https://www.dinemouse.com/politica-privacidade.html</loc>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>
    <url>
        <loc>https://www.dinemouse.com/termos-uso.html</loc>
        <changefreq>yearly</changefreq>
        <priority>0.3</priority>
    </url>
</urlset>
`;
    fs.writeFileSync(sitemapPath, sm, 'utf8');
    console.log('Updated sitemap.xml');
}

main();
