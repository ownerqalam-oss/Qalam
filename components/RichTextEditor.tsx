"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
    ],

    content: value,

    editorProps: {
      attributes: {
        class:
  "prose prose-lg max-w-none min-h-[70vh] rounded-xl p-4 outline-none focus:outline-none " +
  "[&_h1]:text-4xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 " +
  "[&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-5 [&_h2]:mb-3 " +
  "[&_h3]:text-2xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 " +
  "[&_ul]:list-disc [&_ul]:pl-6 " +
  "[&_ol]:list-decimal [&_ol]:pl-6",
      },
    },

    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;

    if (editor.getHTML() !== value) {
      editor.commands.setContent(value, {
        emitUpdate: false,
      });
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <EditorToolbar editor={editor} />

      <EditorContent editor={editor} />
    </div>
  );
}
