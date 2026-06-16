const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const k = typeof key === 'function' ? key(item) : item[key];
  if (!acc[k]) acc[k] = [];
  acc[k].push(item);
  return acc;
}, {});

const sum = (arr, key) => arr.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

const generateRevenueReport = (bookings, { from, to } = {}) => {
  const filtered = bookings.filter(b => {
    if (from && new Date(b.date) < new Date(from)) return false;
    if (to   && new Date(b.date) > new Date(to))   return false;
    return b.status !== 'cancelled';
  });

  const bySport  = groupBy(filtered, 'sport');
  const byField  = groupBy(filtered, b => b.fieldId ?? b.fieldName ?? 'Unknown');
  const byMonth  = groupBy(filtered, b => b.date?.slice(0, 7) ?? 'Unknown');

  return {
    period:       { from, to },
    totalBookings: filtered.length,
    totalRevenue:  sum(filtered, 'amount'),
    avgBookingValue: filtered.length ? Math.round(sum(filtered, 'amount') / filtered.length) : 0,
    bySport: Object.entries(bySport).map(([sport, rows]) => ({
      sport, count: rows.length, revenue: sum(rows, 'amount'),
    })).sort((a, b) => b.revenue - a.revenue),
    byField: Object.entries(byField).map(([field, rows]) => ({
      field, count: rows.length, revenue: sum(rows, 'amount'),
    })).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    byMonth: Object.entries(byMonth).map(([month, rows]) => ({
      month, count: rows.length, revenue: sum(rows, 'amount'),
    })).sort((a, b) => a.month.localeCompare(b.month)),
    generatedAt: new Date().toISOString(),
  };
};

const generateUserReport = (users, bookings) => {
  const bookingsByUser = groupBy(bookings.filter(b => b.status !== 'cancelled'), 'userId');
  return {
    totalUsers:    users.length,
    activeUsers:   Object.keys(bookingsByUser).length,
    topSpenders: users
      .map(u => {
        const ub = bookingsByUser[u._id ?? u.id] ?? [];
        return { userId: u._id ?? u.id, name: u.name, email: u.email, bookings: ub.length, totalSpent: sum(ub, 'amount') };
      })
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10),
    retention: {
      singleBooking:    users.filter(u => (bookingsByUser[u._id ?? u.id] ?? []).length === 1).length,
      multipleBookings: users.filter(u => (bookingsByUser[u._id ?? u.id] ?? []).length > 1).length,
      noBookings:       users.filter(u => !(bookingsByUser[u._id ?? u.id])).length,
    },
    generatedAt: new Date().toISOString(),
  };
};

const generateOccupancyReport = (fields, bookings) => {
  const bookingsByField = groupBy(bookings.filter(b => b.status !== 'cancelled'), b => b.fieldId ?? b.fieldName);
  const HOURS_PER_DAY   = 17;

  return fields.map(f => {
    const fid  = f._id ?? f.id ?? f.name;
    const fb   = bookingsByField[fid] ?? [];
    const days = 30;
    const totalSlots  = days * HOURS_PER_DAY;
    const bookedSlots = sum(fb, 'durationHours') || fb.length;
    const occupancy   = totalSlots > 0 ? Math.min(100, Math.round((bookedSlots / totalSlots) * 100)) : 0;
    return {
      fieldId: fid, name: f.name, sport: f.sport,
      totalBookings: fb.length, bookedHours: bookedSlots,
      occupancyRate: occupancy,
      revenue: sum(fb, 'amount'),
    };
  }).sort((a, b) => b.occupancyRate - a.occupancyRate);
};

export { generateRevenueReport, generateUserReport, generateOccupancyReport, groupBy, sum };
