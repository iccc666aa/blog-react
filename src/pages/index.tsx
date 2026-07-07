import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { history } from 'umi';
import {
  apiRequest,
  AuthResult,
  AuthState,
  BlogPost,
  BlogVisibility,
  clearStoredAuth,
  formatDateTime,
  readStoredAuth,
  visibilityLabel,
  visibilityOptions,
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
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<BlogVisibility>('PUBLIC');
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const createBlog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setShowAuthPanel(true);
      setMessage('登录之后才能新增博客');
      return;
    }
    if (!content.trim()) {
      setMessage('请输入博客内容');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const created = await apiRequest<BlogPost>(
        '/api/blogs',
        {
          method: 'POST',
          body: JSON.stringify({ content, visibility }),
        },
        auth,
      );
      setBlogs((items) => [created, ...items]);
      setContent('');
      setVisibility('PUBLIC');
      setMessage('博客已发布');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布失败');
    } finally {
      setSaving(false);
    }
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
      setContent('');
      setVisibility('PUBLIC');
      setMessage('');
    }
  };

  return (
    <main className={styles.blogPage}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.logo}>Blog</span>
          <strong>{auth ? currentUserLabel : '公共列表'}</strong>
        </div>
        {auth ? (
          <button className={styles.ghostButton} type="button" onClick={logout}>
            退出
          </button>
        ) : (
          <button className={styles.primaryButton} type="button" onClick={() => setShowAuthPanel(true)}>
            登录
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
            <button className={styles.ghostButton} type="button" onClick={() => setShowAuthPanel(false)}>
              收起
            </button>
          </div>

          <form className={styles.form} onSubmit={submitAuth}>
            <h1>{mode === 'login' ? '登录账号' : '注册账号'}</h1>

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
              {loading ? '提交中...' : mode === 'login' ? '登录' : '注册'}
            </button>
          </form>
        </section>
      )}

      {auth && (
        <section className={styles.editorSection}>
          <form className={styles.editor} onSubmit={createBlog}>
            <textarea
              maxLength={10000}
              placeholder="写点什么..."
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className={styles.editorActions}>
              <span>{content.trim().length}/10000</span>
              <label className={styles.inlineField}>
                类型
                <select
                  value={visibility}
                  onChange={(event) => setVisibility(event.target.value as BlogVisibility)}
                >
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button className={styles.primaryButton} disabled={saving} type="submit">
                {saving ? '发布中...' : '发布博客'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.listSection}>
        <div className={styles.sectionTitle}>
          <h1>博客列表</h1>
          <button className={styles.ghostButton} disabled={loading} type="button" onClick={loadBlogs}>
            刷新
          </button>
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
                  <strong>{blog.summary || '未命名博客'}</strong>
                  <span>
                    {visibilityLabel(blog.visibility)} · {blog.authorName} · 更新于 {formatDateTime(blog.updatedAt)}
                  </span>
                </button>
                <div className={styles.itemActions}>
                  <button type="button" onClick={() => history.push(`/blogs/${blog.id}`)}>
                    {blog.owned ? '查看/编辑' : '查看'}
                  </button>
                  {blog.owned && (
                    <button type="button" onClick={() => deleteBlog(blog)}>
                      删除
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
