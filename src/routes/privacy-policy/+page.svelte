<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.seo_privacy_title()}</title>
	<meta name="description" content={m.seo_privacy_description()} />
	<meta name="keywords" content={m.seo_privacy_keywords()} />
</svelte:head>

<main class="page-content text-base-content/90 px-4 py-8 md:py-10">
	<h1>{m.nav_privacy()}</h1>
	<p>{m.privacy_intro()}</p>

	<section class="section-block">
		<h2>{m.privacy_books_title()}</h2>
		<p>{m.privacy_books_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.privacy_usage_title()}</h2>
		<p>{m.privacy_usage_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.privacy_cookies_title()}</h2>
		<p>{m.privacy_cookies_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.privacy_third_title()}</h2>
		<p>{m.privacy_third_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.privacy_changes_title()}</h2>
		<p>{m.privacy_changes_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.privacy_contact_title()}</h2>
		<p>{m.privacy_contact_body()}</p>
	</section>
</main>
