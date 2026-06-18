import { getCompressionAllowance } from './compression';

type GapWarningContext = {
  fitToOrder?: boolean;
  fitApplied?: boolean;
  isFullyFitted?: boolean;
  remainderMm?: number;
};

/**
 * Краткое сообщение о незаполнении / переполнении для UI.
 * «Ширина по планкам» = сумма ширин профилей + зазоры (без растяжения под заказ).
 */
export const formatWidthGapWarning = (
  orderTargetWidthMm: number,
  nominalLayoutWidthMm: number,
  effectiveLayoutWidthMm: number,
  context: GapWarningContext = {},
): string | null => {
  const order = Math.round(orderTargetWidthMm);
  const nominal = Math.round(nominalLayoutWidthMm);
  const effective = Math.round(effectiveLayoutWidthMm);
  const profileWidth = context.fitApplied ? effective : nominal;
  const gapMm = order - profileWidth;

  if (context.fitApplied && context.isFullyFitted) {
    return null;
  }

  if (context.fitApplied && context.remainderMm !== undefined && context.remainderMm !== 0) {
    const amount = Math.abs(context.remainderMm);
    return context.remainderMm > 0
      ? `Остаток ${amount} мм — добавьте или смените планки.`
      : `Переполнение ${amount} мм — уберите планки.`;
  }

  if (gapMm === 0) return null;

  const allowance = getCompressionAllowance(orderTargetWidthMm);

  if (gapMm > 0) {
    if (context.fitToOrder) {
      return `Остаток ${gapMm} мм — подгонка не закрыла заказ.`;
    }
    if (gapMm <= Math.round(allowance.maxMm)) {
      return `Остаток ${gapMm} мм — включите подгонку под заказ.`;
    }
    return `Остаток ${gapMm} мм — добавьте планки.`;
  }

  const excess = Math.abs(gapMm);
  if (context.fitToOrder) {
    return `Лишние ${excess} мм — подгонка не закрыла заказ.`;
  }
  if (excess <= Math.round(allowance.maxMm)) {
    return `Лишние ${excess} мм — включите подгонку под заказ.`;
  }
  return `Лишние ${excess} мм — уберите планки.`;
};
