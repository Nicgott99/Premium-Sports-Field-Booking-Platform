import { useState, useMemo } from 'react';
import {
  Car,
  ParkingSquare,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  ReceiptText,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  Users,
  Star,
  Bus,
  Briefcase,
  Accessibility,
} from 'lucide-react';
import PropTypes from 'prop-types';

// ---------------------------------------------------------------------------
// Constants mirroring venueCarParkManagementEngine
// ---------------------------------------------------------------------------

const ZONE_TYPES = {
  GENERAL:    'GENERAL',
  ACCESSIBLE: 'ACCESSIBLE',
  VIP:        'VIP',
  COACH:      'COACH',
  STAFF:      'STAFF',
  ELECTRIC:   'ELECTRIC',
};

const PERMIT_TYPES = ['MATCH_DAY', 'SEASON_PASS', 'ACCESSIBLE', 'STAFF_PASS', 'VIP_PASS'];

const DEFAULT_TARIFFS = {
  GENERAL: 10, ACCESSIBLE: 0, VIP: 25, COACH: 15, STAFF: 0, ELECTRIC: 12,
};

const BOOKING_STATUS = {
  CONFIRMED:  'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  COMPLETED:  'COMPLETED',
  CANCELLED:  'CANCELLED',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function availableSpaces(zone) {
  return Math.max(0, zone.totalSpaces - zone.occupiedCount - zone.reservedCount - zone.blockedCount);
}

function occupancyPct(zone) {
  return Math.round(((zone.occupiedCount + zone.reservedCount) / zone.totalSpaces) * 1000) / 10;
}

function fmtGBP(v) { return `£${Number(v).toFixed(2)}`; }

function zoneIcon(type) {
  const icons = {
    GENERAL:    Car,
    ACCESSIBLE: Accessibility,
    VIP:        Star,
    COACH:      Bus,
    STAFF:      Briefcase,
    ELECTRIC:   Zap,
  };
  return icons[type] ?? Car;
}

function zoneColors(type) {
  const map = {
    GENERAL:    { text: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    bar: 'bg-blue-500' },
    ACCESSIBLE: { text: 'text-teal-300',    bg: 'bg-teal-500/10',    border: 'border-teal-500/30',    bar: 'bg-teal-500' },
    VIP:        { text: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-500' },
    COACH:      { text: 'text-purple-300',  bg: 'bg-purple-500/10',  border: 'border-purple-500/30',  bar: 'bg-purple-500' },
    STAFF:      { text: 'text-cyan-300',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',    bar: 'bg-cyan-500' },
    ELECTRIC:   { text: 'text-lime-300',    bg: 'bg-lime-500/10',    border: 'border-lime-500/30',    bar: 'bg-lime-500' },
  };
  return map[type] ?? map.GENERAL;
}

function statusColors(status) {
  const map = {
    CONFIRMED:  'bg-blue-500/20 text-blue-300 border-blue-500/30',
    CHECKED_IN: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    COMPLETED:  'bg-slate-500/20 text-slate-400 border-slate-500/30',
    CANCELLED:  'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return map[status] ?? map.CONFIRMED;
}

function OccupancyBar({ pct, barClass }) {
  return (
    <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${barClass} ${pct > 90 ? 'opacity-100' : 'opacity-80'}`}
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}
OccupancyBar.propTypes = { pct: PropTypes.number.isRequired, barClass: PropTypes.string.isRequired };

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function CarParkManagementCard({ venueId, eventId, initialZones, initialBookings }) {
  const [zones, setZones]       = useState(initialZones);
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedZoneId, setSelectedZoneId] = useState(initialZones[0]?.zoneId ?? null);

  // Booking form
  const [vehicleReg, setVehicleReg]   = useState('');
  const [holderName, setHolderName]   = useState('');
  const [permitType, setPermitType]   = useState(PERMIT_TYPES[0]);
  const [bookSuccess, setBookSuccess] = useState(null);

  // Panels
  const [showBookings, setShowBookings]   = useState(true);
  const [showRevenue,  setShowRevenue]    = useState(false);
  const [expandedBkg,  setExpandedBkg]   = useState(null);

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const selectedZone = useMemo(() => zones.find((z) => z.zoneId === selectedZoneId), [zones, selectedZoneId]);

  const venueStats = useMemo(() => {
    const totalOcc = zones.reduce((s, z) => s + z.occupiedCount + z.reservedCount, 0);
    const totalCap = zones.reduce((s, z) => s + z.totalSpaces, 0);
    const pct = Math.round((totalOcc / Math.max(totalCap, 1)) * 1000) / 10;
    return { totalOcc, totalCap, pct };
  }, [zones]);

  const revenue = useMemo(() => {
    const completed = bookings.filter((b) => b.status === BOOKING_STATUS.COMPLETED);
    const gross     = Math.round(completed.reduce((s, b) => s + (b.tariffGBP ?? 0), 0) * 100) / 100;
    const byZone    = {};
    for (const b of completed) {
      byZone[b.zoneId] = (byZone[b.zoneId] ?? 0) + (b.tariffGBP ?? 0);
    }
    return { gross, txCount: completed.length, byZone };
  }, [bookings]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status === BOOKING_STATUS.CONFIRMED || b.status === BOOKING_STATUS.CHECKED_IN),
    [bookings],
  );

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  function handleBook() {
    if (!vehicleReg.trim() || !holderName.trim() || !selectedZoneId) return;
    const zone = zones.find((z) => z.zoneId === selectedZoneId);
    if (!zone || availableSpaces(zone) < 1) return;

    const bkg = {
      bookingId:   `BKG-${Date.now()}`,
      zoneId:      zone.zoneId,
      zoneName:    zone.name,
      zoneType:    zone.type,
      vehicleReg:  vehicleReg.toUpperCase().trim(),
      holderName:  holderName.trim(),
      permitType,
      eventId,
      tariffGBP:   zone.tariffGBP,
      status:      BOOKING_STATUS.CONFIRMED,
      spaceRef:    `${zone.zoneId}-${String(zone.occupiedCount + zone.reservedCount + 1).padStart(3, '0')}`,
      confirmedAt: new Date().toISOString(),
      checkedInAt:  null,
      checkedOutAt: null,
    };

    setZones((prev) => prev.map((z) => z.zoneId === zone.zoneId ? { ...z, reservedCount: z.reservedCount + 1 } : z));
    setBookings((prev) => [bkg, ...prev]);
    setBookSuccess(bkg.bookingId);
    setVehicleReg('');
    setHolderName('');
    setTimeout(() => setBookSuccess(null), 4000);
  }

  function handleCheckIn(bookingId) {
    const bkg = bookings.find((b) => b.bookingId === bookingId);
    if (!bkg || bkg.status !== BOOKING_STATUS.CONFIRMED) return;
    setBookings((prev) => prev.map((b) =>
      b.bookingId === bookingId
        ? { ...b, status: BOOKING_STATUS.CHECKED_IN, checkedInAt: new Date().toISOString() }
        : b,
    ));
    setZones((prev) => prev.map((z) =>
      z.zoneId === bkg.zoneId
        ? { ...z, reservedCount: Math.max(0, z.reservedCount - 1), occupiedCount: z.occupiedCount + 1 }
        : z,
    ));
  }

  function handleCheckOut(bookingId) {
    const bkg = bookings.find((b) => b.bookingId === bookingId);
    if (!bkg || bkg.status !== BOOKING_STATUS.CHECKED_IN) return;
    setBookings((prev) => prev.map((b) =>
      b.bookingId === bookingId
        ? { ...b, status: BOOKING_STATUS.COMPLETED, checkedOutAt: new Date().toISOString() }
        : b,
    ));
    setZones((prev) => prev.map((z) =>
      z.zoneId === bkg.zoneId
        ? { ...z, occupiedCount: Math.max(0, z.occupiedCount - 1) }
        : z,
    ));
  }

  function handleCancel(bookingId) {
    const bkg = bookings.find((b) => b.bookingId === bookingId);
    if (!bkg || ![BOOKING_STATUS.CONFIRMED].includes(bkg.status)) return;
    setBookings((prev) => prev.map((b) =>
      b.bookingId === bookingId ? { ...b, status: BOOKING_STATUS.CANCELLED } : b,
    ));
    setZones((prev) => prev.map((z) =>
      z.zoneId === bkg.zoneId
        ? { ...z, reservedCount: Math.max(0, z.reservedCount - 1) }
        : z,
    ));
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="bg-slate-950/95 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl w-full max-w-2xl">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-500" />

      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/60 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-0.5">
          <ParkingSquare className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-bold text-slate-100 leading-tight">Car Park Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Venue <span className="font-mono text-blue-400">{venueId}</span>
            <span className="mx-1.5 text-slate-600">·</span>
            Event <span className="font-mono text-cyan-400">{eventId}</span>
          </p>
        </div>
        <div className="flex gap-2 text-xs flex-shrink-0">
          <span className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            {venueStats.totalOcc} / {venueStats.totalCap} spaces
          </span>
          <span className={`px-2 py-1 rounded-lg border font-semibold ${venueStats.pct > 90 ? 'bg-red-900/30 text-red-300 border-red-700/30' : venueStats.pct > 70 ? 'bg-amber-900/20 text-amber-300 border-amber-700/30' : 'bg-emerald-900/20 text-emerald-300 border-emerald-700/30'}`}>
            {venueStats.pct}% full
          </span>
        </div>
      </div>

      {/* Zone grid */}
      <div className="px-5 py-3 border-b border-slate-800/40">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Zones</p>
        <div className="grid grid-cols-2 gap-2">
          {zones.map((zone) => {
            const avail  = availableSpaces(zone);
            const pct    = occupancyPct(zone);
            const cols   = zoneColors(zone.type);
            const ZIcon  = zoneIcon(zone.type);
            const isSelected = zone.zoneId === selectedZoneId;
            return (
              <button
                key={zone.zoneId}
                onClick={() => setSelectedZoneId(zone.zoneId)}
                className={`rounded-xl border p-2.5 text-left transition-all ${isSelected ? `${cols.bg} ${cols.border}` : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ZIcon className={`w-3.5 h-3.5 flex-shrink-0 ${cols.text}`} />
                  <span className="text-xs font-semibold text-slate-200 flex-1 truncate">{zone.name}</span>
                </div>
                <OccupancyBar pct={pct} barClass={cols.bar} />
                <div className="flex justify-between mt-1 text-xs text-slate-500">
                  <span className={avail === 0 ? 'text-red-400 font-semibold' : ''}>{avail} free</span>
                  <span>{fmtGBP(zone.tariffGBP)}</span>
                  <span className={pct > 90 ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-slate-400'}>{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Booking form */}
      <div className="px-5 py-3 border-b border-slate-800/40 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">New Booking
          {selectedZone && (
            <span className={`ml-2 normal-case font-normal ${zoneColors(selectedZone.type).text}`}>
              — {selectedZone.name} ({fmtGBP(selectedZone.tariffGBP)})
            </span>
          )}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <input
            value={vehicleReg}
            onChange={(e) => setVehicleReg(e.target.value)}
            placeholder="Vehicle reg (e.g. AB12 CDE)"
            className="col-span-2 bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 uppercase placeholder-slate-500 placeholder:normal-case"
          />
          <input
            value={holderName}
            onChange={(e) => setHolderName(e.target.value)}
            placeholder="Holder name"
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <select
            value={permitType}
            onChange={(e) => setPermitType(e.target.value)}
            className="bg-slate-800/70 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {PERMIT_TYPES.map((p) => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
          </select>
        </div>

        {/* Capacity warning */}
        {selectedZone && availableSpaces(selectedZone) === 0 && (
          <div className="flex items-center gap-2 text-xs text-red-300 bg-red-900/20 border border-red-700/30 rounded-lg px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> Zone is full — no spaces available.
          </div>
        )}

        {bookSuccess ? (
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-700/30 rounded-xl px-3 py-2">
            <CheckCircle2 className="w-4 h-4" /> Booking <span className="font-mono">{bookSuccess}</span> confirmed
          </div>
        ) : (
          <button
            onClick={handleBook}
            disabled={!vehicleReg.trim() || !holderName.trim() || !selectedZoneId || (selectedZone && availableSpaces(selectedZone) === 0)}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <Car className="w-4 h-4" /> Reserve Space
          </button>
        )}
      </div>

      {/* Active bookings list */}
      <div className="px-5 py-3 border-b border-slate-800/40">
        <button
          onClick={() => setShowBookings((p) => !p)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-300 transition-colors mb-1"
        >
          <span className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Active Bookings ({activeBookings.length})
          </span>
          {showBookings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showBookings && (
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 mt-2">
            {activeBookings.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-3">No active bookings.</p>
            )}
            {activeBookings.map((bkg) => {
              const cols = zoneColors(bkg.zoneType);
              const ZIcon = zoneIcon(bkg.zoneType);
              return (
                <div key={bkg.bookingId} className="rounded-xl bg-slate-800/50 border border-slate-700/40 overflow-hidden">
                  {/* Row */}
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-700/30 transition-colors"
                    onClick={() => setExpandedBkg((p) => (p === bkg.bookingId ? null : bkg.bookingId))}
                  >
                    <ZIcon className={`w-4 h-4 flex-shrink-0 ${cols.text}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 font-mono truncate">{bkg.vehicleReg}</p>
                      <p className="text-xs text-slate-500 truncate">{bkg.holderName} · {bkg.spaceRef}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusColors(bkg.status)}`}>
                      {bkg.status.replace('_', ' ')}
                    </span>
                    {expandedBkg === bkg.bookingId
                      ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                  </button>

                  {/* Expanded actions */}
                  {expandedBkg === bkg.bookingId && (
                    <div className="border-t border-slate-700/30 px-3 py-2 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                          <div className="text-slate-400">Zone</div>
                          <div className={`font-semibold truncate ${cols.text}`}>{bkg.zoneName}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                          <div className="text-slate-400">Permit</div>
                          <div className="font-semibold text-slate-200 truncate">{bkg.permitType.replace('_', ' ')}</div>
                        </div>
                        <div className="bg-slate-900/60 rounded-lg px-2 py-1.5 text-center">
                          <div className="text-slate-400">Tariff</div>
                          <div className="font-semibold text-cyan-300">{fmtGBP(bkg.tariffGBP)}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {bkg.status === BOOKING_STATUS.CONFIRMED && (
                          <>
                            <button
                              onClick={() => handleCheckIn(bkg.bookingId)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-700/40 hover:bg-emerald-600/50 border border-emerald-600/30 text-xs text-emerald-300 font-semibold transition-colors"
                            >
                              <LogIn className="w-3.5 h-3.5" /> Check In
                            </button>
                            <button
                              onClick={() => handleCancel(bkg.bookingId)}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-800/40 border border-red-700/30 text-xs text-red-400 font-semibold transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        )}
                        {bkg.status === BOOKING_STATUS.CHECKED_IN && (
                          <button
                            onClick={() => handleCheckOut(bkg.bookingId)}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-blue-700/40 hover:bg-blue-600/50 border border-blue-600/30 text-xs text-blue-300 font-semibold transition-colors"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Check Out
                          </button>
                        )}
                      </div>

                      {bkg.checkedInAt && (
                        <p className="text-xs text-slate-500">
                          Checked in: <span className="text-slate-300">{new Date(bkg.checkedInAt).toLocaleTimeString()}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Revenue summary */}
      <div className="px-5 py-3">
        <button
          onClick={() => setShowRevenue((p) => !p)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-widest hover:text-slate-300 transition-colors mb-1"
        >
          <span className="flex items-center gap-2">
            <ReceiptText className="w-3.5 h-3.5 text-cyan-400" /> Revenue ({revenue.txCount} completed)
          </span>
          {showRevenue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRevenue && (
          <div className="mt-2 space-y-2">
            <div className="bg-slate-800/50 rounded-xl px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">Gross Revenue</span>
              <span className="text-lg font-bold text-cyan-300">{fmtGBP(revenue.gross)}</span>
            </div>
            {Object.keys(revenue.byZone).length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-slate-500">By Zone</p>
                {Object.entries(revenue.byZone).map(([zoneId, total]) => {
                  const zone = zones.find((z) => z.zoneId === zoneId);
                  const cols = zone ? zoneColors(zone.type) : zoneColors('GENERAL');
                  return (
                    <div key={zoneId} className="flex items-center gap-2 text-xs rounded-lg bg-slate-800/30 px-2.5 py-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cols.bar}`} />
                      <span className="flex-1 text-slate-300">{zone?.name ?? zoneId}</span>
                      <span className="font-bold text-cyan-300">{fmtGBP(total)}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {revenue.txCount === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-2">No completed transactions yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

CarParkManagementCard.propTypes = {
  venueId:         PropTypes.string,
  eventId:         PropTypes.string,
  initialZones:    PropTypes.arrayOf(
    PropTypes.shape({
      zoneId:        PropTypes.string.isRequired,
      name:          PropTypes.string.isRequired,
      type:          PropTypes.string.isRequired,
      totalSpaces:   PropTypes.number.isRequired,
      tariffGBP:     PropTypes.number.isRequired,
      occupiedCount: PropTypes.number,
      reservedCount: PropTypes.number,
      blockedCount:  PropTypes.number,
    }),
  ),
  initialBookings: PropTypes.arrayOf(
    PropTypes.shape({
      bookingId:   PropTypes.string.isRequired,
      zoneId:      PropTypes.string,
      zoneName:    PropTypes.string,
      zoneType:    PropTypes.string,
      vehicleReg:  PropTypes.string,
      holderName:  PropTypes.string,
      permitType:  PropTypes.string,
      tariffGBP:   PropTypes.number,
      status:      PropTypes.string,
      spaceRef:    PropTypes.string,
      confirmedAt: PropTypes.string,
      checkedInAt: PropTypes.string,
      checkedOutAt:PropTypes.string,
    }),
  ),
};

CarParkManagementCard.defaultProps = {
  venueId:  'VENUE-001',
  eventId:  'MATCH-001',
  initialZones: [
    { zoneId: 'Z-GEN',  name: 'General A',       type: ZONE_TYPES.GENERAL,    totalSpaces: 200, tariffGBP: DEFAULT_TARIFFS.GENERAL,    occupiedCount: 80,  reservedCount: 20,  blockedCount: 0 },
    { zoneId: 'Z-VIP',  name: 'VIP Enclosure',   type: ZONE_TYPES.VIP,        totalSpaces: 40,  tariffGBP: DEFAULT_TARIFFS.VIP,        occupiedCount: 10,  reservedCount: 5,   blockedCount: 0 },
    { zoneId: 'Z-ACC',  name: 'Accessible Bays',  type: ZONE_TYPES.ACCESSIBLE, totalSpaces: 20,  tariffGBP: DEFAULT_TARIFFS.ACCESSIBLE, occupiedCount: 4,   reservedCount: 2,   blockedCount: 0 },
    { zoneId: 'Z-EV',   name: 'EV Charging',      type: ZONE_TYPES.ELECTRIC,   totalSpaces: 15,  tariffGBP: DEFAULT_TARIFFS.ELECTRIC,   occupiedCount: 6,   reservedCount: 3,   blockedCount: 2 },
    { zoneId: 'Z-COACH',name: 'Coach Bay',         type: ZONE_TYPES.COACH,      totalSpaces: 12,  tariffGBP: DEFAULT_TARIFFS.COACH,      occupiedCount: 3,   reservedCount: 1,   blockedCount: 0 },
    { zoneId: 'Z-STAFF',name: 'Staff Parking',     type: ZONE_TYPES.STAFF,      totalSpaces: 50,  tariffGBP: DEFAULT_TARIFFS.STAFF,      occupiedCount: 25,  reservedCount: 10,  blockedCount: 0 },
  ],
  initialBookings: [],
};
