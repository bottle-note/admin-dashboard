import { expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { render } from '@/test/test-utils';
import { server } from '@/test/mocks/server';
import { wrapApiResponse } from '@/test/mocks/data';
import { adminAlcoholService } from '@/services/admin-alcohol.service';
import * as draft from '../create-alcohol-registration-draft';
import { MfdsDeclarationListPage } from '../MfdsDeclarationList';

it('연결 데이터 포함 여부에 맞춰 예상 개수와 초안 생성 대상을 함께 변경한다', async () => {
  const base = {
    rcno: 'R',
    baseProductNameKo: '제품',
    baseProductNameEn: 'Product',
    skuDisplayNameKo: '제품',
    skuDisplayNameEn: 'Product',
    abvPercent: null,
    volumeMl: null,
    ageYears: null,
    selectedAlcoholId: null,
    createdAt: '2026-09-23',
    alcoholMatchDecision: null,
  };
  const items = [
    { ...base, id: 1 },
    { ...base, id: 2 },
    { ...base, id: 3, skuDisplayNameKo: '연결 제품', selectedAlcoholId: 9 },
  ];
  server.use(
    http.get('/admin/api/v1/mfds/declarations', () =>
      HttpResponse.json(
        wrapApiResponse(items, { hasNext: false, nextCursor: null, totalElements: 3 })
      )
    )
  );
  const template = vi
    .spyOn(adminAlcoholService, 'downloadExcelTemplate')
    .mockResolvedValue(new ArrayBuffer(0));
  const generate = vi
    .spyOn(draft, 'createAlcoholRegistrationDraft')
    .mockResolvedValue({ blob: new Blob(), declarationCount: 1 });
  try {
    const user = userEvent.setup();
    render(<MfdsDeclarationListPage />);
    const open = await screen.findByRole('button', { name: 'Excel 등록 초안 다운로드' });
    await waitFor(() => expect(open).toBeEnabled());
    await user.click(open);
    expect(template).not.toHaveBeenCalled();
    expect(screen.getByText('다운로드 예상 개수: 1개')).toBeInTheDocument();
    const toggle = screen.getByRole('checkbox', { name: '이미 위스키에 연결된 데이터 포함' });
    await user.click(toggle);
    expect(screen.getByText('다운로드 예상 개수: 2개')).toBeInTheDocument();
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: '초안 생성' }));
    await waitFor(() =>
      expect(generate).toHaveBeenCalledWith(expect.any(ArrayBuffer), [items[0], items[1]])
    );
  } finally {
    template.mockRestore();
    generate.mockRestore();
  }
});
