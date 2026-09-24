import { expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from 'react-router';
import { http, HttpResponse } from 'msw';
import { Button } from '@/components/ui/button';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { MfdsRelatedDeclarations } from '../MfdsRelatedDeclarations';

const base = '/admin/api/v1/mfds/declarations';

function BackButton() {
  const navigate = useNavigate();
  return <Button onClick={() => navigate(-1)}>뒤로 가기</Button>;
}

it('검색어를 지우면 전체 신고를 조회하거나 무관한 신고를 표시하지 않는다', async () => {
  const keywords: (string | null)[] = [];
  server.use(
    http.get(base, ({ request }) => {
      const keyword = new URL(request.url).searchParams.get('keyword');
      keywords.push(keyword);
      return HttpResponse.json(
        wrapApiResponse([{ id: 9, rcno: 'OTHER9', skuDisplayNameKo: '무관한 신고' }], {
          hasNext: false,
          nextCursor: null,
        })
      );
    })
  );
  const user = userEvent.setup();
  render(<MfdsRelatedDeclarations declarationId={1} defaultKeyword="기본 제품" />);
  expect(await screen.findByText('OTHER9')).toBeInTheDocument();

  await user.clear(screen.getByRole('textbox', { name: '관련 내역 검색' }));
  await user.click(screen.getByRole('button', { name: '검색' }));

  expect(
    await screen.findByText('검색어를 입력하면 관련 내역을 조회할 수 있습니다.')
  ).toBeInTheDocument();
  expect(screen.queryByText('OTHER9')).not.toBeInTheDocument();
  expect(keywords).toEqual(['기본 제품']);
});

it('뒤로 가기로 검색어가 바뀌면 입력창과 결과가 같은 검색어를 보여준다', async () => {
  server.use(
    http.get(base, ({ request }) => {
      const keyword = new URL(request.url).searchParams.get('keyword');
      return HttpResponse.json(
        wrapApiResponse(
          [
            {
              id: keyword === '다른 제품' ? 10 : 9,
              rcno: keyword === '다른 제품' ? 'OTHER10' : 'OTHER9',
              skuDisplayNameKo: keyword,
            },
          ],
          { hasNext: false, nextCursor: null }
        )
      );
    })
  );
  const user = userEvent.setup();
  render(
    <>
      <MfdsRelatedDeclarations declarationId={1} defaultKeyword="기본 제품" />
      <BackButton />
    </>
  );
  const search = screen.getByRole('textbox', { name: '관련 내역 검색' });
  const table = await screen.findByRole('table', { name: '관련 내역' });
  expect(await within(table).findByText('OTHER9')).toBeInTheDocument();

  await user.clear(search);
  await user.type(search, '다른 제품');
  await user.click(screen.getByRole('button', { name: '검색' }));
  expect(await screen.findByText('OTHER10')).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '뒤로 가기' }));
  await waitFor(() => expect(screen.getByText('OTHER9')).toBeInTheDocument());
  expect(screen.getByRole('textbox', { name: '관련 내역 검색' })).toHaveValue('기본 제품');
});
