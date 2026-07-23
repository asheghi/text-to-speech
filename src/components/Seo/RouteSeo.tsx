import { PropsWithChildren, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
    absoluteUrl,
    buildSoftwareApplicationJsonLd,
    DEFAULT_APP_DESCRIPTION,
    getSeoMeta,
} from "#/lib/seo";
import { APP_NAME } from "../Brand/Brand";

const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || DEFAULT_APP_DESCRIPTION;
const APP_URL = import.meta.env.VITE_APP_URL;

export const RouteSeo = ({ children }: PropsWithChildren): JSX.Element => {
    const location = useLocation();

    useEffect(() => {
        const baseUrl = APP_URL || window.location.origin;
        const meta = getSeoMeta(location.pathname, APP_NAME, APP_DESCRIPTION);
        const canonicalUrl = absoluteUrl(baseUrl, meta.canonicalPath);

        document.title = meta.title;

        setMetaName("description", meta.description);
        setMetaName("application-name", APP_NAME);
        setMetaName("robots", meta.robots);
        setMetaName("twitter:card", "summary");
        setMetaName("twitter:title", meta.title);
        setMetaName("twitter:description", meta.description);
        setMetaProperty("og:site_name", APP_NAME);
        setMetaProperty("og:type", meta.type);
        setMetaProperty("og:title", meta.title);
        setMetaProperty("og:description", meta.description);
        setMetaProperty("og:url", canonicalUrl);
        setCanonical(canonicalUrl);
        setJsonLd(buildSoftwareApplicationJsonLd(APP_NAME, APP_DESCRIPTION, absoluteUrl(baseUrl, "/")));
    }, [location.pathname]);

    return <>{children}</>;
};

function setMetaName(name: string, content: string): void {
    const element = getOrCreateMeta(`meta[name="${cssEscape(name)}"]`, "meta");
    element.setAttribute("name", name);
    element.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string): void {
    const element = getOrCreateMeta(`meta[property="${cssEscape(property)}"]`, "meta");
    element.setAttribute("property", property);
    element.setAttribute("content", content);
}

function setCanonical(href: string): void {
    const element = getOrCreateMeta('link[rel="canonical"]', "link");
    element.setAttribute("rel", "canonical");
    element.setAttribute("href", href);
}

function setJsonLd(data: Record<string, unknown>): void {
    let element = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]#structured-data');

    if (!element) {
        element = document.createElement("script");
        element.type = "application/ld+json";
        element.id = "structured-data";
        document.head.appendChild(element);
    }

    element.textContent = JSON.stringify(data);
}

function getOrCreateMeta<T extends keyof HTMLElementTagNameMap>(selector: string, tagName: T): HTMLElementTagNameMap[T] {
    let element = document.querySelector<HTMLElementTagNameMap[T]>(selector);

    if (!element) {
        element = document.createElement(tagName);
        document.head.appendChild(element);
    }

    return element;
}

function cssEscape(value: string): string {
    return value.replace(/"/g, '\\"');
}
