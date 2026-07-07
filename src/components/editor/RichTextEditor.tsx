import { useEffect } from 'react';
import { EditorContent, JSONContent, useEditor } from '@tiptap/react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import EditorToolbar from './EditorToolbar';
import styles from './editor.less';

type EditorValue = {
  json: JSONContent;
  html: string;
  text: string;
};

type Props = {
  value: JSONContent | null;
  onChange: (value: EditorValue) => void;
  readOnly?: boolean;
};

const emptyDocument: JSONContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export default function RichTextEditor({ value, onChange, readOnly = false }: Props) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: '开始写正文...',
      }),
    ],
    content: value || emptyDocument,
    onUpdate({ editor: currentEditor }) {
      onChange({
        json: currentEditor.getJSON(),
        html: currentEditor.getHTML(),
        text: currentEditor.getText(),
      });
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const nextValue = value || emptyDocument;
    const currentJson = JSON.stringify(editor.getJSON());
    const nextJson = JSON.stringify(nextValue);

    if (currentJson !== nextJson) {
      editor.commands.setContent(nextValue);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className={styles.wrapper}>
      {!readOnly && <EditorToolbar editor={editor} />}
      <EditorContent editor={editor} className={styles.content} />
    </div>
  );
}
