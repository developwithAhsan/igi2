// Build-time SEO prerendering: publish static, route-specific HTML for search crawlers.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGIN = 'https://igi2.online';
const source = await readFile(resolve(ROOT, 'site/index.html'), 'utf8');
const publishDir = resolve(ROOT, 'publish');

function capture(pattern, label) {
  const match = source.match(pattern);
  if (!match) throw new Error('SEO prerender: could not read ' + label + ' from site/index.html');
  return match[1];
}
function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

const pg = JSON.parse(capture(/const PG=(\{[\s\S]*?\});\nconst pv=/, 'page data'));
const art = JSON.parse(capture(/const ART=(\[[\s\S]*?\]);\n/, 'article data'));
const pm = JSON.parse(capture(/const PM=(\{[\s\S]*?\});\nObject\.keys\(PM\)/, 'page metadata'));
const images = JSON.parse(capture(/const IMG=(\{[\s\S]*?\});\nconst IM=/, 'image paths'));
const imageMap = JSON.parse(capture(/const IM=(\{[\s\S]*?\});\nconst ALT=/, 'article image map'));
const imageAlt = JSON.parse(capture(/const ALT=(\{[\s\S]*?\});\nconst hs=/, 'image alt text'));
const blogIntro = JSON.parse(capture(/PG\.blog\.c=("(?:\\.|[^"\\])*")\+/, 'blog introduction'));
const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]);
if (!styles.length) throw new Error('SEO prerender: no site styles found.');
const footerStart = source.indexOf('<footer class="ft">');
const footerEnd = source.indexOf('</footer>', footerStart);
if (footerStart < 0 || footerEnd < 0) throw new Error('SEO prerender: site footer not found.');
const footer = source.slice(footerStart, footerEnd + '</footer>'.length);

const articleSlugs = new Set(art.map(item => item.s));
const pageSlugs = new Set(Object.keys(pg));
function rewriteInternalLinks(markup) {
  return markup.replace(/href=(["'])#([^"']+)\1/g, (whole, quote, fragment) => {
    let target;
    if (fragment === 'home') target = '/';
    else if (fragment === 'blog') target = '/blog/';
    else if (articleSlugs.has(fragment)) target = '/blog/' + fragment + '/';
    else if (pageSlugs.has(fragment)) target = '/' + fragment + '/';
    else target = '/#' + fragment;
    return 'href=' + quote + target + quote;
  });
}
function thumbnail(item, hero) {
  const image = imageMap[item.s];
  let style = '--p:' + item.pp + ';--z:' + item.z;
  if (image) {
    style += ';--bi:url(' + images[image[0]] + ');--bp:' + image[1] + ';--bs:' + (image[2] > 1 ? (image[2] * 100) + '% auto' : 'cover');
  }
  const label = image ? imageAlt[image[0]] : item.k;
  const classes = 'th' + (hero ? ' hero' : '') + (image ? ' im' : '');
  return '<div class="' + classes + '" style="' + escapeHtml(style) + '" role="img" aria-label="' + escapeHtml(label) + '"><i>' + escapeHtml(item.c) + '</i><b>' + escapeHtml(item.k) + '</b></div>';
}

const cards = '<div class="bg2">' + art.map(item =>
  '<a class="bc" href="/blog/' + item.s + '/">' +
  thumbnail(item, false) +
  '<div class="bx"><h3>' + escapeHtml(item.t) + '</h3><p>' + escapeHtml(item.d) + '</p><span>' + escapeHtml(item.m) + ' min read</span></div></a>'
).join('') + '</div>';

const pages = [];
for (const [slug, raw] of Object.entries(pg)) {
  const meta = pm[slug] || [raw.t, raw.m || raw.s];
  pages.push({
    slug,
    title: meta[0],
    description: meta[1],
    name: raw.n,
    heading: raw.h,
    subtitle: raw.s,
    content: slug === 'blog' ? blogIntro + cards : raw.c,
    isArticle: false,
    isBlogIndex: slug === 'blog',
    keywords: []
  });
}
for (const item of art) {
  pages.push({
    slug: 'blog/' + item.s,
    articleSlug: item.s,
    title: item.st + ' | IGI2.online',
    description: item.d,
    name: item.n,
    heading: item.t,
    subtitle: item.d,
    content: thumbnail(item, true) +
      '<p class="am">By Ahsan · November 21, 2026 · ' + escapeHtml(item.m) + ' min read</p>' +
      item.b +
      '<p><a href="/blog/">← Back to all articles</a></p>',
    isArticle: true,
    isBlogIndex: false,
    keywords: item.kw || []
  });
}

function pageUrl(page) {
  return ORIGIN + '/' + page.slug.replace(/^\/+|\/+$/g, '') + '/';
}
function structuredData(page, canonical) {
  let primary;
  if (page.isArticle) {
    primary = {
      '@type': 'BlogPosting',
      headline: page.heading,
      description: page.description,
      inLanguage: 'en',
      mainEntityOfPage: canonical,
      image: ORIGIN + '/assets/og-image.svg',
      datePublished: '2026-11-21',
      dateModified: '2026-11-22',
      keywords: page.keywords,
      articleSection: 'IGI 2 Guides',
      author: { '@type': 'Person', name: 'Ahsan' },
      publisher: {
        '@type': 'Organization',
        name: 'IGI2.online',
        logo: { '@type': 'ImageObject', url: ORIGIN + '/assets/favicon.png' }
      }
    };
  } else if (page.isBlogIndex) {
    primary = {
      '@type': 'CollectionPage',
      name: page.title,
      description: page.description,
      url: canonical,
      inLanguage: 'en',
      hasPart: art.map(item => ({
        '@type': 'BlogPosting',
        headline: item.t,
        url: ORIGIN + '/blog/' + item.s + '/'
      }))
    };
  } else {
    primary = {
      '@type': 'WebPage',
      name: page.title,
      description: page.description,
      url: canonical,
      inLanguage: 'en',
      isPartOf: { '@type': 'WebSite', name: 'IGI2.online', url: ORIGIN + '/' }
    };
  }
  const breadcrumbItems = [{ '@type': 'ListItem', position: 1, name: 'Home', item: ORIGIN + '/' }];
  if (page.isArticle || page.isBlogIndex) {
    breadcrumbItems.push({ '@type': 'ListItem', position: 2, name: 'Blog', item: ORIGIN + '/blog/' });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: page.name,
    item: canonical
  });
  return {
    '@context': 'https://schema.org',
    '@graph': [
      primary,
      { '@type': 'BreadcrumbList', itemListElement: breadcrumbItems }
    ]
  };
}

const styleMarkup = styles.map(style => '<style>\n' + style + '\n</style>').join('\n');
const sharedHead = [
  '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
  '<base href="/">',
  '<meta name="robots" content="index,follow,max-image-preview:large">',
  '<meta name="theme-color" content="#050d15">',
  '<meta name="disfora-site-verification" content="94ece6005917a445d785423cf907cf11">',
  '<link rel="icon" type="image/png" sizes="64x64" href="/assets/favicon.png">',
  '<link rel="apple-touch-icon" href="/assets/favicon.png">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap" rel="stylesheet">'
].join('\n');

for (const page of pages) {
  const canonical = pageUrl(page);
  const isArticle = page.isArticle;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const ogAlt = 'IGI 2: Covert Strike classic tactical shooter menu and IGI2.online browser gaming';
  const crumb = '<p class="crumb"><a href="/">Home</a> › ' +
    (isArticle ? '<a href="/blog/">Blog</a> › ' : '') +
    escapeHtml(page.name) + '</p>';
  const content = rewriteInternalLinks(page.content);
  const schema = safeJson(structuredData(page, canonical));
  const html = '<!doctype html>\n<html lang="en">\n<head>\n' +
    sharedHead + '\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + description + '">\n' +
    '<link rel="canonical" href="' + canonical + '">\n' +
    '<meta property="og:type" content="' + (isArticle ? 'article' : 'website') + '">\n' +
    '<meta property="og:site_name" content="IGI2.online">\n' +
    '<meta property="og:locale" content="en_US">\n' +
    '<meta property="og:title" content="' + title + '">\n' +
    '<meta property="og:description" content="' + description + '">\n' +
    '<meta property="og:url" content="' + canonical + '">\n' +
    '<meta property="og:image" content="' + ORIGIN + '/assets/og-image.svg">\n' +
    '<meta property="og:image:width" content="1200">\n' +
    '<meta property="og:image:height" content="630">\n' +
    '<meta property="og:image:alt" content="' + escapeHtml(ogAlt) + '">\n' +
    '<meta property="og:image:type" content="image/svg+xml">\n' +
    '<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="twitter:title" content="' + title + '">\n' +
    '<meta name="twitter:description" content="' + description + '">\n' +
    '<meta name="twitter:image" content="' + ORIGIN + '/assets/og-image.svg">\n' +
    '<meta name="twitter:image:alt" content="' + escapeHtml(ogAlt) + '">\n' +
    styleMarkup + '\n' +
    '<script type="application/ld+json">' + schema + '</script>\n' +
    '</head>\n<body>\n' +
    '<main class="site"><div class="pn pg">' +
    crumb +
    '<h1 class="pt">' + escapeHtml(page.heading) + '</h1>' +
    '<div class="sub">' + escapeHtml(page.subtitle) + '</div>' +
    content +
    '</div></main>\n' +
    rewriteInternalLinks(footer) + '\n' +
    '</body>\n</html>\n';

  if (/\b(?:fan|unofficial)\b|fan-made/i.test(page.heading + ' ' + page.subtitle + ' ' + page.content + ' ' + footer)) {
    throw new Error('SEO prerender: unwanted affiliation wording remains on ' + page.slug);
  }
  const relative = page.slug.split('/').join('/');
  const output = resolve(publishDir, relative, 'index.html');
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, html, 'utf8');
}
if (pages.length !== 20) throw new Error('SEO prerender: expected 20 pages, generated ' + pages.length);
console.log('Generated ' + pages.length + ' static, crawlable SEO pages (7 information pages, blog index and 12 articles).');
