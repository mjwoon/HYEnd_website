import { useEffect } from 'react';
import { AppRouter } from '@/router';
import { userService } from '@/services/userService';
import { useAuthStore } from '@/store/authStore';

function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const cached = localStorage.getItem('userInfo');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
        return;
      } catch {
        localStorage.removeItem('userInfo');
      }
    }

    if (token === 'mock-test-token') return;

    userService.getMe()
      .then((res) => {
        const { id, name, email, role } = res.data.data;
        const user = { id, username: email, fullName: name, role: role.toLowerCase() as 'student' | 'staff' | 'admin' };
        localStorage.setItem('userInfo', JSON.stringify(user));
        setUser(user);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  }, []);

  return <AppRouter />;
}

export default App;
