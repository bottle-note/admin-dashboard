import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { GraphOptions, NodeData } from '@antv/g6';
import { RelationshipCanvas } from '../variants/a/RelationshipCanvas';

// G6 requires a real Canvas. Verify the React/renderer boundary here and physics in the browser.
const engine = vi.hoisted(() => ({
  options: {} as GraphOptions,
  zoom: 0.4,
  events: new Map<string, () => void>(),
  resize: () => {},
  fit: vi.fn(async () => {}),
  destroy: vi.fn(),
  draw: vi.fn(async () => {}),
  states: vi.fn(async () => {}),
}));
vi.mock('@antv/g6', () => ({
  NodeEvent: { CLICK: 'click', POINTER_ENTER: 'enter', POINTER_LEAVE: 'leave' },
  CanvasEvent: { CLICK: 'canvas-click' },
  GraphEvent: { AFTER_TRANSFORM: 'transform' },
  Graph: class {
    constructor(options: GraphOptions) {
      engine.options = options;
    }
    on(name: string, callback: () => void) {
      engine.events.set(name, callback);
    }
    getZoom() {
      return engine.zoom;
    }
    async zoomTo(value: number) {
      engine.zoom = value;
      engine.events.get('transform')?.();
    }
    fitView = engine.fit;
    async fitCenter() {}
    draw = engine.draw;
    setElementState = engine.states;
    setData() {}
    async render() {}
    resize() {}
    destroy = engine.destroy;
  },
}));
const node: NodeData = { id: 'value', type: 'rect', style: { labelText: '77 점\n대중성' } };
const data = { nodes: [node], edges: [] };
beforeEach(() => {
  engine.zoom = 0.4;
  engine.events.clear();
  vi.clearAllMocks();
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        engine.resize = callback;
      }
      observe() {}
      disconnect() {}
    }
  );
});

afterEach(() => vi.unstubAllGlobals());

describe('관계 그래프 탐색', () => {
  it('확대 후 선택하거나 컨테이너가 바뀌어도 전체 맞춤을 다시 하지 않는다', async () => {
    const onSelect = vi.fn();
    const view = render(<RelationshipCanvas data={data} selectedId={null} onSelect={onSelect} />);
    await waitFor(() => expect(engine.fit).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('button', { name: '그래프 확대' }));
    view.rerender(<RelationshipCanvas data={data} selectedId="value" onSelect={onSelect} />);
    act(() => engine.resize());
    expect(engine.fit).toHaveBeenCalledTimes(1);
    expect(engine.destroy).not.toHaveBeenCalled();
    expect(screen.getByText('50%')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '화면에 맞추기' }));
    expect(engine.fit).toHaveBeenCalledTimes(2);
  });

  it('축소 상태에서는 간결하게 표시하고 선택하면 전체 라벨을 표시한다', async () => {
    const view = render(<RelationshipCanvas data={data} selectedId={null} onSelect={() => {}} />);
    await waitFor(() => expect(engine.fit).toHaveBeenCalled());
    const style = engine.options.node?.style;
    if (!style || typeof style === 'function') throw new Error('Node style required');
    const label = style.labelText;
    expect(typeof label).toBe('function');
    if (typeof label !== 'function') throw new Error('Dynamic label required');
    expect(label.call({} as never, node)).toBe('');
    view.rerender(<RelationshipCanvas data={data} selectedId="value" onSelect={() => {}} />);
    expect(label.call({} as never, node)).toBe('77 점\n대중성');
  });
  it('축소해도 위스키는 이미지로 유지하고 속성 값은 캡슐로 표시한다', async () => {
    const whisky: NodeData = { id: 'alcohol-1', type: 'image' };
    render(
      <RelationshipCanvas
        data={{ nodes: [whisky, node], edges: [] }}
        selectedId={null}
        onSelect={() => {}}
      />
    );
    await waitFor(() => expect(engine.fit).toHaveBeenCalled());
    const type = engine.options.node?.type;
    if (typeof type !== 'function') throw new Error('Dynamic node type required');
    expect(type.call({} as never, whisky)).toBe('image');
    expect(type.call({} as never, node)).toBe('rect');
  });
  it('속성을 선택해도 캡슐의 종류를 교체하거나 강조 전에 전체를 다시 그리지 않는다', async () => {
    const view = render(<RelationshipCanvas data={data} selectedId={null} onSelect={() => {}} />);
    await waitFor(() => expect(engine.states).toHaveBeenCalled());
    engine.draw.mockClear();
    engine.states.mockClear();
    view.rerender(<RelationshipCanvas data={data} selectedId="value" onSelect={() => {}} />);
    await waitFor(() => expect(engine.states).toHaveBeenCalled());
    const type = engine.options.node?.type;
    if (typeof type !== 'function') throw new Error('Dynamic node type required');
    expect(type.call({} as never, node)).toBe('rect');
    expect(engine.draw).not.toHaveBeenCalled();
    expect(engine.states).toHaveBeenLastCalledWith({ value: ['chosen'] }, false);
  });
});
