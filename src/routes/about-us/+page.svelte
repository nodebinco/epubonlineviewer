<script lang="ts">
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.seo_about_title()}</title>
	<meta name="description" content={m.seo_about_description()} />
	<meta name="keywords" content={m.seo_about_keywords()} />
</svelte:head>

<main class="page-content text-base-content/90 px-4 py-8 md:py-10">
	<h1>{m.nav_about()}</h1>
	<p>{m.about_intro()}</p>

	<section class="section-block">
		<h2>{m.about_mission_title()}</h2>
		<p>{m.about_mission_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.about_how_title()}</h2>
		<p>{m.about_how_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.about_who_title()}</h2>
		<p>{m.about_who_body()}</p>
	</section>

	<section class="section-block">
		<h2>{m.about_values_title()}</h2>
		<p>{m.about_values_body()}</p>
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

	<p>{m.about_contact()}</p>
</main>
