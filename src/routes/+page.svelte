<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { listBooks, saveBook, deleteBook, getBook, getBookIdFromContent, updateBookMetadata, parseEpub } from '$lib';
	import { m } from '$lib/paraglide/messages';
	import '../app.css';

	type BookEntry = { id: string; title: string; cover?: string; lastOpened?: number };

	let books = $state<BookEntry[]>([]);
	let uploading = $state(false);
	let error = $state<string | null>(null);
	let errorDetail = $state<string | null>(null);
	let libraryError = $state<string | null>(null);
	let fileInput: HTMLInputElement;

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

	async function loadBooks() {
		libraryError = null;
		try {
			const list = await listBooks();
			books = list.map((b) => ({ id: b.id, title: b.title || m.book_unknown(), cover: b.cover, lastOpened: b.lastOpened }));
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (isStorageError(msg)) {
				libraryError = m.storage_full_library();
			}
			books = [];
		}
	}

	onMount(() => {
		loadBooks();
	});

	async function removeBook(e: Event, id: string) {
		e.preventDefault();
		e.stopPropagation();
		try {
			await deleteBook(id);
			await loadBooks();
		} catch {
			error = m.upload_error_storage();
		}
	}

	async function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !file.name.toLowerCase().endsWith('.epub')) return;
		uploading = true;
		error = null;
		errorDetail = null;
		try {
			const arrayBuffer = await file.arrayBuffer();
			const blob = new Blob([arrayBuffer], { type: 'application/epub+zip' });
			const id = await getBookIdFromContent(arrayBuffer);
			const existing = await getBook(id);
			if (existing) {
				await updateBookMetadata(id, { lastOpened: Date.now() });
				await loadBooks();
				input.value = '';
				goto(`/reader/${id}`);
				return;
			}
			const parsed = await parseEpub(blob);
			let coverDataUrl: string | undefined;
			try {
				coverDataUrl = (await parsed.getCoverDataUrl()) ?? undefined;
			} catch {
				coverDataUrl = undefined;
			}
			await saveBook({
				id,
				blob,
				metadata: {
					title: parsed.metadata.title,
					cover: coverDataUrl,
					lastOpened: Date.now(),
					spineLength: parsed.spine.length,
				},
			});
			await loadBooks();
			input.value = '';
			goto(`/reader/${id}`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			if (isStorageError(msg)) {
				error = m.upload_error_storage();
			} else {
				error = m.upload_error_invalid();
				errorDetail = msg;
				console.error('EPUB parse error:', msg);
			}
		} finally {
			uploading = false;
		}
	}

	function openBook(id: string) {
		goto(`/reader/${id}`);
	}
</script>

<svelte:head>
	<title>{m.seo_landing_title()}</title>
	<meta name="description" content={m.seo_landing_description()} />
	<meta name="keywords" content={m.seo_landing_keywords()} />
</svelte:head>

<!-- Optional top ad slot (future Google Ads). Hidden until ads are added. -->
<div class="w-full max-w-[728px] mx-auto py-1 hidden" aria-hidden="true">
	<!-- Ad slot: e.g. 728x90 -->
</div>

<main class="flex-1 w-full max-w-4xl mx-auto px-4 py-6 md:py-8 min-h-0 overflow-auto">
	<!-- Hero -->
	<section class="text-center mb-8 md:mb-10">
		<h1 class="text-2xl md:text-3xl font-bold mb-2">{m.landing_title()}</h1>
		<p class="text-base-content/80 text-sm md:text-base max-w-xl mx-auto">
			{m.landing_tagline()}
		</p>
	</section>

	<!-- Upload card -->
	<section class="card bg-base-100 shadow-sm border border-base-300 mb-8">
		<div class="card-body">
			<h2 class="card-title text-lg">{m.upload_new_file()}</h2>
			<div class="form-control w-full max-w-md">
				<label for="epub-upload" class="label">
					<span class="label-text">.epub</span>
				</label>
				<input
					id="epub-upload"
					bind:this={fileInput}
					type="file"
					accept=".epub"
					class="file-input file-input-bordered w-full"
					onchange={onFileChange}
					disabled={uploading}
				/>
			</div>
			{#if uploading}
				<p class="text-sm text-base-content/70 flex items-center gap-2">
					<span class="loading loading-spinner loading-sm"></span>
					{m.uploading()}
				</p>
			{/if}
			{#if error}
				<div class="alert alert-error text-sm mt-2">
					<span>{error}</span>
					{#if errorDetail}
						<span class="block mt-1 text-xs opacity-80">{errorDetail}</span>
					{/if}
				</div>
			{/if}
		</div>
	</section>

	<!-- Gallery -->
	<section>
		<h2 class="text-lg font-semibold mb-4">{m.your_library()}</h2>
		{#if libraryError}
			<div class="alert alert-warning text-sm mb-4">
				<span>{libraryError}</span>
			</div>
		{/if}
		{#if books.length === 0}
			<div class="card bg-base-100/50 border border-base-300 border-dashed">
				<div class="card-body items-center justify-center py-12 text-center">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
					<p class="text-base-content/70">{m.gallery_empty()}</p>
				</div>
			</div>
		{:else}
			<ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
				{#each books as book (book.id)}
					<li class="relative group">
						<button
							type="button"
							class="card card-compact bg-base-100 shadow hover:shadow-md border border-base-300 hover:border-primary/30 w-full h-full text-left transition-all"
							onclick={() => openBook(book.id)}
						>
							<figure class="px-4 pt-4 pb-1">
								{#if book.cover}
									<img
										src={book.cover}
										alt=""
										class="w-full aspect-[3/4] object-cover rounded-lg"
									/>
								{:else}
									<div class="w-full aspect-[3/4] bg-base-300 rounded-lg flex items-center justify-center">
										<svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
										</svg>
									</div>
								{/if}
							</figure>
							<div class="card-body p-4 pt-2">
								<h3 class="card-title text-sm font-medium line-clamp-2 min-h-[2.5rem]">
									{book.title}
								</h3>
								<p class="text-xs text-primary">{m.open_book()}</p>
							</div>
						</button>
						<button
							type="button"
							class="absolute top-2 right-2 btn btn-sm btn-ghost btn-circle opacity-0 group-hover:opacity-100 hover:bg-error/20 text-error transition-opacity"
							title={m.delete_book()}
							onclick={(e) => removeBook(e, book.id)}
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
