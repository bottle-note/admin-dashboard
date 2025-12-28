import { useAuthStore } from '@/stores/auth';

export function HomePage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">BottleNote Admin</h1>
      <p className="text-muted-foreground">안녕하세요, {user?.name || 'Admin'} 님!</p>
      <button
        onClick={logout}
        className="rounded-md bg-destructive px-4 py-2 text-destructive-foreground hover:bg-destructive/90"
      >
        Logout
      </button>
    </div>
  );
}
