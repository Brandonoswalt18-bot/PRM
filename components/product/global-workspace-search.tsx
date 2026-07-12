"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

export type GlobalSearchRecord = {
  id: string;
  type: "deal" | "vendor" | "application";
  title: string;
  subtitle: string;
  href: string;
  searchText: string;
};

type GlobalWorkspaceSearchProps = {
  placeholder: string;
  records: GlobalSearchRecord[];
};

const GROUP_ORDER: Array<GlobalSearchRecord["type"]> = ["deal", "vendor", "application"];

const GROUP_LABELS: Record<GlobalSearchRecord["type"], string> = {
  deal: "Deals",
  vendor: "Vendors",
  application: "Applications",
};

function tokenize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function GlobalWorkspaceSearch({
  placeholder,
  records,
}: GlobalWorkspaceSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const resultsId = useId();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);

  useEffect(() => {
    setOpen(false);
    setQuery("");
    setActiveResultId(null);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveResultId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    function focusSearch(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      if (event.key === "/" && !isTyping && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const groupedResults = useMemo(() => {
    const terms = tokenize(query);

    if (terms.length === 0) {
      return [];
    }

    const matches = records.filter((record) =>
      terms.every((term) => record.searchText.includes(term))
    );

    return GROUP_ORDER.map((type) => ({
      type,
      label: GROUP_LABELS[type],
      items: matches.filter((item) => item.type === type).slice(0, 5),
    })).filter((group) => group.items.length > 0);
  }, [query, records]);

  const flatResults = useMemo(
    () => groupedResults.flatMap((group) => group.items),
    [groupedResults]
  );
  const hasQuery = query.trim().length > 0;
  const showResults = open && hasQuery;

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setActiveResultId(null);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      setActiveResultId(null);
      return;
    }

    if (event.key === "Enter") {
      const activeResult = flatResults.find((result) => result.id === activeResultId);

      if (activeResult) {
        event.preventDefault();
        closeSearch();
        router.push(activeResult.href);
      }

      return;
    }

    if ((event.key !== "ArrowDown" && event.key !== "ArrowUp") || flatResults.length === 0) {
      return;
    }

    event.preventDefault();
    setOpen(true);
    const currentIndex = flatResults.findIndex((result) => result.id === activeResultId);
    const nextIndex =
      event.key === "ArrowDown"
        ? currentIndex < flatResults.length - 1
          ? currentIndex + 1
          : 0
        : currentIndex > 0
          ? currentIndex - 1
          : flatResults.length - 1;
    setActiveResultId(flatResults[nextIndex].id);
  }

  return (
    <div className="workspace-search-shell" ref={wrapperRef}>
      <label className="workspace-search-bar">
        <svg aria-hidden="true" className="workspace-search-icon" fill="none" viewBox="0 0 24 24">
          <path
            d="M10.5 5.5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Zm0 0l7 7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
        <input
          ref={inputRef}
          aria-activedescendant={activeResultId ? `${resultsId}-${activeResultId}` : undefined}
          aria-autocomplete="list"
          aria-controls={resultsId}
          aria-expanded={showResults}
          aria-label={placeholder}
          className="workspace-search-input"
          placeholder={placeholder}
          role="combobox"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveResultId(null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </label>

      <span className="sr-only" aria-live="polite">
        {showResults
          ? `${flatResults.length} matching ${flatResults.length === 1 ? "record" : "records"}.`
          : ""}
      </span>

      {showResults ? (
        <div className="workspace-search-results" id={resultsId} role="listbox">
          {groupedResults.length > 0 ? (
            groupedResults.map((group) => (
              <div
                aria-label={group.label}
                className="workspace-search-group"
                key={group.type}
                role="group"
              >
                <div className="workspace-search-group-label">{group.label}</div>
                <div className="workspace-search-group-items">
                  {group.items.map((item) => (
                    <Link
                      aria-selected={activeResultId === item.id}
                      className={`workspace-search-result${activeResultId === item.id ? " is-active" : ""}`}
                      href={item.href}
                      id={`${resultsId}-${item.id}`}
                      key={item.id}
                      prefetch={false}
                      role="option"
                      onClick={closeSearch}
                      onMouseEnter={() => setActiveResultId(item.id)}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="workspace-search-empty">
              <strong>No matching records</strong>
              <span>Try a community name, vendor, contact, email, ID, status, or location.</span>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
