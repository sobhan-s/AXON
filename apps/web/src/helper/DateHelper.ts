interface DateRange {
  from: string;
  to: string;
}

export function shortDate(d: string) {
  return d?.slice(5) ?? d;
}

export function defaultRange(): DateRange {
  const to = new Date(),
    from = new Date();
  from.setMonth(from.getMonth() - 1);
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  };
}
