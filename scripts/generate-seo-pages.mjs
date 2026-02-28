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

function generateMetaTags({ title, description, url, image, type, publishedTime, modifiedTime, tags, author, jsonLd }) {
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

  return meta;
}

function injectMetaTags(html, metaTags) {
  // Replace the default <title> and <meta name="description"> with our custom ones
  let result = html
    .replace(/<title>.*?<\/title>/, '')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, '');

  // Inject meta tags right before </head>
  result = result.replace('</head>', `${metaTags}\n  </head>`);
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

async function main() {
  console.log('Generating SEO pages...\n');

  // 1. Home page - update the root index.html with better meta tags
  const homeMeta = generateMetaTags({
    title: 'Whodo - Transforme suas ideias em soluções digitais',
    description: 'Desenvolvemos tecnologia sob medida para impulsionar seu negócio. Websites, apps e sistemas que fazem a diferença.',
    url: `${SITE_URL}/`,
    image: `${SITE_URL}/teste-image-home.png`,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Whodo',
      url: SITE_URL,
      description: 'Desenvolvemos tecnologia sob medida para impulsionar seu negócio.',
    },
  });
  writePage('index.html', injectMetaTags(indexHtml, homeMeta));

  // 2. Blog listing page
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
      publisher: { '@type': 'Organization', name: 'Whodo', url: SITE_URL },
    },
  });
  writePage('blog/index.html', injectMetaTags(indexHtml, blogMeta));

  // 3. Fetch all published posts and generate individual pages
  try {
    console.log(`\n  Fetching posts from ${API_URL}...`);
    const response = await fetch(`${API_URL}/api/v1/blog/posts?limit=50`);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    const posts = data.posts || [];
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
          image: coverImage,
          url: postUrl,
          datePublished: publishedDate,
          dateModified: post.updated_at || publishedDate,
          author: {
            '@type': 'Person',
            name: post.author_name || 'Whodo',
          },
          publisher: {
            '@type': 'Organization',
            name: 'Whodo',
            url: SITE_URL,
          },
          mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
          ...(post.tags && post.tags.length > 0 && { keywords: post.tags.join(', ') }),
          ...(post.reading_time && { timeRequired: `PT${post.reading_time}M` }),
        },
      });

      writePage(`blog/${post.slug}/index.html`, injectMetaTags(indexHtml, postMeta));
    }

    console.log(`\nSEO pages generated successfully! (${posts.length + 2} pages total)`);
  } catch (err) {
    console.error(`\n  Warning: Could not fetch posts from API: ${err.message}`);
    console.log('  Static pages (home, blog) were still generated.');
    console.log('  Blog post pages will rely on client-side meta tags.\n');
  }
}

main();
