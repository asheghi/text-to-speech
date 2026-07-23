export const DEFAULT_APP_NAME = 'Tala Text To Speech';

export const DEFAULT_APP_DESCRIPTION =
    'Self-hosted neural text-to-speech with Supertonic 3, Piper, VITS, Kitten, a browser studio, sentence reader, and WAV API.';

export type SeoMeta = {
    title: string;
    description: string;
    canonicalPath: string;
    robots: string;
    type: 'website' | 'article';
};

type RouteSeoDefinition = {
    path: string;
    title: (appName: string) => string;
    description: string;
    canonicalPath: string;
    robots?: string;
    type?: SeoMeta['type'];
    sitemap?: boolean;
};

export const SEO_ROUTES: RouteSeoDefinition[] = [
    {
        path: '/',
        title: (appName) => `${appName} | Self-hosted neural text-to-speech`,
        description: DEFAULT_APP_DESCRIPTION,
        canonicalPath: '/',
        sitemap: true,
    },
    {
        path: '/studio',
        title: (appName) => `Text-to-speech studio | ${appName}`,
        description:
            'Generate natural-sounding WAV speech in the browser with multilingual neural TTS models and adjustable voice settings.',
        canonicalPath: '/studio',
        sitemap: true,
    },
    {
        path: '/docs',
        title: (appName) => `API documentation | ${appName}`,
        description:
            'HTTP and tRPC API documentation for generating text-to-speech WAV audio, listing voices, checking storage, and sharing reader sessions.',
        canonicalPath: '/docs',
        sitemap: true,
    },
    {
        path: '/reader',
        title: (appName) => `Sentence reader | ${appName}`,
        description:
            'Listen to longer text sentence by sentence with playback controls, voice selection, preloading, and sharing.',
        canonicalPath: '/reader',
        robots: 'noindex,follow',
    },
    {
        path: '/status',
        title: (appName) => `Storage status | ${appName}`,
        description: 'Storage status for downloaded TTS models and cached generated audio.',
        canonicalPath: '/status',
        robots: 'noindex,follow',
    },
];

export function getSeoMeta(pathname: string, appName = DEFAULT_APP_NAME, fallbackDescription = DEFAULT_APP_DESCRIPTION): SeoMeta {
    const normalizedPath = normalizePath(pathname);
    const exactRoute = SEO_ROUTES.find((route) => route.path === normalizedPath);

    if (exactRoute) {
        return buildSeoMeta(exactRoute, appName);
    }

    if (normalizedPath.startsWith('/reader/')) {
        return {
            title: `Shared reader | ${appName}`,
            description: 'A shared sentence-by-sentence text-to-speech reader session.',
            canonicalPath: '/reader',
            robots: 'noindex,follow',
            type: 'website',
        };
    }

    return {
        title: `Page not found | ${appName}`,
        description: fallbackDescription,
        canonicalPath: normalizedPath,
        robots: 'noindex,follow',
        type: 'website',
    };
}

export function getSitemapRoutes(): RouteSeoDefinition[] {
    return SEO_ROUTES.filter((route) => route.sitemap);
}

export function normalizePath(pathname: string): string {
    if (!pathname) return '/';
    const pathOnly = pathname.split('?')[0].split('#')[0] || '/';
    if (pathOnly === '/') return '/';
    return pathOnly.replace(/\/+$/, '');
}

export function absoluteUrl(baseUrl: string, path: string): string {
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
}

export function buildSoftwareApplicationJsonLd(appName: string, description: string, url: string): Record<string, unknown> {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: appName,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, Linux, Docker',
        description,
        url,
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        featureList: [
            'Neural text-to-speech synthesis',
            'Sentence-by-sentence reader',
            'Supertonic 3 voice styles',
            'Piper, VITS, and Kitten model support',
            'HTTP WAV API',
            'Self-hosted Docker deployment',
        ],
    };
}

function buildSeoMeta(route: RouteSeoDefinition, appName: string): SeoMeta {
    return {
        title: route.title(appName),
        description: route.description,
        canonicalPath: route.canonicalPath,
        robots: route.robots ?? 'index,follow',
        type: route.type ?? 'website',
    };
}
