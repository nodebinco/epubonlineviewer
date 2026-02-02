import { locales, baseLocale } from '$lib/paraglide/runtime';

/** Strip locale prefix from pathname so SvelteKit routes match (e.g. /es/foo → /foo). */
export const reroute = ({ url }: { url: URL }) => {
	const segments = url.pathname.split('/').filter(Boolean);
	if (segments.length > 0 && segments[0] !== baseLocale && locales.includes(segments[0] as (typeof locales)[number])) {
		return '/' + segments.slice(1).join('/');
	}
	return url.pathname;
};
