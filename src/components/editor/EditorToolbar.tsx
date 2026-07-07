import { ChangeEvent, useRef, useState } from 'react';
import type { Editor } from '@tiptap/react';
import Icon, { IconName } from '@/components/Icon';
import type { AuthState } from '@/utils/api';
import { uploadImage } from '@/utils/api';
import styles from './editor.less';

type Props = {
  editor: Editor;
  auth?: AuthState | null;
};

type ToolbarButtonProps = {
  label: string;
  icon?: IconName;
  text?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

function ToolbarButton({ label, icon, text, active, disabled, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={active ? styles.active : ''}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {icon ? <Icon name={icon} /> : <span>{text}</span>}
    </button>
  );
}

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
          width: 300,
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
      <ToolbarButton
        label="加粗"
        icon="bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      />
      <ToolbarButton
        label="斜体"
        icon="italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      />
      <ToolbarButton
        label="删除线"
        icon="strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      />
      <ToolbarButton
        label="一级标题"
        text="H1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      />
      <ToolbarButton
        label="二级标题"
        text="H2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      />
      <ToolbarButton
        label="三级标题"
        text="H3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      />
      <ToolbarButton
        label="无序列表"
        icon="bullet-list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      />
      <ToolbarButton
        label="有序列表"
        icon="ordered-list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      />
      <ToolbarButton
        label="引用"
        icon="quote"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      />
      <ToolbarButton
        label="代码块"
        icon="code"
        active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      />
      <ToolbarButton label="链接" icon="link" onClick={setLink} />
      <ToolbarButton
        label={uploading ? '上传中' : '图片'}
        icon={uploading ? 'upload' : 'image'}
        disabled={uploading}
        onClick={openImageSelector}
      />
      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        onChange={handleImageChange}
      />
      <ToolbarButton label="撤销" icon="undo" onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton label="重做" icon="redo" onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}
