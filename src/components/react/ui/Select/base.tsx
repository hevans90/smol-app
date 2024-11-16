import {
  FloatingFocusManager,
  FloatingPortal,
  autoUpdate,
  flip,
  offset,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '@floating-ui/react';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export function BaseSelect({
  options,
  placeholder = '---',
  showSelected = true,
  compactDisplay = false,
  multi = false,
  disabled = false, // New prop for disabled state
  selectedIndices,
  onSelectionChange,
  className,
}: {
  options: { value: string; display?: string; imgSrc?: string }[];
  placeholder?: string;
  showSelected?: boolean;
  compactDisplay?: boolean;
  multi?: boolean;
  disabled?: boolean;
  selectedIndices: number[];
  onSelectionChange: (indices: number[]) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [isHovering, setIsHovering] = React.useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 10,
      }),
    ],
  });

  const hoverFloating = useFloating({
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), flip({ padding: 10 })],
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const listContentRef = React.useRef(options.map(({ value }) => value));
  const isTypingRef = React.useRef(false);

  const click = useClick(context, { event: 'mousedown' });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    selectedIndex: selectedIndices.length > 0 ? selectedIndices[0] : null,
    onNavigate: setActiveIndex,
    loop: true,
  });
  const typeahead = useTypeahead(context, {
    listRef: listContentRef,
    activeIndex,
    selectedIndex: selectedIndices.length > 0 ? selectedIndices[0] : null,
    onMatch: multi
      ? undefined
      : (index) => {
          setActiveIndex(index);
        },
    onTypingChange(isTyping) {
      isTypingRef.current = isTyping;
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    disabled ? [] : [dismiss, role, listNav, typeahead, click],
  );

  const handleSelect = (index: number) => {
    if (disabled) return; // Prevent interaction when disabled

    const isAlreadySelected = selectedIndices.includes(index);

    let updatedIndices: number[];
    if (multi) {
      updatedIndices = isAlreadySelected
        ? selectedIndices.filter((i) => i !== index)
        : [...selectedIndices, index];
    } else {
      updatedIndices = [index];
    }

    onSelectionChange(updatedIndices);
    if (!multi) setIsOpen(false);
  };

  const selectedItems = selectedIndices.map((i) => options[i]);

  return (
    <>
      <div
        tabIndex={disabled ? -1 : 0}
        ref={(node) => {
          refs.setReference(node);
          hoverFloating.refs.setReference(node);
        }}
        aria-labelledby="select-label"
        aria-autocomplete="none"
        aria-disabled={disabled}
        className={twMerge(
          'flex cursor-pointer items-center justify-between rounded-md border-[1px] border-primary-800 p-2 outline-none',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : ' hover:border-primary-500 hover:text-primary-500',
          className,
        )}
        onMouseEnter={() => !disabled && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        {...getReferenceProps()}
      >
        {selectedItems.length > 0 && showSelected ? (
          compactDisplay ? (
            <span className="flex w-full items-center justify-center">
              {selectedItems.length} selected
            </span>
          ) : (
            <div className="flex w-full flex-wrap gap-1">
              {selectedItems.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-sm"
                >
                  {item.imgSrc && <img className="h-4 w-4" src={item.imgSrc} />}
                  {item.display ?? item.value}
                </div>
              ))}
            </div>
          )
        ) : (
          <span className="flex w-full items-center justify-center">
            {placeholder}
          </span>
        )}
      </div>

      {isHovering &&
        compactDisplay &&
        !disabled &&
        selectedItems.length > 0 && (
          <FloatingPortal>
            <div
              className="z-50 rounded-md border-[1px] border-primary-500 bg-gray-800 p-2 shadow-lg"
              ref={hoverFloating.refs.setFloating}
              style={hoverFloating.floatingStyles}
            >
              {selectedItems.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center gap-2 p-1 text-sm"
                >
                  {item.imgSrc && <img className="h-4 w-4" src={item.imgSrc} />}
                  {item.display ?? item.value}
                </div>
              ))}
            </div>
          </FloatingPortal>
        )}

      {isOpen && !disabled && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              className="overflow-y-auto rounded-md border-[1px] border-primary-500 bg-gray-900 outline-none"
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
              }}
              {...getFloatingProps()}
            >
              {options.map((option, index) => (
                <div
                  className={twMerge(
                    'flex cursor-pointer items-center gap-2 p-2',
                    selectedIndices.includes(index) && 'bg-gray-700',
                    index === activeIndex &&
                      !selectedIndices.includes(index) &&
                      'bg-gray-800 text-primary-300',
                  )}
                  key={option.value}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  role="option"
                  tabIndex={index === activeIndex ? 0 : -1}
                  aria-selected={selectedIndices.includes(index)}
                  {...getItemProps({
                    onClick() {
                      handleSelect(index);
                    },
                    onKeyDown(event) {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSelect(index);
                      }

                      if (event.key === ' ' && !isTypingRef.current) {
                        event.preventDefault();
                        handleSelect(index);
                      }
                    },
                  })}
                >
                  {option.imgSrc && (
                    <img
                      className="h-8 w-8"
                      src={option.imgSrc}
                      alt={option.value}
                    />
                  )}
                  {option.display ?? option.value}
                  <span aria-hidden className="absolute right-4">
                    {selectedIndices.includes(index) ? ' ✓' : ''}
                  </span>
                </div>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
