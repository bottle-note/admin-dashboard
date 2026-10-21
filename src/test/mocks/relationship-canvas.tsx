import type { GraphData } from '@antv/g6';

// Canvas events are simulated here; production renders only the G6 canvas.
export function RelationshipCanvas({
  data,
  onSelect,
  selectedId,
}: {
  data: GraphData;
  selectedId?: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div>
      {data.nodes?.map((node) => (
        <button
          key={node.id}
          aria-pressed={selectedId === node.id}
          onClick={() => onSelect(node.id)}
          aria-label={
            node.type === 'image'
              ? `위스키: ${node.style?.labelText}`
              : `속성: ${String(node.data?.detailLabel).replace('\n', ' · ')}`
          }
        >
          {String(node.id)}
        </button>
      ))}
    </div>
  );
}
