import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  guessWikiIconUrlFromName,
  searchAllOrderItems,
  type OrderSearchKind,
  type OrderSearchResult,
} from '../../../_utils/utils';
import { OrderItemPopover } from '../item-hovers/OrderItemPopover';
import { ItemIcon } from '../ui/ItemIcon';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

// Same shape as OrderSearchResult, but widened to include the "Other"
// escape-hatch case (a query that doesn't match anything catalogued) —
// there's no dedicated searcher for this, it's synthesized here when picked.
export type PickedOrderItem = Omit<OrderSearchResult, 'kind'> & {
  kind: OrderSearchKind | 'other';
};

const DEBOUNCE_MS = 80;

// Wraps every case-insensitive occurrence of any query token in a name with
// a highlighted span, so a result row visually shows WHY it matched.
const HighlightedName = ({ name, tokens }: { name: string; tokens: string[] }) => {
  if (tokens.length === 0) return <>{name}</>;
  const pattern = new RegExp(
    `(${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi',
  );
  const parts = name.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        tokens.some((t) => part.toLowerCase() === t.toLowerCase()) ? (
          <span key={i} className="text-primary-400">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
};

/**
 * Search-first order item picker: type → fuzzy dropdown across uniques,
 * base types, and gems (incl. transfigured) at once, each row tagged with
 * its kind → arrow keys/Enter to select, or fall through to a "use as
 * custom item" escape hatch. See searchAllOrderItems for the ranking/merge
 * strategy across the three underlying catalogs.
 */
export const OrderSearchPicker = ({
  onSelect,
  autoFocus = true,
}: {
  onSelect: (picked: PickedOrderItem) => void;
  autoFocus?: boolean;
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [query]);

  // the popover renders into a portal, so `w-full` resolves against the
  // portal's container rather than the input — track the input's actual
  // width instead and apply it explicitly
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setTriggerWidth(el.offsetWidth));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const trimmed = debouncedQuery.trim();
  const results = trimmed ? searchAllOrderItems(trimmed) : [];
  const tokens = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  // the escape hatch is always the last row when there's a query
  const rowCount = results.length + (trimmed ? 1 : 0);
  const isOpen = rowCount > 0;

  useEffect(() => {
    setActiveIndex(0);
  }, [debouncedQuery]);

  const selectIndex = (index: number) => {
    if (index < results.length) {
      onSelect(results[index]);
    } else if (trimmed) {
      onSelect({
        kind: 'other',
        name: trimmed,
        icon: guessWikiIconUrlFromName(trimmed),
        sublabel: 'Custom',
        id: `other:${trimmed}`,
      });
    }
    setQuery('');
    setDebouncedQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rowCount - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectIndex(activeIndex);
    } else if (e.key === 'Escape') {
      // close just the dropdown first; a second Escape (nothing open) then
      // bubbles up to close the parent dialog as normal
      e.stopPropagation();
      setQuery('');
      setDebouncedQuery('');
    }
  };

  return (
    <Popover placement="bottom-start" open={isOpen}>
      <PopoverTrigger asChild={true}>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={query}
          placeholder="Search for a unique, base type, or gem…"
          className="w-full border border-primary-800 bg-gray-900 px-3 py-2 text-lg"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </PopoverTrigger>
      <PopoverContent
        style={{ width: triggerWidth }}
        className="rounded-sm border-[1px] border-primary-800 bg-gray-900 outline-none focus:ring-0"
        initialFocusRef={inputRef}
      >
        {results.map((item, index) => (
          <OrderItemPopover
            key={`${item.kind}:${item.name}`}
            order={{
              type: item.kind,
              description: item.name,
              item_base_type: item.itemBaseType,
              link_url: item.linkUrl,
            }}
            placement="right"
          >
            <div
              role="option"
              aria-selected={index === activeIndex}
              tabIndex={-1}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectIndex(index)}
              className={twMerge(
                'flex cursor-pointer items-center gap-2 p-2',
                index === activeIndex ? 'bg-gray-700' : 'hover:bg-gray-800',
              )}
            >
              <ItemIcon src={item.icon} className="h-8 w-8 shrink-0 object-contain" />
              <span className="grow truncate">
                <HighlightedName name={item.name} tokens={tokens} />
              </span>
              <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-primary-800">
                {item.sublabel}
              </span>
            </div>
          </OrderItemPopover>
        ))}
        {trimmed && (
          <div
            role="option"
            aria-selected={activeIndex === results.length}
            tabIndex={-1}
            onMouseEnter={() => setActiveIndex(results.length)}
            onClick={() => selectIndex(results.length)}
            className={twMerge(
              'flex cursor-pointer items-center gap-2 p-2 text-sm text-primary-800',
              activeIndex === results.length ? 'bg-gray-700' : 'hover:bg-gray-800',
            )}
          >
            Use "{trimmed}" as a custom item
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
