import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth';
import { authService } from '@/services/auth.service';
import { getUserFromToken } from '@/lib/jwt';
import { getErrorMessage } from '@/lib/api-error';
import { useToast } from '@/hooks/useToast';
import { Loader2 } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      console.log(import.meta.env.VITE_API_BASE_URL, 'VITE_API_BASE_URL');
      const { accessToken, refreshToken } = await authService.login({
        email,
        password,
      });

      // JWT에서 사용자 정보 추출
      const user = getUserFromToken(accessToken);

      if (!user) {
        showToast({
          type: 'error',
          message: '토큰 정보를 읽을 수 없습니다.',
        });
        return;
      }

      setAuth({
        user,
        accessToken,
        refreshToken,
      });

      showToast({
        type: 'success',
        message: `${user.name}님, 환영합니다!`,
      });

      navigate('/');
    } catch (error) {
      showToast({
        type: 'error',
        message: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">BottleNote Admin</h1>
          <p className="text-muted-foreground">관리자 계정으로 로그인하세요</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="admin@bottlenote.com"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="비밀번호를 입력하세요"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                로그인 중...
              </>
            ) : (
              '로그인'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
