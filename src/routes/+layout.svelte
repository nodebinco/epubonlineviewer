<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { afterNavigate, goto } from '$app/navigation';
	import {
		locales,
		localizeHref,
		type Locale,
		overwriteGetLocale,
		extractLocaleFromUrl,
		extractLocaleFromCookie,
		baseLocale,
		setLocale,
	} from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { localeDisplayName } from '$lib/locale-display-names';
	import { initTheme, themeStore, setTheme } from '$lib/theme-store';
	import logo from '$lib/assets/logo.svg';
	import './layout.css';

	// PWA: manifest link and service worker registration (virtual modules from @vite-pwa/sveltekit)
	import { pwaInfo } from 'virtual:pwa-info';
	const webManifestLink = $derived(pwaInfo?.webManifest?.linkTag ?? '');

	// Make getLocale() read from URL first so m.*() shows the correct language when path is /es, etc.
	if (browser && typeof window !== 'undefined') {
		overwriteGetLocale((): Locale => {
			const fromUrl = extractLocaleFromUrl(window.location.href);
			if (fromUrl) return fromUrl as Locale;
			const fromCookie = extractLocaleFromCookie();
			if (fromCookie) return fromCookie as Locale;
			return baseLocale as Locale;
		});
	}

	let { children } = $props();
	let navOpen = $state(false);

	// Use actual browser pathname so locale updates when language switcher navigates (page.url can lag after reroute).
	let pathnameForLocale = $state(browser ? window.location.pathname : page.url.pathname);
	if (browser) {
		afterNavigate(() => {
			pathnameForLocale = window.location.pathname;
		});
	}

	// Derive locale from pathname: /es/foo → es; /foo → from <html lang> or baseLocale.
	const displayLocale = $derived(
		browser && typeof document !== 'undefined'
			? (() => {
					const pathname = pathnameForLocale;
					const segments = pathname.split('/').filter(Boolean);
					if (segments.length > 0 && locales.includes(segments[0] as (typeof locales)[number])) {
						return segments[0] as Locale;
					}
					return (document.documentElement.getAttribute('lang') as Locale) ?? baseLocale;
				})()
			: (undefined as Locale | undefined)
	);

	onMount(() => {
		initTheme();
		if (browser) pathnameForLocale = window.location.pathname;
		// Register PWA service worker (enables Add to Home Screen / install prompt)
		if (browser && pwaInfo) {
			import('virtual:pwa-register').then(({ registerSW }) => {
				registerSW({ immediate: true });
			});
		}
	});

	// Sync Paraglide locale and <html lang> when URL pathname changes (e.g. user clicked language switcher).
	$effect(() => {
		const locale = displayLocale;
		if (browser && typeof document !== 'undefined' && locale) {
			setLocale(locale, { reload: false });
			const current = document.documentElement.getAttribute('lang');
			if (current !== locale) {
				document.documentElement.setAttribute('lang', locale);
			}
		}
	});

	// Force children to re-render when locale changes so m.*() messages update.
	const localeKey = $derived(displayLocale ?? page.url.pathname);
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
	{#if webManifestLink}
		{@html webManifestLink}
	{/if}
</svelte:head>

<!-- Same max-w and padding as reader; theme colors follow reader (light/dark). -->
<div class="min-h-screen flex flex-col bg-base-100">
	{#if !page.url.pathname.startsWith('/reader')}
		<!-- Navbar: same max-w + margin as reader toolbar, same colors (bg-base-200, border) -->
		<header class="navbar bg-base-200 border-b border-base-300 sticky top-0 z-50 shrink-0">
			<div class="w-full max-w-[1920px] mx-auto px-2 md:px-3 flex items-center justify-between gap-2">
			<div class="navbar-start gap-2 min-w-0">
				<details class="dropdown lg:hidden" bind:open={navOpen}>
					<summary class="btn btn-ghost btn-square">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</summary>
					<ul class="menu dropdown-content bg-base-100 rounded-box z-50 mt-2 w-56 p-2 shadow">
						<li><a href={localizeHref('/getting-started', { locale: displayLocale ?? baseLocale })}>{m.nav_getting_started({ locale: displayLocale })}</a></li>
						<li><a href={localizeHref('/what-is-epub', { locale: displayLocale ?? baseLocale })}>{m.nav_what_is_epub({ locale: displayLocale })}</a></li>
						<li><a href={localizeHref('/tools', { locale: displayLocale ?? baseLocale })}>{m.nav_tools({ locale: displayLocale })}</a></li>
						<li><a href={localizeHref('/', { locale: displayLocale ?? baseLocale })}>{m.nav_open_epub_reader({ locale: displayLocale })}</a></li>
					</ul>
				</details>
				<a href={localizeHref('/', { locale: displayLocale ?? baseLocale })} class="brand-link flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-base-300/50 transition-colors">
					<img src={logo} alt="" class="h-8 w-8 shrink-0" width="32" height="32" />
					<span class="brand-text hidden sm:inline">
						<span class="brand-name">EPUB</span>
						<span class="brand-tagline">Online Viewer</span>
					</span>
				</a>
			</div>
			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal gap-1 px-1">
					<li><a href={localizeHref('/getting-started', { locale: displayLocale ?? baseLocale })}>{m.nav_getting_started({ locale: displayLocale })}</a></li>
					<li><a href={localizeHref('/what-is-epub', { locale: displayLocale ?? baseLocale })}>{m.nav_what_is_epub({ locale: displayLocale })}</a></li>
					<li><a href={localizeHref('/tools', { locale: displayLocale ?? baseLocale })}>{m.nav_tools({ locale: displayLocale })}</a></li>
				</ul>
			</div>
			<div class="navbar-end gap-1">
				<button
					type="button"
					class="btn btn-ghost btn-sm btn-square"
					title={$themeStore === 'dark' ? 'Light' : 'Dark'}
					aria-label={$themeStore === 'dark' ? 'Light' : 'Dark'}
					onclick={() => setTheme($themeStore === 'dark' ? 'light' : 'dark')}
				>
					{#if $themeStore === 'dark'}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
					{/if}
				</button>
				<div class="dropdown dropdown-end">
					<button type="button" tabindex="0" class="btn btn-ghost btn-sm btn-square" title="Language" aria-label="Language" aria-haspopup="true">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
						</svg>
					</button>
					<div tabindex="0" role="menu" class="dropdown-content bg-base-100 rounded-box z-50 mt-2 p-2 shadow w-auto min-w-[280px] max-h-[70vh] overflow-y-auto">
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-1">
							{#each locales as locale}
								<a
									href={localizeHref(pathnameForLocale, { locale })}
									role="menuitem"
									class="rounded-lg px-3 py-2 text-sm hover:bg-base-200 focus:bg-base-200 focus:outline-none {locale === displayLocale ? 'bg-primary/10 text-primary font-medium' : 'text-base-content'}"
									onclick={(e) => {
										if (locale === displayLocale) return;
										e.preventDefault();
										const targetHref = localizeHref(pathnameForLocale, { locale });
										setLocale(locale, { reload: false });
										if (locale === baseLocale) {
											window.location.href = targetHref;
										} else {
											goto(targetHref, { replaceState: false });
										}
									}}
								>{localeDisplayName[locale] ?? locale}</a>
							{/each}
						</div>
					</div>
				</div>
				<a href={localizeHref('/', { locale: displayLocale ?? baseLocale })} class="btn btn-primary btn-sm md:btn-md">{m.nav_open_epub_reader({ locale: displayLocale })}</a>
			</div>
			</div>
		</header>
		<!-- Main: same max-w + padding as reader; no aside bar on the right -->
		<div class="flex-1 flex min-h-0 w-full max-w-[1920px] mx-auto px-2 md:px-3 overflow-hidden flex-col">
			<main class="flex-1 min-w-0 min-h-0 flex flex-col pt-14 md:pt-16 overflow-auto">
				{#key localeKey}
					{@render children()}
				{/key}
			</main>
		</div>
		<footer class="footer footer-center bg-base-200 border-t border-base-300 p-6 text-base-content/80 text-sm">
			<div class="flex flex-wrap justify-center gap-4 md:gap-6">
				<a href={localizeHref('/tools', { locale: displayLocale ?? baseLocale })} class="link link-hover">{m.nav_tools({ locale: displayLocale })}</a>
				<a href={localizeHref('/about-us', { locale: displayLocale ?? baseLocale })} class="link link-hover">{m.footer_about({ locale: displayLocale })}</a>
				<a href={localizeHref('/privacy-policy', { locale: displayLocale ?? baseLocale })} class="link link-hover">{m.footer_privacy({ locale: displayLocale })}</a>
				<a href={localizeHref('/terms-of-use', { locale: displayLocale ?? baseLocale })} class="link link-hover">{m.footer_terms({ locale: displayLocale })}</a>
				<a href={localizeHref('/contact-us', { locale: displayLocale ?? baseLocale })} class="link link-hover">{m.footer_contact({ locale: displayLocale })}</a>
			</div>
		</footer>
	{:else}
		<!-- Reader: exactly viewport height, no page scroll; TOC and content scroll independently inside -->
		<div class="h-screen max-h-dvh w-full max-w-[1920px] mx-auto flex flex-col overflow-hidden">
			<main class="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
				{#key localeKey}
					{@render children()}
				{/key}
			</main>
		</div>
	{/if}
</div>
