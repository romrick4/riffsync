"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BoldIcon,
  ItalicIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  SaveIcon,
  UndoIcon,
  RedoIcon,
  Loader2Icon,
} from "lucide-react";

interface LyricsEditorProps {
  songId: string;
  projectId: string;
  initialContent: string;
  versions: {
    id: string;
    content: string;
    changeNote: string | null;
    versionNumber: number;
    createdAt: string;
    editedBy: { id: string; displayName: string };
  }[];
}

export interface LyricsEditorHandle {
  setContent: (content: string) => void;
}

export const LyricsEditor = forwardRef<LyricsEditorHandle, LyricsEditorProps>(
  function LyricsEditor({ songId, projectId, initialContent }, ref) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [showSaveForm, setShowSaveForm] = useState(false);
    const [changeNote, setChangeNote] = useState("");
    const [error, setError] = useState<string | null>(null);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Placeholder.configure({
          placeholder:
            "Start writing lyrics... Use headings for sections like Verse 1, Chorus, Bridge...",
        }),
      ],
      content: initialContent || "",
      editorProps: {
        attributes: {
          class:
            "prose prose-invert prose-lg max-w-none min-h-[400px] px-6 py-4 focus:outline-none leading-relaxed",
        },
      },
    });

    useImperativeHandle(ref, () => ({
      setContent: (content: string) => {
        editor?.commands.setContent(content);
      },
    }));

    const handleSave = async () => {
      if (!editor) return;

      const content = editor.getHTML();
      if (!content.trim() || content === "<p></p>") {
        setError("Cannot save empty lyrics");
        return;
      }

      setSaving(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/projects/${projectId}/songs/${songId}/lyrics`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content,
              changeNote: changeNote.trim() || undefined,
            }),
          }
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to save");
        }

        setChangeNote("");
        setShowSaveForm(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setSaving(false);
      }
    };

    if (!editor) return null;

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().toggleBold()}
          >
            <BoldIcon />
          </Button>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().toggleItalic()}
          >
            <ItalicIcon />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"
            }
            size="icon-sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <Heading1Icon />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"
            }
            size="icon-sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <Heading2Icon />
          </Button>
          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"
            }
            size="icon-sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          >
            <Heading3Icon />
          </Button>
          <div className="mx-1 h-4 w-px bg-border" />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <UndoIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <RedoIcon />
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {!showSaveForm ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setShowSaveForm(true)}
              >
                <SaveIcon data-icon="inline-start" />
                Save
              </Button>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-1.5">
                  <Label
                    htmlFor="change-note"
                    className="text-xs whitespace-nowrap"
                  >
                    What changed?
                  </Label>
                  <Input
                    id="change-note"
                    value={changeNote}
                    onChange={(e) => setChangeNote(e.target.value)}
                    placeholder="e.g. Rewrote chorus"
                    className="h-7 w-full text-xs sm:w-48"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2Icon
                        className="animate-spin"
                        data-icon="inline-start"
                      />
                    ) : (
                      <SaveIcon data-icon="inline-start" />
                    )}
                    {saving ? "Saving..." : "Confirm"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowSaveForm(false);
                      setChangeNote("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="rounded-lg border border-border bg-card/50">
          <EditorContent editor={editor} />
        </div>
      </div>
    );
  }
);
