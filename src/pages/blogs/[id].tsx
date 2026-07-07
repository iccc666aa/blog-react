import { FormEvent, useCallback, useEffect, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { history, useParams } from 'umi';
import RichTextEditor from '@/components/editor/RichTextEditor';
import {
  apiRequest,
  AuthState,
  BlogPost,
  BlogVisibility,
  CommentView,
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

function mergeComment(items: CommentView[], updated: CommentView): CommentView[] {
  return items.map((item) => {
    if (item.id === updated.id) {
      return { ...item, ...updated, replies: item.replies };
    }

    return {
      ...item,
      replies: item.replies.map((reply) => (reply.id === updated.id ? { ...reply, ...updated } : reply)),
    };
  });
}

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [contentJson, setContentJson] = useState<JSONContent | null>(() => createEmptyDocument());
  const [contentHtml, setContentHtml] = useState('');
  const [plainText, setPlainText] = useState('');
  const [visibility, setVisibility] = useState<BlogVisibility>('PUBLIC');
  const [comments, setComments] = useState<CommentView[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<CommentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [message, setMessage] = useState('');
  const [commentMessage, setCommentMessage] = useState('');
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
      setBlog(null);
      setMessage(error instanceof Error ? error.message : '加载博客失败');
    } finally {
      setLoading(false);
    }
  }, [auth, params.id]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentMessage('');
    try {
      const data = await apiRequest<CommentView[]>(
        auth ? `/api/blogs/${params.id}/comments` : `/api/public/blogs/${params.id}/comments`,
        {},
        auth,
      );
      setComments(data);
    } catch (error) {
      setComments([]);
      setCommentMessage(error instanceof Error ? error.message : '加载评论失败');
    } finally {
      setCommentsLoading(false);
    }
  }, [auth, params.id]);

  useEffect(() => {
    loadBlog();
    loadComments();
  }, [loadBlog, loadComments]);

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

  const toggleBlogLike = async () => {
    if (!auth || !blog) {
      setMessage('登录后才能点赞');
      return;
    }

    setMessage('');
    try {
      const updated = await apiRequest<BlogPost>(
        `/api/blogs/${blog.id}/like`,
        {
          method: 'POST',
        },
        auth,
      );
      setBlog(updated);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '点赞失败');
    }
  };

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!auth || !blog) {
      setCommentMessage('登录后才能评论');
      return;
    }
    if (!commentText.trim()) {
      setCommentMessage('请输入评论内容');
      return;
    }

    setSubmittingComment(true);
    setCommentMessage('');
    try {
      await apiRequest<CommentView>(
        '/api/comments',
        {
          method: 'POST',
          body: JSON.stringify({
            postId: blog.id,
            parentId: replyTarget?.id || null,
            content: commentText,
          }),
        },
        auth,
      );
      setCommentText('');
      setReplyTarget(null);
      setBlog((current) =>
        current ? { ...current, commentCount: (current.commentCount || 0) + 1 } : current,
      );
      await loadComments();
    } catch (error) {
      setCommentMessage(error instanceof Error ? error.message : '评论失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  const deleteComment = async (comment: CommentView) => {
    if (!auth || !comment.owned || comment.deleted) {
      return;
    }
    if (!window.confirm('确定删除这条评论吗？')) {
      return;
    }

    setCommentMessage('');
    try {
      await apiRequest<void>(
        `/api/comments/${comment.id}`,
        {
          method: 'DELETE',
        },
        auth,
      );
      setBlog((current) =>
        current ? { ...current, commentCount: Math.max(0, (current.commentCount || 0) - 1) } : current,
      );
      await loadComments();
    } catch (error) {
      setCommentMessage(error instanceof Error ? error.message : '删除评论失败');
    }
  };

  const toggleCommentLike = async (comment: CommentView) => {
    if (!auth) {
      setCommentMessage('登录后才能点赞评论');
      return;
    }
    if (comment.deleted) {
      return;
    }

    setCommentMessage('');
    try {
      const updated = await apiRequest<CommentView>(
        `/api/comments/${comment.id}/like`,
        {
          method: 'POST',
        },
        auth,
      );
      setComments((items) => mergeComment(items, updated));
    } catch (error) {
      setCommentMessage(error instanceof Error ? error.message : '评论点赞失败');
    }
  };

  const renderComment = (comment: CommentView, isReply = false) => (
    <article className={isReply ? styles.replyItem : styles.commentItem} key={comment.id}>
      <div className={styles.commentHeader}>
        <strong>{comment.nickname}</strong>
        {comment.replyToNickname && <span>回复 {comment.replyToNickname}</span>}
        <time>{formatDateTime(comment.createdAt)}</time>
      </div>
      <p className={comment.deleted ? styles.deletedComment : ''}>
        {comment.deleted ? '评论已删除' : comment.content}
      </p>
      <div className={styles.commentActions}>
        <button
          className={comment.liked ? styles.activeAction : ''}
          disabled={comment.deleted}
          type="button"
          onClick={() => toggleCommentLike(comment)}
        >
          赞 {comment.likeCount || 0}
        </button>
        {auth && !comment.deleted && (
          <button type="button" onClick={() => setReplyTarget(comment)}>
            回复
          </button>
        )}
        {comment.owned && !comment.deleted && (
          <button className={styles.deleteAction} type="button" onClick={() => deleteComment(comment)}>
            删除
          </button>
        )}
      </div>
      {!isReply && comment.replies.length > 0 && (
        <div className={styles.replyList}>{comment.replies.map((reply) => renderComment(reply, true))}</div>
      )}
    </article>
  );

  return (
    <main className={styles.detailPage}>
      <header className={styles.topbar}>
        <button type="button" onClick={() => history.push('/')}>
          返回列表
        </button>
        <div className={styles.topbarActions}>
          {blog && (
            <button
              className={blog.liked ? styles.likedButton : ''}
              type="button"
              onClick={toggleBlogLike}
            >
              赞 {blog.likeCount || 0}
            </button>
          )}
          {blog?.owned && (
            <button type="button" onClick={deleteBlog}>
              删除
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className={styles.empty}>加载中...</div>
      ) : !blog ? (
        <div className={styles.empty}>博客不存在或无权查看</div>
      ) : (
        <>
          {blog.owned ? (
            <form className={styles.editor} onSubmit={save}>
              <div className={styles.meta}>
                <h1>博客编辑</h1>
                <span>{visibilityLabel(blog.visibility)}</span>
                <span>作者 {blog.authorName}</span>
                <span>评论 {blog.commentCount || 0}</span>
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
                <span>评论 {blog.commentCount || 0}</span>
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

          <section className={styles.commentSection}>
            <div className={styles.commentTitle}>
              <h2>评论</h2>
              <span>{blog.commentCount || 0} 条</span>
            </div>

            {auth ? (
              <form className={styles.commentForm} onSubmit={submitComment}>
                {replyTarget && (
                  <div className={styles.replyTarget}>
                    正在回复 {replyTarget.nickname}
                    <button type="button" onClick={() => setReplyTarget(null)}>
                      取消
                    </button>
                  </div>
                )}
                <textarea
                  maxLength={1000}
                  placeholder={replyTarget ? `回复 ${replyTarget.nickname}` : '写下你的评论'}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                />
                <div className={styles.commentFormFooter}>
                  <span>{commentText.trim().length}/1000</span>
                  <button type="submit" disabled={submittingComment}>
                    {submittingComment ? '提交中...' : replyTarget ? '发布回复' : '发布评论'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.loginHint}>登录后可以评论、回复和点赞。</div>
            )}

            {commentMessage && <div className={styles.message}>{commentMessage}</div>}

            {commentsLoading ? (
              <div className={styles.empty}>评论加载中...</div>
            ) : comments.length === 0 ? (
              <div className={styles.empty}>暂无评论</div>
            ) : (
              <div className={styles.commentList}>{comments.map((comment) => renderComment(comment))}</div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
