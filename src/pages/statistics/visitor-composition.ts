import type { TimeSeriesPayload } from '@/types/api';

export function createVisitorComposition(payload?: TimeSeriesPayload): TimeSeriesPayload | undefined {
  if (!payload) {
    return undefined;
  }

  const members = payload.series.find((series) => series.key === 'members');

  return {
    ...payload,
    series: [
      {
        key: 'members',
        label: members?.label ?? '회원 방문자',
        unit: 'COUNT',
        fill: 'ZERO',
      },
      {
        key: 'guestVisitors',
        label: members?.label.replace('회원', '비회원') ?? '비회원 방문자',
        unit: 'COUNT',
        fill: 'ZERO',
      },
    ],
    points: payload.points.map((point) => {
      const visitors = point.values.visitors;
      const memberVisitors = point.values.members;

      return {
        ...point,
        values: {
          members: memberVisitors ?? null,
          guestVisitors:
            visitors === null || visitors === undefined || memberVisitors === null || memberVisitors === undefined
              ? null
              : Math.max(0, visitors - memberVisitors),
        },
      };
    }),
  };
}
