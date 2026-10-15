"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { TableKit } from "@tiptap/extension-table";
import UnderlineExtension from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered,
  Pilcrow, Quote, Redo2, RemoveFormatting, Table2, Underline, Undo2,
} from "lucide-react";
import { useState } from "react";

const BUTTON = "flex h-9 w-9 items-center justify-center rounded-none text-club-navy transition hover:bg-white hover:text-club-red disabled:pointer-events-none disabled:opacity-35";

export function RichTextEditor({ name, defaultValue, enableTables = false }: { name: string; defaultValue: string; enableTables?: boolean }) {
  const [value, setValue] = useState(defaultValue);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      UnderlineExtension,
      Placeholder.configure({ placeholder: "Sāc rakstīt…" }),
      ...(enableTables ? [TableKit.configure({ table: { resizable: false, renderWrapper: true } })] : []),
    ],
    content: defaultValue || "<p></p>",
    editorProps: {
      attributes: {
        class: "rich-text-editor min-h-72 px-4 py-3 text-base leading-7 text-black/80 outline-none",
        "aria-label": "Lapas teksts",
      },
    },
    onUpdate: ({ editor: currentEditor }) => setValue(currentEditor.getHTML()),
  });
  const tableState = useEditorState({ editor, selector: ({ editor: current }) => ({ inTable: current?.isActive("table") ?? false }) });

  function insertLeagueTable() {
    if (!editor) return;
    const headings = ["Vieta", "Komanda", "Spēles", "U", "N", "Z", "GV", "IV", "+/−", "Punkti"];
    const cell = (type: string, text = "") => ({ type, content: [{ type: "paragraph", ...(text ? { content: [{ type: "text", text }] } : {}) }] });
    editor.chain().focus().insertContent([
      { type: "table", content: [
        { type: "tableRow", content: headings.map(heading => cell("tableHeader", heading)) },
        ...Array.from({ length: 3 }, (_, index) => ({ type: "tableRow", content: headings.map((_, column) => cell("tableCell", column === 0 ? String(index + 1) : "")) })),
      ] },
      { type: "paragraph" },
    ]).run();
  }

  function setLink() {
    if (!editor) return;
    const current = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Ievadi pilnu saiti, piemēram, https://example.com", current ?? "https://");
    if (href === null) return;
    if (!href.trim()) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: href.trim() }).run();
  }

  const tool = (
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    action: () => void,
    active = false,
    disabled = !editor,
  ) => (
    <button key={label} type="button" title={label} aria-label={label} aria-pressed={active}
      disabled={disabled} onClick={action}
      className={`${BUTTON} ${active ? "bg-white text-club-red shadow-sm" : ""}`}>
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="mt-1.5 overflow-hidden rounded-none border border-black/15 bg-white focus-within:border-black">
      <div className="flex flex-wrap items-center gap-1 border-b border-black/15 bg-slate-50 p-2">
        {tool("Rindkopa", Pilcrow, () => editor?.chain().focus().setParagraph().run(), editor?.isActive("paragraph"))}
        {tool("2. līmeņa virsraksts", Heading2, () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), editor?.isActive("heading", { level: 2 }))}
        {tool("3. līmeņa virsraksts", Heading3, () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), editor?.isActive("heading", { level: 3 }))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {tool("Treknraksts", Bold, () => editor?.chain().focus().toggleBold().run(), editor?.isActive("bold"))}
        {tool("Slīpraksts", Italic, () => editor?.chain().focus().toggleItalic().run(), editor?.isActive("italic"))}
        {tool("Pasvītrots", Underline, () => editor?.chain().focus().toggleUnderline().run(), editor?.isActive("underline"))}
        {tool("Saite", Link2, setLink, editor?.isActive("link"))}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {tool("Aizzīmju saraksts", List, () => editor?.chain().focus().toggleBulletList().run(), editor?.isActive("bulletList"))}
        {tool("Numurēts saraksts", ListOrdered, () => editor?.chain().focus().toggleOrderedList().run(), editor?.isActive("orderedList"))}
        {tool("Citāts", Quote, () => editor?.chain().focus().toggleBlockquote().run(), editor?.isActive("blockquote"))}
        {tool("Notīrīt formatējumu", RemoveFormatting, () => editor?.chain().focus().unsetAllMarks().clearNodes().run())}
        <span className="mx-1 h-5 w-px bg-slate-200" />
        {tool("Atsaukt", Undo2, () => editor?.chain().focus().undo().run(), false, !editor?.can().undo())}
        {tool("Atkārtot", Redo2, () => editor?.chain().focus().redo().run(), false, !editor?.can().redo())}
        {enableTables && <>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button type="button" disabled={!editor} onClick={() => editor?.chain().focus().insertTable({ rows: 4, cols: 3, withHeaderRow: true }).run()} className={`${BUTTON} w-auto gap-2 px-3`}><Table2 className="size-4" />Tabula</button>
          <button type="button" disabled={!editor} onClick={insertLeagueTable} className={`${BUTTON} w-auto px-3`}>Līgas tabula</button>
        </>}
      </div>
      {enableTables && tableState?.inTable && <div className="flex flex-wrap gap-2 border-b border-black/15 bg-slate-50 p-2" aria-label="Tabulas darbības">
        {([
          ["+ Rinda", () => editor?.chain().focus().addRowAfter().run()],
          ["− Rinda", () => editor?.chain().focus().deleteRow().run()],
          ["+ Kolonna", () => editor?.chain().focus().addColumnAfter().run()],
          ["− Kolonna", () => editor?.chain().focus().deleteColumn().run()],
          ["Virsraksta rinda", () => editor?.chain().focus().toggleHeaderRow().run()],
          ["Dzēst tabulu", () => { if (window.confirm("Dzēst šo tabulu?")) editor?.chain().focus().deleteTable().run(); }],
        ] as const).map(([label, action]) => <button key={label} type="button" onClick={action} className="min-h-10 border border-black/15 px-3 text-xs font-medium text-club-navy transition hover:bg-white hover:text-club-red">{label}</button>)}
      </div>}
      <EditorContent editor={editor} />
      {enableTables && <p className="border-t border-black/15 px-4 py-2 text-xs font-normal text-slate-500">“Līgas tabula” ievieto gatavas kolonnas. Visas vērtības ievadi manuāli. Ieklikšķini šūnā, lai pievienotu vai dzēstu rindas un kolonnas.</p>}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
