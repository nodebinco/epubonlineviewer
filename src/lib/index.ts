// place files you want to import through the `$lib` alias in this folder.

export {
	getBookIdFromContent,
	listBooks,
	getBook,
	getBookArrayBuffer,
	saveBook,
	deleteBook,
	updateBookMetadata,
	type EpubBookMetadata,
	type EpubBookRecord,
} from './epub-store.js';

export {
	parseEpub,
	type EpubMetadata,
	type EpubSpineItem,
	type EpubParseResult,
} from './epub-parser.js';
