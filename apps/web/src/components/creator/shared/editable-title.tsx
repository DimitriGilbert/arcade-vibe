"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";

interface EditableTitleProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxWidth?: string;
  /** External trigger to start editing - increment this value to trigger edit mode */
  startEditingTrigger?: number;
}

export function EditableTitle({
  value,
  onChange,
  placeholder = "Untitled",
  disabled = false,
  className = "",
  maxWidth = "max-w-[180px]",
  startEditingTrigger = 0,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // External trigger to start editing
  useEffect(() => {
    if (startEditingTrigger > 0 && !disabled) {
      setEditValue(value);
      setIsEditing(true);
    }
  }, [startEditingTrigger, disabled, value]);

  const handleStartEdit = useCallback(() => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  }, [value, disabled]);

  const handleSaveEdit = useCallback(() => {
    onChange(editValue.trim());
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleCancelEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-32 px-2 py-1 text-sm bg-[var(--background)] border border-[var(--border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
          placeholder={placeholder}
          maxLength={100}
        />
        <button
          type="button"
          onClick={handleSaveEdit}
          className="p-1 rounded hover:bg-[var(--muted)] text-green-500"
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={handleCancelEdit}
          className="p-1 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-sm font-medium hover:text-[var(--primary)] transition-colors truncate ${maxWidth} disabled:opacity-50 disabled:cursor-not-allowed group ${className}`}
    >
      <span className="truncate">{value || placeholder}</span>
      <Pencil className="h-3 w-3 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
