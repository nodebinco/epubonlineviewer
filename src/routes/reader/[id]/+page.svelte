<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { page } from '$app/state';
	import { getBook, updateBookMetadata } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import ePub from 'epubjs';
	import '../../../app.css';

	/** epub.js navigation item (from book.loaded.navigation.toc) */
	interface TocChapter {
		id?: string;
		href: string;
		label: string;
		subitems?: TocChapter[];
	}

	const FONT_SIZES = [90, 100, 110, 120, 130, 140, 150] as const;
	const FONT_FAMILIES = [
		{ value: 'serif', label: () => m.reader_font_serif() },
		{ value: 'sans-serif', label: () => m.reader_font_sans() },
		{ value: 'monospace', label: () => m.reader_font_mono() },
	] as const;

	const VIEWER_ID = 'epub-viewer';

	let book = $state<ReturnType<typeof ePub> | null>(null);
	let rendition = $state<ReturnType<ReturnType<typeof ePub>['renderTo']> | null>(null);
	let blobUrl = $state<string | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let fullScreen = $state(false);
	let tocOpen = $state(true);
	let readerFontSize = $state(100);
	let readerFontFamily = $state<'serif' | 'sans-serif' | 'monospace'>('serif');
	let toc = $state<TocChapter[]>([]);
	let spreadMode = $state<'single' | 'double'>('double');
	let atStart = $state(true);
	let atEnd = $state(false);
	let title = $state('');
	let readerContainer: HTMLDivElement;
	let tocListEl: HTMLUListElement;
	let currentHref = $state<string | null>(null);

	function isStorageError(msg: string): boolean {
		const lower = msg.toLowerCase();
		return (
			lower.includes('quota') ||
			lower.includes('quotaexceeded') ||
			lower.includes('no_space') ||
			lower.includes('file_error_no_space') ||
			lower.includes('connection is closing')
		);
	}

	$effect(() => {
		const bookId = page.params.id;
		if (!bookId) return;
		loadBook(bookId);
	});

	$effect(() => {
		if (!rendition) return;
		readerFontSize;
		readerFontFamily;
		rendition.themes.fontSize(readerFontSize + '%');
		rendition.themes.font(readerFontFamily);
	});

	async function loadBook(bookId: string) {
		loading = true;
		error = null;
		// Cleanup previous
		if (rendition) {
			rendition.destroy();
			rendition = null;
		}
		if (book) {
			book.destroy();
			book = null;
		}
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
			blobUrl = null;
		}
		toc = [];
		atStart = true;
		atEnd = false;
		title = '';
		currentHref = null;
		try {
			const record = await getBook(bookId);
			if (!record) {
				error = m.reader_error_not_found();
				return;
			}
			// epub.js: blob URL + openAs 'epub' so it fetches as binary (see Book.determineType)
			const url = URL.createObjectURL(record.blob);
			blobUrl = url;
			const bk = ePub(url, { encoding: 'binary', openAs: 'epub' });
			book = bk;
			await updateBookMetadata(bookId, { lastOpened: Date.now() });

			// Wait for Svelte to render the viewer div (we just set book so "else if book" block appears)
			await tick();
			const viewerEl = document.getElementById(VIEWER_ID);
			if (!viewerEl) {
				error = 'Viewer element not found';
				return;
			}

			const opts: Parameters<ReturnType<typeof ePub>['renderTo']>[1] = {
				width: '100%',
				height: '100%',
				flow: 'paginated',
				spread: spreadMode === 'double' ? 'always' : 'none',
				minSpreadWidth: 800,
			};
			const rend = bk.renderTo(viewerEl, opts);
			rendition = rend;

			// TOC from epub.js navigation (like spreads example: book.loaded.navigation.then(toc => ...))
			bk.loaded.navigation.then((nav: { toc?: TocChapter[] } | TocChapter[]) => {
				toc = Array.isArray(nav) ? nav : (nav?.toc ?? []);
			});

			bk.loaded.metadata.then((meta: { title?: string }) => {
				title = meta?.title ?? '';
			});

			rend.on('relocated', (location: { atStart: boolean; atEnd: boolean; start?: { href?: string } }) => {
				atStart = location.atStart;
				atEnd = location.atEnd;
				currentHref = location.start?.href ?? null;
			});

			await rend.display();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			error = isStorageError(msg) ? m.reader_error_storage() : (msg || m.reader_error_not_found());
		} finally {
			loading = false;
		}
	}

	function goToHref(href: string) {
		if (!rendition) return;
		rendition.display(href);
	}

	function goPrev() {
		if (!rendition || atStart) return;
		const meta = book?.packaging?.metadata;
		const rtl = meta?.direction === 'rtl';
		if (rtl) rendition.next();
		else rendition.prev();
	}

	function goNext() {
		if (!rendition || atEnd) return;
		const meta = book?.packaging?.metadata;
		const rtl = meta?.direction === 'rtl';
		if (rtl) rendition.prev();
		else rendition.next();
	}

	function toggleFullScreen() {
		if (!readerContainer) return;
		if (!fullScreen) {
			readerContainer.requestFullscreen?.();
			fullScreen = true;
		} else {
			document.exitFullscreen?.();
			fullScreen = false;
		}
	}

	function onFullScreenChange() {
		fullScreen = !!document.fullscreenElement;
	}

	function onKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('input, textarea, [contenteditable="true"]')) return;
		if (target.closest('details[open]')) return;
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			goPrev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			goNext();
		}
	}

	function setSpreadMode(mode: 'single' | 'double') {
		spreadMode = mode;
		if (rendition) {
			rendition.spread(mode === 'double' ? 'always' : 'none', 800);
		}
	}

	// Flatten TOC for simple list (epub.js nav can have subitems)
	function flattenToc(items: TocChapter[]): TocChapter[] {
		const out: TocChapter[] = [];
		function add(items: TocChapter[]) {
			for (const ch of items) {
				out.push(ch);
				if (ch.subitems && ch.subitems.length) add(ch.subitems);
			}
		}
		add(items);
		return out;
	}

	const canPrev = $derived(!!rendition && !atStart);
	const canNext = $derived(!!rendition && !atEnd);
	const flatToc = $derived(flattenToc(toc));

	// Scroll active TOC item into view
	$effect(() => {
		if (!tocListEl || !currentHref) return;
		const btn = Array.from(tocListEl.querySelectorAll<HTMLElement>('[data-href]')).find(
			(el) => el.getAttribute('data-href') === currentHref
		);
		if (btn) btn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
	});

	onMount(() => {
		document.addEventListener('fullscreenchange', onFullScreenChange);
		document.addEventListener('keydown', onKeydown);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
			document.removeEventListener('keydown', onKeydown);
			if (rendition) rendition.destroy();
			if (book) book.destroy();
			if (blobUrl) URL.revokeObjectURL(blobUrl);
		};
	});
</script>

<svelte:head>
	<title>{title ? m.seo_reader_title({ title }) : 'Reader | EPUB Online Viewer'}</title>
	<meta name="description" content={title ? m.seo_reader_description({ title }) : ''} />
	<meta name="keywords" content={m.seo_reader_keywords()} />
</svelte:head>

<div class="flex-1 flex flex-col min-h-0 overflow-hidden bg-base-100">
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
	{:else if book}
		<!-- Toolbar: fixed height like epubreader-js (58px) -->
		<nav
			class="reader-toolbar grid grid-cols-[1fr_1fr] items-center gap-2 h-14 px-2 md:px-3 bg-base-200 border-b border-base-300 shrink-0"
			aria-label="Reader toolbar"
		>
			<div class="menu-1 flex items-center justify-start gap-1 min-w-0">
				<a href="/" class="btn btn-sm btn-ghost btn-square md:btn-square md:gap-1" title={m.back_to_library()}>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
					</svg>
					<span class="hidden md:inline">{m.back_to_library()}</span>
				</a>
				<button
					type="button"
					class="btn btn-sm btn-ghost btn-square lg:hidden"
					onclick={() => (tocOpen = !tocOpen)}
					title={m.reader_toc_toggle()}
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
					</svg>
				</button>
				<button type="button" class="btn btn-sm btn-ghost" disabled={!canPrev} onclick={goPrev} title={m.reader_prev()}>
					{m.reader_prev()}
				</button>
				<button type="button" class="btn btn-sm btn-ghost" disabled={!canNext} onclick={goNext} title={m.reader_next()}>
					{m.reader_next()}
				</button>
			</div>
			<div class="menu-2 flex items-center justify-end gap-1 min-w-0">
				<div class="dropdown dropdown-end hidden sm:block">
					<label tabindex="0" class="btn btn-sm btn-ghost gap-1" title="Spread">
						<span class="text-sm">Spread</span>
					</label>
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-40 p-2 shadow border border-base-300">
						<li>
							<button type="button" class="text-sm {spreadMode === 'single' ? 'active' : ''}" onclick={() => setSpreadMode('single')}>
								Single page
							</button>
						</li>
						<li>
							<button type="button" class="text-sm {spreadMode === 'double' ? 'active' : ''}" onclick={() => setSpreadMode('double')}>
								Two pages
							</button>
						</li>
					</ul>
				</div>
				<div class="dropdown dropdown-end hidden sm:block">
					<label tabindex="0" class="btn btn-sm btn-ghost gap-1"><span class="text-sm">{readerFontSize}%</span></label>
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-32 p-2 shadow border border-base-300">
						{#each FONT_SIZES as pct}
							<li>
								<button type="button" class="text-sm {readerFontSize === pct ? 'active' : ''}" onclick={() => (readerFontSize = pct)}>{pct}%</button>
							</li>
						{/each}
					</ul>
				</div>
				<div class="dropdown dropdown-end hidden sm:block">
					<label tabindex="0" class="btn btn-sm btn-ghost gap-1"><span class="text-sm">{m.reader_font_family()}</span></label>
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-36 p-2 shadow border border-base-300">
						{#each FONT_FAMILIES as fam}
							<li>
								<button type="button" class="text-sm {readerFontFamily === fam.value ? 'active' : ''}" onclick={() => (readerFontFamily = fam.value)}>
									{fam.label()}
								</button>
							</li>
						{/each}
					</ul>
				</div>
				<button type="button" class="btn btn-sm btn-ghost" onclick={toggleFullScreen} title={fullScreen ? m.reader_exit_full_screen() : m.reader_full_screen()}>
					{fullScreen ? m.reader_exit_full_screen() : m.reader_full_screen()}
				</button>
			</div>
		</nav>

		<!-- TOC (left) + viewer (right) - epub.js style -->
		<div class="flex-1 flex min-h-0 overflow-hidden">
			<aside
				class="shrink-0 w-64 bg-base-200 border-r border-base-300 flex flex-col overflow-hidden {tocOpen ? 'flex' : 'hidden lg:flex'}"
				aria-label={m.reader_toc()}
			>
				<div class="shrink-0 p-3 border-b border-base-300 font-semibold text-sm">{m.reader_toc()}</div>
				<nav class="flex-1 overflow-y-auto overscroll-contain p-2" aria-label={m.reader_toc()}>
					<ul class="menu menu-sm gap-0.5 p-0 w-full" bind:this={tocListEl}>
						{#each flatToc as chapter (chapter.id + chapter.href)}
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

			<!-- Content: prev | viewer (epub.js renders here) | next -->
			<div bind:this={readerContainer} class="reader-content flex-1 min-w-0 flex flex-col bg-base-100 overflow-hidden">
				<div class="flex-1 min-h-0 flex items-stretch overflow-hidden">
					<button
						type="button"
						class="reader-arrow prev flex-shrink-0 flex items-center justify-start px-2 md:px-4 min-w-[48px] {!canPrev ? 'opacity-30 pointer-events-none' : 'hover:bg-base-200'} transition-colors"
						onclick={goPrev}
						title={m.reader_prev()}
						disabled={!canPrev}
					>
						<span class="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content/40 hover:text-base-content/70 select-none" aria-hidden="true">&lt;</span>
					</button>

					<div class="viewer-container flex-1 min-w-0 overflow-hidden flex items-center justify-center bg-base-100">
						<div id={VIEWER_ID} class="w-full h-full min-h-0"></div>
					</div>

					<button
						type="button"
						class="reader-arrow next flex-shrink-0 flex items-center justify-end px-2 md:px-4 min-w-[48px] {!canNext ? 'opacity-30 pointer-events-none' : 'hover:bg-base-200'} transition-colors"
						onclick={goNext}
						title={m.reader_next()}
						disabled={!canNext}
					>
						<span class="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content/40 hover:text-base-content/70 select-none" aria-hidden="true">&gt;</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
