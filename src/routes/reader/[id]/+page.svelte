<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getBookArrayBuffer, updateBookMetadata } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import ePub from 'epubjs';
	import '../../../app.css';

	interface TocItem {
		id?: string;
		href: string;
		label: string;
		subitems?: TocItem[];
	}

	const FONT_SIZES = [90, 100, 110, 120, 130, 140, 150] as const;
	const FONT_FAMILIES = [
		{ value: 'serif', label: () => m.reader_font_serif() },
		{ value: 'sans-serif', label: () => m.reader_font_sans() },
		{ value: 'monospace', label: () => m.reader_font_mono() },
	] as const;

	let loading = $state(true);
	let error = $state<string | null>(null);
	let bookData = $state<ArrayBuffer | null>(null);
	/** Metadata from last load (for lastPosition restore). */
	let loadedMetadata = $state<{ lastPosition?: number } | null>(null);
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
	let readerFontSize = $state(100);
	let readerFontFamily = $state<'serif' | 'sans-serif' | 'monospace'>('serif');
	let spreadMode = $state<'single' | 'double'>('double');
	let fullScreen = $state(false);
	let readerContainer = $state<HTMLDivElement | null>(null);
	let tocListEl = $state<HTMLUListElement | null>(null);

	const bookId = $derived(page.params.id);

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
		getBookArrayBuffer(id)
			.then(async (data) => {
				if (cancelled) return;
				if (!data) {
					error = m.reader_error_not_found();
					return;
				}
				bookData = data.arrayBuffer;
				loadedMetadata = data.metadata ? { lastPosition: data.metadata.lastPosition } : null;
				await updateBookMetadata(id, { lastOpened: Date.now() });
			})
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

	// 2) When bookData is set, wait for viewer div (bind:this) then create epub.js and render
	const INIT_POLL_FRAMES = 30;
	let initRafId = 0;
	$effect(() => {
		const buf = bookData;
		if (!buf) return;
		let pollCount = 0;
		function tryInit() {
			pollCount++;
			const el = viewerEl;
			if (!el || !bookData || rendition) return;
			if (!document.contains(el)) {
				if (pollCount < INIT_POLL_FRAMES) initRafId = requestAnimationFrame(tryInit);
				return;
			}
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
			};
			const rend = bk.renderTo(el, opts);
			rendition = rend;
			bk.loaded.navigation.then((nav: { toc?: TocItem[] } | TocItem[]) => {
				toc = Array.isArray(nav) ? nav : (nav?.toc ?? []);
			});
			bk.loaded.metadata.then((meta: { title?: string }) => {
				title = meta?.title ?? '';
			});
			let savePositionTimer: ReturnType<typeof setTimeout> | null = null;
			const SAVE_POSITION_MS = 1500;
			rend.on('relocated', (loc: { atStart: boolean; atEnd: boolean; start?: { href?: string; location?: number; percentage?: number; displayed?: { page?: number; total?: number } } }) => {
				atStart = loc.atStart;
				atEnd = loc.atEnd;
				currentHref = loc.start?.href ?? null;
				// Page: use displayed (per chapter) so numbers are 1,2,3... and total is correct for this chapter
				const dp = loc.start?.displayed;
				if (dp && typeof dp.page === 'number' && dp.page >= 1 && typeof dp.total === 'number' && dp.total >= 1) {
					currentPage = dp.page;
					totalPages = dp.total;
				}
				// Debounce save last position for continue-from-last (percentage is from locations when available)
				const pct = loc.start?.percentage;
				if (typeof pct === 'number' && pct >= 0 && pct <= 1 && bookId) {
					if (savePositionTimer) clearTimeout(savePositionTimer);
					savePositionTimer = setTimeout(() => {
						savePositionTimer = null;
						updateBookMetadata(bookId, { lastOpened: Date.now(), lastPosition: pct }).catch(() => {});
					}, SAVE_POSITION_MS);
				}
			});
			rend.display();
			// Generate locations; then restore last position if we have one (continue from last read)
			const whenReady = bk.ready ?? Promise.resolve();
			const lastPos = loadedMetadata?.lastPosition;
			const hasValidLastPos = typeof lastPos === 'number' && lastPos >= 0 && lastPos <= 1;
			whenReady
				.then(() => (bk.locations?.generate?.() ?? Promise.resolve()).catch(() => {}))
				.then(() => {
					if (hasValidLastPos && bk.locations?.length?.()) {
						rend.display(lastPos).catch(() => {});
					}
				})
				.catch(() => {});
		};
		initRafId = requestAnimationFrame(tryInit);
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

	// Theme when font size/family change
	$effect(() => {
		if (!rendition) return;
		readerFontSize;
		readerFontFamily;
		rendition.themes.fontSize(readerFontSize + '%');
		rendition.themes.font(readerFontFamily);
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
	function onKeydown(e: KeyboardEvent) {
		if ((e.target as HTMLElement).closest('input, textarea, [contenteditable]')) return;
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
	const hasPageInfo = $derived(totalPages > 0);

	$effect(() => {
		if (!tocListEl || !currentHref) return;
		const btn = Array.from(tocListEl.querySelectorAll<HTMLElement>('[data-href]')).find(
			(el) => el.getAttribute('data-href') === currentHref
		);
		btn?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});

	onMount(() => {
		document.addEventListener('fullscreenchange', onFullScreenChange);
		document.addEventListener('keydown', onKeydown);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
			document.removeEventListener('keydown', onKeydown);
			rendition?.destroy();
			book?.destroy();
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
				<a href="/" class="btn btn-primary mt-4">{m.back_to_library()}</a>
			</div>
		</div>
	{:else if bookData}
		<!-- Toolbar: sticky so it stays fixed when scrolling -->
		<nav class="reader-toolbar sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-2 h-14 px-2 md:px-3 bg-base-200 border-b border-base-300 shrink-0" aria-label="Reader toolbar">
			<div class="menu-1 flex items-center justify-start gap-1 min-w-0">
				<a href="/" class="btn btn-sm btn-ghost btn-square" title={m.back_to_library()} aria-label={m.back_to_library()}>
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
			<div class="menu-center flex items-center justify-center shrink-0" aria-label={m.reader_page_of({ current: currentPage, total: totalPages || 1 })}>
				{#if hasPageInfo}
					<span class="text-sm text-base-content/80 whitespace-nowrap">{m.reader_page_of({ current: currentPage, total: totalPages })}</span>
				{:else}
					<span class="text-sm text-base-content/50 whitespace-nowrap">—</span>
				{/if}
			</div>
			<div class="menu-2 flex items-center justify-end gap-1 min-w-0">
				<div class="dropdown dropdown-end hidden sm:block">
					<button type="button" tabindex="0" class="btn btn-sm btn-ghost gap-1" aria-haspopup="listbox" aria-expanded="false"><span class="text-sm">Spread</span></button>
					<ul role="listbox" tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-40 p-2 shadow border border-base-300">
						<li><button type="button" class="text-sm {spreadMode === 'single' ? 'active' : ''}" onclick={() => setSpreadMode('single')}>Single page</button></li>
						<li><button type="button" class="text-sm {spreadMode === 'double' ? 'active' : ''}" onclick={() => setSpreadMode('double')}>Two pages</button></li>
					</ul>
				</div>
				<div class="dropdown dropdown-end hidden sm:block">
					<button type="button" tabindex="0" class="btn btn-sm btn-ghost gap-1" aria-haspopup="listbox" aria-expanded="false"><span class="text-sm">{readerFontSize}%</span></button>
					<ul role="listbox" tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-32 p-2 shadow border border-base-300">
						{#each FONT_SIZES as pct}
							<li><button type="button" class="text-sm {readerFontSize === pct ? 'active' : ''}" onclick={() => (readerFontSize = pct)}>{pct}%</button></li>
						{/each}
					</ul>
				</div>
				<div class="dropdown dropdown-end hidden sm:block">
					<button type="button" tabindex="0" class="btn btn-sm btn-ghost gap-1" aria-haspopup="listbox" aria-expanded="false"><span class="text-sm">{m.reader_font_family()}</span></button>
					<ul role="listbox" tabindex="-1" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-36 p-2 shadow border border-base-300">
						{#each FONT_FAMILIES as fam}
							<li><button type="button" class="text-sm {readerFontFamily === fam.value ? 'active' : ''}" onclick={() => (readerFontFamily = fam.value)}>{fam.label()}</button></li>
						{/each}
					</ul>
				</div>
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

			<div bind:this={readerContainer} class="reader-content flex-1 min-w-0 flex flex-col bg-base-100 overflow-hidden">
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
					<div class="viewer-container flex-1 min-w-0 overflow-hidden flex items-center justify-center bg-base-100">
						<div bind:this={viewerEl} class="w-full h-full min-h-[400px]"></div>
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
	{/if}
</div>
