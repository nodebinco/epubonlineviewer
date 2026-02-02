// place files you want to import through the `$lib` alias in this folder.

export {
	generateBookId,
	listBooks,
	getBook,
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
