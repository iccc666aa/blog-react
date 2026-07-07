import type { Editor } from '@tiptap/react';
import styles from './editor.less';

type Props = {
  editor: Editor;
};

export default function EditorToolbar({ editor }: Props) {
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
      <button type="button" onClick={() => editor.chain().focus().undo().run()}>
        撤销
      </button>
      <button type="button" onClick={() => editor.chain().focus().redo().run()}>
        重做
      </button>
    </div>
  );
}
