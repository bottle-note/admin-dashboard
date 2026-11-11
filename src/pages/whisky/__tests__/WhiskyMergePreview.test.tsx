import { beforeAll, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import type { AlcoholMergePreview } from '@/types/api';
import { WhiskyMergePreview } from '../WhiskyMergePreview';

const preview: AlcoholMergePreview = {
  base: { alcoholId: 10, korName: '남길 위스키', engName: 'Base whisky', imageUrl: null },
  duplicates: Array.from({ length: 10 }, (_, index) => ({
    alcohol: {
      alcoholId: 20 + index,
      korName: `중복 위스키 ${index + 1}`,
      engName: `Duplicate whisky ${index + 1}`,
      imageUrl: null,
    },
    counts: [
      { name: 'reviews', moved: index + 1, deleted: index },
      { name: 'ratings', moved: 0, deleted: 0 },
      { name: 'tastingTags', moved: 0, deleted: 14 },
      { name: 'futureCategory', moved: 2, deleted: 0 },
    ].sort((left, right) => (index % 2 ? 1 : -1) * left.name.localeCompare(right.name)),
  })),
};

beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
});

describe('WhiskyMergePreview', () => {
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    '상속 속성과 이름이 같은 %s 항목도 원문으로 표시한다',
    (name) => {
      render(
        <WhiskyMergePreview
          preview={{
            ...preview,
            duplicates: [{
              alcohol: preview.duplicates[0]!.alcohol,
              counts: [{ name, moved: 2, deleted: 1 }],
            }],
          }}
        />
      );
      expect(screen.getByRole('row', { name: `${name} 2건 1건` })).toBeInTheDocument();
    }
  );

  it('중복 10개의 기록을 항목별로 합산한 표 하나로 표시하고 알 수 없는 항목도 보존한다', () => {
    render(<WhiskyMergePreview preview={preview} />);
    const table = screen.getByRole('table', { name: '전체 병합 기록 합계' });
    expect(screen.getByRole('table', { name: '변경 없는 기록' })).not.toBeVisible();
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    const reviewRow = within(table).getByRole('row', { name: '리뷰 55건 45건' });
    expect(reviewRow).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: '테이스팅 태그 0건 140건' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: 'futureCategory 20건 0건' })).toBeInTheDocument();
    expect(screen.getByText('중복 10개 전체')).toBeInTheDocument();
    expect(within(table).queryByText('별점')).not.toBeInTheDocument();
  });

  it('위스키별 내역을 조회해도 전체 병합 대상 안내를 유지하고 전체 합계로 돌아간다', async () => {
    const user = userEvent.setup();
    render(<WhiskyMergePreview preview={preview} />);
    await user.click(screen.getByRole('combobox', { name: '미리보기 범위' }));
    await user.click(screen.getByRole('option', { name: '중복 위스키 10 (#29)' }));
    const table = screen.getByRole('table', { name: '중복 위스키 10 (#29) 병합 기록' });
    expect(within(table).getByRole('row', { name: '리뷰 10건 9건' })).toBeInTheDocument();
    expect(within(table).getByRole('row', { name: '테이스팅 태그 0건 14건' })).toBeInTheDocument();
    expect(screen.getByText('중복 10개 전체')).toBeInTheDocument();
    expect(screen.getByText('조회 범위를 바꿔도 병합 대상은 바뀌지 않습니다.')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: '미리보기 범위' }));
    await user.click(screen.getByRole('option', { name: '전체 합계 (10개)' }));
    expect(screen.getByRole('table', { name: '전체 병합 기록 합계' })).toBeInTheDocument();
  });

  it('변경 없는 항목은 접어 두고 펼치면 0건 내역을 확인한다', async () => {
    const user = userEvent.setup();
    render(<WhiskyMergePreview preview={preview} />);
    expect(screen.getByRole('table', { name: '변경 없는 기록' })).not.toBeVisible();
    await user.click(screen.getByText('변경 없는 항목 1개'));
    const table = screen.getByRole('table', { name: '변경 없는 기록' });
    expect(table).toBeVisible();
    expect(within(table).getByRole('row', { name: '별점 0건 0건' })).toBeInTheDocument();
  });

  it('모든 기록이 0건이어도 중복 위스키가 삭제된다는 안내를 표시한다', () => {
    render(
      <WhiskyMergePreview
        preview={{
          ...preview,
          duplicates: preview.duplicates.map((item) => ({
            ...item,
            counts: [{ name: 'reviews', moved: 0, deleted: 0 }],
          })),
        }}
      />
    );
    expect(screen.queryByRole('table', { name: '전체 병합 기록 합계' })).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: '변경 없는 기록' })).not.toBeVisible();
    expect(
      screen.getByText('연결된 기록의 변경은 없습니다. 선택한 중복 위스키는 병합 시 삭제됩니다.')
    ).toBeInTheDocument();
  });
});
