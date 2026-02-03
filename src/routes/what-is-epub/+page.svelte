<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.seo_what_is_epub_title()}</title>
	<meta name="description" content={m.seo_what_is_epub_description()} />
	<meta name="keywords" content={m.seo_what_is_epub_keywords()} />
</svelte:head>

<main class="page-content text-base-content/90 px-4 py-8 md:py-10">
	<h1>{m.nav_what_is_epub()}</h1>
	<p>{m.what_is_epub_intro()}</p>

	<section class="section-block">
		<h2>{m.what_is_epub_what_title()}</h2>
		<p>{m.what_is_epub_what_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.what_is_epub_how_title()}</h2>
		<p>{m.what_is_epub_how_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.what_is_epub_versions_title()}</h2>
		<p>{m.what_is_epub_versions_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.what_is_epub_benefits_title()}</h2>
		<p>{m.what_is_epub_benefits_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.what_is_epub_where_title()}</h2>
		<p>{m.what_is_epub_where_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.what_is_epub_why_title()}</h2>
		<p>{m.what_is_epub_why_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.what_is_epub_summary_title()}</h2>
		<p>{m.what_is_epub_summary_body()}</p>
	</section>

	<section class="promote-section">
		<h2>{m.promote_section_title()}</h2>
		<div class="promote-cards">
			<a
				href="/"
				class="promote-card card card-compact bg-base-100 border-base-300 hover:border-primary/40 border no-underline shadow-sm transition-all hover:shadow-md"
			>
				<div class="card-body p-4">
					<h3 class="card-title text-primary text-base">{m.promote_card_1_title()}</h3>
					<p class="text-base-content/80 text-sm">{m.promote_card_1_body()}</p>
				</div>
			</a>
			<a
				href="/"
				class="promote-card card card-compact bg-base-100 border-base-300 hover:border-primary/40 border no-underline shadow-sm transition-all hover:shadow-md"
			>
				<div class="card-body p-4">
					<h3 class="card-title text-primary text-base">{m.promote_card_2_title()}</h3>
					<p class="text-base-content/80 text-sm">{m.promote_card_2_body()}</p>
				</div>
			</a>
			<a
				href="/"
				class="promote-card card card-compact bg-base-100 border-base-300 hover:border-primary/40 border no-underline shadow-sm transition-all hover:shadow-md"
			>
				<div class="card-body p-4">
					<h3 class="card-title text-primary text-base">{m.promote_card_3_title()}</h3>
					<p class="text-base-content/80 text-sm">{m.promote_card_3_body()}</p>
				</div>
			</a>
		</div>
		<div class="promote-cta">
			<a href="/" class="btn btn-primary">{m.promote_cta()}</a>
		</div>
	</section>
</main>
