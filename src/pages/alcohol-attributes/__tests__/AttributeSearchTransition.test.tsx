import { it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { AttributeSearchBuilder } from '../variants/a/AttributeSearchBuilder';
import { GraphConditionForm } from '../variants/a/GraphConditionForm';
import type { AlcoholAttribute } from '@/types/api/alcohol-attribute.api';
const attribute: AlcoholAttribute = {
  id: 1,
  key: 'taste',
  displayName: '맛',
  datatype: 'STRING',
  type: 'KEYWORD',
  allowedValues: ['좋음', '보통'],
  pattern: null,
  groupId: null,
  unit: null,
  description: null,
  createAt: '',
  lastModifyAt: '',
  createPrincipal: null,
  lastModifyPrincipal: null,
};
it.each(['EQ', 'NE'] as const)(
  '상세 검색에서 포함→%s 전환 시 숨은 값을 제거한다',
  async (operator) => {
    server.use(
      http.get('/admin/api/v1/alcohols/attributes', () =>
        HttpResponse.json({ success: true, data: [attribute], meta: { hasNext: false } })
      )
    );
    const apply = vi.fn();
    render(
      <AttributeSearchBuilder
        value={{ match: 'AND', conditions: [{ key: 'taste', operator: 'CONTAINS', value: '좋' }] }}
        onApply={apply}
      />
    );
    const user = userEvent.setup();
    await screen.findByText('맛');
    await user.selectOptions(screen.getByLabelText('조건 1 연산자'), operator);
    expect(screen.getByRole('combobox', { name: '조건 1 값' })).toHaveValue('');
    await user.click(screen.getByRole('button', { name: '검색 적용' }));
    expect(apply).not.toHaveBeenCalled();
    await user.selectOptions(screen.getByLabelText('조건 1 값'), '좋음');
    await user.click(screen.getByRole('button', { name: '검색 적용' }));
    expect(apply).toHaveBeenCalledWith({
      match: 'AND',
      conditions: [{ key: 'taste', operator, value: '좋음' }],
    });
  }
);
it('그래프 빠른 조건에서도 포함 검색어를 선택값으로 보내지 않는다', async () => {
  const add = vi.fn();
  render(
    <GraphConditionForm
      attributes={[attribute]}
      onAdd={add}
      disabled={false}
      conditionCount={0}
      initialCondition={{ key: 'taste', operator: 'CONTAINS', value: '좋' }}
    />
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('추가 조건 연산자'), 'EQ');
  await user.click(screen.getByRole('button', { name: '조건 수정' }));
  expect(add).not.toHaveBeenCalled();
  await user.selectOptions(screen.getByLabelText('추가 조건 값'), '좋음');
  await user.click(screen.getByRole('button', { name: '조건 수정' }));
  expect(add).toHaveBeenCalledWith([{ key: 'taste', operator: 'EQ', value: '좋음' }]);
});
