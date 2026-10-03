"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Check, Plus, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils/cn";

export interface ComboboxOption {
  id: string;
  label: string;
}

interface ComboboxProps {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  disabledHint?: string;
  error?: string;
  onCreateNew?: (inputValue: string) => Promise<ComboboxOption>;
}

export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = "Select or type to search...",
  disabled,
  disabledHint,
  error,
  onCreateNew,
}: ComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.id === value);

  // Intentional: syncs the visible text back to the selected option's label
  // whenever the dropdown closes or the selected option changes elsewhere
  // (e.g. the parent form reset) — a deliberate "resync local display state
  // from an external source" effect, not an accidental derived-state bug.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isOpen) setQuery(selected?.label ?? "");
  }, [selected, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());
  const canCreate = !!onCreateNew && query.trim().length > 0 && !exactMatch;

  const itemCount = filtered.length + (canCreate ? 1 : 0);

  // Intentional: resets the keyboard-highlighted option whenever the query
  // text or open state changes, so an old highlight from a previous search
  // never points at a row that's no longer in the filtered list.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current
      ?.querySelector<HTMLElement>('[data-highlighted="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isOpen]);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.id);
    setQuery(option.label);
    setIsOpen(false);
  };

  const handleCreate = async () => {
    if (!onCreateNew) return;
    setIsCreating(true);
    try {
      const created = await onCreateNew(query.trim());
      onChange(created.id);
      setQuery(created.label);
      setIsOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, itemCount - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex]);
      } else if (canCreate) {
        handleCreate();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

 return (
  <div ref={containerRef} className="flex w-full flex-col gap-1.5">
    <label className="text-label">{label}</label>

    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        disabled={disabled}
        placeholder={disabled ? disabledHint : placeholder}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);

          if (value) {
            onChange(null);
          }
        }}
        onKeyDown={handleKeyDown}
        aria-invalid={error ? true : undefined}
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={isOpen ? listId : undefined}
        aria-activedescendant={
          isOpen ? `combobox-option-${highlightedIndex}` : undefined
        }
        className={cn(
          "h-10 w-full rounded-md border border-border bg-card pl-3 pr-9 text-sm text-text-primary",
          "placeholder:text-xs placeholder:text-text-subtle",
          "transition-[border-color,background-color,box-shadow] duration-150",
          "hover:border-text-subtle/50",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10",
          "disabled:cursor-not-allowed disabled:bg-card-hover disabled:text-text-subtle disabled:opacity-60",
          error && "border-danger focus:border-danger focus:ring-danger/10",
        )}
      />

      <ChevronDown
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-text-muted",
          "transition-transform duration-200",
          isOpen && "rotate-180",
        )}
      />

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.99 }}
            transition={{ duration: 0.12 }}
            className="scrollbar-hidden absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-card p-1.5 shadow-soft-lg"
          >
            {filtered.length === 0 && !canCreate && (
              <li className="flex min-h-16 items-center justify-center px-3 py-4">
                <span className="text-body-sm text-text-subtle">
                  No matches found
                </span>
              </li>
            )}

            {filtered.map((option, index) => {
              const isSelected = option.id === value;
              const isHighlighted = index === highlightedIndex;

              return (
                <li key={option.id}>
                  <button
                    id={`combobox-option-${index}`}
                    type="button"
                    role="option"
                    data-highlighted={isHighlighted}
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left",
                      "text-body-sm text-text-primary transition-colors duration-100",
                      "hover:bg-card-hover",
                      isHighlighted && "bg-card-hover",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {option.label}
                    </span>

                    {isSelected && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check
                          className="size-3 text-primary"
                          strokeWidth={2.5}
                          aria-hidden="true"
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}

            {canCreate && (
              <>
                {filtered.length > 0 && (
                  <li
                    aria-hidden="true"
                    className="my-1 h-px bg-border/70"
                  />
                )}

                <li>
                  <button
                    id={`combobox-option-${filtered.length}`}
                    type="button"
                    role="option"
                    aria-selected={false}
                    disabled={isCreating}
                    data-highlighted={filtered.length === highlightedIndex}
                    onMouseEnter={() => setHighlightedIndex(filtered.length)}
                    onClick={() => void handleCreate()}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left",
                      "text-body-sm font-medium text-text-primary transition-colors duration-100",
                      "hover:bg-card-hover disabled:cursor-not-allowed disabled:opacity-50",
                      filtered.length === highlightedIndex && "bg-card-hover",
                    )}
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center">
                      {isCreating ? (
                        <Loader2
                          className="size-3.5 animate-spin text-primary"
                          aria-hidden="true"
                        />
                      ) : (
                        <Plus
                          className="size-3.5 text-primary"
                          aria-hidden="true"
                        />
                      )}
                    </span>

                    <span className="min-w-0 truncate">
                      Create{" "}
                      <span className="text-text-muted">
                        &quot;{query.trim()}&quot;
                      </span>
                    </span>
                  </button>
                </li>
              </>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>

    {error && (
      <p className="text-body-sm text-danger">
        {error}
      </p>
    )}

    {!error && disabled && disabledHint && (
      <p className="text-caption text-text-subtle">
        {disabledHint}
      </p>
    )}
  </div>
);
}