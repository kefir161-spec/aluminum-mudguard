import { LINE_THICK_PX, LINE_THIN_PX, mm } from '../domain/eskd';

type Props = {
  /** Левый верхний угол основной надписи, px. */
  x: number;
  y: number;
  designation: string;
  productName: string;
  documentTitle: string;
  scaleLabel: string;
  developer: string;
  orgName: string;
  sheet?: number;
  sheetsTotal?: number;
};

/** Размеры подобраны под высоту граф штампа (5 / 15 / 25 мм), без выхода за рамки. */
const FONT_LABEL = 7;
const FONT_VALUE = 10;
const FONT_NAME = 11;
const FONT_DESIGNATION = 14;
const FONT_ORG = 11;

type LineSeg = { x1: number; y1: number; x2: number; y2: number };

const VLine = ({ x1, y1, x2, y2 }: LineSeg) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={LINE_THIN_PX} />
);

type CellTextProps = {
  cx: number;
  cy: number;
  text: string;
  size: number;
  anchor?: 'start' | 'middle';
  px?: number;
};

const CellText = ({ cx, cy, text, size, anchor = 'middle', px = 0 }: CellTextProps) => (
  <text
    x={anchor === 'middle' ? cx : cx + px}
    y={cy}
    textAnchor={anchor}
    dominantBaseline="middle"
    className="eskd-text eskd-title-text"
    style={{ fontSize: size }}
  >
    {text}
  </text>
);

/** Основная надпись (форма 1) по ГОСТ 2.104. */
export const TitleBlock = ({
  x,
  y,
  designation,
  productName,
  documentTitle,
  scaleLabel,
  developer,
  orgName,
  sheet = 1,
  sheetsTotal = 1,
}: Props) => {
  const lx = (value: number): number => x + mm(value);
  const ly = (value: number): number => y + mm(value);

  const roles = ['Разраб.', 'Пров.', 'Т.контр.', 'Н.контр.', 'Утв.'];

  return (
    <g className="eskd-title-block">
      {/* Внешняя рамка штампа (основная линия) */}
      <rect
        x={lx(0)}
        y={ly(0)}
        width={mm(185)}
        height={mm(55)}
        fill="#fff"
        stroke="#000"
        strokeWidth={LINE_THICK_PX}
      />

      {/* Вертикальные линии левого блока (графы изменений и исполнителей) */}
      <VLine x1={lx(7)} y1={ly(0)} x2={lx(7)} y2={ly(30)} />
      <VLine x1={lx(17)} y1={ly(0)} x2={lx(17)} y2={ly(55)} />
      <VLine x1={lx(40)} y1={ly(0)} x2={lx(40)} y2={ly(55)} />
      <VLine x1={lx(55)} y1={ly(0)} x2={lx(55)} y2={ly(55)} />
      <VLine x1={lx(65)} y1={ly(0)} x2={lx(65)} y2={ly(55)} />

      {/* Горизонтальные линии левого блока — строки по 5 мм */}
      {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((row) => (
        <VLine key={`h-left-${row}`} x1={lx(0)} y1={ly(row)} x2={lx(65)} y2={ly(row)} />
      ))}

      {/* Правый блок: обозначение / наименование / организация */}
      <VLine x1={lx(65)} y1={ly(15)} x2={lx(185)} y2={ly(15)} />
      <VLine x1={lx(65)} y1={ly(40)} x2={lx(185)} y2={ly(40)} />
      <VLine x1={lx(135)} y1={ly(15)} x2={lx(135)} y2={ly(40)} />

      {/* Правый под-блок: Лит. / Масса / Масштаб + Лист / Листов */}
      <VLine x1={lx(150)} y1={ly(15)} x2={lx(150)} y2={ly(30)} />
      <VLine x1={lx(167)} y1={ly(15)} x2={lx(167)} y2={ly(30)} />
      <VLine x1={lx(135)} y1={ly(20)} x2={lx(185)} y2={ly(20)} />
      <VLine x1={lx(140)} y1={ly(20)} x2={lx(140)} y2={ly(30)} />
      <VLine x1={lx(145)} y1={ly(20)} x2={lx(145)} y2={ly(30)} />
      <VLine x1={lx(135)} y1={ly(30)} x2={lx(185)} y2={ly(30)} />
      <VLine x1={lx(135)} y1={ly(35)} x2={lx(185)} y2={ly(35)} />
      <VLine x1={lx(160)} y1={ly(30)} x2={lx(160)} y2={ly(40)} />

      {/* Графа изменений — заголовок */}
      <CellText cx={lx(3.5)} cy={ly(2.5)} text="Изм." size={FONT_LABEL} />
      <CellText cx={lx(12)} cy={ly(2.5)} text="Лист" size={FONT_LABEL} />
      <CellText cx={lx(28.5)} cy={ly(2.5)} text="№ докум." size={FONT_LABEL} />
      <CellText cx={lx(47.5)} cy={ly(2.5)} text="Подп." size={FONT_LABEL} />
      <CellText cx={lx(60)} cy={ly(2.5)} text="Дата" size={FONT_LABEL} />

      {/* Графы исполнителей */}
      {roles.map((role, index) => {
        const rowY = 30 + index * 5;
        return (
          <CellText
            key={role}
            cx={lx(1)}
            cy={ly(rowY + 2.5)}
            text={role}
            size={FONT_LABEL}
            anchor="start"
          />
        );
      })}
      <CellText cx={lx(18)} cy={ly(32.5)} text={developer} size={FONT_VALUE} anchor="start" px={1} />

      {/* Обозначение документа (графа 2) */}
      <CellText cx={lx(125)} cy={ly(7.5)} text={designation} size={FONT_DESIGNATION} />

      {/* Наименование изделия и документа (графа 1): две строки внутри 15–40 мм */}
      <CellText cx={lx(100)} cy={ly(23)} text={productName} size={FONT_NAME} />
      <CellText cx={lx(100)} cy={ly(32)} text={documentTitle} size={FONT_VALUE} />

      {/* Лит. / Масса / Масштаб */}
      <CellText cx={lx(142.5)} cy={ly(17.5)} text="Лит." size={FONT_LABEL} />
      <CellText cx={lx(158.5)} cy={ly(17.5)} text="Масса" size={FONT_LABEL} />
      <CellText cx={lx(176)} cy={ly(17.5)} text="Масштаб" size={FONT_LABEL} />
      <CellText cx={lx(176)} cy={ly(25)} text={scaleLabel} size={FONT_VALUE} />

      {/* Лист / Листов */}
      <CellText cx={lx(147.5)} cy={ly(32.5)} text="Лист" size={FONT_LABEL} />
      <CellText cx={lx(172.5)} cy={ly(32.5)} text="Листов" size={FONT_LABEL} />
      <CellText cx={lx(147.5)} cy={ly(37.5)} text={String(sheet)} size={FONT_VALUE} />
      <CellText cx={lx(172.5)} cy={ly(37.5)} text={String(sheetsTotal)} size={FONT_VALUE} />

      {/* Наименование организации (графа 9) */}
      <CellText cx={lx(125)} cy={ly(47.5)} text={orgName} size={FONT_ORG} />
    </g>
  );
};
