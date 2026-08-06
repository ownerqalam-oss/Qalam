"use client";

import { Editor } from "@tiptap/react";

interface Props {
  editor: Editor | null;
}

export default function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const button = (active: boolean) =>
    `rounded-md px-3 py-2 transition ${
      active
        ? "bg-black text-white"
        : "bg-white hover:bg-gray-100"
    }`;

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border bg-white p-3">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={button(editor.isActive("bold"))}
      >
        <b>B</b>
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={button(editor.isActive("italic"))}
      >
        <i>I</i>
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().setHeading({ level: 1 }).run()
        }
        className={button(editor.isActive("heading", { level: 1 }))}
      >
        H1
      </button>

      <button
        type="button"
        onClick={() =>
          editor.chain().focus().setHeading({ level: 2 }).run()
        }
        className={button(editor.isActive("heading", { level: 2 }))}
      >
        H2
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={button(editor.isActive("bulletList"))}
      >
        • List
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={button(editor.isActive("blockquote"))}
      >
        ❝ Quote
      </button>
    </div>
  );
}
