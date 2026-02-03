<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getBookArrayBuffer, updateBookMetadata } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import { localizeHref, locales, baseLocale } from '$lib/paraglide/runtime';
	import { themeStore, setTheme } from '$lib/theme-store';
	import ePub from 'epubjs';
	import '../../../app.css';

	interface TocItem {
		id?: string;
		href: string;
		label: string;
		subitems?: TocItem[];
	}

	const FONT_SIZES = [90, 100, 110, 120, 130, 140, 150] as const;
	const FONT_FAMILIES: { value: string; label: () => string }[] = [
		{ value: 'serif', label: () => m.reader_font_serif() },
		{ value: 'sans-serif', label: () => m.reader_font_sans() },
		{ value: 'monospace', label: () => m.reader_font_mono() },
	];
	const THEME_STYLES: Record<'light' | 'dark', { body: { background: string; color: string } }> = {
		light: { body: { background: '#faf8f5', color: '#1a1a1a' } },
		dark: { body: { background: '#1a1a1a', color: '#e6edf3' } },
	};
	type ContentWithDoc = { addStylesheetCss?: (css: string, key: string) => boolean };

	let loading = $state(true);
	let error = $state<string | null>(null);
	let bookData = $state<ArrayBuffer | null>(null);
	/** Metadata from last load (for lastPosition/lastCfi/lastHref restore). */
	let loadedMetadata = $state<{ lastPosition?: number; lastCfi?: string; lastHref?: string } | null>(null);
	let book = $state<ReturnType<typeof ePub> | null>(null);
	let rendition = $state<ReturnType<ReturnType<typeof ePub>['renderTo']> | null>(null);
	let viewerEl = $state<HTMLDivElement | null>(null);
	let tocOpen = $state(true);
	let toc = $state<TocItem[]>([]);
	let title = $state('');
	let atStart = $state(true);
	let atEnd = $state(false);
	let currentHref = $state<string | null>(null);
	let currentPage = $state(1);
	let totalPages = $state(0);
	/** Spine hrefs in order (for chapter number: Ch. N) */
	let spineHrefs = $state<string[]>([]);
	/** Last known position (0–1) for saving when leaving the page */
	let lastKnownPosition = $state<number | null>(null);
	/** True while generating locations and restoring saved position (show loading overlay) */
	let restoringPosition = $state(false);
	let readerFontSize = $state(100);
	let readerFontFamily = $state('serif');
	let spreadMode = $state<'single' | 'double'>('double');

	const readerTheme = $derived($themeStore);
	let fullScreen = $state(false);
	let readerContainer = $state<HTMLDivElement | null>(null);
	let tocListEl = $state<HTMLUListElement | null>(null);

	const bookId = $derived(page.params.id);

	// Current locale from URL (e.g. /es/reader/xxx → es) for localized "back to library" link
	const displayLocale = $derived.by(() => {
		const pathname = page.url.pathname;
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length > 0 && locales.includes(segments[0] as (typeof locales)[number])) return segments[0];
		return baseLocale;
	});
	const homeHref = $derived(localizeHref('/', { locale: displayLocale }));

	// 1) Load book data when route id changes; use cancelled flag so we don't apply stale results
	$effect(() => {
		const id = bookId;
		if (!id) return;
		let cancelled = false;
		loading = true;
		error = null;
		bookData = null;
		loadedMetadata = null;
		viewerEl = null;
		toc = [];
		title = '';
		atStart = true;
		atEnd = false;
		currentHref = null;
		currentPage = 1;
		totalPages = 0;
		spineHrefs = [];
		lastKnownPosition = null;
		restoringPosition = false;
		readerFontSize = 100;
		readerFontFamily = 'serif';
		spreadMode = 'double';
		async function loadBook() {
			let data = await getBookArrayBuffer(id);
			if (cancelled) return;
			if (!data) {
				// Retry once after a short delay (IndexedDB may not be flushed yet after upload)
				await new Promise((r) => setTimeout(r, 350));
				if (cancelled) return;
				data = await getBookArrayBuffer(id);
			}
			if (cancelled) return;
			if (!data) {
				error = m.reader_error_not_found();
				return;
			}
			bookData = data.arrayBuffer;
			loadedMetadata = data.metadata
				? { lastPosition: data.metadata.lastPosition, lastCfi: data.metadata.lastCfi, lastHref: data.metadata.lastHref }
				: null;
			if (data.metadata) {
				if (typeof data.metadata.fontSize === 'number' && data.metadata.fontSize >= 90 && data.metadata.fontSize <= 150) {
					readerFontSize = data.metadata.fontSize;
				}
				if (typeof data.metadata.fontFamily === 'string' && data.metadata.fontFamily.length > 0) {
					readerFontFamily = data.metadata.fontFamily;
				}
				if (data.metadata.spreadMode === 'single' || data.metadata.spreadMode === 'double') {
					spreadMode = data.metadata.spreadMode;
				}
			}
			await updateBookMetadata(id, { lastOpened: Date.now() });
		}
		loadBook()
			.catch((e) => {
				if (cancelled) return;
				const msg = e instanceof Error ? e.message : String(e);
				error =
					msg.toLowerCase().includes('quota') ||
					msg.toLowerCase().includes('no_space') ||
					msg.toLowerCase().includes('connection is closing')
						? m.reader_error_storage()
						: msg || m.reader_error_not_found();
			})
			.finally(() => {
				if (!cancelled) loading = false;
			});
		return () => {
			cancelled = true;
			// Destroy book/rendition when id changes so second effect cleanup can run with bookData=null
			if (rendition) {
				rendition.destroy();
				rendition = null;
			}
			if (book) {
				book.destroy();
				book = null;
			}
		};
	});

	// 2) When bookData and viewerEl are both set and loading is done, create epub.js and render (so loadedMetadata is ready for restore)
	let initRafId = 0;
	$effect(() => {
		const buf = bookData;
		const el = viewerEl;
		const meta = loadedMetadata;
		const doneLoading = !loading;
		if (!buf || !el || rendition) return;
		if (!doneLoading) return;
		if (!document.contains(el)) return;
		// Defer one frame so the container is laid out
		initRafId = requestAnimationFrame(() => {
			const el2 = viewerEl;
			if (!el2 || !bookData || rendition || !document.contains(el2)) return;
			const arrayBuffer = bookData;
			const requestMethod = (_url: string, type: string) =>
				type === 'binary' ? Promise.resolve(arrayBuffer) : Promise.reject(new Error('Unexpected request'));
			const bk = ePub('epub://local/', { requestMethod, openAs: 'epub' });
			book = bk;
			const opts = {
				width: '100%',
				height: '100%',
				flow: 'paginated' as const,
				spread: (spreadMode === 'double' ? 'always' : 'none') as 'always' | 'none',
				minSpreadWidth: 800,
				allowScriptedContent: true,
			};
			const rend = bk.renderTo(el, opts);
			rendition = rend;
			bk.loaded.navigation.then((nav: { toc?: TocItem[] } | TocItem[]) => {
				toc = Array.isArray(nav) ? nav : (nav?.toc ?? []);
			});
			bk.loaded.metadata.then((meta: { title?: string }) => {
				title = meta?.title ?? '';
			});
			bk.loaded.spine.then(() => {
				const arr: string[] = [];
				bk.spine.each((s: { href: string }) => arr.push(s.href));
				spineHrefs = arr;
			});
			let savePositionTimer: ReturnType<typeof setTimeout> | null = null;
			const SAVE_POSITION_MS = 1500;
			rend.on('relocated', (loc: { atStart: boolean; atEnd: boolean; start?: { href?: string; percentage?: number; cfi?: string; displayed?: { page?: number; total?: number } } }) => {
				atStart = loc.atStart;
				atEnd = loc.atEnd;
				currentHref = loc.start?.href ?? null;
				const dp = loc.start?.displayed;
				if (dp && typeof dp.page === 'number' && dp.page >= 1 && typeof dp.total === 'number' && dp.total >= 1) {
					currentPage = dp.page;
					totalPages = dp.total;
				}
				const pct = loc.start?.percentage;
				const rawCfi = loc.start?.cfi;
				const href = loc.start?.href ?? null;
				const cfiStr = rawCfi != null ? (typeof rawCfi === 'string' ? rawCfi : (rawCfi as { toString?: () => string }).toString?.() ?? '') : undefined;
				const cfiToSave = cfiStr && cfiStr.length > 10 ? cfiStr : undefined;
				if (typeof pct === 'number' && pct >= 0 && pct <= 1) {
					lastKnownPosition = pct;
					if (bookId) {
						if (savePositionTimer) clearTimeout(savePositionTimer);
						savePositionTimer = setTimeout(() => {
							savePositionTimer = null;
							updateBookMetadata(bookId, { lastOpened: Date.now(), lastPosition: pct, lastCfi: cfiToSave, lastHref: href ?? undefined }).catch(() => {});
						}, SAVE_POSITION_MS);
					}
				}
			});
			const whenReady = bk.ready ?? Promise.resolve();
			const lastCfi = meta?.lastCfi;
			const lastPos = meta?.lastPosition;
			const lastHref = meta?.lastHref;
			const hasValidCfi = typeof lastCfi === 'string' && lastCfi.length > 10;
			const hasValidLastPos = typeof lastPos === 'number' && lastPos >= 0 && lastPos <= 1;
			const hasValidHref = typeof lastHref === 'string' && lastHref.length > 0;
			if (hasValidCfi) {
				restoringPosition = true;
				whenReady
					.then(() => rend.display(lastCfi!).catch(() => { throw new Error('CFI restore failed'); }))
					.then(() => {
						setTimeout(() => { restoringPosition = false; }, 120);
					})
					.catch(() => {
						if (hasValidHref) {
							rend.display(lastHref!).then(() => setTimeout(() => { restoringPosition = false; }, 120)).catch(() => { restoringPosition = false; });
						} else if (hasValidLastPos) {
							(bk.locations?.generate?.() ?? Promise.resolve()).catch(() => {}).then(() => {
								rend.display(lastPos!).catch(() => {});
								setTimeout(() => { restoringPosition = false; }, 120);
							});
						} else {
							rend.display();
							restoringPosition = false;
						}
					});
			} else if (hasValidHref) {
				restoringPosition = true;
				whenReady
					.then(() => rend.display(lastHref!))
					.then(() => setTimeout(() => { restoringPosition = false; }, 120))
					.catch(() => {
						if (hasValidLastPos) {
							(bk.locations?.generate?.() ?? Promise.resolve()).catch(() => {}).then(() => {
								rend.display(lastPos!).catch(() => {});
								setTimeout(() => { restoringPosition = false; }, 120);
							});
						} else {
							rend.display();
							restoringPosition = false;
						}
					});
			} else if (hasValidLastPos) {
				restoringPosition = true;
				rend.display();
				setTimeout(() => { restoringPosition = false; }, 400);
				whenReady
					.then(() => (bk.locations?.generate?.() ?? Promise.resolve()).catch(() => {}))
					.then(() => rend.display(lastPos!).catch(() => {}))
					.catch(() => {});
			} else {
				rend.display();
				whenReady.then(() => (bk.locations?.generate?.() ?? Promise.resolve()).catch(() => {}));
			}
		});
		return () => {
			cancelAnimationFrame(initRafId);
			if (rendition) {
				rendition.destroy();
				rendition = null;
			}
			if (book) {
				book.destroy();
				book = null;
			}
		};
	});

	// Theme: font size, font family, and light/dark mode
	$effect(() => {
		if (!rendition) return;
		readerFontSize;
		readerFontFamily;
		readerTheme;
		rendition.themes.fontSize(readerFontSize + '%');
		rendition.themes.font(readerFontFamily);
		rendition.themes.default(THEME_STYLES[readerTheme]);
		const contents = rendition.getContents() as ContentWithDoc[];
		const fontRule = `body, body * { font-family: ${readerFontFamily} !important; }`;
		contents.forEach((content) => {
			if (content.addStylesheetCss) {
				content.addStylesheetCss(fontRule, 'reader-font-force');
			}
		});
	});

	// Persist reader settings (font, font size, spread) to IndexedDB when they change
	const SAVE_SETTINGS_MS = 600;
	$effect(() => {
		const id = bookId;
		if (!id || !rendition) return;
		const size = readerFontSize;
		const family = readerFontFamily;
		const spread = spreadMode;
		const t = setTimeout(() => {
			updateBookMetadata(id, { fontSize: size, fontFamily: family, spreadMode: spread }).catch(() => {});
		}, SAVE_SETTINGS_MS);
		return () => clearTimeout(t);
	});

	function goToHref(href: string) {
		rendition?.display(href);
	}
	function goPrev() {
		if (!rendition || atStart) return;
		const rtl = book?.packaging?.metadata?.direction === 'rtl';
		rtl ? rendition.next() : rendition.prev();
	}
	function goNext() {
		if (!rendition || atEnd) return;
		const rtl = book?.packaging?.metadata?.direction === 'rtl';
		rtl ? rendition.prev() : rendition.next();
	}
	function setSpreadMode(mode: 'single' | 'double') {
		spreadMode = mode;
		rendition?.spread(mode === 'double' ? 'always' : 'none', 800);
	}
	function toggleFullScreen() {
		const el = readerContainer;
		if (!el) return;
		if (fullScreen) document.exitFullscreen?.();
		else el.requestFullscreen?.();
		fullScreen = !!document.fullscreenElement;
	}
	function onFullScreenChange() {
		fullScreen = !!document.fullscreenElement;
	}
	/** Close other toolbar dropdowns so only one is open at a time */
	function closeOtherToolbarDropdowns(exceptDetails: Element | null) {
		const container = exceptDetails?.parentElement;
		if (!container) return;
		container.querySelectorAll('details.dropdown').forEach((d) => {
			if (d !== exceptDetails) d.removeAttribute('open');
		});
	}
	function onKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('input, textarea, [contenteditable]')) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goPrev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			goNext();
		}
	}

	function flattenToc(items: TocItem[]): TocItem[] {
		const out: TocItem[] = [];
		function add(list: TocItem[]) {
			for (const ch of list) {
				out.push(ch);
				if (ch.subitems?.length) add(ch.subitems);
			}
		}
		add(items);
		return out;
	}

	const canPrev = $derived(!!rendition && !atStart);
	const canNext = $derived(!!rendition && !atEnd);
	const flatToc = $derived(flattenToc(toc));

	$effect(() => {
		if (!tocListEl || !currentHref) return;
		const btn = Array.from(tocListEl.querySelectorAll<HTMLElement>('[data-href]')).find(
			(el) => el.getAttribute('data-href') === currentHref
		);
		btn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});

	$effect(() => {
		if (!rendition) return;
		const el = readerContainer;
		if (!el) return;
		const t = setTimeout(() => {
			el.focus({ preventScroll: true });
		}, 100);
		return () => clearTimeout(t);
	});

	/** Save reading position when user leaves (back, close tab) so we can restore next time. Returns a promise so caller can wait before destroying. */
	function savePositionOnLeave(): Promise<void> {
		const id = bookId;
		if (!id) return Promise.resolve();
		const pct = lastKnownPosition;
		const rawCfi = rendition?.location?.start?.cfi;
		const href = rendition?.location?.start?.href ?? currentHref;
		const cfiStr = rawCfi != null ? (typeof rawCfi === 'string' ? rawCfi : (rawCfi as { toString?: () => string }).toString?.() ?? '') : undefined;
		const lastCfi = cfiStr && cfiStr.length > 10 ? cfiStr : undefined;
		const lastHrefVal = href && String(href).trim() ? href : undefined;
		if (typeof pct === 'number' && pct >= 0 && pct <= 1) {
			return updateBookMetadata(id, { lastOpened: Date.now(), lastPosition: pct, lastCfi: lastCfi, lastHref: lastHrefVal });
		}
		if (lastCfi || lastHrefVal) {
			return updateBookMetadata(id, { lastOpened: Date.now(), lastCfi: lastCfi, lastHref: lastHrefVal });
		}
		return Promise.resolve();
	}

	onMount(() => {
		document.addEventListener('fullscreenchange', onFullScreenChange);
		window.addEventListener('keydown', onKeydown, true);
		window.addEventListener('pagehide', savePositionOnLeave);
		const onVisibilityChange = () => {
			if (document.visibilityState === 'hidden') savePositionOnLeave();
		};
		document.addEventListener('visibilitychange', onVisibilityChange);
		return () => {
			const destroy = () => {
				rendition?.destroy();
				book?.destroy();
			};
			savePositionOnLeave().then(destroy).catch(destroy);
			document.removeEventListener('fullscreenchange', onFullScreenChange);
			window.removeEventListener('keydown', onKeydown, true);
			window.removeEventListener('pagehide', savePositionOnLeave);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	});
</script>

<svelte:head>
	<title>{title ? m.seo_reader_title({ title }) : 'Reader | EPUB Online Viewer'}</title>
	<meta name="description" content={title ? m.seo_reader_description({ title }) : ''} />
	<meta name="keywords" content={m.seo_reader_keywords()} />
</svelte:head>

<div class="h-full flex flex-col min-h-0 overflow-hidden bg-base-100">
	{#if loading}
		<div class="flex items-center justify-center flex-1 p-8">
			<span class="loading loading-spinner loading-lg text-primary"></span>
			<p class="ml-3">{m.reader_loading()}</p>
		</div>
	{:else if error}
		<div class="flex-1 flex items-center justify-center p-8">
			<div class="text-center">
				<p class="text-error text-lg">{error}</p>
				<a href={homeHref} class="btn btn-primary mt-4">{m.back_to_library()}</a>
			</div>
		</div>
	{:else if bookData}
		<!-- Theme is applied globally via <html data-theme> from theme-store -->
		<div class="reader-page h-full flex flex-col min-h-0 overflow-hidden bg-base-100">
		<!-- Toolbar: sticky so it stays fixed when scrolling -->
		<nav class="reader-toolbar sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 h-14 px-2 md:px-3 bg-base-200 border-b border-base-300 shrink-0" aria-label="Reader toolbar">
			<div class="menu-1 flex items-center justify-start gap-1 min-w-0">
				<a href={homeHref} class="btn btn-sm btn-ghost btn-square" title={m.back_to_library()} aria-label={m.back_to_library()}>
					<!-- Lucide ArrowLeft -->
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
				</a>
				<button type="button" class="btn btn-sm btn-ghost btn-square" onclick={() => (tocOpen = !tocOpen)} title={m.reader_toc_toggle()} aria-label={m.reader_toc_toggle()} aria-pressed={tocOpen}>
					<!-- Lucide PanelLeftOpen / PanelLeftClose for TOC -->
					{#if tocOpen}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9 3 3-3 3"/></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m15 9 3 3-3 3"/></svg>
					{/if}
				</button>
			</div>
			<div class="menu-center flex items-center justify-center gap-2 shrink-0 max-w-[min(100%,22rem)]" aria-label={title || 'Book title'}>
				<span class="text-sm text-base-content/80 whitespace-nowrap truncate">{title || '—'}</span>
			</div>
			<div class="menu-2 flex items-center justify-end gap-1 min-w-0" role="group" aria-label="Reader options">
				<button
					type="button"
					class="btn btn-sm btn-ghost btn-square"
					title={readerTheme === 'dark' ? m.reader_theme_light() : m.reader_theme_dark()}
					aria-label={readerTheme === 'dark' ? m.reader_theme_light() : m.reader_theme_dark()}
					onclick={() => setTheme(readerTheme === 'dark' ? 'light' : 'dark')}
				>
					{#if readerTheme === 'dark'}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
					{/if}
				</button>
				<details class="dropdown dropdown-end hidden sm:block">
					<summary class="btn btn-sm btn-ghost gap-1" onclick={(e) => closeOtherToolbarDropdowns((e.currentTarget as HTMLElement).closest('details'))}><span class="text-sm">Spread</span></summary>
					<ul role="listbox" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-40 p-2 shadow border border-base-300">
						<li><button type="button" class="text-sm {spreadMode === 'single' ? 'active' : ''}" onclick={() => setSpreadMode('single')}>Single page</button></li>
						<li><button type="button" class="text-sm {spreadMode === 'double' ? 'active' : ''}" onclick={() => setSpreadMode('double')}>Two pages</button></li>
					</ul>
				</details>
				<details class="dropdown dropdown-end hidden sm:block" id="reader-font-family-dropdown">
					<summary class="btn btn-sm btn-ghost gap-1" title={m.reader_font_family()} onclick={(e) => closeOtherToolbarDropdowns((e.currentTarget as HTMLElement).closest('details'))}><span class="text-sm">{m.reader_font_family()}</span></summary>
					<ul role="listbox" class="dropdown-content menu menu-vertical bg-base-100 rounded-box z-50 mt-1 max-h-64 overflow-y-auto w-52 p-2 shadow border border-base-300 flex-nowrap">
						{#each FONT_FAMILIES as fam}
							<li class="w-full"><button type="button" class="text-sm w-full text-left py-2 px-3 rounded-md {readerFontFamily === fam.value ? 'active' : ''}" onclick={() => (readerFontFamily = fam.value)}>{fam.label()}</button></li>
						{/each}
					</ul>
				</details>
				<details class="dropdown dropdown-end hidden sm:block" id="reader-font-size-dropdown">
					<summary class="btn btn-sm btn-ghost gap-1" title={m.reader_font_size()} onclick={(e) => closeOtherToolbarDropdowns((e.currentTarget as HTMLElement).closest('details'))}><span class="text-sm">{readerFontSize}%</span></summary>
					<ul role="listbox" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-32 p-2 shadow border border-base-300">
						{#each FONT_SIZES as pct}
							<li><button type="button" class="text-sm {readerFontSize === pct ? 'active' : ''}" onclick={() => (readerFontSize = pct)}>{pct}%</button></li>
						{/each}
					</ul>
				</details>
				<button type="button" class="btn btn-sm btn-ghost btn-square" onclick={toggleFullScreen} title={fullScreen ? m.reader_exit_full_screen() : m.reader_full_screen()} aria-label={fullScreen ? m.reader_exit_full_screen() : m.reader_full_screen()}>
					{#if fullScreen}
						<!-- Lucide Minimize2 -->
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v3a2 2 0 0 0 2 2h3M3 16h3a2 2 0 0 0 2-2v-3"/></svg>
					{:else}
						<!-- Lucide Maximize2 -->
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
					{/if}
				</button>
			</div>
		</nav>

		<!-- TOC + Viewer area: fixed height row; TOC and content each scroll independently -->
		<div class="flex-1 flex min-h-0 overflow-hidden">
			<aside class="shrink-0 w-64 min-h-0 bg-base-200 border-r border-base-300 flex flex-col overflow-hidden transition-[margin,width] duration-200 {tocOpen ? 'flex' : 'hidden'}" aria-label={m.reader_toc()} aria-hidden={!tocOpen}>
				<div class="shrink-0 p-3 border-b border-base-300 font-semibold text-sm">{m.reader_toc()}</div>
				<nav class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2" aria-label={m.reader_toc()}>
					<ul class="menu menu-sm gap-0.5 p-0 w-full" bind:this={tocListEl}>
						{#each flatToc as chapter (chapter.id ?? '' + chapter.href)}
							<li class="w-full">
								<button
									type="button"
									data-href={chapter.href}
									class="w-full text-left text-sm py-2 px-3 rounded-md {currentHref === chapter.href ? 'btn-active bg-primary/15 text-primary font-medium' : 'hover:bg-base-300'}"
									onclick={() => goToHref(chapter.href)}
								>
									{chapter.label}
								</button>
							</li>
						{/each}
					</ul>
				</nav>
			</aside>

			<div
				bind:this={readerContainer}
				class="reader-content flex-1 min-w-0 flex flex-col overflow-hidden outline-none reader-theme-{readerTheme}"
				tabindex="0"
				aria-label="Reading area – use arrow keys to turn pages"
			>
				<div class="flex-1 min-h-0 flex items-stretch overflow-hidden">
					<button
						type="button"
						class="reader-arrow prev flex-shrink-0 flex items-center justify-start px-2 md:px-4 min-w-[48px] {!canPrev ? 'opacity-30 pointer-events-none' : 'hover:bg-base-200'}"
						onclick={goPrev}
						title={m.reader_prev()}
						disabled={!canPrev}
					>
						<span class="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content/40 hover:text-base-content/70 select-none">&lt;</span>
					</button>
					<div class="viewer-container flex-1 min-w-0 overflow-hidden flex items-center justify-center relative reader-theme-bg-{readerTheme}">
						<div bind:this={viewerEl} class="w-full h-full min-h-[400px]"></div>
						{#if restoringPosition}
							<div class="absolute inset-0 flex items-center justify-center z-10 reader-restoring-overlay-{readerTheme}" aria-live="polite" aria-busy="true">
								<div class="flex flex-col items-center gap-3">
									<span class="loading loading-spinner loading-lg text-primary"></span>
									<p class="text-sm opacity-80">{m.reader_restoring_position()}</p>
								</div>
							</div>
						{/if}
					</div>
					<button
						type="button"
						class="reader-arrow next flex-shrink-0 flex items-center justify-end px-2 md:px-4 min-w-[48px] {!canNext ? 'opacity-30 pointer-events-none' : 'hover:bg-base-200'}"
						onclick={goNext}
						title={m.reader_next()}
						disabled={!canNext}
					>
						<span class="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content/40 hover:text-base-content/70 select-none">&gt;</span>
					</button>
				</div>
			</div>
		</div>
		</div>
	{/if}
</div>
