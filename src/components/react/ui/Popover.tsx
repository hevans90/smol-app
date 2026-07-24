import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFloatingTree,
  useHover,
  useId,
  useInteractions,
  useMergeRefs,
  useRole,
  type Placement,
} from '@floating-ui/react';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

interface PopoverOptions {
  initialOpen?: boolean;
  placement?: Placement;
  floatOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openOnHover?: boolean;
  persistOnHoverContent?: boolean;
  // By default, `flip` falls back to the perpendicular axis (top/bottom)
  // when neither the requested side nor its opposite fit — which reads as
  // "sometimes centers" for a popover meant to strictly stay left/right of
  // its trigger (e.g. an item-hover tooltip next to a dropdown row). Set
  // this to only ever flip to the opposite side, never top/bottom.
  preventAxisFlip?: boolean;
}

const FloatingNodeContext = React.createContext<string | null>(null);

function usePopover({
  initialOpen = false,
  placement = 'left',
  floatOffset = 5,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  openOnHover = false,
  persistOnHoverContent = false,
  preventAxisFlip = false,
}: PopoverOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
  const [labelId, setLabelId] = React.useState<string | undefined>();
  const [descriptionId, setDescriptionId] = React.useState<
    string | undefined
  >();

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const tree = useFloatingTree();
  const floatingParentIdFromTree = useFloatingParentNodeId();
  const inheritedParentId = React.useContext(FloatingNodeContext);
  const parentId = inheritedParentId ?? floatingParentIdFromTree;
  const nodeId = useFloatingNodeId(parentId ?? undefined);

  const data = useFloating({
    nodeId,
    placement,
    open,
    onOpenChange: setOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(floatOffset),
      flip({
        crossAxis: placement.includes('-'),
        fallbackAxisSideDirection: preventAxisFlip ? 'none' : 'end',
        padding: 5,
      }),
      shift({ padding: 5 }),
    ],
  });

  const context = data.context;

  // 🔥 Hover logic aware of nested popovers
  const hover = useHover(context, {
    enabled: openOnHover,
    // @ts-expect-error
    handleClose: persistOnHoverContent
      ? (ctx) => {
          const event = (ctx as { event?: MouseEvent }).event;
          if (!tree || !nodeId)
            // @ts-expect-error
            return safePolygon({ blockPointerEvents: true })(event);

          const nodes = tree.nodesRef.current;
          const isChildOpen = nodes.some((n) => {
            if (!n || !n.id) return false;
            if (n.id === nodeId) return false;

            let currentParent = n.parentId;
            while (currentParent) {
              if (currentParent === nodeId && n.context?.open) {
                return true;
              }
              const parentNode = nodes.find((x) => x.id === currentParent);
              currentParent = parentNode?.parentId ?? null;
            }
            return false;
          });

          if (isChildOpen) {
            // Don’t close if a nested popover is open
            return false;
          }

          // @ts-expect-error
          return safePolygon({ blockPointerEvents: true })(event);
        }
      : null,
  });

  const click = useClick(context, { enabled: !openOnHover });
  const dismiss = useDismiss(context, { bubbles: true });
  const role = useRole(context);
  const interactions = useInteractions([click, hover, dismiss, role]);

  return React.useMemo(
    () => ({
      nodeId,
      parentId,
      open,
      setOpen,
      tree,
      openOnHover,
      ...interactions,
      ...data,
      labelId,
      descriptionId,
      setLabelId,
      setDescriptionId,
    }),
    [
      nodeId,
      parentId,
      open,
      setOpen,
      tree,
      openOnHover,
      interactions,
      data,
      labelId,
      descriptionId,
    ],
  );
}

type ContextType =
  | (ReturnType<typeof usePopover> & {
      setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
      setDescriptionId: React.Dispatch<
        React.SetStateAction<string | undefined>
      >;
    })
  | null;

const PopoverContext = React.createContext<ContextType>(null);

const usePopoverContext = () => {
  const context = React.useContext(PopoverContext);
  if (context == null)
    throw new Error('Popover components must be wrapped in <Popover />');
  return context;
};

export function Popover({
  children,
  ...restOptions
}: { children: React.ReactNode } & PopoverOptions) {
  const popover = usePopover({ ...restOptions });
  return (
    <PopoverContext.Provider value={popover}>
      {children}
    </PopoverContext.Provider>
  );
}

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const PopoverTrigger = React.forwardRef<
  HTMLElement,
  React.HTMLProps<HTMLElement> & PopoverTriggerProps
>(function PopoverTrigger({ children, asChild = false, ...props }, propRef) {
  const context = usePopoverContext();

  const childrenRef = (children as any).ref;
  const ref = useMergeRefs([context.refs.setReference, propRef, childrenRef]);

  const triggerProps = context.getReferenceProps({
    ref,
    ...props,
    ...(children as any)?.props,
    'data-state': context.open ? 'open' : 'closed',
  });

  const trigger =
    asChild && React.isValidElement(children) ? (
      React.cloneElement(children, triggerProps)
    ) : (
      <button type="button" {...triggerProps}>
        {children}
      </button>
    );

  return (
    <FloatingNodeContext.Provider value={context.nodeId}>
      {trigger}
    </FloatingNodeContext.Provider>
  );
});

export const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement> & {
    initialFocusRef?: React.RefObject<HTMLElement>;
    // A popover rendered inside another open popover's content (e.g. an
    // item-hover tooltip inside a search-results dropdown) needs to paint
    // above it unambiguously — every PopoverContent otherwise shares the
    // same fixed z-index, so which one wins is left to DOM-order/portal
    // details that can vary. Pass a higher value for nested cases.
    zIndex?: number;
  }
>(function PopoverContent({ style, initialFocusRef, zIndex = 100, ...props }, propRef) {
  const { context: floatingContext, ...context } = usePopoverContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);

  if (!floatingContext.open) return null;

  return (
    <FloatingPortal root={typeof document !== 'undefined' ? document.body : undefined}>
      <FloatingFocusManager
        context={floatingContext}
        modal={false}
        initialFocus={initialFocusRef}
        returnFocus={true}
        // Hover-triggered popovers (item-preview tooltips) are decorative —
        // they have no focusable content and nothing to keyboard-navigate —
        // so focus management should leave whatever's currently focused
        // (e.g. a search input) alone rather than default to grabbing focus
        // onto the floating element itself, which is what FloatingFocusManager
        // does absent an explicit initialFocusRef. Click-opened popovers
        // (dropdowns/menus) still get normal focus management.
        disabled={context.openOnHover}
      >
        <div
          ref={ref}
          style={{
            ...context.floatingStyles,
            ...style,
            zIndex,
            pointerEvents: 'auto',
          }}
          aria-labelledby={context.labelId}
          aria-describedby={context.descriptionId}
          {...context.getFloatingProps(props)}
          className={twMerge(props.className)}
        >
          {props.children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
});

export const PopoverHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLProps<HTMLHeadingElement>
>(function PopoverHeading(props, ref) {
  const { setLabelId } = usePopoverContext();
  const id = useId();

  React.useLayoutEffect(() => {
    setLabelId(id);
    return () => setLabelId(undefined);
  }, [id, setLabelId]);

  return (
    <h2 {...props} ref={ref} id={id}>
      {props.children}
    </h2>
  );
});

export const PopoverDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLProps<HTMLParagraphElement>
>(function PopoverDescription(props, ref) {
  const { setDescriptionId } = usePopoverContext();
  const id = useId();

  React.useLayoutEffect(() => {
    setDescriptionId(id);
    return () => setDescriptionId(undefined);
  }, [id, setDescriptionId]);

  return <p {...props} ref={ref} id={id} />;
});
