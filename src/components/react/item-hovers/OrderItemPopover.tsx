import type { Placement } from '@floating-ui/react';
import React, { useMemo } from 'react';
import { buildOrderItemPreview } from '../../../_utils/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { ItemDetail } from './ItemDetail';

interface OrderItemPopoverProps {
  order: {
    type: string;
    description?: string | null;
    link_url?: string | null;
    item_base_type?: string | null;
  };
  children: React.ReactNode;
  // Rows inside another popover/dropdown (quick-order search results, the
  // selected-items preview list) need the tooltip pushed to one side so it
  // doesn't cover the very dropdown/list it's hovering over — defaults to
  // Popover's own default ('left') when omitted. `preventAxisFlip` below
  // keeps it strictly on this side (or the opposite, if there's no room) —
  // never top/bottom — so it never reads as "centering" on the trigger.
  placement?: Placement;
}

// Wraps an order row/dialog's icon with the same hover-preview experience
// the character sheet has — but built from a canonical, static preview
// (see buildOrderItemPreview) rather than a real per-instance item, since
// orders don't carry one. Renders children unwrapped when there's nothing
// to preview (Other orders, or an unresolved unique/base/gem name), so
// wrapping a row never risks showing an empty tooltip.
export const OrderItemPopover: React.FC<OrderItemPopoverProps> = ({
  order,
  children,
  placement,
}) => {
  const preview = useMemo(() => buildOrderItemPreview(order), [order]);

  if (!preview) return <>{children}</>;

  return (
    <Popover openOnHover placement={placement} preventAxisFlip>
      {/* asChild clones the trigger's ref/hover handlers straight onto
          whatever single element is passed (an icon, or a whole dropdown
          row — OrderSearchPicker wraps its entire row so hovering anywhere
          on it triggers the popover, not just the icon), so floating-ui
          anchors to its actual rendered box instead of a zero-sized
          wrapper. */}
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      {/* Rendered on hover from inside other popovers/dropdowns (the
          quick-order search results, the fulfillment dialog) — a higher
          z-index than the default (100) so it unambiguously paints above
          whatever it's nested in, rather than leaving that to DOM-order
          details between two equal-z-index floating layers. */}
      <PopoverContent className="outline-none focus:ring-0" zIndex={500}>
        <ItemDetail item={preview} />
      </PopoverContent>
    </Popover>
  );
};
