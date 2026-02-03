<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import { locales, localizeHref, type Locale } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { initTheme, themeStore, setTheme } from '$lib/theme-store';
	import favicon from '$lib/assets/favicon.svg';
	import logo from '$lib/assets/logo.svg';
	import './layout.css';

	let { children } = $props();
	let navOpen = $state(false);
	let moreOpen = $state(false);

	// Use the locale from the server-injected <html lang="..."> so SSR and first client paint match (avoids hydration_mismatch).
	const displayLocale = $derived(
		browser && typeof document !== 'undefined'
			? ((document.documentElement.getAttribute('lang') as Locale) ?? 'en')
			: undefined
	);

	onMount(() => {
		initTheme();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
						<li><a href="/">{m.nav_home({ locale: displayLocale })}</a></li>
						<li><a href="/getting-started">{m.nav_getting_started({ locale: displayLocale })}</a></li>
						<li><a href="/what-is-epub">{m.nav_what_is_epub({ locale: displayLocale })}</a></li>
						<li><a href="/supported-formats">{m.nav_supported_formats({ locale: displayLocale })}</a></li>
						<li><a href="/keyboard-shortcuts">{m.nav_keyboard_shortcuts({ locale: displayLocale })}</a></li>
						<li><a href="/faq">{m.nav_faq({ locale: displayLocale })}</a></li>
						<li><a href="/about-us">{m.nav_about({ locale: displayLocale })}</a></li>
						<li><a href="/contact-us">{m.nav_contact({ locale: displayLocale })}</a></li>
						<li><a href="/privacy-policy">{m.nav_privacy({ locale: displayLocale })}</a></li>
						<li><a href="/terms-of-use">{m.nav_terms({ locale: displayLocale })}</a></li>
					</ul>
				</details>
				<a href="/" class="flex items-center gap-2 px-2 hover:opacity-90">
					<img src={logo} alt="" class="h-8 w-8" width="32" height="32" />
					<span class="font-bold text-lg hidden sm:inline">EPUB Online Viewer</span>
				</a>
			</div>
			<div class="navbar-center hidden lg:flex">
				<ul class="menu menu-horizontal gap-1 px-1">
					<li><a href="/" class:active={page.url.pathname === '/'}>{m.nav_home({ locale: displayLocale })}</a></li>
					<li><a href="/getting-started">{m.nav_getting_started({ locale: displayLocale })}</a></li>
					<li><a href="/what-is-epub">{m.nav_what_is_epub({ locale: displayLocale })}</a></li>
					<li><a href="/supported-formats">{m.nav_supported_formats({ locale: displayLocale })}</a></li>
					<li><a href="/keyboard-shortcuts">{m.nav_keyboard_shortcuts({ locale: displayLocale })}</a></li>
					<li><a href="/faq">{m.nav_faq({ locale: displayLocale })}</a></li>
					<li>
						<details class="dropdown" bind:open={moreOpen}>
							<summary class="cursor-pointer">{m.nav_more({ locale: displayLocale })}</summary>
							<ul class="menu dropdown-content bg-base-100 rounded-box z-50 mt-1 w-48 p-2 shadow">
								<li><a href="/about-us">{m.nav_about({ locale: displayLocale })}</a></li>
								<li><a href="/contact-us">{m.nav_contact({ locale: displayLocale })}</a></li>
								<li><a href="/privacy-policy">{m.nav_privacy({ locale: displayLocale })}</a></li>
								<li><a href="/terms-of-use">{m.nav_terms({ locale: displayLocale })}</a></li>
							</ul>
						</details>
					</li>
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
					<label tabindex="0" class="btn btn-ghost btn-sm btn-square" title="Language">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
						</svg>
					</label>
					<ul tabindex="0" class="menu dropdown-content bg-base-100 rounded-box z-50 mt-2 w-32 p-2 shadow">
						{#each locales as locale}
							<li>
								<a href={localizeHref(page.url.pathname, { locale })}>{locale}</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>
			</div>
		</header>
		<!-- Main: same max-w + padding as reader; no aside bar on the right -->
		<div class="flex-1 flex min-h-0 w-full max-w-[1920px] mx-auto px-2 md:px-3 overflow-hidden">
			<main class="flex-1 min-w-0 min-h-0 flex flex-col pt-14 md:pt-16">
				{@render children()}
			</main>
		</div>
	{:else}
		<!-- Reader: exactly viewport height, no page scroll; TOC and content scroll independently inside -->
		<div class="h-screen max-h-dvh w-full max-w-[1920px] mx-auto flex flex-col overflow-hidden">
			<main class="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
				{@render children()}
			</main>
		</div>
	{/if}
</div>
