import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { twMerge } from 'tailwind-merge';
import type { AtlasData, AtlasNode } from '../../../_utils/atlas';
import {
  NODE_RADIUS,
  TREE_COLOURS,
  baseTree,
  layerPaths,
  nodesPath,
  treeViewBox,
  type TreeLayer,
} from '../../../_utils/atlas-geometry';

// Two ways of drawing an atlas tree, in the manner of pobb.in's tree preview:
// the whole tree dimmed, with what is allocated lit on top.
//
//   AtlasTreeThumb     static, a few paths; cheap enough for one per member
//   AtlasTreeExplorer  pan, zoom and a tooltip per node; one at a time

// Thumbnails are drawn at ~1/60 scale, where true-size nodes would vanish.
// (any larger and clustered notables merge into blobs the full view lacks)
const THUMB_NODE_SCALE = 1.5;
// ...but the unallocated background stays fine-grained, or it turns to mush
const THUMB_BASE_SCALE = 1.2;
const baseId = (data: AtlasData) => `atlas-base-${data.version.replace(/\W/g, '-')}`;

/**
 * The unallocated tree for one version, defined once and reused by every
 * thumbnail through <use>. Render one per version somewhere on the page.
 */
export const AtlasTreeDefs = ({ data }: { data: AtlasData }) => {
  const base = baseTree(data, THUMB_BASE_SCALE);
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      <defs>
        <g id={baseId(data)}>
          <path d={base.edges} fill="none" stroke={TREE_COLOURS.edge} strokeWidth={26} />
          <path d={base.nodes} fill={TREE_COLOURS.node} />
        </g>
      </defs>
    </svg>
  );
};

/** One lit layer: nodes, and the edges between them. Dimmest first. */
export type ThumbLayer = TreeLayer;

// Lit edges as a fixed fraction of a small node's radius, so the thumbnail and
// the explorer keep the same proportions
const litEdgeWidth = (nodeScale: number) => NODE_RADIUS.small * nodeScale * 0.8;

/** Every layer's edges under every layer's nodes, so no dot is cut by a line. */
const LitLayers = ({ drawn, edgeWidth }: { drawn: ReturnType<typeof layerPaths>; edgeWidth: number }) => (
  <>
    {drawn.map(({ colour, edges }, index) => (
      <path
        key={`e${index}`}
        d={edges}
        fill="none"
        stroke={colour}
        strokeWidth={edgeWidth}
        strokeLinecap="round"
      />
    ))}
    {drawn.map(({ colour, nodes }, index) => (
      <path key={`n${index}`} d={nodes} fill={colour} />
    ))}
  </>
);

export const AtlasTreeThumb = ({
  data,
  layers,
  label,
  className,
}: {
  data: AtlasData;
  /** drawn in order, later layers on top */
  layers: ThumbLayer[];
  label: string;
  className?: string;
}) => {
  const view = treeViewBox(data);
  const drawn = useMemo(() => layerPaths(data, layers, THUMB_NODE_SCALE), [data, layers]);

  return (
    <svg
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      role="img"
      aria-label={label}
      className={twMerge('block', className)}
    >
      <use href={`#${baseId(data)}`} />
      <LitLayers drawn={drawn} edgeWidth={litEdgeWidth(THUMB_NODE_SCALE)} />
    </svg>
  );
};

type View = { x: number; y: number; w: number; h: number };

const KIND_LABEL: Partial<Record<AtlasNode['kind'], string>> = {
  notable: 'Notable',
  keystone: 'Keystone',
  gateway: 'Gateway',
};

export const AtlasTreeExplorer = ({
  data,
  layers,
  highlight,
  noteFor,
  className,
}: {
  data: AtlasData;
  /** what is lit, dimmest first; the same layers a thumbnail takes */
  layers: TreeLayer[];
  /** nodes to call out (e.g. the mechanic hovered in a side list) */
  highlight?: Set<number>;
  /** an extra tooltip line for a node, e.g. "4 members" */
  noteFor?: (hash: number) => string | undefined;
  className?: string;
}) => {
  const full = useMemo(() => treeViewBox(data), [data]);
  const [view, setView] = useState<View>(full);
  useEffect(() => setView(full), [full]);

  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  // user units per CSS pixel, and the top-left corner actually shown (the
  // viewBox is letterboxed inside the element)
  const measure = () => {
    const rect = svgRef.current!.getBoundingClientRect();
    const current = viewRef.current;
    const scale = Math.max(current.w / rect.width, current.h / rect.height);
    return {
      rect,
      scale,
      left: current.x - (rect.width * scale - current.w) / 2,
      top: current.y - (rect.height * scale - current.h) / 2,
    };
  };

  // wheel zoom, about the cursor. Attached by hand: React's wheel listener
  // is passive and could not stop the page scrolling underneath.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const { rect, scale, left, top } = measure();
      const current = viewRef.current;
      const factor = event.deltaY > 0 ? 1.18 : 1 / 1.18;
      const w = Math.min(Math.max(current.w * factor, full.w / 12), full.w * 1.1);
      const applied = w / current.w;
      const px = left + (event.clientX - rect.left) * scale;
      const py = top + (event.clientY - rect.top) * scale;
      setView({
        w,
        h: current.h * applied,
        x: px - (px - current.x) * applied,
        y: py - (py - current.y) * applied,
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [full]);

  const drag = useRef<{ x: number; y: number }>();
  const [tip, setTip] = useState<{ hash: number; x: number; y: number }>();

  const onPointerDown = (event: PointerEvent<SVGSVGElement>) => {
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (drag.current) {
      const { scale } = measure();
      const dx = (event.clientX - drag.current.x) * scale;
      const dy = (event.clientY - drag.current.y) * scale;
      drag.current = { x: event.clientX, y: event.clientY };
      setView((current) => ({ ...current, x: current.x - dx, y: current.y - dy }));
      setTip(undefined);
      return;
    }
    const hash = (event.target as SVGElement).dataset?.hash;
    if (!hash) return setTip(undefined);
    const { rect } = measure();
    setTip({
      hash: Number(hash),
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };
  const endDrag = () => (drag.current = undefined);

  const base = baseTree(data);
  const drawn = useMemo(() => layerPaths(data, layers), [data, layers]);
  const highlightPath = useMemo(
    () => (highlight?.size ? nodesPath(data, (hash) => highlight.has(hash), 1.35) : ''),
    [data, highlight],
  );
  // transparent, oversized hit targets: the tooltip works on every node,
  // allocated or not
  const targets = useMemo(
    () =>
      Object.entries(data.nodes)
        .filter(([, node]) => node.x !== undefined)
        .map(([hash, node]) => (
          <circle
            key={hash}
            data-hash={hash}
            cx={node.x}
            cy={node.y}
            r={NODE_RADIUS[node.kind] * 1.6}
            fill="transparent"
          />
        )),
    [data],
  );

  const tipNode = tip ? data.nodes[tip.hash] : undefined;
  const tipNote = tip ? noteFor?.(tip.hash) : undefined;

  return (
    <div className={twMerge('relative overflow-hidden rounded bg-gray-950', className)}>
      <svg
        ref={svgRef}
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setTip(undefined)}
      >
        <path d={base.edges} fill="none" stroke={TREE_COLOURS.edge} strokeWidth={14} />
        <path d={base.nodes} fill={TREE_COLOURS.node} />
        <LitLayers drawn={drawn} edgeWidth={litEdgeWidth(1)} />
        {highlightPath && (
          <path
            d={highlightPath}
            fill="none"
            stroke={TREE_COLOURS.highlight}
            strokeWidth={18}
          />
        )}
        {targets}
      </svg>

      <button
        type="button"
        onClick={() => setView(full)}
        className="absolute bottom-2 right-2 rounded border border-primary-900 bg-gray-900 px-2 py-1 text-xs text-primary-800 hover:text-primary-300"
      >
        Reset view
      </button>

      {tip && tipNode && (
        <div
          className="pointer-events-none absolute z-10 w-72 rounded border border-primary-900 bg-gray-900 p-3 text-sm shadow-lg"
          style={{
            left: Math.min(tip.x + 16, (svgRef.current?.clientWidth ?? 0) - 300),
            top: tip.y + 16,
          }}
        >
          <div className="text-primary-400">{tipNode.name}</div>
          <div className="mb-2 text-xs text-primary-800">
            {[KIND_LABEL[tipNode.kind], data.mechanics[tipNode.mechanic], tipNote]
              .filter(Boolean)
              .join(' · ')}
          </div>
          {tipNode.stats.map((stat, index) => (
            <div key={index} className="whitespace-pre-line text-poeItem-magic">
              {stat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
