"use client";

import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const buttonClass = (active = false, disabled = false) =>
    `
      flex h-9 min-w-9 items-center justify-center rounded-md px-2
      text-sm font-medium transition
      ${
        active
          ? "bg-gray-200 text-black"
          : "text-gray-700 hover:bg-gray-100"
      }
      ${disabled ? "cursor-not-allowed opacity-30" : ""}
    `;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-2">
      
      {/* Undo */}
      <button
        type="button"
        title="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        className={buttonClass(false, !editor.can().undo())}
      >
        ↶
      </button>

      {/* Redo */}
      <button
        type="button"
        title="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        className={buttonClass(false, !editor.can().redo())}
      >
        ↷
      </button>

      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* Text style */}
      <select
        value={
          editor.isActive("heading", { level: 1 })
            ? "h1"
            : editor.isActive("heading", { level: 2 })
            ? "h2"
            : "paragraph"
        }
        onChange={(e) => {
          const value = e.target.value;

          if (value === "paragraph") {
            editor.chain().focus().setParagraph().run();
          }

          if (value === "h1") {
            editor.chain().focus().setHeading({ level: 1 }).run();
          }

          if (value === "h2") {
            editor.chain().focus().setHeading({ level: 2 }).run();
          }
        }}
        className="h-9 rounded-md border-none bg-white px-2 text-sm font-medium text-gray-700 outline-none hover:bg-gray-100"
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
      </select>

      <div className="mx-1 h-6 w-px bg-gray-200" />

      {/* Bold */}
      <button
        type="button"
        title="Bold"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive("bold"))}
      >
        <strong>B</strong>
      </button>

      {/* Italic */}
      <button
        type="button"
        title="Italic"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive("italic"))}
      >
        <em>I</em>
      </button>

      {/* Underline */}
      <button
        type="button"
        title="Underline"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive("underline"))}
      >
        <span className="underline">U</span>
      </button>

      <div className="mx-1 h-6 w-px bg-gray-200" />

    {/* Bullet List */}
<button
  type="button"
  title="Bullet List"
  onClick={() => editor.chain().focus().toggleBulletList().run()}
  className={buttonClass(editor.isActive("bulletList"))}
>
  • List
</button>

{/* Numbered List */}
<button
  type="button"
  title="Numbered List"
  onClick={() => editor.chain().focus().toggleOrderedList().run()}
  className={buttonClass(editor.isActive("orderedList"))}
>
  1. List
</button>

      {/* Quote */}
      <button
        type="button"
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive("blockquote"))}
      >
        “
      </button>
    </div>
  );
}
