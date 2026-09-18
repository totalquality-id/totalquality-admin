// src/lib/htmlText.js
//
// Konten article disimpan sebagai HTML dari RichTextEditor. Untuk preview di
// daftar dan untuk pencarian, HTML itu harus di-strip dulu; kalau tidak, tag
// seperti <div> dan <h3> ikut tampil di kartu dan pencarian bisa cocok dengan
// nama tag alih-alih isi tulisan.

const ENTITIES = [
  [/&nbsp;/g, " "],
  [/&amp;/g, "&"],
  [/&lt;/g, "<"],
  [/&gt;/g, ">"],
  [/&quot;/g, '"'],
  [/&#39;/g, "'"],
];

export function stripHtml(html) {
  if (!html) return "";

  let text = String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");

  // Pemisah blok jadi spasi supaya kata tidak saling menempel.
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, " ");
  text = text.replace(/<br\s*\/?>/gi, " ");
  text = text.replace(/<[^>]+>/g, " ");

  for (const [pattern, replacement] of ENTITIES) {
    text = text.replace(pattern, replacement);
  }

  return text.replace(/\s+/g, " ").trim();
}

/** Potong jadi teks biasa di batas kata terdekat. */
export function truncateContent(html, maxLength = 160) {
  const plain = stripHtml(html);
  if (plain.length <= maxLength) return plain;

  const slice = plain.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice;

  return cut.trimEnd() + "...";
}
