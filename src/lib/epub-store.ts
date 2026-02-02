import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'epub-online-viewer';
const STORE_BOOKS = 'books';

export interface EpubBookMetadata {
	title: string;
	cover?: string; // data URL or blob URL
	lastOpened?: number; // timestamp
	/** Reading position: 0–1 percentage (for continue-from-last). */
	lastPosition?: number;
	spineLength?: number;
}

export interface EpubBookRecord {
	id: string;
	blob: Blob;
	metadata: EpubBookMetadata;
}

interface EpubDBSchema extends DBSchema {
	[STORE_BOOKS]: {
		key: string;
		value: EpubBookRecord;
		indexes: { 'by-last-opened': number };
	};
}

let dbPromise: Promise<IDBPDatabase<EpubDBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<EpubDBSchema>> {
	if (!dbPromise) {
		dbPromise = openDB<EpubDBSchema>(DB_NAME, 1, {
			upgrade(db) {
				const store = db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
				store.createIndex('by-last-opened', 'metadata.lastOpened');
			},
		});
	}
	return dbPromise;
}

/** Hash book content (SHA-256) to get a stable id. Same file => same id. */
export async function hashBookContent(arrayBuffer: ArrayBuffer): Promise<string> {
	const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Use content hash as book id (first 32 hex chars). Same content => same id => one stored file. */
export async function getBookIdFromContent(arrayBuffer: ArrayBuffer): Promise<string> {
	const fullHash = await hashBookContent(arrayBuffer);
	return fullHash.slice(0, 32);
}

/** List all stored books (metadata only; no blob). Sorted by lastOpened descending when present. */
export async function listBooks(): Promise<EpubBookMetadata & { id: string }[]> {
	const db = await getDB();
	const tx = db.transaction(STORE_BOOKS, 'readonly');
	const store = tx.objectStore(STORE_BOOKS);
	const all = await store.getAll();
	await tx.done;
	const withId = all.map((r) => ({ id: r.id, ...r.metadata }));
	withId.sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0));
	return withId;
}

/** Get a full book record (blob + metadata) by id. */
export async function getBook(id: string): Promise<EpubBookRecord | undefined> {
	const db = await getDB();
	return db.get(STORE_BOOKS, id);
}

/**
 * Get book as ArrayBuffer so the blob is read inside the same flow and not held as a reference.
 * Avoids "file could not be read... permission problems after reference was acquired" when
 * the IndexedDB transaction has closed and the blob becomes unreadable.
 */
export async function getBookArrayBuffer(id: string): Promise<{ metadata: EpubBookMetadata; arrayBuffer: ArrayBuffer } | undefined> {
	const db = await getDB();
	const record = await db.get(STORE_BOOKS, id);
	if (!record) return undefined;
	const arrayBuffer = await record.blob.arrayBuffer();
	return { metadata: record.metadata, arrayBuffer };
}

/** Save a book (blob + metadata). Id must be set on record. Stores blob as Blob per design (no MessagePack). */
export async function saveBook(record: EpubBookRecord): Promise<void> {
	const db = await getDB();
	await db.put(STORE_BOOKS, record);
}

/** Delete a book by id. */
export async function deleteBook(id: string): Promise<void> {
	const db = await getDB();
	await db.delete(STORE_BOOKS, id);
}

/** Update only metadata (e.g. lastOpened, reading position). */
export async function updateBookMetadata(
	id: string,
	metadata: Partial<EpubBookMetadata>
): Promise<void> {
	const existing = await getBook(id);
	if (!existing) return;
	await saveBook({
		...existing,
		metadata: { ...existing.metadata, ...metadata },
	});
}
