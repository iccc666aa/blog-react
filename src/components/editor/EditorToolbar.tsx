import { ChangeEvent, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { AuthState } from '@/utils/api';
import { uploadImage } from '@/utils/api';
import styles from './editor.less';

type Props = {
  editor: Editor;
  auth?: AuthState | null;
};

export default function EditorToolbar({ editor, auth }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('请输入链接地址', previousUrl || '');

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const openImageSelector = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }
    if (!auth) {
      window.alert('请先登录再上传图片');
      return;
    }
    if (!file.type.startsWith('image/')) {
      window.alert('只能上传图片');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('图片不能超过 5MB');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadImage(file, auth);
      editor
        .chain()
        .focus()
        .setImage({
          src: result.url,
          alt: result.originalName || '',
          title: result.originalName || '',
        })
        .run();
    } catch (error) {
      console.error(error);
      window.alert(error instanceof Error ? error.message : '图片上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.toolbar}>
      <button
        type="button"
        className={editor.isActive('bold') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        B
      </button>
      <button
        type="button"
        className={editor.isActive('italic') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        I
      </button>
      <button
        type="button"
        className={editor.isActive('strike') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        S
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </button>
      <button
        type="button"
        className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </button>
      <button
        type="button"
        className={editor.isActive('bulletList') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        无序列表
      </button>
      <button
        type="button"
        className={editor.isActive('orderedList') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        有序列表
      </button>
      <button
        type="button"
        className={editor.isActive('blockquote') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        引用
      </button>
      <button
        type="button"
        className={editor.isActive('codeBlock') ? styles.active : ''}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        代码块
      </button>
      <button type="button" onClick={setLink}>
        链接
      </button>
      <button type="button" onClick={openImageSelector} disabled={uploading}>
        {uploading ? '上传中...' : '图片'}
      </button>
      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={handleImageChange}
      />
      <button type="button" onClick={() => editor.chain().focus().undo().run()}>
        撤销
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()}>
        重做
      </button>
    </div>
  );
}
