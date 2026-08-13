import { LINE_THIN_PX } from '../domain/eskd';
import { layoutDrawingComment, type CommentSlot } from './drawingCommentLayout';

type Props = {
  text: string;
  slot: CommentSlot;
};

/** Блок примечания в левом нижнем углу листа, слева от основной надписи. */
export const DrawingComment = ({ text, slot }: Props) => {
  const box = layoutDrawingComment(text, slot);
  if (!box) return null;

  const titleY = box.y + box.pad + box.titleFontSize;
  const firstLineY = titleY + box.titleGap + box.lineHeight;

  return (
    <g className="sheet-comment" aria-label={box.title}>
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        fill="#fff"
        stroke="#000"
        strokeWidth={LINE_THIN_PX}
      />
      <text
        x={box.x + box.pad}
        y={titleY}
        className="eskd-text sheet-comment__title"
        style={{ fontSize: box.titleFontSize }}
      >
        {box.title}
      </text>
      {box.lines.map((line, index) => (
        <text
          key={`comment-line-${index}`}
          x={box.x + box.pad}
          y={firstLineY + index * box.lineHeight}
          className="eskd-text sheet-comment__text"
          style={{ fontSize: box.fontSize }}
        >
          {line}
        </text>
      ))}
    </g>
  );
};
