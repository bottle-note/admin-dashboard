import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse, wrapApiError } from '@/test/mocks/data';
import { AttributeGroupsPanel } from '../variants/a/AttributeGroupsPanel';

const groupsPath = '/admin/api/v1/alcohols/attribute-groups';
const attributesPath = '/admin/api/v1/alcohols/attributes';
let groups = [{ id: 1, name: '바텐더 노트', description: '', displayOrder: 0 }];
let attribute = {
  id: 11,
  key: 'price',
  displayName: '병 가격',
  type: 'PRICE',
  datatype: 'INT',
  unit: '원',
  description: null,
  groupId: null as number | null,
};
let updateBodies: Record<string, unknown>[] = [];
beforeEach(() => {
  groups = [{ id: 1, name: '바텐더 노트', description: '', displayOrder: 0 }];
  attribute = { ...attribute, groupId: null };
  updateBodies = [];
  server.use(
    http.get(groupsPath, () => HttpResponse.json(wrapApiResponse(groups))),
    http.post(groupsPath, async ({ request }) => {
      const body = (await request.json()) as Omit<(typeof groups)[number], 'id'>;
      const group = { ...body, id: 2 };
      groups.push(group);
      return HttpResponse.json(wrapApiResponse(group));
    }),
    http.put(`${groupsPath}/:id`, async ({ request, params }) => {
      const body = (await request.json()) as Omit<(typeof groups)[number], 'id'>;
      const group = { ...body, id: Number(params.id) };
      groups = groups.map((item) => (item.id === group.id ? group : item));
      return HttpResponse.json(wrapApiResponse(group));
    }),
    http.delete(`${groupsPath}/:id`, ({ params }) => {
      if (attribute.groupId === Number(params.id))
        return HttpResponse.json(
          wrapApiError(409, 'GROUP_NOT_EMPTY', '속성이 남아 있는 그룹입니다.'),
          { status: 409 }
        );
      groups = groups.filter((group) => group.id !== Number(params.id));
      return HttpResponse.json(wrapApiResponse({ targetId: Number(params.id) }));
    }),
    http.get(attributesPath, () =>
      HttpResponse.json(
        wrapApiResponse([attribute], {
          page: 0,
          size: 100,
          hasNext: false,
          totalElements: 1,
          totalPages: 1,
        })
      )
    ),
    http.put(`${attributesPath}/11`, async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>;
      updateBodies.push(body);
      attribute.groupId = body.groupId as number | null;
      return HttpResponse.json(wrapApiResponse({ targetId: 11 }));
    })
  );
});

describe('실제 API 계약 기반 속성 그룹 관리', () => {
  it('그룹 생성과 수정 후 속성을 배정하고 명시적인 null로 해제한다', async () => {
    const user = userEvent.setup();
    render(<AttributeGroupsPanel />);
    await screen.findByRole('heading', { name: '바텐더 노트' });
    await user.click(screen.getByRole('button', { name: '그룹 만들기' }));
    await user.type(screen.getByRole('textbox', { name: '그룹 이름' }), '시음회');
    await user.click(screen.getByRole('button', { name: '그룹 저장' }));
    await screen.findByRole('heading', { name: '시음회' });
    await user.click(screen.getByRole('button', { name: '그룹 편집' }));
    await user.clear(screen.getByRole('textbox', { name: '그룹 이름' }));
    await user.type(screen.getByRole('textbox', { name: '그룹 이름' }), '시음 기록');
    await user.click(screen.getByRole('button', { name: '그룹 저장' }));
    await screen.findByRole('heading', { name: '시음 기록' });
    await user.click(screen.getByRole('button', { name: /미분류.*1/ }));
    await user.click(screen.getByRole('checkbox', { name: '병 가격 선택' }));
    await user.selectOptions(screen.getByRole('combobox', { name: '이동할 그룹' }), '2');
    await user.click(screen.getByRole('button', { name: '선택 속성 이동' }));
    await waitFor(() =>
      expect(updateBodies[0]).toMatchObject({ groupId: 2, datatype: 'INT', unit: '원' })
    );
    await user.click(await screen.findByRole('button', { name: /시음 기록.*1/ }));
    await user.click(screen.getByRole('checkbox', { name: '병 가격 선택' }));
    await user.selectOptions(screen.getByRole('combobox', { name: '이동할 그룹' }), 'ungrouped');
    await user.click(screen.getByRole('button', { name: '선택 속성 이동' }));
    await waitFor(() => expect(updateBodies[1]).toHaveProperty('groupId', null));
  });

  it('속성이 남아 있는 그룹의 삭제 실패를 표시하고 그룹을 유지한다', async () => {
    attribute.groupId = 1;
    const user = userEvent.setup();
    render(<AttributeGroupsPanel />);
    await screen.findByRole('heading', { name: '바텐더 노트' });
    await user.click(screen.getByRole('button', { name: '그룹 삭제' }));
    await user.click(screen.getByRole('button', { name: '삭제 확인' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('속성이 남아 있는 그룹입니다.');
    expect(screen.getByRole('heading', { name: '바텐더 노트' })).toBeInTheDocument();
  });
  it('속성 이동이 일부 실패하면 성공분을 반영하고 실패한 속성만 선택해 둔다', async () => {
    const second = {
      ...attribute,
      id: 12,
      key: 'score',
      displayName: '대중성 점수',
      groupId: null,
    };
    server.use(
      http.get(attributesPath, () =>
        HttpResponse.json(
          wrapApiResponse([attribute, second], {
            page: 0,
            size: 100,
            hasNext: false,
            totalElements: 2,
            totalPages: 1,
          })
        )
      ),
      http.put(`${attributesPath}/12`, () =>
        HttpResponse.json(wrapApiError(409, 'CONFLICT', '다시 확인해 주세요.'), { status: 409 })
      )
    );
    const user = userEvent.setup();
    render(<AttributeGroupsPanel />);
    await user.click(await screen.findByRole('button', { name: /미분류.*2/ }));
    await user.click(screen.getByRole('checkbox', { name: '병 가격 선택' }));
    await user.click(screen.getByRole('checkbox', { name: '대중성 점수 선택' }));
    await user.selectOptions(screen.getByRole('combobox', { name: '이동할 그룹' }), '1');
    await user.click(screen.getByRole('button', { name: '선택 속성 이동' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('1개 속성을 이동하지 못했습니다.');
    expect(screen.getByRole('status')).toHaveTextContent('1개 속성을 이동했습니다.');
    expect(screen.getByRole('checkbox', { name: '대중성 점수 선택' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: '병 가격 선택' })).not.toBeInTheDocument();
  });
});
