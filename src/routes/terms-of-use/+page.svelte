<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.seo_terms_title()}</title>
	<meta name="description" content={m.seo_terms_description()} />
	<meta name="keywords" content={m.seo_terms_keywords()} />
</svelte:head>

<main class="page-content text-base-content/90 px-4 py-8 md:py-10">
	<h1>{m.nav_terms()}</h1>
	<p>{m.terms_intro()}</p>

	<section class="section-block">
		<h2>{m.terms_use_title()}</h2>
		<p>{m.terms_use_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.terms_content_title()}</h2>
		<p>{m.terms_content_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.terms_disclaimer_title()}</h2>
		<p>{m.terms_disclaimer_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.terms_changes_title()}</h2>
		<p>{m.terms_changes_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.terms_contact_title()}</h2>
		<p>{m.terms_contact_body()}</p>
	</section>
</main>
