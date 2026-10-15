# Custom page buttons and galleries

In **Kluba lapas**, edit or create a page:

- **Darbību pogas**: up to six buttons with a label, URL, red/outlined style,
  order controls, and an optional new tab. Links support local paths, anchors,
  HTTP(S), email and phone links. Buttons appear below the page text.
- **Fotoattēli un galerija**: choose a gallery below the text or images in the
  right column. Add captions and alternative text. Clicking an image opens
  the full image, with keyboard arrows, Escape, and previous/next controls.

Up to six photos are supported. Each upload batch is limited to 5 MB to fit
the existing 6 MB Server Action request limit. Upload larger collections in
multiple saves. Existing images can be removed with the per-image checkbox.

No migration is needed. The existing `club_pages.images` text column stores
versioned JSON containing `photos`, `layout`, and `actions`. Readers also accept
the previous newline-separated image URLs and preserve their sidebar layout.
Always use `parseClubPageMedia` when reading this column; this includes public
page metadata and sitemap image entries. Photo files stay in the existing
persistent uploads folder.

The page text editor also supports tables: use **Tabula** or **Līgas tabula**, then edit cells and add/remove rows and columns. Values are entered manually.
