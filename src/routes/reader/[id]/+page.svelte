<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getBook, updateBookMetadata, parseEpub } from '$lib';
	import type { EpubParseResult, EpubSpineItem } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import '../../../app.css';

	const FONT_SIZES = [90, 100, 110, 120, 130, 140, 150] as const;
	const FONT_FAMILIES = [
		{ value: 'serif', label: () => m.reader_font_serif() },
		{ value: 'sans-serif', label: () => m.reader_font_sans() },
		{ value: 'monospace', label: () => m.reader_font_mono() },
	] as const;

	let parsed = $state<EpubParseResult | null>(null);
	let currentIndex = $state(0);
	let chapterHtml = $state<string>('');
	let loading = $state(true);
	let error = $state<string | null>(null);
	let fullScreen = $state(false);
	let tocOpen = $state(true);
	let readerFontSize = $state(100);
	let readerFontFamily = $state<'serif' | 'sans-serif' | 'monospace'>('serif');
	let tocLabels = $state<Map<number, string>>(new Map());
	let spreadMode = $state<'single' | 'double'>('double');
	let nextChapterHtml = $state<string>('');
	let readerContainer: HTMLDivElement;
	let tocListEl: HTMLUListElement;

	function resolveRelativePath(baseDir: string, href: string): string {
		const parts = baseDir ? baseDir.split('/').filter(Boolean) : [];
		const rel = href.split('#')[0].split('/').filter(Boolean);
		for (const p of rel) {
			if (p === '..') parts.pop();
			else parts.push(p);
		}
		return parts.join('/');
	}

	function wrapWithReaderStyles(
		html: string,
		opts: { fontSize: number; fontFamily: string; currentHref: string }
	): string {
		const style = `
<style id="epub-reader-overrides">
  body { font-family: ${opts.fontFamily}; font-size: ${opts.fontSize}%; line-height: 1.6; }
  body { max-width: 42em; margin-left: auto; margin-right: auto; padding: 1.5em 1em; box-sizing: border-box; }
  * { box-sizing: border-box; }
</style>`;
		const linkScript =
			'<script>(function(){document.addEventListener("click",function(e){var a=e.target.closest("a");if(!a)return;var href=a.getAttribute("href");if(!href||href.charAt(0)==="#")return;e.preventDefault();window.parent.postMessage({type:"epub-navigate",href:href},"*")},true)})();<' +
			'/script>';
		let out = html;
		if (out.includes('</head>')) out = out.replace('</head>', style + '\n</head>');
		else if (out.includes('<body')) out = out.replace('<body', '<body style="font-family:' + opts.fontFamily + ';font-size:' + opts.fontSize + '%;max-width:42em;margin:0 auto;padding:1.5em 1em;"');
		else out = style + out;
		if (out.includes('</body>')) out = out.replace('</body>', linkScript + '\n</body>');
		else out = out + linkScript;
		return out;
	}

	async function applyChapterContent() {
		if (!parsed) return;
		const raw = await parsed.getChapterHtml(currentIndex);
		const currentHref = parsed.spine[currentIndex]?.href ?? '';
		chapterHtml = wrapWithReaderStyles(raw, {
			fontSize: readerFontSize,
			fontFamily: readerFontFamily,
			currentHref,
		});
		// Load next chapter for spread view
		const nextIdx = currentIndex + 1;
		if (nextIdx < parsed.spine.length) {
			const nextRaw = await parsed.getChapterHtml(nextIdx);
			const nextHref = parsed.spine[nextIdx]?.href ?? '';
			nextChapterHtml = wrapWithReaderStyles(nextRaw, {
				fontSize: readerFontSize,
				fontFamily: readerFontFamily,
				currentHref: nextHref,
			});
		} else {
			nextChapterHtml = '';
		}
	}

	function handleEpubNavigate(href: string) {
		if (!parsed) return;
		const currentHref = parsed.spine[currentIndex]?.href ?? '';
		const currentDir = currentHref.includes('/') ? currentHref.replace(/\/[^/]+$/, '/') : '';
		const pathOnly = href.split('#')[0].trim();
		if (!pathOnly) return;
		const resolved = resolveRelativePath(currentDir, pathOnly);
		for (let i = 0; i < parsed.spine.length; i++) {
			const itemPath = parsed.spine[i].href.split('#')[0];
			if (itemPath === resolved || itemPath.endsWith('/' + resolved) || resolved.endsWith('/' + itemPath)) {
				currentIndex = i;
				return;
			}
		}
	}

	$effect(() => {
		const bookId = page.params.id;
		if (!bookId) return;
		loadBook(bookId);
	});

	$effect(() => {
		if (!parsed || loading) return;
		currentIndex;
		readerFontSize;
		readerFontFamily;
		void applyChapterContent();
	});

	async function loadBook(bookId: string) {
		loading = true;
		error = null;
		parsed = null;
		chapterHtml = '';
		tocLabels = new Map();
		try {
			const record = await getBook(bookId);
			if (!record) {
				error = m.reader_error_not_found();
				return;
			}
			parsed = await parseEpub(record.blob);
			tocLabels = await parsed.getTocLabels();
			await updateBookMetadata(bookId, { lastOpened: Date.now() });
			currentIndex = 0;
		} catch (err) {
			error = err instanceof Error ? err.message : m.reader_error_not_found();
		} finally {
			loading = false;
		}
	}

	function goToChapter(index: number) {
		if (!parsed || index < 0 || index >= parsed.spine.length) return;
		currentIndex = index;
	}

	function goPrev() {
		if (!parsed || currentIndex <= 0) return;
		currentIndex -= 1;
	}

	function goNext() {
		if (!parsed || currentIndex >= parsed.spine.length - 1) return;
		currentIndex += 1;
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
		if (!parsed) return;
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

	function onMessage(e: MessageEvent) {
		if (e.data?.type === 'epub-navigate' && typeof e.data.href === 'string') {
			handleEpubNavigate(e.data.href);
		}
	}

	onMount(() => {
		document.addEventListener('fullscreenchange', onFullScreenChange);
		document.addEventListener('keydown', onKeydown);
		window.addEventListener('message', onMessage);
		return () => {
			document.removeEventListener('fullscreenchange', onFullScreenChange);
			document.removeEventListener('keydown', onKeydown);
			window.removeEventListener('message', onMessage);
		};
	});

	// Chapter label: TOC title from nav doc, else fallback to id or "Chapter N"
	function chapterLabel(item: EpubSpineItem, index: number): string {
		const fromToc = tocLabels.get(index);
		if (fromToc) return fromToc;
		const id = item.id || '';
		if (id) return id.replace(/-/g, ' ').replace(/^chapter\s*/i, 'Ch. ');
		return `Chapter ${index + 1}`;
	}

	const title = $derived(parsed?.metadata.title ?? '');
	const canPrev = $derived(!!parsed && currentIndex > 0);
	const canNext = $derived(!!parsed && parsed.spine.length > 0 && currentIndex < parsed.spine.length - 1);

	// Scroll active TOC item into view when chapter changes
	$effect(() => {
		if (!tocListEl || !parsed) return;
		currentIndex;
		const active = tocListEl.querySelector('[data-toc-index="' + currentIndex + '"]');
		if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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
	{:else if parsed}
		<!-- Toolbar: epubreader-js style grid (menu-1 left | menu-2 right) -->
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
				<span class="text-sm opacity-70 tabular-nums min-w-[3rem] text-center">{currentIndex + 1} / {parsed.spine.length}</span>
				<button type="button" class="btn btn-sm btn-ghost" disabled={!canNext} onclick={goNext} title={m.reader_next()}>
					{m.reader_next()}
				</button>
			</div>
			<div class="menu-2 flex items-center justify-end gap-1 min-w-0">
				<!-- Spread: single / two pages -->
				<div class="dropdown dropdown-end hidden sm:block">
					<label tabindex="0" class="btn btn-sm btn-ghost gap-1" title={m.reader_spread()}>
						<span class="text-sm">{m.reader_spread()}</span>
					</label>
					<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-50 mt-1 w-40 p-2 shadow border border-base-300">
						<li>
							<button type="button" class="text-sm {spreadMode === 'single' ? 'active' : ''}" onclick={() => (spreadMode = 'single')}>
								{m.reader_spread_single()}
							</button>
						</li>
						<li>
							<button type="button" class="text-sm {spreadMode === 'double' ? 'active' : ''}" onclick={() => (spreadMode = 'double')}>
								{m.reader_spread_double()}
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

		<!-- TOC (left) + content (right) -->
		<div class="flex-1 flex min-h-0 overflow-hidden">
			<aside
				class="shrink-0 w-64 bg-base-200 border-r border-base-300 flex flex-col overflow-hidden {tocOpen ? 'flex' : 'hidden lg:flex'}"
				aria-label={m.reader_toc()}
			>
				<div class="shrink-0 p-3 border-b border-base-300 font-semibold text-sm">{m.reader_toc()}</div>
				<nav class="flex-1 overflow-y-auto overscroll-contain p-2" aria-label={m.reader_toc()}>
					<ul class="menu menu-sm gap-0.5 p-0" bind:this={tocListEl}>
						{#each parsed.spine as item, index (item.id + String(index))}
							<li class="w-full">
								<button
									type="button"
									data-toc-index={index}
									class="w-full text-left text-sm py-2 px-3 rounded-md {currentIndex === index ? 'btn-active bg-primary/15 text-primary font-medium' : 'hover:bg-base-300'}"
									onclick={() => goToChapter(index)}
								>
									{chapterLabel(item, index)}
								</button>
							</li>
						{/each}
					</ul>
				</nav>
			</aside>

			<!-- Content: epubreader-js style = prev (arrow) | viewer | next (arrow) -->
			<div bind:this={readerContainer} class="reader-content flex-1 min-w-0 flex flex-col bg-base-100 overflow-hidden">
				<div class="flex-1 min-h-0 flex items-stretch overflow-hidden">
					<!-- Prev arrow (large <) -->
					<button
						type="button"
						class="reader-arrow prev flex-shrink-0 flex items-center justify-start px-2 md:px-4 min-w-[48px] {!canPrev ? 'opacity-30 pointer-events-none' : 'hover:bg-base-200'} transition-colors"
						onclick={goPrev}
						title={m.reader_prev()}
						disabled={!canPrev}
					>
						<span class="text-4xl md:text-5xl lg:text-6xl font-bold text-base-content/40 hover:text-base-content/70 select-none" aria-hidden="true">&lt;</span>
					</button>

					<!-- Viewer: single or spread (two panels) -->
					<div class="viewer-container flex-1 min-w-0 flex items-stretch overflow-hidden {spreadMode === 'double' && nextChapterHtml ? 'reader-spread' : ''}">
						<div class="viewer-panel flex-1 min-w-0 overflow-auto flex justify-center bg-base-100">
							<div class="w-full max-w-3xl min-h-full">
								{#key currentIndex}
									<iframe
										title="Chapter content"
										sandbox="allow-same-origin allow-scripts"
										class="w-full min-h-full border-0 block"
										style="height: 100%; min-height: 60vh;"
										srcdoc={chapterHtml}
									></iframe>
								{/key}
							</div>
						</div>
						{#if spreadMode === 'double' && nextChapterHtml}
							<div class="reader-spread-divider hidden min-[800px]:block w-px flex-shrink-0 bg-base-300 border-l border-dashed" aria-hidden="true"></div>
							<div class="viewer-panel right flex-1 min-w-0 overflow-auto hidden min-[800px]:flex justify-center bg-base-100">
								<div class="w-full max-w-3xl min-h-full">
									<iframe
										title="Next chapter"
										sandbox="allow-same-origin allow-scripts"
										class="w-full min-h-full border-0 block"
										style="height: 100%; min-height: 60vh;"
										srcdoc={nextChapterHtml}
									></iframe>
								</div>
							</div>
						{/if}
					</div>

					<!-- Next arrow (large >) -->
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
