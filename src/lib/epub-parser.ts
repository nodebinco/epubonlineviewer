import JSZip from 'jszip';

export interface EpubMetadata {
	title: string;
	creator?: string;
	language?: string;
	identifier?: string;
}

export interface EpubSpineItem {
	id: string;
	href: string; // path relative to OPF
	linear?: boolean;
}

export interface EpubParseResult {
	metadata: EpubMetadata;
	spine: EpubSpineItem[];
	coverHref?: string; // path to cover image if present
	getChapterHtml: (index: number) => Promise<string>;
	getChapterBlobUrl: (index: number) => Promise<string | null>;
	/** Get cover image as data URL if present. */
	getCoverDataUrl: () => Promise<string | null>;
	/** Get TOC labels (spine index -> chapter title). Resolved from nav document when available. */
	getTocLabels: () => Promise<Map<number, string>>;
}

const CONTAINER_PATH = 'META-INF/container.xml';
const MIMETYPE = 'application/epub+zip';

/**
 * Parse an EPUB blob: extract metadata, spine, and provide chapter content.
 * Uses JSZip; OPF/NCX parsing is minimal (enough for title, spine, cover).
 */
export async function parseEpub(blob: Blob): Promise<EpubParseResult> {
	const zip = await JSZip.loadAsync(blob);

	// Find rootfile from container.xml
	const containerXml = await zip.file(CONTAINER_PATH)?.async('string');
	if (!containerXml) throw new Error('Invalid EPUB: missing container.xml');

	const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
	if (!rootfileMatch) throw new Error('Invalid EPUB: no rootfile in container');
	const opfPath = rootfileMatch[1];
	const opfDir = opfPath.includes('/') ? opfPath.replace(/\/[^/]+$/, '/') : '';

	const opfXml = await zip.file(opfPath)?.async('string');
	if (!opfXml) throw new Error('Invalid EPUB: missing OPF');

	// Parse metadata and spine from OPF (simplified; no full OPF namespace handling)
	const metadata = parseOpfMetadata(opfXml);
	const { spine, manifest } = parseOpfSpineAndManifest(opfXml);
	const coverHref = parseOpfCover(opfXml, manifest);

	async function resolvePath(href: string): Promise<string> {
		if (href.startsWith('/')) return href.slice(1);
		// Resolve relative to OPF directory
		const base = opfDir || '';
		const parts = base.split('/').filter(Boolean);
		const rel = href.split('/').filter(Boolean);
		for (const p of rel) {
			if (p === '..') parts.pop();
			else parts.push(p);
		}
		return parts.join('/');
	}

	function resolveRelativePath(baseDir: string, href: string): string {
		const decoded = decodeURIComponent(href);
		const parts = baseDir ? baseDir.split('/').filter(Boolean) : [];
		const rel = decoded.split('/').filter(Boolean);
		for (const p of rel) {
			if (p === '..') parts.pop();
			else parts.push(p);
		}
		return parts.join('/');
	}

	async function getChapterHtml(index: number): Promise<string> {
		const item = spine[index];
		if (!item) throw new Error('Chapter index out of range');
		const fullPath = (await resolvePath(item.href)).replace(/\\/g, '/');
		const file = zip.file(fullPath);
		if (!file) throw new Error(`EPUB missing file: ${fullPath}`);
		let html = await file.async('string');
		const chapterDir = fullPath.includes('/') ? fullPath.replace(/\/[^/]+$/, '/') : '';
		// Rewrite img src to data URLs so images load inside srcdoc iframe (no external requests)
		html = await inlineChapterImages(html, chapterDir, zip, resolveRelativePath);
		return html;
	}

	async function inlineChapterImages(
		html: string,
		chapterDir: string,
		zip: JSZip,
		resolveRel: (base: string, href: string) => string
	): Promise<string> {
		const imgRegex = /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi;
		const srcToDataUrl = new Map<string, string>();
		const uniqueSrcs: string[] = [];
		let m: RegExpExecArray | null;
		while ((m = imgRegex.exec(html)) !== null) {
			const src = m[2].trim();
			if (src.startsWith('data:') || srcToDataUrl.has(src)) continue;
			uniqueSrcs.push(src);
			const resolvedPath = resolveRel(chapterDir, src.split('#')[0]);
			const imgFile = zip.file(resolvedPath);
			if (!imgFile) continue;
			const blob = await imgFile.async('blob');
			const dataUrl = await new Promise<string>((resolve, reject) => {
				const r = new FileReader();
				r.onload = () => resolve(r.result as string);
				r.onerror = reject;
				r.readAsDataURL(blob);
			});
			srcToDataUrl.set(src, dataUrl);
		}
		const replaceRegex = /<img([^>]*)\ssrc=["']([^"']+)["']([^>]*)>/gi;
		return html.replace(replaceRegex, (tag, before, src, after) => {
			const dataUrl = srcToDataUrl.get(src.trim());
			if (!dataUrl) return tag;
			return '<img' + before + ' src="' + dataUrl + '"' + after + '>';
		});
	}

	async function getChapterBlobUrl(index: number): Promise<string | null> {
		const item = spine[index];
		if (!item) return null;
		const fullPath = await resolvePath(item.href);
		const file = zip.file(fullPath);
		if (!file) return null;
		const blob = await file.async('blob');
		return URL.createObjectURL(blob);
	}

	const resolvedCoverHref = coverHref ? (await resolvePath(coverHref)).replace(/\\/g, '/') : undefined;

	async function getCoverDataUrl(): Promise<string | null> {
		// Try OPF-declared cover first
		if (resolvedCoverHref) {
			const file = zip.file(resolvedCoverHref);
			if (file) {
				const blob = await file.async('blob');
				return new Promise((resolve, reject) => {
					const r = new FileReader();
					r.onload = () => resolve(r.result as string);
					r.onerror = reject;
					r.readAsDataURL(blob);
				});
			}
		}
		// Fallback: first spine item may be cover XHTML with <img src="...">
		const firstItem = spine[0];
		if (!firstItem) return null;
		const firstPath = await resolvePath(firstItem.href);
		const firstFile = zip.file(firstPath);
		if (!firstFile) return null;
		const html = await firstFile.async('string');
		const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
		if (!imgMatch) return null;
		const imgSrc = imgMatch[1].trim();
		// Resolve image path relative to the HTML file's directory
		const firstDir = firstPath.includes('/') ? firstPath.replace(/\/[^/]+$/, '/') : '';
		const imgPath = resolveRelativePath(firstDir, imgSrc);
		const imgFile = zip.file(imgPath);
		if (!imgFile) return null;
		const blob = await imgFile.async('blob');
		return new Promise((resolve, reject) => {
			const r = new FileReader();
			r.onload = () => resolve(r.result as string);
			r.onerror = reject;
			r.readAsDataURL(blob);
		});
	}

	async function getTocLabels(): Promise<Map<number, string>> {
		const labels = new Map<number, string>();
		// Find nav document (EPUB 3: item with properties="nav")
		let navHref: string | undefined;
		for (const [, item] of manifest) {
			if (item.properties?.split(/\s+/).includes('nav')) {
				navHref = item.href;
				break;
			}
		}
		if (!navHref) return labels;
		const navPath = (await resolvePath(navHref)).replace(/\\/g, '/');
		const navDir = navPath.includes('/') ? navPath.replace(/\/[^/]+$/, '/') : '';
		const navFile = zip.file(navPath);
		if (!navFile) return labels;
		const navHtml = await navFile.async('string');
		// Find nav epub:type="toc" and collect <a href="...">text</a> (flat list)
		const tocNavMatch = navHtml.match(/<nav[^>]*epub:type=["']toc["'][^>]*>([\s\S]*?)<\/nav>/i);
		const tocBlock = tocNavMatch ? tocNavMatch[1] : navHtml;
		const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
		let linkMatch: RegExpExecArray | null;
		while ((linkMatch = linkRegex.exec(tocBlock)) !== null) {
			const href = linkMatch[1].trim().split('#')[0];
			const rawText = linkMatch[2];
			const text = rawText.replace(/<[^>]+>/g, '').trim();
			if (!text) continue;
			const resolvedHref = resolveRelativePath(navDir, href || '');
			const normalized = resolvedHref.replace(/\\/g, '/');
			for (let i = 0; i < spine.length; i++) {
				const itemHref = spine[i].href.split('#')[0];
				const itemPath = (await resolvePath(itemHref)).replace(/\\/g, '/');
				if (itemPath === normalized) {
					labels.set(i, text);
					break;
				}
			}
		}
		return labels;
	}

	return {
		metadata,
		spine,
		coverHref: resolvedCoverHref,
		getChapterHtml,
		getChapterBlobUrl,
		getCoverDataUrl,
		getTocLabels,
	};
}

function parseOpfMetadata(opf: string): EpubMetadata {
	const titleMatch = opf.match(/<dc:title[^>]*>([^<]+)</i) || opf.match(/<title[^>]*>([^<]+)</i);
	const creatorMatch = opf.match(/<dc:creator[^>]*>([^<]+)</i);
	const langMatch = opf.match(/<dc:language[^>]*>([^<]+)</i);
	const idMatch = opf.match(/<dc:identifier[^>]*>([^<]+)</i);
	return {
		title: titleMatch ? titleMatch[1].trim() : 'Unknown',
		creator: creatorMatch ? creatorMatch[1].trim() : undefined,
		language: langMatch ? langMatch[1].trim() : undefined,
		identifier: idMatch ? idMatch[1].trim() : undefined,
	};
}

interface ManifestItem {
	id: string;
	href: string;
	'media-type': string;
	properties?: string;
}

function parseOpfSpineAndManifest(opf: string): {
	spine: EpubSpineItem[];
	manifest: Map<string, ManifestItem>;
} {
	const manifest = new Map<string, ManifestItem>();
	const itemRegex = /<item\s+([^>]+)\s*\/?>/gi;
	let m: RegExpExecArray | null;
	while ((m = itemRegex.exec(opf)) !== null) {
		const attrs = m[1];
		const id = attrs.match(/id="([^"]+)"/)?.[1];
		const href = attrs.match(/href="([^"]+)"/)?.[1];
		const mt = attrs.match(/media-type="([^"]+)"/)?.[1];
		const props = attrs.match(/properties="([^"]*)"/)?.[1];
		if (id && href) manifest.set(id, { id, href, 'media-type': mt || '', properties: props });
	}

	const spine: EpubSpineItem[] = [];
	const spineRegex = /<itemref\s+idref="([^"]+)"(?:\s+linear="(no|yes)")?\s*\/?>/gi;
	while ((m = spineRegex.exec(opf)) !== null) {
		const idref = m[1];
		const linear = m[2] === 'no' ? false : true;
		const item = manifest.get(idref);
		if (item) spine.push({ id: item.id, href: item.href, linear });
	}

	return { spine, manifest };
}

function parseOpfCover(opf: string, manifest: Map<string, ManifestItem>): string | undefined {
	// 1) meta name="cover" content="cover-id" (ID of image or of item that references it)
	const coverMeta = opf.match(/<meta\s+name="cover"\s+content="([^"]+)"/i);
	if (coverMeta) {
		const item = manifest.get(coverMeta[1]);
		if (item?.href) {
			// If it's an image, use directly
			if (/image\//.test(item['media-type'] ?? '')) return item.href;
			// Else it might be an XHTML item that contains the cover image; we'll try fallbacks below
		}
	}
	// 2) Item with id containing "cover" and media-type image
	for (const [id, item] of manifest) {
		if (id.toLowerCase().includes('cover') && /image\//.test(item['media-type'] ?? ''))
			return item.href;
	}
	// 3) First image in manifest (many EPUBs have cover as first image)
	for (const [, item] of manifest) {
		if (/image\/(jpeg|jpg|png|gif|webp)/.test(item['media-type'] ?? '')) return item.href;
	}
	return undefined;
}

