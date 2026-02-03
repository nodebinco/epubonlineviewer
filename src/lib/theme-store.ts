import { writable } from 'svelte/store';
import { getSetting, setSetting } from '$lib/epub-store';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'theme';

function applyThemeToDocument(theme: Theme) {
	if (typeof document === 'undefined') return;
	document.documentElement.setAttribute('data-theme', theme);
}

export const themeStore = writable<Theme>('light');

/** Load theme from IndexedDB and apply to document. Call once on app init (e.g. in layout). */
export async function initTheme(): Promise<void> {
	const saved = await getSetting(THEME_KEY);
	const theme: Theme = saved === 'dark' ? 'dark' : 'light';
	themeStore.set(theme);
	applyThemeToDocument(theme);
}

/** Set theme, persist to IndexedDB, and apply to document. */
export async function setTheme(theme: Theme): Promise<void> {
	themeStore.set(theme);
	await setSetting(THEME_KEY, theme);
	applyThemeToDocument(theme);
}
