import express from 'express'
import type { Request } from 'express';
import path from 'path';
import fs from 'fs';
import {env} from './env'
import {
    absoluteUrl,
    buildSoftwareApplicationJsonLd,
    getSeoMeta,
    getSitemapRoutes,
} from './lib/seo.js';

const fallbackRouter = express.Router();
// fallbackRouter.all("*", (req, res) => {
//     res.status(404).send();
// })


export const SpaExpressRouter = (distPath: string) => {
    if (!fs.existsSync(distPath)) {
        console.error("SPA dist path does not exists: " + distPath)
        return fallbackRouter;
    }
    const app = express.Router();

    const indexPath = path.join(path.join(distPath, 'index.html'));
    if (!fs.existsSync(indexPath)) {
        console.error("SPA index.html file does not exists!");
        return fallbackRouter;
    }

    const indexFileContent = fs.readFileSync(indexPath, "utf-8");

    app.get('/robots.txt', (req, res) => {
        const baseUrl = getBaseUrl(req);
        res.type('text/plain').send([
            'User-agent: *',
            'Allow: /',
            'Disallow: /api/',
            'Disallow: /reader/',
            'Disallow: /status',
            `Sitemap: ${absoluteUrl(baseUrl, '/sitemap.xml')}`,
            '',
        ].join('\n'));
    });

    app.get('/sitemap.xml', (req, res) => {
        const baseUrl = getBaseUrl(req);
        const today = new Date().toISOString().slice(0, 10);
        const urls = getSitemapRoutes()
            .map((route) => [
                '  <url>',
                `    <loc>${escapeXml(absoluteUrl(baseUrl, route.canonicalPath))}</loc>`,
                `    <lastmod>${today}</lastmod>`,
                '    <changefreq>weekly</changefreq>',
                route.path === '/' ? '    <priority>1.0</priority>' : '    <priority>0.7</priority>',
                '  </url>',
            ].join('\n'))
            .join('\n');

        res.type('application/xml').send([
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
            urls,
            '</urlset>',
            '',
        ].join('\n'));
    });

    // serve files
    app.use(express.static(distPath, { index: false }));

    // serve index.html
    app.get('*', (req, res) => {
        res.send(renderIndex(indexFileContent, req));
    })

    return app;
}

function renderIndex(html: string, req: Request): string {
    const baseUrl = getBaseUrl(req);
    const meta = getSeoMeta(req.path, env.VITE_APP_TITLE, env.VITE_APP_DESCRIPTION);
    const canonicalUrl = absoluteUrl(baseUrl, meta.canonicalPath);
    const jsonLd = buildSoftwareApplicationJsonLd(env.VITE_APP_TITLE, env.VITE_APP_DESCRIPTION, absoluteUrl(baseUrl, '/'));
    let nextHtml = setTitle(html, meta.title);

    nextHtml = setMetaName(nextHtml, 'description', meta.description);
    nextHtml = setMetaName(nextHtml, 'application-name', env.VITE_APP_TITLE);
    nextHtml = setMetaName(nextHtml, 'robots', meta.robots);
    nextHtml = setMetaName(nextHtml, 'twitter:card', 'summary');
    nextHtml = setMetaName(nextHtml, 'twitter:title', meta.title);
    nextHtml = setMetaName(nextHtml, 'twitter:description', meta.description);
    nextHtml = setMetaProperty(nextHtml, 'og:site_name', env.VITE_APP_TITLE);
    nextHtml = setMetaProperty(nextHtml, 'og:type', meta.type);
    nextHtml = setMetaProperty(nextHtml, 'og:title', meta.title);
    nextHtml = setMetaProperty(nextHtml, 'og:description', meta.description);
    nextHtml = setMetaProperty(nextHtml, 'og:url', canonicalUrl);
    nextHtml = setCanonical(nextHtml, canonicalUrl);

    return setJsonLd(nextHtml, jsonLd);
}

function getBaseUrl(req: Request): string {
    if (env.VITE_APP_URL) {
        return env.VITE_APP_URL;
    }

    const proto = String(req.headers['x-forwarded-proto'] ?? req.protocol ?? 'http').split(',')[0].trim();
    const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? `localhost:${env.PORT}`).split(',')[0].trim();
    return `${proto}://${host}`;
}

function setTitle(html: string, title: string): string {
    return html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function setMetaName(html: string, name: string, content: string): string {
    const tag = `<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}" />`;
    const pattern = new RegExp(`<meta\\s+name=["']${escapeRegExp(name)}["'][^>]*>`, 'i');
    return pattern.test(html) ? html.replace(pattern, tag) : insertIntoHead(html, tag);
}

function setMetaProperty(html: string, property: string, content: string): string {
    const tag = `<meta property="${escapeHtml(property)}" content="${escapeHtml(content)}" />`;
    const pattern = new RegExp(`<meta\\s+property=["']${escapeRegExp(property)}["'][^>]*>`, 'i');
    return pattern.test(html) ? html.replace(pattern, tag) : insertIntoHead(html, tag);
}

function setCanonical(html: string, href: string): string {
    const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`;
    const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;
    return pattern.test(html) ? html.replace(pattern, tag) : insertIntoHead(html, tag);
}

function setJsonLd(html: string, data: Record<string, unknown>): string {
    const json = JSON.stringify(data).replace(/</g, '\\u003c');
    const tag = `<script type="application/ld+json" id="structured-data">${json}</script>`;
    const pattern = /<script\s+type=["']application\/ld\+json["']\s+id=["']structured-data["'][\s\S]*?<\/script>/i;
    return pattern.test(html) ? html.replace(pattern, tag) : insertIntoHead(html, tag);
}

function insertIntoHead(html: string, tag: string): string {
    return html.replace('</head>', `    ${tag}\n  </head>`);
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function escapeXml(value: string): string {
    return escapeHtml(value).replace(/'/g, '&apos;');
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
