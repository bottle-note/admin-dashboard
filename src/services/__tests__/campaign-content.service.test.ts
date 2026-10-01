import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api-client';
import { campaignContentService } from '../campaign-content.service';

vi.mock('@/lib/api-client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

beforeEach(() => vi.clearAllMocks());

describe('캠페인 콘텐츠 API service', () => {
  it('목록의 data[]와 meta를 분리하고 필터를 전달한다', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: [{ id: 7, code: 'whiskey-mbti' }],
      meta: { page: 1, size: 20, totalElements: 21, totalPages: 2, hasNext: false },
    } as never);
    const params = { keyword: 'mbti', isActive: false, page: 1, size: 20 };
    const result = await campaignContentService.search(params);
    expect(apiClient.get).toHaveBeenCalledWith('/admin/api/v1/campaign-contents', { params });
    expect(result.items[0]?.id).toBe(7);
    expect(result.meta.totalElements).toBe(21);
  });

  it('등록·수정·토글·삭제에서 지정 경로와 요청 본문을 그대로 사용한다', async () => {
    const result = { code: 'OK', targetId: 7, message: '', responseAt: '' };
    vi.mocked(apiClient.post).mockResolvedValueOnce(result);
    vi.mocked(apiClient.put).mockResolvedValueOnce(result);
    vi.mocked(apiClient.patch).mockResolvedValueOnce(result);
    vi.mocked(apiClient.delete).mockResolvedValueOnce(result);
    const body = { code: 'whiskey-tarot', name: '타로', description: '카드 세 장', isActive: true };
    expect(await campaignContentService.create(body)).toEqual(result);
    expect(apiClient.post).toHaveBeenCalledWith('/admin/api/v1/campaign-contents', body);
    const updateBody = { name: body.name, description: body.description, isActive: body.isActive };
    expect(await campaignContentService.update(7, updateBody)).toEqual(result);
    expect(apiClient.put).toHaveBeenCalledWith('/admin/api/v1/campaign-contents/7', updateBody);
    await campaignContentService.updateStatus(7, { isActive: false });
    expect(apiClient.patch).toHaveBeenCalledWith('/admin/api/v1/campaign-contents/7/status', {
      isActive: false,
    });
    await campaignContentService.delete(7);
    expect(apiClient.delete).toHaveBeenCalledWith('/admin/api/v1/campaign-contents/7');
  });

  it('상세와 기간 지표의 data를 풀고 기본 기간은 생략한다', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ data: { id: 7, name: 'MBTI' } } as never)
      .mockResolvedValueOnce({ data: { viewVisitors: 3 } } as never);
    expect((await campaignContentService.getDetail(7)).id).toBe(7);
    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/admin/api/v1/campaign-contents/7');
    expect((await campaignContentService.getMetrics(7, {})).viewVisitors).toBe(3);
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/admin/api/v1/campaign-contents/7/metrics', {
      params: {},
    });
  });
});
