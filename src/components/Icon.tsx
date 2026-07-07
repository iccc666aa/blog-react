import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'arrow-left'
  | 'bold'
  | 'bullet-list'
  | 'code'
  | 'edit'
  | 'eye'
  | 'heart'
  | 'image'
  | 'italic'
  | 'link'
  | 'log-in'
  | 'log-out'
  | 'ordered-list'
  | 'plus'
  | 'quote'
  | 'redo'
  | 'refresh'
  | 'reply'
  | 'save'
  | 'send'
  | 'strikethrough'
  | 'trash'
  | 'undo'
  | 'upload'
  | 'user-plus'
  | 'x';

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const paths: Record<IconName, ReactElement> = {
  'arrow-left': (
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>
  ),
  bold: (
    <>
      <path d="M7 5h6a4 4 0 0 1 0 8H7z" />
      <path d="M7 13h7a3 3 0 0 1 0 6H7z" />
    </>
  ),
  'bullet-list': (
    <>
      <path d="M9 7h10" />
      <path d="M9 12h10" />
      <path d="M9 17h10" />
      <path d="M5 7h.01" />
      <path d="M5 12h.01" />
      <path d="M5 17h.01" />
    </>
  ),
  code: (
    <>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    </>
  ),
  heart: (
    <path d="M20.8 8.6a5.4 5.4 0 0 0-9.2-3.8L12 5.2l.4-.4a5.4 5.4 0 1 1 7.6 7.6L12 20.4 4 12.4A5.4 5.4 0 1 1 11.6 4.8l.4.4" />
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 16 5-5 4 4 2-2 7 6" />
      <path d="M8.5 9.5h.01" />
    </>
  ),
  italic: (
    <>
      <path d="M19 4h-9" />
      <path d="M14 20H5" />
      <path d="M15 4 9 20" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1" />
    </>
  ),
  'log-in': (
    <>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="m10 17 5-5-5-5" />
      <path d="M15 12H3" />
    </>
  ),
  'log-out': (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  'ordered-list': (
    <>
      <path d="M10 7h10" />
      <path d="M10 12h10" />
      <path d="M10 17h10" />
      <path d="M4 6h1v4" />
      <path d="M4 10h2" />
      <path d="M4 14h2l-2 3h2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  quote: (
    <>
      <path d="M8 8H5a2 2 0 0 0-2 2v3a3 3 0 0 0 3 3h2v-6H5" />
      <path d="M19 8h-3a2 2 0 0 0-2 2v3a3 3 0 0 0 3 3h2v-6h-3" />
    </>
  ),
  redo: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M21 6v5a7 7 0 0 1-7 7H7" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 0 1-15.3 6.4" />
      <path d="M3 12A9 9 0 0 1 18.3 5.6" />
      <path d="M18 2v4h-4" />
      <path d="M6 22v-4h4" />
    </>
  ),
  reply: (
    <>
      <path d="m9 17-6-5 6-5v4h5a7 7 0 0 1 7 7v1" />
    </>
  ),
  save: (
    <>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  strikethrough: (
    <>
      <path d="M17 5.5A5.1 5.1 0 0 0 12.6 4H11a4 4 0 0 0-4 4c0 1.5.8 2.7 2.1 3.3" />
      <path d="M3 12h18" />
      <path d="M7 18.2A6.3 6.3 0 0 0 11.4 20H13a4 4 0 0 0 4-4c0-1.3-.6-2.4-1.7-3.1" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="m19 6-1 14H6L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </>
  ),
  undo: (
    <>
      <path d="m7 7-4 4 4 4" />
      <path d="M3 11h11a6 6 0 0 1 0 12H9" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m17 8-5-5-5 5" />
      <path d="M12 3v12" />
    </>
  ),
  'user-plus': (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
};

export default function Icon({ name, ...props }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
