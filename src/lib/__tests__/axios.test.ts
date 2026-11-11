import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
  accessToken: 'local-test-access',
  refreshToken: 'local-test-refresh',
  setTokens: vi.fn(),
  logout: vi.fn(),
}));
vi.mock('@/stores/auth', () => ({ useAuthStore: { getState: () => auth } }));
import { api } from '../axios';

const adapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = adapter;
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function denied(config: InternalAxiosRequestConfig, status: number) {
  return Promise.reject(
    new AxiosError('Local authentication rejection', 'ERR_BAD_REQUEST', config, undefined, {
      status,
      statusText: 'Denied',
      config,
      headers: {},
      data: {},
    })
  );
}

describe('인증 갱신 대기열', () => {
  it.each([401, 403])(
    '대기했던 POST도 %i 재응답 시 추가 갱신이나 세 번째 전송 없이 종료한다',
    async (status) => {
      let release!: (response: AxiosResponse) => void;
      const refreshResponse = {
        data: {
          success: true,
          data: {
            accessToken: 'local-test-new-access',
            refreshToken: 'local-test-new-refresh',
          },
        },
      } as AxiosResponse;
      const refresh = vi
        .spyOn(axios, 'post')
        .mockImplementationOnce(
          () =>
            new Promise<AxiosResponse>((resolve) => {
              release = resolve;
            })
        )
        .mockResolvedValue(refreshResponse);
      const attempts = new Map<string, number>();
      api.defaults.adapter = async (config) => {
        const count = (attempts.get(config.url!) ?? 0) + 1;
        attempts.set(config.url!, count);
        if (count === 1 || config.url === '/local-fixture/b') return denied(config, status);
        return { status: 200, statusText: 'OK', config, headers: {}, data: {} };
      };

      const first = api.post('/local-fixture/a').then(
        () => 'fulfilled',
        () => 'rejected'
      );
      await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
      const queued = api.post('/local-fixture/b').then(
        () => 'fulfilled',
        () => 'rejected'
      );
      await vi.waitFor(() => expect(attempts.get('/local-fixture/b')).toBe(1));
      release(refreshResponse);

      expect(await Promise.all([first, queued])).toEqual(['fulfilled', 'rejected']);
      expect(attempts.get('/local-fixture/a')).toBe(2);
      expect(attempts.get('/local-fixture/b')).toBe(2);
      expect(refresh).toHaveBeenCalledTimes(1);
      expect(auth.logout).not.toHaveBeenCalled();
    }
  );

  it('동시에 만료된 요청은 한 번의 갱신을 공유하고 각 요청을 한 번만 재전송한다', async () => {
    let release!: (response: AxiosResponse) => void;
    const refresh = vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise<AxiosResponse>((resolve) => {
          release = resolve;
        })
    );
    const attempts = new Map<string, number>();
    api.defaults.adapter = async (config) => {
      const count = (attempts.get(config.url!) ?? 0) + 1;
      attempts.set(config.url!, count);
      if (count === 1) return denied(config, 401);
      return { status: 200, statusText: 'OK', config, headers: {}, data: {} };
    };
    const requests = ['/local-fixture/a', '/local-fixture/b', '/local-fixture/c'].map((url) =>
      api.post(url)
    );
    await vi.waitFor(() => expect(attempts.size).toBe(3));
    expect(refresh).toHaveBeenCalledTimes(1);
    release({
      data: {
        success: true,
        data: {
          accessToken: 'local-test-new-access',
          refreshToken: 'local-test-new-refresh',
        },
      },
    } as AxiosResponse);
    await Promise.all(requests);
    expect([...attempts.values()]).toEqual([2, 2, 2]);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
