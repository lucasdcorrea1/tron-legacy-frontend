/**
 * Post-build script: generates static HTML pages with SEO meta tags
 * for each published blog post. This ensures search engines and social
 * media crawlers see proper meta tags even before JavaScript executes.
 *
 * Run after `vite build`: node scripts/generate-seo-pages.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(__dirname, '..', 'dist');
const API_URL = process.env.VITE_API_URL || 'https://tron-legacy-api.onrender.com';
const SITE_URL = 'https://whodo.com.br';

// Read the built index.html as template
const indexHtml = readFileSync(resolve(DIST_DIR, 'index.html'), 'utf-8');

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getImageUrl(url) {
  if (!url) return `${SITE_URL}/teste-image-home.png`;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  if (/^[a-f0-9]{24}$/.test(url)) {
    return `${API_URL}/api/v1/blog/images/group/${url}?size=banner`;
  }
  return `${API_URL}${url}`;
}

function generateMetaTags({ title, description, url, image, type, publishedTime, modifiedTime, tags, author, jsonLd, extraJsonLd }) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);

  let meta = `
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDesc}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="${type || 'website'}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:locale" content="pt_BR" />
    <meta property="og:site_name" content="Whodo" />`;

  if (image) {
    meta += `\n    <meta property="og:image" content="${image}" />`;
  }

  if (publishedTime) {
    meta += `\n    <meta property="article:published_time" content="${publishedTime}" />`;
  }
  if (modifiedTime) {
    meta += `\n    <meta property="article:modified_time" content="${modifiedTime}" />`;
  }
  if (tags && tags.length > 0) {
    tags.forEach(tag => {
      meta += `\n    <meta property="article:tag" content="${escapeHtml(tag)}" />`;
    });
  }

  meta += `
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />`;

  if (image) {
    meta += `\n    <meta name="twitter:image" content="${image}" />`;
  }

  if (jsonLd) {
    meta += `\n    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  }

  if (extraJsonLd) {
    meta += `\n    <script type="application/ld+json">${JSON.stringify(extraJsonLd)}</script>`;
  }

  return meta;
}

function injectMetaTags(html, metaTags, bodyContent = '') {
  // Replace the default <title> and <meta name="description"> with our custom ones
  let result = html
    .replace(/<title>.*?<\/title>/, '')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, '');

  // Inject meta tags right before </head>
  result = result.replace('</head>', `${metaTags}\n  </head>`);

  // Inject visible content inside #root for crawlers (React createRoot will replace it)
  if (bodyContent) {
    result = result.replace(
      '<div id="root"></div>',
      `<div id="root">${bodyContent}</div>`
    );
  }

  return result;
}

function writePage(relativePath, html) {
  const filePath = resolve(DIST_DIR, relativePath);
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(filePath, html, 'utf-8');
  console.log(`  Generated: ${relativePath}`);
}

// Static body content for crawlers — React replaces this on mount
function homeBodyContent() {
  return `
    <header><a href="/">Whodo</a></header>
    <main>
      <h1>Whodo - A plataforma que acelera seu marketing digital</h1>
      <p>Agende posts, automatize respostas e gerencie campanhas no Instagram, Meta Ads e Email Marketing. Tudo em um só lugar.</p>
      <section>
        <h2>O que o Whodo faz por você</h2>
        <ul>
          <li>Agendamento de posts para redes sociais</li>
          <li>Respostas automáticas inteligentes</li>
          <li>Gestão de campanhas no Instagram e Meta Ads</li>
          <li>Email Marketing integrado</li>
        </ul>
      </section>
      <section>
        <h2>Por que escolher o Whodo?</h2>
        <p>Tudo que você precisa para alavancar seu marketing digital em uma única plataforma. Comece grátis, escale quando quiser.</p>
      </section>
    </main>
    <footer><p>&copy; ${new Date().getFullYear()} Whodo Group LTDA - Todos os direitos reservados.</p></footer>`;
}

function servicesBodyContent() {
  return `
    <header><a href="/">Whodo</a></header>
    <main>
      <h1>Funcionalidades da Plataforma Whodo</h1>
      <p>Agendamento de posts, respostas automáticas, Instagram, Meta Ads e Email Marketing. Tudo em um só lugar.</p>
      <section>
        <h2>Agendamento de Posts</h2>
        <p>Planeje e agende publicações para suas redes sociais com antecedência.</p>
      </section>
      <section>
        <h2>Respostas Automáticas</h2>
        <p>Configure regras inteligentes para responder automaticamente seus seguidores e leads.</p>
      </section>
      <section>
        <h2>Instagram e Meta Ads</h2>
        <p>Gerencie suas campanhas de anúncios diretamente pela plataforma.</p>
      </section>
      <section>
        <h2>Email Marketing</h2>
        <p>Crie e dispare campanhas de email para engajar sua base de contatos.</p>
      </section>
    </main>
    <footer><p>&copy; ${new Date().getFullYear()} Whodo Group LTDA - Todos os direitos reservados.</p></footer>`;
}

function blogBodyContent(posts = []) {
  const postList = posts.slice(0, 10).map(p => {
    const date = p.published_at ? new Date(p.published_at).toLocaleDateString('pt-BR') : '';
    return `<li><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a>${p.excerpt ? ` - ${escapeHtml(p.excerpt)}` : ''}${date ? ` <time>${date}</time>` : ''}</li>`;
  }).join('\n          ');

  return `
    <header><a href="/">Whodo</a> &gt; <a href="/blog">Blog</a></header>
    <main>
      <h1>Blog Tron Legacy - Artigos sobre Tecnologia</h1>
      <p>Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software. Explorando código, sistemas e o futuro digital.</p>
      ${posts.length > 0 ? `<section><h2>Artigos Recentes</h2><ul>${postList}</ul></section>` : ''}
    </main>
    <footer><p>&copy; ${new Date().getFullYear()} Whodo Group LTDA - Todos os direitos reservados.</p></footer>`;
}

function postBodyContent(post) {
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const plainContent = post.content ? post.content.replace(/<[^>]*>/g, '').slice(0, 500) : '';

  return `
    <header><a href="/">Whodo</a> &gt; <a href="/blog">Blog</a> &gt; ${escapeHtml(post.title)}</header>
    <main>
      <article>
        <h1>${escapeHtml(post.meta_title || post.title)}</h1>
        <p>${escapeHtml(post.meta_description || post.excerpt || post.title)}</p>
        ${post.author_name ? `<p>Por ${escapeHtml(post.author_name)}${date ? ` — ${date}` : ''}</p>` : ''}
        ${post.category ? `<p>Categoria: ${escapeHtml(post.category)}</p>` : ''}
        ${post.tags && post.tags.length > 0 ? `<p>Tags: ${post.tags.map(t => escapeHtml(t)).join(', ')}</p>` : ''}
        ${plainContent ? `<div>${escapeHtml(plainContent)}${plainContent.length >= 500 ? '...' : ''}</div>` : ''}
      </article>
    </main>
    <footer><p>&copy; ${new Date().getFullYear()} Whodo Group LTDA - Todos os direitos reservados.</p></footer>`;
}

async function main() {
  console.log('Generating SEO pages...\n');

  // 1. Home page - update the root index.html with better meta tags
  const homeMeta = generateMetaTags({
    title: 'Whodo - A plataforma que acelera seu marketing digital',
    description: 'Agende posts, automatize respostas e gerencie campanhas no Instagram, Meta Ads e Email Marketing. Tudo em um só lugar.',
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/teste-image-home.png`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Whodo',
      url: SITE_URL,
      description: 'Plataforma de marketing digital: agende posts, automatize respostas e gerencie campanhas.',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    extraJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Whodo',
      url: SITE_URL,
      inLanguage: 'pt-BR',
      publisher: {
        '@type': 'Organization',
        name: 'Whodo',
        url: SITE_URL,
      },
    },
  });
  writePage('index.html', injectMetaTags(indexHtml, homeMeta, homeBodyContent()));

  // 2. Services page
  const servicesMeta = generateMetaTags({
    title: 'Funcionalidades da Plataforma | Whodo',
    description: 'Agendamento de posts, respostas automáticas, Instagram, Meta Ads e Email Marketing. Conheça tudo que o Whodo oferece.',
    url: `${SITE_URL}/features`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      applicationCategory: 'Marketing',
      provider: {
        '@type': 'Organization',
        name: 'Whodo',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
      },
      areaServed: { '@type': 'Country', name: 'Brasil' },
    },
    extraJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Features', item: `${SITE_URL}/features` },
      ],
    },
  });
  writePage('features/index.html', injectMetaTags(indexHtml, servicesMeta, servicesBodyContent()));

  // 3. Blog listing page
  const blogMeta = generateMetaTags({
    title: 'Blog Tron Legacy - Artigos sobre Tecnologia | Whodo',
    description: 'Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Tron Legacy',
      url: `${SITE_URL}/blog`,
      description: 'Artigos, tutoriais e novidades sobre tecnologia.',
      inLanguage: 'pt-BR',
      publisher: {
        '@type': 'Organization',
        name: 'Whodo',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` },
      },
    },
    extraJsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      ],
    },
  });
  // Blog page body content will be updated after fetching posts
  let blogPosts = [];

  // 3. Fetch all published posts and generate individual pages
  try {
    console.log(`\n  Fetching posts from ${API_URL}...`);
    const response = await fetch(`${API_URL}/api/v1/blog/posts?limit=50`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const posts = data.posts || [];
    blogPosts = posts;
    console.log(`  Found ${posts.length} published posts\n`);

    for (const post of posts) {
      const postTitle = post.meta_title || post.title;
      const postDescription = post.meta_description || post.excerpt || post.title;
      const postUrl = `${SITE_URL}/blog/${post.slug}`;
      const coverImage = post.cover_images && post.cover_images.length > 0
        ? getImageUrl(post.cover_images[0])
        : getImageUrl(post.cover_image);
      const publishedDate = post.published_at || post.created_at;

      const postMeta = generateMetaTags({
        title: `${postTitle} | Whodo Blog`,
        description: postDescription,
        url: postUrl,
        image: coverImage,
        type: 'article',
        publishedTime: publishedDate,
        modifiedTime: post.updated_at,
        tags: post.tags,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: postTitle,
          description: postDescription,
          image: {
            '@type': 'ImageObject',
            url: coverImage,
            width: 1920,
            height: 1080,
          },
          url: postUrl,
          datePublished: publishedDate,
          dateModified: post.updated_at || publishedDate,
          author: {
            '@type': 'Person',
            name: post.author_name || 'Whodo',
            url: SITE_URL,
          },
          publisher: {
            '@type': 'Organization',
            name: 'Whodo',
            url: SITE_URL,
            logo: {
              '@type': 'ImageObject',
              url: `${SITE_URL}/favicon.svg`,
            },
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
          inLanguage: 'pt-BR',
          ...(post.category && { articleSection: post.category }),
          ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
          ...(post.reading_time && { timeRequired: `PT${post.reading_time}M` }),
        },
        extraJsonLd: {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
            { '@type': 'ListItem', position: 3, name: postTitle, item: postUrl },
          ],
        },
      });

      writePage(`blog/${post.slug}/index.html`, injectMetaTags(indexHtml, postMeta, postBodyContent(post)));
    }

    // 4. Generate sitemap.xml
    generateSitemap(posts);

    // 5. Generate RSS feed
    generateRssFeed(posts);

    console.log(`\nSEO pages generated successfully! (${posts.length + 3} pages + sitemap.xml + feed.xml)`);
  } catch (err) {
    console.error(`\n  Warning: Could not fetch posts from API: ${err.message}`);
    console.log('  Static pages (home, blog) were still generated.');
    console.log('  Blog post pages will rely on client-side meta tags.\n');

    // Generate sitemap with static pages only
    generateSitemap([]);
  }

  // Generate blog listing page (after fetching posts so we can include them)
  writePage('blog/index.html', injectMetaTags(indexHtml, blogMeta, blogBodyContent(blogPosts)));
}

function generateSitemap(posts) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/features</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

  for (const post of posts) {
    const lastMod = (post.updated_at || post.published_at || post.created_at || '').split('T')[0];
    xml += `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }

  xml += `
</urlset>
`;

  writeFileSync(resolve(DIST_DIR, 'sitemap.xml'), xml, 'utf-8');
  console.log(`  Generated: sitemap.xml (${posts.length + 3} URLs)`);
}

function generateRssFeed(posts) {
  const buildDate = new Date().toUTCString();

  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Whodo Blog - Tron Legacy</title>
    <link>${SITE_URL}/blog</link>
    <description>Artigos, tutoriais e novidades sobre tecnologia, programação e desenvolvimento de software.</description>
    <language>pt-BR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`;

  for (const post of posts) {
    const postTitle = escapeHtml(post.meta_title || post.title);
    const postDescription = escapeHtml(post.meta_description || post.excerpt || post.title);
    const postUrl = `${SITE_URL}/blog/${post.slug}`;
    const pubDate = new Date(post.published_at || post.created_at).toUTCString();

    rss += `
    <item>
      <title>${postTitle}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${postDescription}</description>
      <pubDate>${pubDate}</pubDate>
      ${post.author_name ? `<author>noreply@whodo.com.br (${escapeHtml(post.author_name)})</author>` : ''}
      ${post.category ? `<category>${escapeHtml(post.category)}</category>` : ''}
    </item>`;
  }

  rss += `
  </channel>
</rss>
`;

  writeFileSync(resolve(DIST_DIR, 'feed.xml'), rss, 'utf-8');
  console.log(`  Generated: feed.xml (${posts.length} items)`);
}

main();
