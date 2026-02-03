<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		listBooks,
		saveBook,
		deleteBook,
		getBook,
		getBookIdFromContent,
		updateBookMetadata,
		parseEpub
	} from '$lib';
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
			books = list.map((b) => ({
				id: b.id,
				title: b.title || m.book_unknown(),
				cover: b.cover,
				lastOpened: b.lastOpened
			}));
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

	async function processFile(file: File) {
		if (!file.name.toLowerCase().endsWith('.epub')) return;
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
				await new Promise((r) => setTimeout(r, 50));
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
					spineLength: parsed.spine.length
				}
			});
			await loadBooks();
			await new Promise((r) => setTimeout(r, 80));
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

	async function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		await processFile(file);
		input.value = '';
	}

	let dropZoneActive = $state(false);

	function onDropZoneClick() {
		if (uploading) return;
		fileInput?.click();
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (uploading) return;
		dropZoneActive = true;
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dropZoneActive = false;
	}

	async function onDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		dropZoneActive = false;
		if (uploading) return;
		const file = e.dataTransfer?.files?.[0];
		if (!file) return;
		await processFile(file);
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


<main class="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-auto px-4 py-6 md:py-8">
	<!-- Hero -->
	<section class="mb-8 text-center md:mb-10">
		<h1 class="mb-2 text-2xl font-bold md:text-3xl">{m.landing_title()}</h1>
		<p class="text-base-content/80 mx-auto max-w-xl text-sm md:text-base">
			{m.landing_tagline()}
		</p>
	</section>

	<!-- Upload zone: drag & drop + click to browse -->
	<section class="mb-8">
		<h2 class="sr-only">{m.upload_new_file()}</h2>
		<input
			id="epub-upload"
			bind:this={fileInput}
			type="file"
			accept=".epub,application/epub+zip"
			class="sr-only"
			onchange={onFileChange}
			disabled={uploading}
			aria-hidden="true"
		/>
		<button
			type="button"
			class="focus-visible:ring-primary w-full rounded-2xl border-2 border-dashed transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 {dropZoneActive
				? 'border-primary bg-primary/10 scale-[1.01]'
				: 'border-base-300 bg-base-200/50 hover:border-base-content/30 hover:bg-base-200'} {uploading
				? 'pointer-events-none opacity-70'
				: 'cursor-pointer'}"
			ondragenter={onDragOver}
			ondragover={onDragOver}
			ondragleave={onDragLeave}
			ondrop={onDrop}
			onclick={onDropZoneClick}
			disabled={uploading}
			aria-label={m.upload_new_file()}
		>
			<div class="flex flex-col items-center justify-center gap-3 px-6 py-12 md:px-8 md:py-16">
				{#if uploading}
					<span class="loading loading-spinner loading-lg text-primary" aria-hidden="true"></span>
					<p class="text-base-content/80 text-base font-medium">{m.uploading()}</p>
				{:else}
					<div
						class="bg-base-300/80 text-base-content/60 rounded-xl p-4 {dropZoneActive
							? 'bg-primary/20 text-primary'
							: ''}"
						aria-hidden="true"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-12 w-12 md:h-14 md:w-14"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					</div>
					<div class="space-y-1 text-center">
						<p class="text-base-content text-base font-semibold md:text-lg">
							{typeof m.upload_drop_here === 'function'
								? m.upload_drop_here()
								: 'Drag and drop your EPUB here'}
						</p>
						<p class="text-base-content/60 text-sm">
							{typeof m.upload_or_browse === 'function'
								? m.upload_or_browse()
								: 'or click to browse'}
						</p>
						<p class="text-base-content/50 mt-1 text-xs">
							{typeof m.upload_accept_epub === 'function'
								? m.upload_accept_epub()
								: '.epub files only'}
						</p>
					</div>
				{/if}
			</div>
		</button>
		{#if error}
			<div class="alert alert-error mt-4 text-sm shadow-sm" role="alert">
				<span>{error}</span>
				{#if errorDetail}
					<span class="mt-1 block text-xs opacity-80">{errorDetail}</span>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Gallery -->
	<section>
		<h2 class="mb-4 text-lg font-semibold">{m.your_library()}</h2>
		{#if libraryError}
			<div class="alert alert-warning mb-4 text-sm">
				<span>{libraryError}</span>
			</div>
		{/if}
		{#if books.length === 0}
			<div class="card bg-base-100/50 border-base-300 border border-dashed">
				<div class="card-body items-center justify-center py-12 text-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="text-base-content/30 mb-2 h-12 w-12"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
					<p class="text-base-content/70">{m.gallery_empty()}</p>
				</div>
			</div>
		{:else}
			<ul class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
				{#each books as book (book.id)}
					<li class="group relative">
						<button
							type="button"
							class="card card-compact bg-base-100 border-base-300 hover:border-primary/30 h-full w-full border text-left shadow transition-all hover:shadow-md"
							onclick={() => openBook(book.id)}
						>
							<figure class="px-4 pt-4 pb-1">
								{#if book.cover}
									<img
										src={book.cover}
										alt=""
										class="aspect-[3/4] w-full rounded-lg object-cover"
									/>
								{:else}
									<div
										class="bg-base-300 flex aspect-[3/4] w-full items-center justify-center rounded-lg"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="text-base-content/40 h-10 w-10"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="1.5"
												d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
											/>
										</svg>
									</div>
								{/if}
							</figure>
							<div class="card-body p-4 pt-2">
								<h3 class="card-title line-clamp-2 min-h-[2.5rem] text-sm font-medium">
									{book.title}
								</h3>
								<p class="text-primary text-xs">{m.open_book()}</p>
							</div>
						</button>
						<button
							type="button"
							class="btn btn-sm btn-ghost btn-circle hover:bg-error/20 text-error absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
							title={m.delete_book()}
							onclick={(e) => removeBook(e, book.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<!-- Content below library: features, benefits, why use us (same width as upload) -->
	<article
		class="home-content text-base-content/90 mx-auto mt-10 w-full max-w-4xl space-y-8 px-4 md:mt-14 md:space-y-10"
	>
		<!-- Intro -->
		<section class="section-narrow space-y-3">
			<h2>{m.home_seo_heading()}</h2>
			<p>{m.home_seo_intro()}</p>
			<p>{m.home_intro_2()}</p>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- Why use us -->
		<section class="space-y-3">
			<h3 class="section-narrow">{m.home_why_title()}</h3>
			<p class="section-narrow">{m.home_why_intro()}</p>
			<p class="section-narrow">{m.home_why_more()}</p>
			<div class="mt-4 grid gap-3 sm:grid-cols-2">
				<div class="card bg-base-200/70 border-base-300 border shadow-sm">
					<div class="card-body p-4">
						<span class="badge badge-primary badge-sm mb-1 w-fit">Free</span>
						<p>{m.home_why_free()}</p>
					</div>
				</div>
				<div class="card bg-base-200/70 border-base-300 border shadow-sm">
					<div class="card-body p-4">
						<span class="badge badge-primary badge-sm mb-1 w-fit">Private</span>
						<p>{m.home_why_private()}</p>
					</div>
				</div>
				<div class="card bg-base-200/70 border-base-300 border shadow-sm">
					<div class="card-body p-4">
						<span class="badge badge-primary badge-sm mb-1 w-fit">Simple</span>
						<p>{m.home_why_simple()}</p>
					</div>
				</div>
				<div class="card bg-primary/10 border-primary/20 border shadow-sm">
					<div class="card-body p-4">
						<span class="badge badge-primary badge-sm mb-1 w-fit">Reader</span>
						<p>{m.home_why_reader()}</p>
					</div>
				</div>
			</div>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- Features grid -->
		<section class="space-y-3">
			<h3 class="section-narrow">{m.home_features_title()}</h3>
			<div class="grid gap-3 sm:grid-cols-2">
				<div
					class="card bg-base-100 border-base-300 border shadow-sm transition-shadow hover:shadow"
				>
					<div class="card-body p-4">
						<h4 class="text-primary">{m.home_feature_upload_title()}</h4>
						<p>{m.home_feature_upload_body()}</p>
					</div>
				</div>
				<div
					class="card bg-base-100 border-base-300 border shadow-sm transition-shadow hover:shadow"
				>
					<div class="card-body p-4">
						<h4 class="text-primary">{m.home_feature_reader_title()}</h4>
						<p>{m.home_feature_reader_body()}</p>
					</div>
				</div>
				<div
					class="card bg-base-100 border-base-300 border shadow-sm transition-shadow hover:shadow"
				>
					<div class="card-body p-4">
						<h4 class="text-primary">{m.home_feature_custom_title()}</h4>
						<p>{m.home_feature_custom_body()}</p>
					</div>
				</div>
				<div
					class="card bg-base-100 border-base-300 border shadow-sm transition-shadow hover:shadow"
				>
					<div class="card-body p-4">
						<h4 class="text-primary">{m.home_feature_lang_title()}</h4>
						<p>{m.home_feature_lang_body()}</p>
					</div>
				</div>
				<div
					class="card bg-base-100 border-base-300 border shadow-sm transition-shadow hover:shadow sm:col-span-2"
				>
					<div class="card-body p-4">
						<h4 class="text-primary">{m.home_feature_device_title()}</h4>
						<p>{m.home_feature_device_body()}</p>
					</div>
				</div>
			</div>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- Benefits -->
		<section class="space-y-3">
			<h3 class="section-narrow">{m.home_benefits_title()}</h3>
			<ul class="section-narrow space-y-2">
				<li class="flex gap-2">
					<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">✓</span>
					<p>{m.home_benefit_1()}</p>
				</li>
				<li class="flex gap-2">
					<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">✓</span>
					<p>{m.home_benefit_2()}</p>
				</li>
				<li class="flex gap-2">
					<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">✓</span>
					<p>{m.home_benefit_3()}</p>
				</li>
				<li class="flex gap-2">
					<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">✓</span>
					<p>{m.home_benefit_4()}</p>
				</li>
				<li class="flex gap-2">
					<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">✓</span>
					<p>{m.home_benefit_5()}</p>
				</li>
				<li class="flex gap-2">
					<span class="text-primary mt-0.5 shrink-0" aria-hidden="true">✓</span>
					<p>{m.home_benefit_6()}</p>
				</li>
			</ul>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- Who it's for -->
		<section class="section-narrow space-y-2">
			<h3>{m.home_who_title()}</h3>
			<p>{m.home_who_body()}</p>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- Reader experience -->
		<section class="section-narrow space-y-2">
			<h3>{m.home_reader_title()}</h3>
			<p>{m.home_reader_body()}</p>
			<p>{m.home_reader_2()}</p>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- Quick tips -->
		<section class="section-narrow space-y-2">
			<h3>{m.home_tips_title()}</h3>
			<ul class="list-inside list-disc space-y-1.5">
				<li>{m.home_tips_1()}</li>
				<li>{m.home_tips_2()}</li>
				<li>{m.home_tips_3()}</li>
			</ul>
		</section>

		<div class="divider my-6" aria-hidden="true"></div>

		<!-- About the app -->
		<section class="section-narrow space-y-2">
			<h3>{m.home_seo_app_title()}</h3>
			<p>{m.home_seo_app_body()}</p>
		</section>

		<!-- CTA -->
		<section class="bg-base-200/80 border-base-300 rounded-xl border px-5 py-5 text-center">
			<h3 class="mb-2">{m.home_cta_title()}</h3>
			<p class="text-base-content/80 section-narrow mx-auto">{m.home_cta_body()}</p>
		</section>
	</article>
</main>
