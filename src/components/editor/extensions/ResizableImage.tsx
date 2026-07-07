import { mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { useRef } from 'react';
import styles from '../editor.less';

const MIN_WIDTH = 80;
const MAX_WIDTH = 900;

function toWidth(value: unknown) {
  const width = Number(value);
  return Number.isFinite(width) && width > 0 ? width : null;
}

function clampWidth(width: number, maxWidth: number) {
  return Math.max(MIN_WIDTH, Math.min(width, maxWidth));
}

function ResizableImageView({ node, selected, editor, updateAttributes }: ReactNodeViewProps) {
  const wrapperRef = useRef<HTMLSpanElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const width = toWidth(node.attrs.width);
  const isEditable = editor.isEditable;

  const startResize = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isEditable) {
      return;
    }

    const image = imageRef.current;
    const editorElement = editor.view.dom as HTMLElement;
    const startX = event.clientX;
    const startWidth = image?.getBoundingClientRect().width || width || MIN_WIDTH;
    const editorWidth = editorElement.getBoundingClientRect().width;
    const maxWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(editorWidth - 28)));

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const nextWidth = clampWidth(startWidth + moveEvent.clientX - startX, maxWidth);

      updateAttributes({
        width: Math.round(nextWidth),
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('rte-image-resizing');
    };

    document.body.classList.add('rte-image-resizing');
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapperRef}
      className={`${styles.imageNode} ${selected ? styles.imageNodeSelected : ''}`}
      contentEditable={false}
      style={width ? { width } : undefined}
    >
      <img
        ref={imageRef}
        className="rte-image"
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        title={node.attrs.title || undefined}
        draggable={false}
      />
      {isEditable && (
        <button
          type="button"
          className={styles.imageResizeHandle}
          onMouseDown={startResize}
          aria-label="调整图片宽度"
        />
      )}
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  name: 'image',

  addAttributes() {
    const attributes = this.parent?.() ?? {};
    delete attributes.height;

    return {
      ...attributes,
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {};
          }

          return {
            width: attributes.width,
          };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

export default ResizableImage;
