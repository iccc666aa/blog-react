import { FormEvent, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { history } from 'umi';
import RichTextEditor from '@/components/editor/RichTextEditor';
import {
  apiRequest,
  AuthState,
  BlogPost,
  BlogVisibility,
  readStoredAuth,
  visibilityOptions,
} from '@/utils/api';
import styles from './detail.less';

function createEmptyDocument(): JSONContent {
  return {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };
}

export default function BlogNewPage() {
  const [auth] = useState<AuthState | null>(() => readStoredAuth());
  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState<JSONContent | null>(() => createEmptyDocument());
  const [contentHtml, setContentHtml] = useState('');
  const [plainText, setPlainText] = useState('');
  const [visibility, setVisibility] = useState<BlogVisibility>('PUBLIC');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const createBlog = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth) {
      setMessage('请先登录后新增博客');
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
      const created = await apiRequest<BlogPost>(
        '/api/blogs',
        {
          method: 'POST',
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
      history.push(`/blogs/${created.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '发布失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className={styles.detailPage}>
      <header className={styles.topbar}>
        <button type="button" onClick={() => history.push('/')}>
          返回列表
        </button>
      </header>

      {!auth ? (
        <div className={styles.empty}>请先登录后新增博客</div>
      ) : (
        <form className={styles.editor} onSubmit={createBlog}>
          <div className={styles.meta}>
            <h1>新增博客</h1>
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
              {saving ? '发布中...' : '发布博客'}
            </button>
          </div>

          {message && <div className={styles.message}>{message}</div>}
        </form>
      )}
    </main>
  );
}
