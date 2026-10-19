import type { GraphData } from '@antv/g6';

export function relationshipStates(
  data: GraphData,
  selected: string | null,
  hovered: string | null
) {
  const focus = selected ?? hovered;
  const neighbors = new Set<string>();
  const states: Record<string, string[]> = {};
  for (const edge of data.edges ?? []) {
    const related = !!focus && (edge.source === focus || edge.target === focus);
    if (related) {
      neighbors.add(edge.source);
      neighbors.add(edge.target);
    }
    if (edge.id) states[edge.id] = [!focus ? 'normal' : related ? 'related' : 'muted'];
  }
  for (const node of data.nodes ?? []) {
    states[node.id] = [
      node.id === selected
        ? 'chosen'
        : !focus
          ? 'normal'
          : neighbors.has(node.id) || node.id === focus
            ? 'related'
            : 'muted',
    ];
    if (node.id === hovered && node.id !== selected) states[node.id]?.push('hovered');
  }
  return states;
}
