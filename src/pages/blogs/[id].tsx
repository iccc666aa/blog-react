import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { history, useParams } from 'umi';
import RichTextEditor from '@/components/editor/RichTextEditor';
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

function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}

function parseContentJson(value?: string | null): JSONContent {
  if (!value) {
    return createEmptyDocument();
  }

  try {
    return JSON.parse(value) as JSONContent;
  } catch {
    return createEmptyDocument();
  }
}

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState<JSONContent | null>(() => createEmptyDocument());
  const [contentHtml, setContentHtml] = useState('');
  const [plainText, setPlainText] = useState('');
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
      setTitle(data.title || '');
      setContentJson(parseContentJson(data.contentJson));
      setContentHtml(data.contentHtml || '');
      setPlainText(data.plainText || '');
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
    if (!title.trim()) {
      setMessage('请输入标题');
      return;
    }
    if (!plainText.trim()) {
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
          body: JSON.stringify({
            title,
            contentJson: JSON.stringify(contentJson || createEmptyDocument()),
            contentHtml,
            plainText,
            visibility,
          }),
        },
        auth,
      );
      setBlog(updated);
      setTitle(updated.title || '');
      setContentJson(parseContentJson(updated.contentJson));
      setContentHtml(updated.contentHtml || '');
      setPlainText(updated.plainText || '');
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
      ) : blog.owned ? (
        <form className={styles.editor} onSubmit={save}>
          <div className={styles.meta}>
            <h1>博客编辑</h1>
            <span>{visibilityLabel(blog.visibility)}</span>
            <span>作者 {blog.authorName}</span>
            <span>创建于 {formatDateTime(blog.createdAt)}</span>
            <span>更新于 {formatDateTime(blog.updatedAt)}</span>
          </div>

          <input
            className={styles.titleInput}
            maxLength={200}
            placeholder="请输入标题"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <RichTextEditor
            auth={auth}
            value={contentJson}
            onChange={({ json, html, text }) => {
              setContentJson(json);
              setContentHtml(html);
              setPlainText(text);
            }}
          />

          <div className={styles.actions}>
            <span>{plainText.trim().length} 字</span>
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
          </div>

          {message && <div className={styles.message}>{message}</div>}
        </form>
      ) : (
        <article className={styles.article}>
          <div className={styles.meta}>
            <h1>{blog.title || '未命名博客'}</h1>
            <span>{visibilityLabel(blog.visibility)}</span>
            <span>作者 {blog.authorName}</span>
            <span>创建于 {formatDateTime(blog.createdAt)}</span>
            <span>更新于 {formatDateTime(blog.updatedAt)}</span>
          </div>
          <div
            className={styles.articleBody}
            dangerouslySetInnerHTML={{ __html: blog.contentHtml || '' }}
          />
          {message && <div className={styles.message}>{message}</div>}
        </article>
      )}
    </main>
  );
}
