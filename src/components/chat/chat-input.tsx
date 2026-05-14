"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SendIcon } from "lucide-react";
import {
  ChatAutocomplete,
  type AutocompleteMode,
  type AutocompleteSelection,
} from "./chat-autocomplete";

interface ChatInputProps {
  projectId: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

interface TriggerState {
  mode: AutocompleteMode;
  index: number;
  query: string;
}

function detectTrigger(
  value: string,
  cursorPos: number,
): TriggerState | null {
  const before = value.slice(0, cursorPos);

  for (let i = before.length - 1; i >= 0; i--) {
    const ch = before[i];
    if (ch === " " || ch === "\n") return null;
    if (ch === "@" || ch === "/") {
      if (i > 0 && before[i - 1] !== " " && before[i - 1] !== "\n")
        return null;
      const query = before.slice(i + 1);
      return {
        mode: ch === "@" ? "member" : "entity",
        index: i,
        query,
      };
    }
  }

  return null;
}

function buildMarkup(sel: AutocompleteSelection): string {
  const prefix = sel.type === "member" ? "@" : "/";
  return `[${prefix}${sel.label}](${sel.type}:${sel.id})`;
}

export function ChatInput({ projectId, onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [trigger, setTrigger] = useState<TriggerState | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    setTrigger(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !trigger) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setValue(newValue);

    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;

    const cursorPos = el.selectionStart ?? newValue.length;
    setTrigger(detectTrigger(newValue, cursorPos));
  }

  function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    const cursorPos = el.selectionStart ?? value.length;
    setTrigger(detectTrigger(value, cursorPos));
  }

  const handleAutocompleteSelect = useCallback(
    (selection: AutocompleteSelection) => {
      if (!trigger || !textareaRef.current) return;

      const markup = buildMarkup(selection);
      const before = value.slice(0, trigger.index);
      const after = value.slice(trigger.index + 1 + trigger.query.length);
      const newValue = before + markup + " " + after;

      setValue(newValue);
      setTrigger(null);

      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          const pos = before.length + markup.length + 1;
          el.focus();
          el.setSelectionRange(pos, pos);
        }
      });
    },
    [trigger, value],
  );

  const handleDismiss = useCallback(() => {
    setTrigger(null);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="relative border-t bg-background">
      {trigger && (
        <ChatAutocomplete
          projectId={projectId}
          mode={trigger.mode}
          query={trigger.query}
          onSelect={handleAutocompleteSelect}
          onDismiss={handleDismiss}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 py-3"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          placeholder="Message your band..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none rounded-lg border bg-muted/50 px-3 py-2 text-base sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!value.trim() || disabled}
          className="shrink-0"
        >
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  );
}
