import { getCompressionAllowance } from './compression';
import { formatAllowance } from './formatAllowance';

type GapWarningContext = {
  fitToOrder?: boolean;
  fitApplied?: boolean;
  isFullyFitted?: boolean;
  remainderMm?: number;
  fitNote?: string;
};

/**
 * Сообщение о незаполнении / переполнении.
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
    const sign = context.remainderMm > 0 ? 'незаполнено' : 'переполнение';
    return `После подгонки ${sign} ${amount} мм (заказ ${order} мм, по планкам ${profileWidth} мм). ${context.fitNote ?? ''}`.trim();
  }

  if (gapMm === 0) return null;

  const allowance = getCompressionAllowance(orderTargetWidthMm);

  if (gapMm > 0) {
    if (context.fitToOrder) {
      return `Незаполнено ${gapMm} мм: заказ ${order} мм, по планкам ${profileWidth} мм. Включите «Подогнать под размер заказчика» (допуск ${formatAllowance(allowance.minMm, allowance.maxMm)}).`;
    }
    if (gapMm <= Math.round(allowance.maxMm)) {
      return `Незаполнено ${gapMm} мм: заказ ${order} мм, по планкам ${profileWidth} мм. Можно подогнать натяжением тросов (допуск ${formatAllowance(allowance.minMm, allowance.maxMm)}).`;
    }
    return `Незаполнено ${gapMm} мм: заказ ${order} мм, по планкам ${profileWidth} мм. Добавьте профили или «Автозаполнение остатка».`;
  }

  const excess = Math.abs(gapMm);
  if (context.fitToOrder) {
    return `Переполнение ${excess} мм: заказ ${order} мм, по планкам ${profileWidth} мм. Включите «Подогнать под размер заказчика» (допуск ${formatAllowance(allowance.minMm, allowance.maxMm)}).`;
  }
  if (excess <= Math.round(allowance.maxMm)) {
    return `Переполнение ${excess} мм: заказ ${order} мм, по планкам ${profileWidth} мм. Можно подогнать натяжением тросов (допуск ${formatAllowance(allowance.minMm, allowance.maxMm)}).`;
  }
  return `Переполнение ${excess} мм: по планкам ${profileWidth} мм при заказе ${order} мм. Удалите профили или увеличьте габарит.`;
};
