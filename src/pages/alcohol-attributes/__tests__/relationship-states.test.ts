import { describe, expect, it } from 'vitest';
import { relationshipStates } from '../variants/a/relationship-states';
const data = {
  nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  edges: [{ id: 'ab', source: 'a', target: 'b' }],
};
describe('relationship emphasis', () => {
  it('keeps selected connections while hovering another node', () => {
    expect(relationshipStates(data, 'a', 'c')).toEqual({
      a: ['chosen'],
      b: ['related'],
      c: ['muted', 'hovered'],
      ab: ['related'],
    });
  });
  it('restores all nodes and edges after hover leaves', () => {
    expect(relationshipStates(data, null, 'a').c).toEqual(['muted']);
    expect(relationshipStates(data, null, null)).toEqual({
      a: ['normal'],
      b: ['normal'],
      c: ['normal'],
      ab: ['normal'],
    });
  });
  it('replaces the previous relationship when selection changes', () => {
    expect(relationshipStates(data, 'c', null)).toEqual({
      a: ['muted'],
      b: ['muted'],
      c: ['chosen'],
      ab: ['muted'],
    });
  });
});
