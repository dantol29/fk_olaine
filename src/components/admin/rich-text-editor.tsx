"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, Redo2, Underline, Undo2 } from "lucide-react";

type Command = { label: string; icon: React.ComponentType<{ className?: string }>; command: string; value?: string };

const COMMANDS: Command[] = [
  { label: "Treknraksts", icon: Bold, command: "bold" },
  { label: "Slīpraksts", icon: Italic, command: "italic" },
  { label: "Pasvītrots", icon: Underline, command: "underline" },
  { label: "Virsraksts", icon: Heading2, command: "formatBlock", value: "h2" },
  { label: "Citāts", icon: Quote, command: "formatBlock", value: "blockquote" },
  { label: "Aizzīmju saraksts", icon: List, command: "insertUnorderedList" },
  { label: "Numurēts saraksts", icon: ListOrdered, command: "insertOrderedList" },
];

export function RichTextEditor({ name, defaultValue }: { name: string; defaultValue: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(defaultValue);

  function run(command: string, commandValue?: string) {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    setValue(editorRef.current?.innerHTML ?? "");
  }

  function addLink() {
    const href = window.prompt("Ievadi pilnu saiti, piemēram, https://example.com");
    if (href) run("createLink", href);
  }

  return (
    <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-club-red">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        {COMMANDS.map(({ label, icon: Icon, command, value: commandValue }) => (
          <button key={label} type="button" title={label} aria-label={label}
            onMouseDown={(event) => event.preventDefault()} onClick={() => run(command, commandValue)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-club-navy transition hover:bg-white hover:text-club-red">
            <Icon className="h-4 w-4" />
          </button>
        ))}
        <button type="button" title="Pievienot saiti" aria-label="Pievienot saiti"
          onMouseDown={(event) => event.preventDefault()} onClick={addLink}
          className="flex h-9 w-9 items-center justify-center rounded-md text-club-navy transition hover:bg-white hover:text-club-red">
          <Link2 className="h-4 w-4" />
        </button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" title="Atsaukt" aria-label="Atsaukt" onClick={() => run("undo")}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-club-navy"><Undo2 className="h-4 w-4" /></button>
        <button type="button" title="Atkārtot" aria-label="Atkārtot" onClick={() => run("redo")}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-white hover:text-club-navy"><Redo2 className="h-4 w-4" /></button>
      </div>
      <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true"
        onInput={(event) => setValue(event.currentTarget.innerHTML)}
        dangerouslySetInnerHTML={{ __html: defaultValue }}
        className="rich-text-editor min-h-72 px-4 py-3 text-base leading-7 text-slate-700 outline-none empty:before:pointer-events-none empty:before:text-slate-400 empty:before:content-['Sāc_rakstīt…']" />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
