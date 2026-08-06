"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
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

    console.log("RichTextEditor rendered");

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your article...",
      }),
    ],

    content: value,

    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none min-h-[70vh] rounded-xl p-4 outline-none focus:outline-none",
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
  <>
   

    <EditorToolbar editor={editor} />

    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <EditorContent editor={editor} />
    </div>
  </>
);}
