import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AlcoholAttributeVariantA } from '../variants/a/AlcoholAttributeVariantA';

// Canvas rendering is verified in Orca; jsdom covers the shared state and accessible node controls.
vi.mock('../variants/a/RelationshipCanvas', () => ({ RelationshipCanvas: () => null }));

function renderPage() {
  render(
    <MemoryRouter>
      <AlcoholAttributeVariantA />
    </MemoryRouter>
  );
  return userEvent.setup();
}

describe('속성 관리 통합 화면', () => {
  it('비교 후 취소하면 원본을 유지하고 확정하면 변경과 기존 연결을 반영한다', async () => {
    const user = renderPage();
    const input = screen.getByRole('textbox', { name: /속성 이름/ });
    await user.clear(input);
    await user.type(input, '선물 추천');
    await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('변경 전')).toBeInTheDocument();
    expect(within(dialog).getByText('변경 후')).toBeInTheDocument();
    expect(within(dialog).getByText('선물용')).toBeInTheDocument();
    expect(within(dialog).getByText('선물 추천')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: '다시 편집' }));
    expect(screen.getByRole('heading', { name: '선물용' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '변경 저장' }));
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 선물 추천' }));
    const details = screen.getByRole('complementary', { name: '그래프 상세' });
    expect(within(details).getByText('선물 추천')).toBeInTheDocument();
    expect(within(details).getByText('맥캘란 12년 더블 캐스크')).toBeInTheDocument();
  });

  it('연결 해제 결과를 그래프에 반영하며 그래프에서는 변경 동작을 제공하지 않는다', async () => {
    const user = renderPage();
    const panel = screen.getByRole('complementary', { name: '속성 상세 패널' });
    const unlink = within(panel).getAllByRole('button', { name: /연결 해제/ })[0]!;
    const name = unlink.getAttribute('aria-label')!.replace(' 연결 해제', '');
    await user.click(unlink);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '연결 해제' }));
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 선물용' }));
    expect(
      within(screen.getByRole('complementary', { name: '그래프 상세' })).queryByText(name)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /연결 해제|연결 적용|삭제/ })
    ).not.toBeInTheDocument();
  });

  it('새 연결을 확정하면 그래프에서 양방향으로 조회한다', async () => {
    const user = renderPage();
    await user.click(screen.getByRole('tab', { name: '속성 연결' }));
    await user.click(screen.getByRole('checkbox', { name: '히비키 재패니즈 하모니 선택' }));
    await user.click(screen.getByRole('checkbox', { name: /겨울 추천 후보/ }));
    await user.click(screen.getByRole('button', { name: '1쌍 연결 검토' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: '연결 적용' }));
    await user.click(screen.getByRole('tab', { name: '관계 그래프' }));
    await user.click(screen.getByText('노드 목록으로 탐색'));
    await user.click(screen.getByRole('button', { name: '속성: 겨울 추천 후보' }));
    const details = screen.getByRole('complementary', { name: '그래프 상세' });
    await user.click(within(details).getByRole('button', { name: '히비키 재패니즈 하모니' }));
    expect(within(details).getByRole('button', { name: '겨울 추천 후보' })).toBeInTheDocument();
  });

  it('키보드로 세 번째 탭까지 이동하고 매핑이 없는 노드는 제외한다', async () => {
    const user = renderPage();
    screen.getByRole('tab', { name: '속성관리' }).focus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(screen.getByRole('tab', { name: '관계 그래프' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(screen.getByText('노드 목록으로 탐색'));
    expect(screen.queryByRole('button', { name: '속성: 겨울 추천 후보' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: '위스키: 히비키 재패니즈 하모니' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '속성: 선물용' })).toBeInTheDocument();
  });
});
