import { it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import { AttributeEditor } from '../variants/a/AttributeEditor';
import { MappingValueEditor } from '../variants/a/MappingValueEditor';
import { emptyAttribute } from '../variants/a/attribute-model';

const attribute = {
  ...emptyAttribute,
  id: 1,
  key: 'taste',
  displayName: '맛 평가',
  allowedValues: ['좋음', '보통'],
  pattern: '.+',
};
it('규칙 해제는 null로 저장하며 서버 충돌을 표시한다', async () => {
  const save = vi
    .fn()
    .mockResolvedValue('기존 매핑 값과 충돌하는 속성 규칙으로 변경할 수 없습니다.');
  render(
    <AttributeEditor attribute={attribute} linkedCount={1} onSave={save} onCancel={() => {}} />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '직접 입력' }));
  await user.click(screen.getByRole('button', { name: '제한 해제' }));
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  await user.click(screen.getByRole('button', { name: '변경 저장' }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ allowedValues: null, pattern: null })
  );
  expect(await screen.findByRole('alert')).toHaveTextContent('기존 매핑 값과 충돌');
});
it('중복 허용값은 저장 확인을 열지 않는다', async () => {
  render(
    <AttributeEditor attribute={attribute} linkedCount={0} onSave={vi.fn()} onCancel={() => {}} />
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('선택 항목 2'));
  await user.type(screen.getByLabelText('선택 항목 2'), '좋음');
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('중복');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
it('허용값이 있으면 연결 값을 선택하여 저장한다', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <MappingValueEditor
      attribute={attribute}
      mapping={{ id: 1, alcoholId: 1, attributeId: 1, value: '좋음' }}
      onSave={save}
    />
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByRole('combobox', { name: '맛 평가 값' }), '보통');
  await user.click(screen.getByRole('button', { name: '값 저장' }));
  expect(save).toHaveBeenCalledWith('보통');
});

it('허용값과 패턴을 수정해 저장한다', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <AttributeEditor attribute={attribute} linkedCount={0} onSave={save} onCancel={() => {}} />
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('선택 항목 1'));
  await user.type(screen.getByLabelText('선택 항목 1'), ' AB12');
  await user.clear(screen.getByLabelText('선택 항목 2'));
  await user.type(screen.getByLabelText('선택 항목 2'), 'CD34 ');
  await user.click(screen.getByRole('button', { name: '문자 조합으로 바꾸기' }));
  await user.click(screen.getByRole('checkbox', { name: '밑줄' }));
  await user.click(screen.getByRole('checkbox', { name: '영문 대문자' }));
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  await user.click(screen.getByRole('button', { name: '변경 저장' }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ allowedValues: ['AB12', 'CD34'], pattern: '[a-zA-Z0-9]{1,255}' })
  );
});

it('그래프 조건은 허용값을 선택하고 포함 검색은 자유 입력한다', async () => {
  const { GraphConditionForm } = await import('../variants/a/GraphConditionForm');
  const add = vi.fn();
  render(
    <GraphConditionForm
      attributes={[
        {
          ...attribute,
          groupId: null,
          allowedValues: ['좋음', '보통'],
          pattern: '.+',
          createAt: '',
          lastModifyAt: '',
          createPrincipal: null,
          lastModifyPrincipal: null,
        },
      ]}
      onAdd={add}
      disabled={false}
      conditionCount={0}
    />
  );
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('추가할 속성'), 'taste');
  await user.selectOptions(screen.getByRole('combobox', { name: '추가 조건 값' }), '좋음');
  await user.click(screen.getByRole('button', { name: '조건 추가' }));
  expect(add).toHaveBeenLastCalledWith([{ key: 'taste', operator: 'EQ', value: '좋음' }]);
  await user.selectOptions(screen.getByLabelText('추가 조건 연산자'), 'CONTAINS');
  const input = screen.getByRole('textbox', { name: '추가 조건 값' });
  await user.clear(input);
  await user.type(input, '좋');
  await user.click(screen.getByRole('button', { name: '조건 추가' }));
  expect(add).toHaveBeenLastCalledWith([{ key: 'taste', operator: 'CONTAINS', value: '좋' }]);
});

it('기존 맞춤 형식은 선택 항목을 수정해도 그대로 보존한다', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <AttributeEditor
      attribute={{ ...attribute, pattern: '\\p{L}{2,10}' }}
      linkedCount={0}
      onSave={save}
      onCancel={() => {}}
    />
  );
  const user = userEvent.setup();
  expect(screen.getByText('기존 맞춤 형식 유지')).toBeVisible();
  expect(screen.queryByRole('textbox', { name: '입력 패턴' })).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '항목 추가' }));
  expect(screen.getByLabelText('선택 항목 3')).toHaveFocus();
  await user.type(screen.getByLabelText('선택 항목 3'), '아쉬움');
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  await user.click(screen.getByRole('button', { name: '변경 저장' }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ allowedValues: ['좋음', '보통', '아쉬움'], pattern: '\\p{L}{2,10}' })
  );
});

it('선택 항목이 비었거나 선택한 입력 형식과 맞지 않으면 저장을 막는다', async () => {
  render(
    <AttributeEditor attribute={attribute} linkedCount={0} onSave={vi.fn()} onCancel={() => {}} />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '문자 조합으로 바꾸기' }));
  await user.click(screen.getByRole('checkbox', { name: '영문 소문자' }));
  await user.click(screen.getByRole('checkbox', { name: '밑줄' }));
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('입력 형식에 맞지 않는');
  await user.click(screen.getByRole('button', { name: '선택 항목 2 삭제' }));
  await user.click(screen.getByRole('button', { name: '선택 항목 1 삭제' }));
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  expect(screen.getByRole('alert')).toHaveTextContent('1개 이상');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});

it('허용 문자와 첫 글자·길이를 조합하고 예시 확인 후 저장한다', async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  render(
    <AttributeEditor
      attribute={{ ...attribute, allowedValues: null, pattern: null }}
      linkedCount={0}
      onSave={save}
      onCancel={() => {}}
    />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '허용 문자 설정' }));
  await user.selectOptions(screen.getByLabelText('첫 글자'), 'lower');
  await user.clear(screen.getByLabelText('최대 글자 수'));
  await user.type(screen.getByLabelText('최대 글자 수'), '64');
  await user.type(screen.getByLabelText('입력해 보기'), 'tasting_note_01');
  expect(screen.getByText('사용 가능한 형식이에요.')).toBeVisible();
  await user.clear(screen.getByLabelText('입력해 보기'));
  await user.type(screen.getByLabelText('입력해 보기'), '1note');
  expect(screen.getByText('선택한 문자, 첫 글자 또는 길이에 맞지 않아요.')).toBeVisible();
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  await user.click(screen.getByRole('button', { name: '변경 저장' }));
  expect(save).toHaveBeenCalledWith(
    expect.objectContaining({ allowedValues: null, pattern: '[a-z][a-z0-9_]{0,63}' })
  );
  expect(save.mock.calls[0]?.[0]).not.toHaveProperty('patternError');
});

it('문자를 모두 해제하면 이전 유효한 규칙으로 저장하지 않는다', async () => {
  const save = vi.fn();
  render(
    <AttributeEditor
      attribute={{ ...attribute, allowedValues: null, pattern: '[a-z]+' }}
      linkedCount={0}
      onSave={save}
      onCancel={() => {}}
    />
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('checkbox', { name: '영문 소문자' }));
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(save).not.toHaveBeenCalled();
  expect(
    screen.getAllByText('공백 외에 허용할 문자를 하나 이상 선택하세요.').length
  ).toBeGreaterThan(0);
});

it('자료형을 바꿨다 돌아오면 복원된 규칙의 이전 오류를 해제한다', async () => {
  const user = userEvent.setup();
  render(
    <AttributeEditor
      attribute={{ ...attribute, allowedValues: null, pattern: '[a-z]{1,255}' }}
      linkedCount={0}
      onSave={vi.fn()}
      onCancel={() => {}}
    />
  );
  await user.clear(screen.getByLabelText('최소 글자 수'));
  await user.type(screen.getByLabelText('최소 글자 수'), '0');
  await user.selectOptions(screen.getByLabelText('값 형식'), 'INT');
  await user.selectOptions(screen.getByLabelText('값 형식'), 'STRING');
  expect(screen.getByLabelText('최소 글자 수')).toHaveValue(1);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await user.type(screen.getByLabelText(/속성 이름/), ' 수정');
  await user.click(screen.getByRole('button', { name: '변경 내용 확인' }));
  expect(screen.getByRole('dialog')).toBeVisible();
});
it('입력해 보기의 Enter는 저장 확인을 열지 않는다', async () => {
  const user = userEvent.setup();
  render(
    <AttributeEditor
      attribute={{ ...attribute, allowedValues: null, pattern: '[a-z]+' }}
      linkedCount={0}
      onSave={vi.fn()}
      onCancel={() => {}}
    />
  );
  await user.type(screen.getByLabelText(/속성 이름/), ' 수정');
  await user.type(screen.getByLabelText('입력해 보기'), 'taste{Enter}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByLabelText('입력해 보기')).toHaveFocus();
});
it('선택 항목 삭제 후 다음 입력 또는 항목 추가 버튼으로 포커스를 옮긴다', async () => {
  const user = userEvent.setup();
  render(
    <AttributeEditor attribute={attribute} linkedCount={0} onSave={vi.fn()} onCancel={() => {}} />
  );
  screen.getByRole('button', { name: '선택 항목 1 삭제' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByLabelText('선택 항목 1')).toHaveFocus();
  screen.getByRole('button', { name: '선택 항목 1 삭제' }).focus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('button', { name: '항목 추가' })).toHaveFocus();
});
