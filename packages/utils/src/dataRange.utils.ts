import { Request } from 'express';

export interface DateRange {
  from: Date;
  to: Date;
}

export function parseDateRange(req: Request): DateRange {
  const now = new Date();

  const from = req.query.from
    ? new Date(req.query.from as string)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const to = req.query.to ? new Date(req.query.to as string) : now;

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new Error(
      'Invalid date range. Use ISO format: ?from=2024-01-01&to=2024-12-31',
    );
  }

  if (from > to) {
    throw new Error('"from" must be before "to"');
  }

  to.setHours(23, 59, 59, 999);

  return { from, to };
}
