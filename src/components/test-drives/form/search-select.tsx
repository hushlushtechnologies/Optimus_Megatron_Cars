"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/cn";
import type { SearchResult } from "@/src/lib/types/test-drive";

const DEBOUNCE_MS = 250;

interface SearchSelectProps<T extends { id: string }> {
  label: string;
  placeholder: string;
  helper?: string;
  error?: string;
  required?: boolean;
  value: T | null;
  onChange: (item: T | null) => void;
  search: (query: string) => Promise<SearchResult<T>>;
  renderOption: (item: T) => ReactNode;
  renderSelected: (item: T) => ReactNode;
  emptyMessage: string;
  isOptionDisabled?: (item: T) => boolean;
  getDisabledReason?: (item: T) => string;
}

export function SearchSelect<T extends { id: string }>({
  label,
  placeholder,
  helper,
  error,
  required,
  value,
  onChange,
  search,
  renderOption,
  renderSelected,
  emptyMessage,
  isOptionDisabled,
  getDisabledReason,
}: SearchSelectProps<T>) {
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const helperId = `${baseId}-helper`;
  const errorId = `${baseId}-error`;

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<T[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [activeIndex, setActiveIndex] = useState(-1);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const runSearch = (term: string, delay: number) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("loading");
    const id = ++requestId.current;

    timer.current = setTimeout(async () => {
      try {
        const result = await search(term);
        if (id !== requestId.current) return; // a newer search has started: ignore this answer
        setResults(result.results);
        setStatus(result.failed ? "error" : "idle");
        setActiveIndex(-1);
      } catch {
        if (id !== requestId.current) return;
        setResults([]);
        setStatus("error");
      }
    }, delay);
  };

  const disabled = (item: T) => isOptionDisabled?.(item) ?? false;

  const choose = (item: T) => {
    if (disabled(item)) return;
    onChange(item);
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleChange = (next: string) => {
    setQuery(next);
    setOpen(true);
    runSearch(next, DEBOUNCE_MS);
  };

  const handleFocus = () => {
    setOpen(true);
    if (results.length === 0 || status === "error") runSearch(query, 0);
  };

  const move = (direction: 1 | -1) => {
    if (results.length === 0) return;
    let next = activeIndex;
    for (let step = 0; step < results.length; step++) {
      next = (next + direction + results.length) % results.length;
      if (!disabled(results[next])) {
        setActiveIndex(next);
        return;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        else move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Enter":
        // Never let Enter submit the whole form from inside a search box.
        event.preventDefault();
        if (open && activeIndex >= 0 && results[activeIndex]) choose(results[activeIndex]);
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          setOpen(false);
        }
        break;
    }
  };

  const clear = () => {
    onChange(null);
    // The input appears on the next render; focus it then.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const describedBy =
    [helper ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const showList = open && status !== "error" && results.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={value ? undefined : inputId} className="text-label">
        {label}
        {required && (
          <span className="ml-0.5 text-red-400" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {value ? (
        <div
          className={cn(
            "bg-card flex items-center justify-between gap-3 rounded-md border px-3 py-2.5",
            error ? "border-red-500" : "border-border",
          )}
        >
          <div className="min-w-0 flex-1">{renderSelected(value)}</div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={`Change ${label.toLowerCase()}`}
            onClick={clear}
          >
            Change
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative"
          onBlur={(event) => {
            if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
          }}
        >
          <div className="relative">
            <Search
              className="text-text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              role="combobox"
              autoComplete="off"
              aria-expanded={open}
              aria-controls={showList ? listId : undefined}
              aria-autocomplete="list"
              aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
              aria-invalid={error ? true : undefined}
              aria-describedby={describedBy}
              placeholder={placeholder}
              value={query}
              onChange={(event) => handleChange(event.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              className={cn(
                "bg-card text-body text-text-primary placeholder:text-text-subtle focus-visible:ring-primary h-10 w-full rounded-md border pr-9 pl-9 focus-visible:ring-2 focus-visible:outline-none",
                error ? "border-red-500" : "border-border",
              )}
            />
            {status === "loading" && (
              <Loader2
                className="text-text-subtle absolute top-1/2 right-3 size-4 -translate-y-1/2 motion-safe:animate-spin"
                aria-hidden="true"
              />
            )}
          </div>

          {open && (
            <div className="surface-card-elevated border-border absolute z-30 mt-1 max-h-72 w-full overflow-y-auto rounded-md border py-1">
              {status === "error" ? (
                <p role="alert" className="text-body-sm text-text-primary px-3 py-3">
                  The search failed. Check your connection and try again.
                </p>
              ) : status === "loading" && results.length === 0 ? (
                <p className="text-body-sm text-text-muted px-3 py-3">Searching…</p>
              ) : results.length === 0 ? (
                <p className="text-body-sm text-text-muted px-3 py-3">{emptyMessage}</p>
              ) : (
                <ul id={listId} role="listbox" aria-label={label}>
                  {results.map((item, index) => {
                    const isDisabled = disabled(item);
                    return (
                      <li
                        key={item.id}
                        id={`${listId}-${index}`}
                        role="option"
                        aria-selected={index === activeIndex}
                        aria-disabled={isDisabled || undefined}
                        // Keeps focus in the input so the list doesn't close before the click lands.
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => choose(item)}
                        onMouseEnter={() => !isDisabled && setActiveIndex(index)}
                        className={cn(
                          "flex items-center justify-between gap-3 px-3 py-2",
                          isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                          index === activeIndex && !isDisabled && "bg-card-hover",
                        )}
                      >
                        <div className="min-w-0 flex-1">{renderOption(item)}</div>
                        {isDisabled && getDisabledReason && (
                          <span className="text-caption text-text-subtle shrink-0">
                            {getDisabledReason(item)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          <p className="sr-only" role="status" aria-live="polite">
            {open && status === "idle"
              ? `${results.length} result${results.length === 1 ? "" : "s"} available`
              : ""}
          </p>
        </div>
      )}

      {helper && !error && (
        <p id={helperId} className="text-caption text-text-subtle">
          {helper}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-body-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
