import { FormEvent, useCallback, useEffect, useState } from 'react';
import { history, useParams } from 'umi';
import {
  apiRequest,
  AuthState,
  BlogPost,
  BlogVisibility,
  formatDateTime,
  readStoredAuth,
  visibilityLabel,
  visibilityOptions,
} from '@/utils/api';
import styles from './detail.less';

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<BlogVisibility>('PUBLIC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [auth] = useState<AuthState | null>(() => readStoredAuth());

  const loadBlog = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const data = await apiRequest<BlogPost>(
        auth ? `/api/blogs/${params.id}` : `/api/public/blogs/${params.id}`,
        {},
        auth,
      );
      setBlog(data);
      setContent(data.content);
      setVisibility(data.visibility);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '加载博客失败');
    } finally {
      setLoading(false);
    }
  }, [auth, params.id]);

  useEffect(() => {
    loadBlog();
  }, [loadBlog]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !blog?.owned) {
      return;
    }
    if (!content.trim()) {
      setMessage('请输入博客内容');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      const updated = await apiRequest<BlogPost>(
        `/api/blogs/${blog.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ content, visibility }),
        },
        auth,
      );
      setBlog(updated);
      setContent(updated.content);
      setVisibility(updated.visibility);
      setMessage('保存成功');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async () => {
    if (!auth || !blog?.owned) {
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
      history.push('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <main className={styles.detailPage}>
      <header className={styles.topbar}>
        <button type="button" onClick={() => history.push('/')}>
          返回列表
        </button>
        {blog?.owned && (
          <button type="button" onClick={deleteBlog}>
            删除
          </button>
        )}
      </header>

      {loading ? (
        <div className={styles.empty}>加载中...</div>
      ) : !blog ? (
        <div className={styles.empty}>博客不存在或无权查看</div>
      ) : (
        <form className={styles.editor} onSubmit={save}>
          <div className={styles.meta}>
            <h1>博客详情</h1>
            <span>{visibilityLabel(blog.visibility)}</span>
            <span>作者 {blog.authorName}</span>
            <span>创建于 {formatDateTime(blog.createdAt)}</span>
            <span>更新于 {formatDateTime(blog.updatedAt)}</span>
          </div>

          <textarea
            maxLength={10000}
            readOnly={!blog.owned}
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <div className={styles.actions}>
            <span>{content.trim().length}/10000</span>
            {blog.owned ? (
              <>
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
                <button type="submit" disabled={saving}>
                  {saving ? '保存中...' : '保存修改'}
                </button>
              </>
            ) : (
              <span>仅作者可编辑</span>
            )}
          </div>

          {message && <div className={styles.message}>{message}</div>}
        </form>
      )}
    </main>
  );
}
