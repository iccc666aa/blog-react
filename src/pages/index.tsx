import { FormEvent, useMemo, useState } from 'react';
import styles from './index.less';

type Mode = 'login' | 'register';

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
  timestamp: string;
};

type UserView = {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
};

type AuthResult = {
  tokenType: string;
  accessToken: string;
  expiresAt: string;
  user: UserView;
};

type AuthState = {
  token: string;
  user?: UserView;
};

const authStorageKey = 'blog-auth';

function readStoredAuth(): AuthState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    window.localStorage.removeItem(authStorageKey);
    return null;
  }
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [auth, setAuth] = useState<AuthState | null>(() => readStoredAuth());

  const title = mode === 'login' ? '登录账号' : '注册账号';
  const submitText = loading ? '提交中...' : mode === 'login' ? '登录' : '注册';

  const currentUserLabel = useMemo(() => {
    if (!auth?.user) {
      return '';
    }
    return auth.user.nickname || auth.user.username;
  }, [auth]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!username.trim() || !password) {
      setMessage('请输入用户名和密码');
      return;
    }

    setLoading(true);

    try {
      const payload =
        mode === 'login'
          ? { username: username.trim(), password }
          : {
              username: username.trim(),
              password,
              nickname: nickname.trim() || undefined,
              email: email.trim() || undefined,
            };

      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResponse<AuthResult>;

      if (!response.ok || result.code !== 200) {
        throw new Error(result.message || '请求失败');
      }

      const nextAuth = {
        token: `${result.data.tokenType} ${result.data.accessToken}`,
        user: result.data.user,
      };

      window.localStorage.setItem(authStorageKey, JSON.stringify(nextAuth));
      setAuth(nextAuth);
      setMessage(`${mode === 'login' ? '登录' : '注册'}成功`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    window.localStorage.removeItem(authStorageKey);
    setAuth(null);
    setMessage('已清除本地登录状态');
  };

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.brand}>
          <span>Blog</span>
          <strong>账号入口</strong>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="账号操作">
          <button
            className={mode === 'login' ? styles.activeTab : ''}
            type="button"
            onClick={() => setMode('login')}
          >
            登录
          </button>
          <button
            className={mode === 'register' ? styles.activeTab : ''}
            type="button"
            onClick={() => setMode('register')}
          >
            注册
          </button>
        </div>

        <form className={styles.form} onSubmit={submit}>
          <h1>{title}</h1>

          <label>
            用户名
            <input
              autoComplete="username"
              minLength={3}
              maxLength={64}
              placeholder="请输入用户名"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label>
            密码
            <input
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={6}
              maxLength={72}
              placeholder="请输入密码"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {mode === 'register' && (
            <>
              <label>
                昵称
                <input
                  maxLength={64}
                  placeholder="可选"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                />
              </label>

              <label>
                邮箱
                <input
                  autoComplete="email"
                  maxLength={128}
                  placeholder="可选"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            </>
          )}

          <button className={styles.submit} disabled={loading} type="submit">
            {submitText}
          </button>

          {message && <div className={styles.message}>{message}</div>}
        </form>
      </section>

      <aside className={styles.status}>
        <h2>当前状态</h2>
        {auth ? (
          <>
            <p>
              已登录：
              <strong>{currentUserLabel}</strong>
            </p>
            <textarea readOnly value={auth.token} aria-label="登录令牌" />
            <button type="button" onClick={clearAuth}>
              清除登录状态
            </button>
          </>
        ) : (
          <p>未登录。登录或注册成功后会在这里显示本地保存的 token。</p>
        )}
      </aside>
    </div>
  );
}
