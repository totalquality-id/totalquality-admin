// src/components/Common/RichTextEditor.jsx
//
// Rich text editor custom berbasis contenteditable.
// Fitur: heading H2-H4, bold/italic/underline/strikethrough, warna teks &
// highlight, daftar poin/bernomor, indentasi, perataan (kiri/tengah/kanan/
// justify), kutipan, kode inline & blok kode, tabel, superskrip/subskrip,
// garis pemisah, tautan, gambar inline, bersihkan format, layar penuh, dan
// penghitung kata.
// Konten disimpan dan dikirim sebagai HTML string.
// Gambar inline diupload via prop onImageUpload(file) => Promise<url>

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Superscript,
  Subscript,
  List,
  ListOrdered,
  Link,
  Link2Off,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  IndentIncrease,
  IndentDecrease,
  Quote,
  Code,
  Code2,
  Table,
  Minus,
  Undo,
  Redo,
  Upload,
  Eraser,
  Maximize2,
  Minimize2,
  X,
  Check,
} from "lucide-react";

// Palet warna teks & highlight. Sengaja preset (bukan color picker bebas)
// supaya tulisan tetap konsisten dengan identitas visual Total Quality dan
// kontrasnya tetap terbaca.
const TEXT_COLORS = [
  { label: "Default", value: "#364153" },
  { label: "Hitam", value: "#1a1a1a" },
  { label: "Biru brand", value: "#0201FF" },
  { label: "Biru tua", value: "#2B5589" },
  { label: "Abu", value: "#64748b" },
  { label: "Merah", value: "#dc2626" },
  { label: "Hijau", value: "#15803d" },
  { label: "Kuning brand", value: "#8a6d00" },
];

const HIGHLIGHT_COLORS = [
  { label: "Kuning", value: "#fef3c7" },
  { label: "Hijau", value: "#dcfce7" },
  { label: "Biru", value: "#dbeafe" },
  { label: "Merah muda", value: "#fce7f3" },
  { label: "Abu", value: "#e2e8f0" },
];

const BLOCK_FORMATS = [
  { label: "Paragraf", tag: "p" },
  { label: "Heading 2", tag: "h2" },
  { label: "Heading 3", tag: "h3" },
  { label: "Heading 4", tag: "h4" },
];

// ─── Dropdown warna ──────────────────────────────────────────────────────────
const ColorMenu = ({ title, colors, onPick, children, showClear }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        title={title}
        aria-label={title}
        aria-expanded={open}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen((prev) => !prev);
        }}
        className="p-1.5 rounded transition-colors text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-800"
      >
        {children}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(false);
            }}
          />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-44">
            <div className="grid grid-cols-4 gap-1.5">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.label}
                  aria-label={color.label}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onPick(color.value);
                    setOpen(false);
                  }}
                  className="w-8 h-8 rounded border border-slate-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
            {showClear && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onPick(null);
                  setOpen(false);
                }}
                className="mt-2 w-full text-xs text-slate-600 hover:text-slate-900 py-1 rounded hover:bg-slate-50"
              >
                Hapus warna
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Escape agar teks yang dimasukkan ke blok kode tidak diperlakukan sebagai HTML.
const escapeHtml = (text) =>
  String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ─── Toolbar Button ───────────────────────────────────────────────────────────
const ToolbarButton = ({ onClick, active, disabled, title, children }) => (
  <button
    type="button"
    onMouseDown={(e) => {
      e.preventDefault(); // jaga agar editor tidak kehilangan focus
      if (!disabled) onClick(e);
    }}
    disabled={disabled}
    title={title}
    className={`
      p-1.5 rounded transition-colors text-sm
      ${
        active
          ? "bg-blue-600 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
      }
      ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    {children}
  </button>
);

const Divider = () => <div className="w-px h-5 bg-slate-200 mx-1" />;

// ─── Insert Image Modal ───────────────────────────────────────────────────────
const InsertImageModal = ({ onInsert, onClose, onUpload, isUploading }) => {
  const [mode, setMode] = useState("url"); // "url" | "upload"
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  };

  const handleInsert = async () => {
    if (mode === "url") {
      if (!url.trim()) return;
      onInsert(url.trim(), alt.trim());
    } else {
      if (!file) return;
      const uploadedUrl = await onUpload(file);
      if (uploadedUrl) onInsert(uploadedUrl, alt.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">
            Insert Image
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          {["url", "upload"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setPreview("");
                setFile(null);
                setUrl("");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${mode === m ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {m === "url" ? <Link size={14} /> : <Upload size={14} />}
              {m === "url" ? "From URL" : "Upload File"}
            </button>
          ))}
        </div>

        {mode === "url" ? (
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPreview(e.target.value);
            }}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            autoFocus
          />
        ) : (
          <div className="mb-3">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Max 5MB · JPG, PNG, GIF, WebP
            </p>
          </div>
        )}

        <input
          type="text"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="Alt text (optional)"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />

        {/* Preview */}
        {preview && (
          <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 max-h-40">
            <img
              src={preview}
              alt="preview"
              className="w-full h-40 object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={isUploading || (mode === "url" ? !url.trim() : !file)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                Uploading...
              </>
            ) : (
              <>
                <Check size={14} /> Insert
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Insert Link Modal ────────────────────────────────────────────────────────
const InsertLinkModal = ({ onInsert, onClose }) => {
  const [url, setUrl] = useState("https://");
  const [text, setText] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-800">
            Insert Link
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          autoFocus
        />
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Link text (optional)"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onInsert(url, text)}
            disabled={!url.trim() || url === "https://"}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Check size={14} /> Insert
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main RichTextEditor ──────────────────────────────────────────────────────
const RichTextEditor = ({
  label,
  value = "",
  onChange,
  onImageUpload, // async (file: File) => Promise<string url>
  error,
  disabled = false,
  placeholder = "Write your content here...",
  minHeight = 300,
}) => {
  const editorRef = useRef(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [counts, setCounts] = useState({ words: 0, chars: 0 });
  const savedRange = useRef(null);

  // styleWithCSS membuat execCommand menghasilkan <span style="..."> alih-alih
  // tag <font> yang sudah usang dan tidak bisa disanitasi dengan rapi.
  useEffect(() => {
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch {
      // Browser lama boleh mengabaikan ini.
    }
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const isFocused = document.activeElement === editor;
    if (!isFocused && editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]); // reaktif terhadap perubahan value dari luar

  // Update state format aktif saat selection berubah
  const updateActiveFormats = useCallback(() => {
    const block = (document.queryCommandValue("formatBlock") || "").toLowerCase();

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strike: document.queryCommandState("strikeThrough"),
      superscript: document.queryCommandState("superscript"),
      subscript: document.queryCommandState("subscript"),
      block,
      ul: document.queryCommandState("insertUnorderedList"),
      ol: document.queryCommandState("insertOrderedList"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
    });
  }, []);

  // Simpan selection sebelum modal terbuka (agar bisa insert di posisi yang benar)
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  // Restore selection setelah modal close
  const restoreSelection = () => {
    if (savedRange.current) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    } else {
      // Kalau tidak ada, taruh cursor di akhir editor
      editorRef.current?.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  const exec = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    triggerChange();
    updateActiveFormats();
  };

  const triggerChange = () => {
    const editor = editorRef.current;
    if (!editor) return;

    if (onChange) onChange(editor.innerHTML);

    const text = (editor.innerText || "").replace(/\s+/g, " ").trim();
    setCounts({
      words: text ? text.split(" ").length : 0,
      chars: text.length,
    });
  };

  // ── Image insert ─────────────────────────────────────────────────────────
  const handleOpenImageModal = () => {
    saveSelection();
    setShowImageModal(true);
  };

  const handleInsertImage = async (src, alt) => {
    setShowImageModal(false);
    restoreSelection();

    // Bungkus gambar dalam figure agar bisa center dan ada caption-nya nanti
    const html = `<figure class="rte-figure" contenteditable="false">
      <img src="${src}" alt="${alt || ""}" class="rte-img" />
      ${alt ? `<figcaption class="rte-caption">${alt}</figcaption>` : ""}
    </figure><p><br></p>`;

    document.execCommand("insertHTML", false, html);
    triggerChange();
  };

  const handleUploadForInline = async (file) => {
    if (!onImageUpload) return null;
    setIsUploading(true);
    try {
      const url = await onImageUpload(file);
      return url;
    } catch {
      alert("Failed to upload image");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // ── Link insert ──────────────────────────────────────────────────────────
  const handleOpenLinkModal = () => {
    saveSelection();
    setShowLinkModal(true);
  };

  const handleInsertLink = (url, text) => {
    setShowLinkModal(false);
    restoreSelection();
    const linkText = text || url;
    exec(
      "insertHTML",
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`,
    );
  };

  // ── Format block ─────────────────────────────────────────────────────────
  const toggleBlock = (tag) => {
    const current = (document.queryCommandValue("formatBlock") || "").toLowerCase();
    exec("formatBlock", current === tag ? "p" : tag);
  };

  const setBlock = (tag) => exec("formatBlock", tag);

  // ── Warna teks & highlight ───────────────────────────────────────────────
  const applyTextColor = (color) =>
    exec("foreColor", color ?? TEXT_COLORS[0].value);

  const applyHighlight = (color) =>
    // "transparent" efektif menghapus highlight tanpa menyentuh warna teks.
    exec("hiliteColor", color ?? "transparent");

  // ── Kode ─────────────────────────────────────────────────────────────────
  const insertInlineCode = () => {
    const selection = window.getSelection();
    const selected = selection?.toString() || "kode";
    exec("insertHTML", `<code class="rte-code">${escapeHtml(selected)}</code>&nbsp;`);
  };

  const insertCodeBlock = () => {
    const selection = window.getSelection();
    const selected = selection?.toString() || "";
    exec(
      "insertHTML",
      `<pre class="rte-pre"><code>${escapeHtml(selected)}</code></pre><p><br></p>`
    );
  };

  // ── Tabel ────────────────────────────────────────────────────────────────
  const insertTable = (rows = 3, cols = 3) => {
    const header = Array.from({ length: cols })
      .map((_, i) => `<th>Kolom ${i + 1}</th>`)
      .join("");
    const body = Array.from({ length: rows - 1 })
      .map(
        () =>
          `<tr>${Array.from({ length: cols })
            .map(() => "<td><br></td>")
            .join("")}</tr>`
      )
      .join("");

    exec(
      "insertHTML",
      `<table class="rte-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table><p><br></p>`
    );
  };

  // ── Bersihkan format & buang link ────────────────────────────────────────
  const clearFormatting = () => {
    exec("removeFormat");
    exec("formatBlock", "p");
  };

  const removeLink = () => exec("unlink");

  // ── Paste: strip rich formatting dari luar, pertahankan gambar ───────────
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </label>
      )}

      <div
        className={`border rounded-lg overflow-hidden transition-colors bg-white
          ${error ? "border-red-400" : "border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"}
          ${disabled ? "opacity-60 pointer-events-none" : ""}
          ${isFullscreen ? "fixed inset-4 z-50 flex flex-col shadow-2xl" : ""}
        `}
      >
        {/* ── Toolbar ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 bg-slate-50 border-b border-slate-200">
          <ToolbarButton onClick={() => exec("undo")} title="Undo (Ctrl+Z)">
            <Undo size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("redo")} title="Redo (Ctrl+Y)">
            <Redo size={15} />
          </ToolbarButton>
          <Divider />

          {/* Pilihan blok: paragraf & heading */}
          <select
            value={
              BLOCK_FORMATS.some((f) => f.tag === activeFormats.block)
                ? activeFormats.block
                : "p"
            }
            onChange={(e) => setBlock(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            title="Format paragraf"
            aria-label="Format paragraf"
            className="h-8 px-2 mr-1 text-xs border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {BLOCK_FORMATS.map((format) => (
              <option key={format.tag} value={format.tag}>
                {format.label}
              </option>
            ))}
          </select>
          <Divider />

          <ToolbarButton
            onClick={() => exec("bold")}
            active={activeFormats.bold}
            title="Tebal (Ctrl+B)"
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("italic")}
            active={activeFormats.italic}
            title="Miring (Ctrl+I)"
          >
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("underline")}
            active={activeFormats.underline}
            title="Garis bawah (Ctrl+U)"
          >
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("strikeThrough")}
            active={activeFormats.strike}
            title="Coret"
          >
            <Strikethrough size={15} />
          </ToolbarButton>
          <Divider />

          <ColorMenu
            title="Warna teks"
            colors={TEXT_COLORS}
            onPick={applyTextColor}
          >
            <span className="flex flex-col items-center leading-none">
              <span className="text-[11px] font-bold">A</span>
              <span className="block w-3.5 h-[3px] bg-[#0201FF] rounded-sm mt-0.5" />
            </span>
          </ColorMenu>
          <ColorMenu
            title="Warna sorotan"
            colors={HIGHLIGHT_COLORS}
            onPick={applyHighlight}
            showClear
          >
            <span className="flex flex-col items-center leading-none">
              <span className="text-[11px] font-bold">A</span>
              <span className="block w-3.5 h-[3px] bg-[#fef3c7] border border-slate-300 rounded-sm mt-0.5" />
            </span>
          </ColorMenu>
          <Divider />

          <ToolbarButton
            onClick={() => exec("insertUnorderedList")}
            active={activeFormats.ul}
            title="Daftar poin"
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("insertOrderedList")}
            active={activeFormats.ol}
            title="Daftar bernomor"
          >
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("outdent")} title="Kurangi indentasi">
            <IndentDecrease size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("indent")} title="Tambah indentasi">
            <IndentIncrease size={15} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            onClick={() => exec("justifyLeft")}
            active={activeFormats.justifyLeft}
            title="Rata kiri"
          >
            <AlignLeft size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("justifyCenter")}
            active={activeFormats.justifyCenter}
            title="Rata tengah"
          >
            <AlignCenter size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("justifyRight")}
            active={activeFormats.justifyRight}
            title="Rata kanan"
          >
            <AlignRight size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("justifyFull")}
            active={activeFormats.justifyFull}
            title="Rata kiri-kanan"
          >
            <AlignJustify size={15} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton
            onClick={() => toggleBlock("blockquote")}
            active={activeFormats.block === "blockquote"}
            title="Kutipan"
          >
            <Quote size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={insertInlineCode} title="Kode inline">
            <Code size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={insertCodeBlock} title="Blok kode">
            <Code2 size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => insertTable(3, 3)} title="Sisipkan tabel 3x3">
            <Table size={15} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton onClick={() => exec("superscript")} active={activeFormats.superscript} title="Superskrip">
            <Superscript size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={() => exec("subscript")} active={activeFormats.subscript} title="Subskrip">
            <Subscript size={15} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => exec("insertHorizontalRule")}
            title="Garis pemisah"
          >
            <Minus size={15} />
          </ToolbarButton>
          <Divider />

          <ToolbarButton onClick={handleOpenLinkModal} title="Sisipkan tautan">
            <Link size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={removeLink} title="Hapus tautan">
            <Link2Off size={15} />
          </ToolbarButton>
          <ToolbarButton onClick={clearFormatting} title="Bersihkan format">
            <Eraser size={15} />
          </ToolbarButton>
          <Divider />

          {/* Insert Image — tombol utama */}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleOpenImageModal();
            }}
            title="Sisipkan gambar ke dalam konten"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <ImageIcon size={14} />
            <span className="text-xs">Sisipkan Gambar</span>
          </button>

          <div className="ml-auto">
            <ToolbarButton
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </ToolbarButton>
          </div>
        </div>

        {/* ── Editor Area ───────────────────────────────────────────────── */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={triggerChange}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          style={{ minHeight: isFullscreen ? undefined : minHeight }}
          className={`rte-editor px-4 py-3 outline-none text-slate-800 text-sm leading-relaxed ${
            isFullscreen ? "flex-1 overflow-y-auto" : ""
          }`}
        />

        {/* Penghitung kata: bantu penulis menjaga panjang artikel */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
          <span>
            {counts.words.toLocaleString("id-ID")} kata ·{" "}
            {counts.chars.toLocaleString("id-ID")} karakter
          </span>
          {isFullscreen && <span>Tekan tombol layar penuh lagi untuk keluar</span>}
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {showImageModal && (
        <InsertImageModal
          onInsert={handleInsertImage}
          onClose={() => setShowImageModal(false)}
          onUpload={handleUploadForInline}
          isUploading={isUploading}
        />
      )}
      {showLinkModal && (
        <InsertLinkModal
          onInsert={handleInsertLink}
          onClose={() => setShowLinkModal(false)}
        />
      )}

      {/* ── Styles ───────────────────────────────────────────────────── */}
      <style>{`
        .rte-editor[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .rte-editor h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #1e293b; }
        .rte-editor h3 { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.4rem; color: #334155; }
        .rte-editor p  { margin: 0.4rem 0; }
        .rte-editor ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rte-editor ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rte-editor li { margin: 0.2rem 0; }
        .rte-editor blockquote {
          border-left: 3px solid #3b82f6;
          margin: 0.75rem 0;
          padding: 0.5rem 1rem;
          background: #f0f9ff;
          color: #475569;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .rte-editor h4 { font-size: 0.95rem; font-weight: 600; margin: 0.6rem 0 0.3rem; color: #334155; }
        .rte-editor a { color: #2563eb; text-decoration: underline; }
        .rte-editor hr { border: none; border-top: 1px solid #e2e8f0; margin: 1rem 0; }
        .rte-editor .rte-code, .rte-editor code {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 0.25rem;
          padding: 0.1rem 0.3rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.85em;
          color: #be123c;
        }
        .rte-editor .rte-pre, .rte-editor pre {
          background: #0f172a;
          color: #e2e8f0;
          border-radius: 0.5rem;
          padding: 0.75rem 1rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .rte-editor pre code {
          background: none;
          border: none;
          color: inherit;
          padding: 0;
        }
        .rte-editor .rte-table, .rte-editor table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75rem 0;
          font-size: 0.875rem;
        }
        .rte-editor th, .rte-editor td {
          border: 1px solid #cbd5e1;
          padding: 0.4rem 0.6rem;
          text-align: left;
        }
        .rte-editor th { background: #f1f5f9; font-weight: 600; }
        .rte-editor mark { padding: 0 0.15rem; border-radius: 0.15rem; }

        /* Gambar inline */
        .rte-figure {
          display: block;
          margin: 1rem auto;
          text-align: center;
          max-width: 100%;
        }
        .rte-img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
          display: block;
          margin: 0 auto;
        }
        .rte-caption {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.375rem;
          font-style: italic;
        }

        /* Styles yang sama untuk render di halaman publik */
        .prose-rte h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .prose-rte h3 { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
        .prose-rte p  { margin: 0.4rem 0; line-height: 1.75; }
        .prose-rte ul { list-style: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-rte ol { list-style: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
        .prose-rte blockquote { border-left: 3px solid #3b82f6; padding: 0.5rem 1rem; background: #f0f9ff; color: #475569; border-radius: 0 0.375rem 0.375rem 0; margin: 0.75rem 0; }
        .prose-rte a { color: #2563eb; text-decoration: underline; }
        .prose-rte figure { text-align: center; margin: 1rem auto; }
        .prose-rte figure img { max-width: 100%; border-radius: 0.5rem; margin: 0 auto; display: block; }
        .prose-rte figcaption { font-size: 0.75rem; color: #64748b; margin-top: 0.375rem; font-style: italic; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
