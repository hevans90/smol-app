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

export default function Select({
  options,
  placeholder = 'Select...',
  showSelected = true,
  onSelectChange,
}: {
  options: { value: string; imgSrc?: string }[];
  placeholder?: string;
  showSelected?: boolean;
  onSelectChange?: (value: string) => unknown;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

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

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const listContentRef = React.useRef(options.map(({ value }) => value));
  const isTypingRef = React.useRef(false);

  const click = useClick(context, { event: 'mousedown' });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'listbox' });
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    // This is a large list, allow looping.
    loop: true,
  });
  const typeahead = useTypeahead(context, {
    listRef: listContentRef,
    activeIndex,
    selectedIndex,
    onMatch: isOpen ? setActiveIndex : setSelectedIndex,
    onTypingChange(isTyping) {
      isTypingRef.current = isTyping;
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
    [dismiss, role, listNav, typeahead, click]
  );

  const handleSelect = ({ value, index }: { value: string; index: number }) => {
    setSelectedIndex(index);
    setIsOpen(false);

    if (onSelectChange) {
      onSelectChange(value);
    }
  };

  const selectedItemLabel =
    selectedIndex !== null ? options[selectedIndex]?.value : undefined;

  return (
    <>
      <div
        tabIndex={0}
        ref={refs.setReference}
        aria-labelledby="select-label"
        aria-autocomplete="none"
        className="w-36 flex items-center cursor-pointer justify-center leading-3 p-1 border-primary-800 rounded-md border-[1px] hover:border-primary-500 hover:text-primary-500 outline-none"
        {...getReferenceProps()}
      >
        {(showSelected && selectedItemLabel) || placeholder}
      </div>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              className="overflow-y-auto rounded-md bg-gray-900 border-[1px] border-primary-500 outline-none"
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
              }}
              {...getFloatingProps()}
            >
              {options.map((option, index) => (
                <div
                  className={`flex gap-2 items-center p-2 cursor-pointer ${
                    index === activeIndex &&
                    'bg-gray-800 text-primary-300 outline-none'
                  }`}
                  key={option.value}
                  ref={(node) => {
                    listRef.current[index] = node;
                  }}
                  role="option"
                  tabIndex={index === activeIndex ? 0 : -1}
                  aria-selected={
                    index === selectedIndex && index === activeIndex
                  }
                  {...getItemProps({
                    // Handle pointer select.
                    onClick() {
                      handleSelect({ value: option.value, index });
                    },
                    // Handle keyboard select.
                    onKeyDown(event) {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleSelect({ value: option.value, index });
                      }

                      if (event.key === ' ' && !isTypingRef.current) {
                        event.preventDefault();
                        handleSelect({ value: option.value, index });
                      }
                    },
                  })}
                >
                  {option.imgSrc && (
                    <img
                      className="w-8 h-8"
                      src={option.imgSrc}
                      alt={option.value}
                    />
                  )}
                  {option.value}
                  {showSelected && (
                    <span aria-hidden className="absolute right-4">
                      {index === selectedIndex ? ' ✓' : ''}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
