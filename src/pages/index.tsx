import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { history } from 'umi';
import Icon from '@/components/Icon';
import {
  apiRequest,
  AuthResult,
  AuthState,
  BlogPost,
  clearStoredAuth,
  formatDateTime,
  readStoredAuth,
  visibilityLabel,
  writeStoredAuth,
} from '@/utils/api';
import styles from './index.less';

type Mode = 'login' | 'register';

export default function HomePage() {
  const [auth, setAuth] = useState<AuthState | null>(() => readStoredAuth());
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const currentUserLabel = useMemo(() => {
    if (!auth?.user) {
      return '';
    }
    return auth.user.nickname || auth.user.username;
  }, [auth]);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest<BlogPost[]>(
        auth ? '/api/blogs' : '/api/public/blogs',
        {},
        auth,
      );
      setBlogs(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载博客失败');
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
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
      const result = await apiRequest<AuthResult>(`/api/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const nextAuth = {
        token: `${result.tokenType} ${result.accessToken}`,
        user: result.user,
      };

      writeStoredAuth(nextAuth);
      setAuth(nextAuth);
      setPassword('');
      setShowAuthPanel(false);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '请求失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const openCreatePage = () => {
    if (!auth) {
      setShowAuthPanel(true);
      setMessage('登录之后才能新增博客');
      return;
    }

    history.push('/blogs/new');
  };

  const deleteBlog = async (blog: BlogPost) => {
    if (!auth || !blog.owned) {
      return;
    }
    if (!window.confirm('确定删除这篇博客吗？')) {
      return;
    }

    setMessage('');
    try {
      await apiRequest<void>(
        `/api/blogs/${blog.id}`,
        {
          method: 'DELETE',
        },
        auth,
      );
      setBlogs((items) => items.filter((item) => item.id !== blog.id));
      setMessage('博客已删除');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  const logout = async () => {
    if (!auth) {
      return;
    }

    setMessage('');
    try {
      await apiRequest<void>(
        '/api/auth/logout',
        {
          method: 'POST',
        },
        auth,
      );
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      clearStoredAuth();
      setAuth(null);
      setMessage('');
    }
  };

  return (
    <main className={styles.blogPage}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.logo}>Blog</span>
          {auth && <strong>{currentUserLabel}</strong>}
        </div>
        {auth ? (
          <button
            className={styles.iconButton}
            type="button"
            onClick={logout}
            aria-label="退出"
            title="退出"
          >
            <Icon name="log-out" />
          </button>
        ) : (
          <button
            className={styles.primaryIconButton}
            type="button"
            onClick={() => setShowAuthPanel(true)}
            aria-label="登录"
            title="登录"
          >
            <Icon name="log-in" />
          </button>
        )}
      </header>

      {!auth && showAuthPanel && (
        <section className={styles.authPanel}>
          <div className={styles.authHeader}>
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
            <button
              className={styles.iconButton}
              type="button"
              onClick={() => setShowAuthPanel(false)}
              aria-label="收起"
              title="收起"
            >
              <Icon name="x" />
            </button>
          </div>

          <form className={styles.form} onSubmit={submitAuth}>
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

            <button className={styles.primaryButton} disabled={loading} type="submit">
              <Icon name={mode === 'login' ? 'log-in' : 'user-plus'} />
              {loading ? '提交中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>
        </section>
      )}

      <section className={styles.listSection}>
        <div className={styles.sectionTitle}>
          <h1>文章</h1>
          <div className={styles.sectionActions}>
            <button
              className={styles.primaryIconButton}
              type="button"
              onClick={openCreatePage}
              aria-label="新增"
              title="新增"
            >
              <Icon name="plus" />
            </button>
            <button
              className={styles.iconButton}
              disabled={loading}
              type="button"
              onClick={loadBlogs}
              aria-label="刷新"
              title="刷新"
            >
              <Icon name="refresh" />
            </button>
          </div>
        </div>

        {message && <div className={styles.message}>{message}</div>}

        {loading ? (
          <div className={styles.empty}>加载中...</div>
        ) : blogs.length === 0 ? (
          <div className={styles.empty}>{auth ? '暂无可见博客' : '暂无公共博客'}</div>
        ) : (
          <div className={styles.blogList}>
            {blogs.map((blog) => (
              <article className={styles.blogItem} key={blog.id}>
                <button
                  className={styles.blogContent}
                  type="button"
                  onClick={() => history.push(`/blogs/${blog.id}`)}
                >
                  <strong>{blog.title || blog.summary || '未命名博客'}</strong>
                  <span>
                    {visibilityLabel(blog.visibility)} · {blog.authorName} · 更新于 {formatDateTime(blog.updatedAt)}
                  </span>
                </button>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    onClick={() => history.push(`/blogs/${blog.id}`)}
                    aria-label={blog.owned ? '查看并编辑' : '查看'}
                    title={blog.owned ? '查看并编辑' : '查看'}
                  >
                    <Icon name={blog.owned ? 'edit' : 'eye'} />
                  </button>
                  {blog.owned && (
                    <button
                      type="button"
                      onClick={() => deleteBlog(blog)}
                      aria-label="删除"
                      title="删除"
                    >
                      <Icon name="trash" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
