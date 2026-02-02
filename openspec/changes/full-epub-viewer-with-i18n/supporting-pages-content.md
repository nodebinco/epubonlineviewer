# Supporting Pages Content (SEO-friendly, long-form)

This document is the **content reference** for the five supporting pages. Use these sections as the source for Paraglide message keys (one key per paragraph or logical block). All content should be translated for every locale. Content is written to be useful for users and to target relevant search terms (e.g. read epub online, free epub viewer, what is epub, epub format).

**SEO per page:** Every page SHALL have a unique **title**, **meta description (snippet)** (~120–160 chars), and **meta keywords** (comma-separated). Optional: Open Graph and Twitter Card for share snippets. All meta SHALL be localizable (Paraglide). See the SEO block under each page below.

### SEO meta for other pages (landing, reader, legal)

**Landing (`/`)**

- **Title:** Read EPUB Online – Free EPUB Viewer | EPUB Online Viewer
- **Meta description (snippet):** Read EPUB ebooks in your browser. Upload once, read anytime. No account. Your books stay on your device. Free epub viewer with full-screen and many languages.
- **Keywords:** read epub online, free epub viewer, epub reader online, epub in browser, upload epub, epub library, no account epub reader

**Reader (`/reader/[id]`)**

- **Title:** [Book title] – Read Online | EPUB Online Viewer (or dynamic: book title from metadata)
- **Meta description (snippet):** Read [book title] in your browser. EPUB Online Viewer – full-screen, chapter navigation, reading position saved. Read epub online.
- **Keywords:** read epub online, epub reader, epub viewer, [book title], full-screen reading

**Legal / info (about-us, contact-us, privacy-policy, terms-of-use):** Each SHALL have its own unique title, meta description (snippet), and keywords (e.g. about us, contact, privacy policy, terms of use, epub online viewer).

---

## 1. Getting Started (`/getting-started`)

**SEO**

- **Title:** Getting Started – Read EPUBs Online | EPUB Online Viewer
- **Meta description (snippet):** Learn how to upload EPUB ebooks and read them in your browser. No account needed. Upload once, read anytime—your books stay on your device. Step-by-step guide.
- **Keywords:** getting started, read epub online, upload epub, epub viewer, free epub reader, epub in browser, how to read epub

**Content:**

### Welcome to EPUB Online Viewer

EPUB Online Viewer lets you read EPUB ebooks directly in your browser—no app install, no account, and no subscription. Your books stay on your device in your browser’s storage, so you can upload once and read again anytime. This guide walks you through uploading your first EPUB and reading it on any device with a modern browser.

### Why read EPUBs in the browser?

Reading EPUBs online is convenient: you don’t need a dedicated e-reader app or device. Open the website, upload your `.epub` file, and start reading. Your library is stored locally in your browser (using IndexedDB), so your files never leave your device. That means better privacy and the ability to read offline after the first load. Many users also prefer a single place to read—whether on a laptop, tablet, or phone—without syncing or logging in.

### Step 1: Open the app

Go to the homepage of EPUB Online Viewer. You’ll see the main screen with two areas: an **upload** area to add a new EPUB file, and a **library** (gallery) showing books you’ve already uploaded. If this is your first visit, the library will be empty.

### Step 2: Upload an EPUB file

Click or tap the upload area (or “Upload new file”) and choose an `.epub` file from your device. The app will read the file, extract the book’s metadata (title, cover, chapters), and save it in your browser’s local storage. Upload usually takes a few seconds depending on file size. When it’s done, the new book appears in your library on the same page. You can then open it to start reading or upload more books.

### Step 3: Open a book from your library

In the library section, you’ll see all the EPUBs you’ve uploaded. Each entry shows the book’s title and cover (if available). Click or tap a book to open the reader. The reader will open to the first chapter—or to your last position if you’ve read the book before and the app has saved your progress.

### Step 4: Read and navigate

Inside the reader you can move between chapters using **Previous** and **Next** (or the keyboard shortcuts listed on the Keyboard Shortcuts page). You can switch to **full-screen mode** for a distraction-free reading experience. Your reading position can be saved automatically so you can continue later. To return to your library, use the back or home link.

### Tips for the best experience

- **Supported format:** Use standard EPUB (`.epub`) files. For details and limits, see the Supported Formats page.
- **Same browser:** Your library is stored per browser and device. To see the same books on another device, you’d need to upload them there again (we don’t sync to the cloud).
- **Clearing data:** If you clear your browser’s site data or use private/incognito mode, your stored books may be removed. Use a normal browsing session if you want to keep your library.
- **Language:** The app is available in many languages. Use the language selector to switch.

If you run into issues, check the FAQ or the Supported Formats page. Happy reading!

---

## 2. What Is an EPUB File? (`/what-is-epub`)

**SEO**

- **Title:** What Is an EPUB File? – EPUB Format Explained | EPUB Online Viewer
- **Meta description (snippet):** What is an EPUB file? Learn the EPUB ebook format: structure, EPUB 2 vs EPUB 3, and why EPUB is ideal for reading online. Reflowable, open standard, widely supported.
- **Keywords:** what is epub, epub format, epub file, epub explained, ebook format, epub 2, epub 3, electronic publication, read epub online

**Content:**

### Introduction to the EPUB format

EPUB (short for “electronic publication”) is a standard format for ebooks. It’s widely used for digital books because it’s open, reflowable (text adapts to screen size), and works across devices and apps. If you’ve ever downloaded an ebook from a library or store, chances are it was an EPUB or a variant of it. This page explains what an EPUB file is, how it’s structured, and why it’s a good choice for reading online.

### What does “EPUB” mean?

EPUB is a file format (usually with the extension `.epub`) that packages a book’s text, images, and metadata into a single file. The format is defined by the IDPF (International Digital Publishing Forum), now part of the W3C. EPUB 2 and EPUB 3 are the main versions in use today. Most readers and apps, including EPUB Online Viewer, support both. The file is essentially a ZIP archive containing XHTML (or HTML) for the text, CSS for styling, images, and XML files that describe the book’s structure (chapters, order, metadata).

### Why choose EPUB over other ebook formats?

- **Reflowable text:** Unlike a fixed layout (e.g. some PDFs), EPUB text reflows when you change font size or screen size. That makes it comfortable to read on phones, tablets, and desktops.
- **Open standard:** EPUB is an open standard, so many tools can create, edit, and read EPUBs. You’re not locked into one vendor.
- **Rich structure:** EPUB supports chapters, table of contents, images, and metadata (title, author, language). That enables features like “go to chapter” and “resume where you left off.”
- **Widely supported:** Most ebook stores and libraries offer EPUB. Reading EPUBs online in a browser is a natural next step.

### How is an EPUB file structured?

Under the hood, an EPUB file is a ZIP archive. Inside you’ll find folders such as `META-INF` and `OEBPS` (or similar), and files like `mimetype`, `content.opf` (package document), `toc.ncx` or `nav.xhtml` (table of contents), and XHTML/HTML files for each chapter. The package document lists all resources and the reading order (spine). EPUB Online Viewer and similar apps parse this structure to show chapters and navigate the book. You don’t need to understand this to read an EPUB—we handle it for you.

### EPUB vs PDF and other formats

- **EPUB vs PDF:** PDFs are often fixed layout and better for print-like documents. EPUBs are designed for on-screen reading with reflow and optional accessibility features. For long-form reading, EPUB is usually more flexible.
- **EPUB vs Kindle (AZW, KFX):** Kindle uses its own formats. If you have an EPUB, you can read it in EPUB Online Viewer or other EPUB-compatible apps; Kindle formats require Kindle apps or devices.
- **EPUB vs plain text/HTML:** EPUB adds structure (chapters, TOC, metadata) and packaging (one file). That makes it easier for readers to navigate and for apps to provide a consistent experience.

### Where can I get EPUB files?

Many public-domain and open-license books are available as EPUB (e.g. Project Gutenberg, open libraries). Commercial ebook stores and libraries often offer EPUB as well. Always respect copyright and terms of use. EPUB Online Viewer does not distribute books—you upload your own files and read them locally in your browser.

### Summary

An EPUB file is a standard, open ebook format that combines text, images, and metadata in a single, reflowable package. It’s ideal for reading on screens and is widely supported. With EPUB Online Viewer, you can read EPUBs directly in your browser without installing an app, and your books stay on your device for privacy and offline access.

---

## 3. Supported Formats (`/supported-formats`)

**SEO**

- **Title:** Supported Formats & Limits – EPUB Online Viewer
- **Meta description (snippet):** EPUB Online Viewer supports EPUB 2 and EPUB 3. No PDF or Kindle formats. DRM-free only. File size and browser storage limits explained. Read epub online in your browser.
- **Keywords:** supported formats, epub support, epub 2, epub 3, epub file size, epub limits, read epub online, epub viewer, no pdf, no kindle, drm-free epub

**Content:**

### Which file formats are supported?

EPUB Online Viewer supports **EPUB** ebooks. You can upload any standard EPUB file (typically with the extension `.epub`). We support both **EPUB 2** and **EPUB 3** specifications, which cover the vast majority of ebooks available today. The app reads the book’s metadata (title, author, cover) and structure (chapters, table of contents) so you can navigate and read normally.

### What is an EPUB file?

An EPUB file is a packaged ebook format (see our “What is an EPUB file?” page for a full explanation). It’s a ZIP-based container that holds XHTML/HTML content, CSS, images, and metadata. Most ebooks from libraries and stores that aren’t Kindle-specific are distributed as EPUB. If you have a file that ends in `.epub`, you can try uploading it here.

### File size and performance

We don’t enforce a strict maximum file size, but very large EPUBs (e.g. hundreds of megabytes) may take longer to upload and parse. Your browser’s IndexedDB storage also has limits per origin (often in the range of hundreds of MB to several GB, depending on the browser and device). For the best experience, we recommend EPUBs in the range of a few MB to tens of MB—typical for most novels and non-fiction. If you hit storage limits, the app will show an error; you may need to remove some stored books or free space.

### Unsupported formats

We do **not** support PDF, Kindle (AZW, KFX), MOBI (old Kindle), or other non-EPUB formats in this app. If your book is in another format, you’ll need to convert it to EPUB using external tools or use another reader that supports that format. We focus on EPUB to keep the app simple and reliable for online EPUB reading.

### DRM-protected ebooks

EPUB Online Viewer does not support DRM (Digital Rights Management). If your ebook is protected by DRM (e.g. from a commercial store that locks files to a specific app or device), it will not open correctly here. You’ll need to read DRM-protected books in the app or device provided by the seller. We support only DRM-free EPUB files.

### Browsers and devices

The app runs in modern browsers that support IndexedDB, the File API, and current web standards. We recommend the latest versions of Chrome, Firefox, Safari, or Edge on desktop or mobile. Older browsers may not support all features or may have lower storage limits. The app is responsive so you can read on phones, tablets, and desktops.

### Summary

- **Supported:** EPUB (`.epub`), EPUB 2 and EPUB 3.
- **Storage:** Your books are stored in your browser (IndexedDB); size limits depend on your browser and device.
- **Not supported:** PDF, Kindle formats, DRM-protected ebooks, other non-EPUB formats.
- **Recommendation:** Use typical-sized, DRM-free EPUB files for the best experience.

For more details on the EPUB format, see “What is an EPUB file?” For step-by-step usage, see “Getting started.”

---

## 4. Keyboard Shortcuts (`/keyboard-shortcuts`)

**SEO**

- **Title:** Keyboard Shortcuts – EPUB Online Viewer
- **Meta description (snippet):** Keyboard shortcuts for EPUB Online Viewer: previous/next chapter, full-screen, exit reader. Navigate and read epub online with the keyboard.
- **Keywords:** keyboard shortcuts, epub reader shortcuts, epub viewer shortcuts, full-screen epub, read epub keyboard, epub navigation

**Content:**

### Using keyboard shortcuts

Keyboard shortcuts let you navigate the reader and the app without using the mouse or touch. This page lists the shortcuts available in EPUB Online Viewer. Shortcuts are available when the reader or the relevant element has focus; some may only work in the reader view.

### Reader shortcuts

- **Previous chapter / page:** Go to the previous chapter (or previous page, depending on implementation). Useful for moving backward in the book.
- **Next chapter / page:** Go to the next chapter (or next page). Use this to move forward.
- **Full-screen:** Toggle full-screen mode for the reader. In full-screen, the book content fills the screen for a distraction-free read. Exit full-screen with the same shortcut or by pressing Escape.
- **Escape:** Exit full-screen mode (when the reader is in full-screen).

Exact key bindings (e.g. Arrow Left/Right, Page Up/Down, or custom keys) should be defined in the app and listed here. Example: “Left arrow: previous; Right arrow: next; F: full-screen; Esc: exit full-screen.” Implement and then fill in the real keys for your build.

### App and navigation shortcuts

- **Home / Back:** Return to the main page (upload and library). Depending on implementation, this may be a link or a shortcut (e.g. Alt+Home or a visible “Home” button).
- **Open table of contents:** If the reader has a TOC panel, a shortcut (e.g. Ctrl+O or a stated key) can open or focus it so you can jump to a chapter by keyboard.

List the actual key bindings your app uses so users can rely on this page as the single reference. If you add more shortcuts later (e.g. font size, theme), add them here and keep the list up to date.

### Tips

- Shortcuts may not work when focus is in an input field (e.g. search). Click back into the reader or press Tab to refocus.
- On some mobile devices, keyboard shortcuts are less relevant; touch gestures (swipe, tap) are used instead. Consider adding a short note for mobile users.
- Keeping shortcuts consistent with common reader apps (e.g. arrows for prev/next) helps accessibility and muscle memory.

---

## 5. FAQ (`/faq`)

**SEO**

- **Title:** Frequently Asked Questions – EPUB Online Viewer
- **Meta description (snippet):** FAQ: Is EPUB Online Viewer free? Where are my books stored? Supported formats, reading position, full-screen, privacy. Read epub online without an account.
- **Keywords:** faq, frequently asked questions, epub viewer faq, read epub online free, epub storage, epub privacy, epub format support, epub viewer help

**Content:**

### General

**What is EPUB Online Viewer?**

EPUB Online Viewer is a web app that lets you read EPUB ebooks in your browser. You upload your own `.epub` files; they’re stored locally in your browser (IndexedDB). You can then open any uploaded book from your library and read it with chapter navigation and full-screen mode. No account or subscription is required. The app is available in many languages.

**Is it free? Do I need an account?**

Yes, the app is free to use. You do not need to create an account or log in. You upload files from your device and read them in your browser. Your books stay on your device; we don’t store them on our servers.

**Where are my books stored? Are they sent to your servers?**

Your EPUB files are stored only in your browser’s local storage (IndexedDB) on the device you’re using. They are not uploaded to our servers for storage. We don’t keep copies of your books. This design protects your privacy and allows you to read without an account. If you clear your browser data for this site, your stored books may be removed.

**Can I read my books on another device or browser?**

The library is stored per browser and per device. To read the same books on another device or in another browser, you would need to upload the EPUB files again on that device or browser. We don’t sync your library across devices or accounts.

### Upload and format

**What file format do you support?**

We support EPUB (`.epub`) files only—both EPUB 2 and EPUB 3. We do not support PDF, Kindle (AZW, KFX), or other formats. See the Supported Formats page for details.

**My upload failed or the book won’t open. What should I do?**

Possible causes: (1) The file might not be a valid EPUB—try opening it in another EPUB reader to confirm. (2) The file might be DRM-protected; we don’t support DRM. (3) Your browser storage might be full—try removing some stored books or freeing space. (4) The file might be corrupted—try re-downloading or re-exporting the EPUB. If the problem continues, check Supported Formats or contact us.

**Is there a file size limit?**

We don’t set a fixed limit, but very large files may be slow to upload and parse. Your browser’s IndexedDB has its own limit (often hundreds of MB to several GB). If you see a storage error, free space or remove some stored books.

### Reading and features

**How do I go back to my library?**

Use the “Home” or “Library” link (or back button) in the app to return to the main page where your upload area and book list are. You can then choose another book or upload a new one.

**Do you save my reading position?**

The app can save your last position (chapter and location) per book. When you open that book again from your library, it may open where you left off. This depends on implementation and may require that you don’t clear site data.

**Can I read in full-screen?**

Yes. In the reader there is a full-screen option (button or shortcut). Activate it for a distraction-free view. Exit with the same control or by pressing Escape.

**Do you support table of contents?**

The reader can show a table of contents (TOC) when the EPUB provides one. You can jump to chapters from the TOC. Support depends on the EPUB structure and the reader implementation.

### Privacy and data

**Do you collect or use my reading data?**

We don’t store your books on our servers. Reading happens in your browser; your EPUBs and reading position stay on your device. For privacy details, see our Privacy Policy.

**What happens if I clear my browser data?**

If you clear site data (cookies, storage) for this site, your stored EPUBs and any saved positions may be deleted. You would need to re-upload books to read them again. Use a normal (non-private) session if you want to keep your library.

### Languages and accessibility

**In which languages is the app available?**

The app is available in many languages (dozens of locales). Use the language selector in the app to switch. Content on supporting pages (like this FAQ) is translated where possible. If your language is missing or a translation is wrong, you can contact us.

**Is the app accessible?**

We aim to make the app usable with keyboard navigation and screen readers where possible. The reader and main navigation can be operated with the keyboard. For details on shortcuts, see Keyboard Shortcuts. If you encounter accessibility issues, please contact us.

### Still have questions?

If your question isn’t answered here, see Getting Started, What is an EPUB file?, or Supported Formats. You can also contact us through the Contact page.
