<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.seo_getting_started_title()}</title>
	<meta name="description" content={m.seo_getting_started_description()} />
	<meta name="keywords" content={m.seo_getting_started_keywords()} />
</svelte:head>

<main class="page-content px-4 py-8 md:py-10 text-base-content/90">
	<h1>{m.nav_getting_started()}</h1>
	<p>{m.getting_started_intro()}</p>

	<section class="section-block">
		<h2>{m.getting_started_upload_title()}</h2>
		<p>{m.getting_started_upload_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.getting_started_library_title()}</h2>
		<p>{m.getting_started_library_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.getting_started_reader_title()}</h2>
		<p>{m.getting_started_reader_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.getting_started_tips_title()}</h2>
		<ul>
			<li>{m.getting_started_tip_1()}</li>
			<li>{m.getting_started_tip_2()}</li>
			<li>{m.getting_started_tip_3()}</li>
		</ul>
	</section>

	<section class="section-block">
		<h2>{m.getting_started_why_title()}</h2>
		<p>{m.getting_started_why_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.getting_started_summary_title()}</h2>
		<p>{m.getting_started_summary_body()}</p>
	</section>

	<section class="promote-section">
		<h2>{m.promote_section_title()}</h2>
		<div class="promote-cards">
			<a href="/" class="promote-card card card-compact bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all no-underline">
				<div class="card-body p-4">
					<h3 class="card-title text-primary text-base">{m.promote_card_1_title()}</h3>
					<p class="text-sm text-base-content/80">{m.promote_card_1_body()}</p>
				</div>
			</a>
			<a href="/" class="promote-card card card-compact bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all no-underline">
				<div class="card-body p-4">
					<h3 class="card-title text-primary text-base">{m.promote_card_2_title()}</h3>
					<p class="text-sm text-base-content/80">{m.promote_card_2_body()}</p>
				</div>
			</a>
			<a href="/" class="promote-card card card-compact bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all no-underline">
				<div class="card-body p-4">
					<h3 class="card-title text-primary text-base">{m.promote_card_3_title()}</h3>
					<p class="text-sm text-base-content/80">{m.promote_card_3_body()}</p>
				</div>
			</a>
		</div>
		<div class="promote-cta">
			<a href="/" class="btn btn-primary">{m.promote_cta()}</a>
		</div>
	</section>

	<p>{m.getting_started_outro()}</p>
</main>
