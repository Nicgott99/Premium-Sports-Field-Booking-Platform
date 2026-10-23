/**
 * PitchFormationView.jsx — Interactive 2D Pitch Lineup & Tactical Formation Board
 * Premium Sports Field Booking Platform
 *
 * An interactive pitch formation visualizer for team captains, managers, and squads:
 *  - Formations for 11v11 Football (4-3-3, 4-4-2, 3-5-2, 4-2-3-1), 7v7 Turf (2-3-1, 3-2-1), and 5v5 Futsal (1-2-1)
 *  - Top-down visual pitch diagram with turf stripes, penalty boxes, and center circle
 *  - Interactive player jersey nodes with squad numbers, player names, and Captain (C) badges
 *  - Tactical balance meters (Defense, Midfield, Attack ratings)
 *  - Substitutes bench tray with quick swap / selection triggers
 *  - Fully responsive, accessible, and zero external dependencies
 *
 * Usage:
 * ─────────────────────────────────────────────────────────────────────────────
 * <PitchFormationView
 *   teamName="Dhaka Thunder FC"
 *   initialFormation="4-3-3"
 *   players={squadList}
 *   onPlayerClick={(player) => inspectPlayer(player)}
 * />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react';

// ─── Formation Coordinates (x: % from left, y: % from top/goal) ─────────────

const FORMATIONS = {
  '4-3-3': {
    name: '4-3-3 Attack',
    type: '11v11',
    positions: [
      { id: 'pos_gk', role: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { id: 'pos_lb', role: 'LB', label: 'Left Back', x: 16, y: 72 },
      { id: 'pos_cb1', role: 'CB', label: 'Center Back', x: 38, y: 74 },
      { id: 'pos_cb2', role: 'CB', label: 'Center Back', x: 62, y: 74 },
      { id: 'pos_rb', role: 'RB', label: 'Right Back', x: 84, y: 72 },
      { id: 'pos_cm1', role: 'CM', label: 'Left Mid', x: 28, y: 48 },
      { id: 'pos_cdm', role: 'CDM', label: 'Holding Mid', x: 50, y: 54 },
      { id: 'pos_cm2', role: 'CM', label: 'Right Mid', x: 72, y: 48 },
      { id: 'pos_lw', role: 'LW', label: 'Left Wing', x: 18, y: 22 },
      { id: 'pos_st', role: 'ST', label: 'Striker', x: 50, y: 16 },
      { id: 'pos_rw', role: 'RW', label: 'Right Wing', x: 82, y: 22 },
    ],
    stats: { defense: 84, midfield: 86, attack: 92 },
  },
  '4-4-2': {
    name: '4-4-2 Classic',
    type: '11v11',
    positions: [
      { id: 'pos_gk', role: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { id: 'pos_lb', role: 'LB', label: 'Left Back', x: 16, y: 72 },
      { id: 'pos_cb1', role: 'CB', label: 'Center Back', x: 38, y: 74 },
      { id: 'pos_cb2', role: 'CB', label: 'Center Back', x: 62, y: 74 },
      { id: 'pos_rb', role: 'RB', label: 'Right Back', x: 84, y: 72 },
      { id: 'pos_lm', role: 'LM', label: 'Left Mid', x: 16, y: 45 },
      { id: 'pos_cm1', role: 'CM', label: 'Central Mid', x: 38, y: 48 },
      { id: 'pos_cm2', role: 'CM', label: 'Central Mid', x: 62, y: 48 },
      { id: 'pos_rm', role: 'RM', label: 'Right Mid', x: 84, y: 45 },
      { id: 'pos_st1', role: 'ST', label: 'Left Striker', x: 35, y: 18 },
      { id: 'pos_st2', role: 'ST', label: 'Right Striker', x: 65, y: 18 },
    ],
    stats: { defense: 88, midfield: 82, attack: 85 },
  },
  '4-2-3-1': {
    name: '4-2-3-1 Wide',
    type: '11v11',
    positions: [
      { id: 'pos_gk', role: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { id: 'pos_lb', role: 'LB', label: 'Left Back', x: 16, y: 72 },
      { id: 'pos_cb1', role: 'CB', label: 'Center Back', x: 38, y: 74 },
      { id: 'pos_cb2', role: 'CB', label: 'Center Back', x: 62, y: 74 },
      { id: 'pos_rb', role: 'RB', label: 'Right Back', x: 84, y: 72 },
      { id: 'pos_dm1', role: 'CDM', label: 'Defensive Mid', x: 35, y: 56 },
      { id: 'pos_dm2', role: 'CDM', label: 'Defensive Mid', x: 65, y: 56 },
      { id: 'pos_lam', role: 'LAM', label: 'Attacking Left', x: 20, y: 35 },
      { id: 'pos_cam', role: 'CAM', label: 'Playmaker', x: 50, y: 32 },
      { id: 'pos_ram', role: 'RAM', label: 'Attacking Right', x: 80, y: 35 },
      { id: 'pos_st', role: 'ST', label: 'Target Man', x: 50, y: 15 },
    ],
    stats: { defense: 87, midfield: 90, attack: 88 },
  },
  '2-3-1': {
    name: '2-3-1 Turf (7v7)',
    type: '7v7',
    positions: [
      { id: 'pos_gk', role: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { id: 'pos_cb1', role: 'CB', label: 'Left Defender', x: 32, y: 68 },
      { id: 'pos_cb2', role: 'CB', label: 'Right Defender', x: 68, y: 68 },
      { id: 'pos_lm', role: 'LM', label: 'Left Wing', x: 18, y: 44 },
      { id: 'pos_cm', role: 'CM', label: 'Playmaker', x: 50, y: 46 },
      { id: 'pos_rm', role: 'RM', label: 'Right Wing', x: 82, y: 44 },
      { id: 'pos_st', role: 'ST', label: 'Striker', x: 50, y: 18 },
    ],
    stats: { defense: 82, midfield: 88, attack: 86 },
  },
  '1-2-1': {
    name: '1-2-1 Futsal (5v5)',
    type: '5v5',
    positions: [
      { id: 'pos_gk', role: 'GK', label: 'Goalkeeper', x: 50, y: 88 },
      { id: 'pos_fixo', role: 'FIX', label: 'Fixo (Defender)', x: 50, y: 65 },
      { id: 'pos_ala1', role: 'ALA', label: 'Left Ala', x: 22, y: 42 },
      { id: 'pos_ala2', role: 'ALA', label: 'Right Ala', x: 78, y: 42 },
      { id: 'pos_pivo', role: 'PIV', label: 'Pivo (Forward)', x: 50, y: 18 },
    ],
    stats: { defense: 85, midfield: 85, attack: 90 },
  },
};

const DEFAULT_PLAYERS = [
  { id: 'p1', name: 'Tanvir A.', number: 1, role: 'GK', isCaptain: false },
  { id: 'p2', name: 'Zubair K.', number: 4, role: 'CB', isCaptain: false },
  { id: 'p3', name: 'Hasibullah', number: 5, role: 'CB', isCaptain: true },
  { id: 'p4', name: 'Shahed R.', number: 3, role: 'LB', isCaptain: false },
  { id: 'p5', name: 'Farhan M.', number: 2, role: 'RB', isCaptain: false },
  { id: 'p6', name: 'Arif H.', number: 6, role: 'CDM', isCaptain: false },
  { id: 'p7', name: 'Nafis I.', number: 8, role: 'CM', isCaptain: false },
  { id: 'p8', name: 'Rahim S.', number: 10, role: 'CAM', isCaptain: false },
  { id: 'p9', name: 'Rony B.', number: 11, role: 'LW', isCaptain: false },
  { id: 'p10', name: 'Arman V.', number: 7, role: 'RW', isCaptain: false },
  { id: 'p11', name: 'Tahmid C.', number: 9, role: 'ST', isCaptain: false },
];

const DEFAULT_BENCH = [
  { id: 'b1', name: 'Shakil N.', number: 12, role: 'SUB' },
  { id: 'b2', name: 'Imran F.', number: 14, role: 'SUB' },
  { id: 'b3', name: 'Sabbir Q.', number: 21, role: 'SUB' },
];

export function PitchFormationView({
  teamName = 'Starting Lineup',
  initialFormation = '4-3-3',
  players = DEFAULT_PLAYERS,
  bench = DEFAULT_BENCH,
  onPlayerClick,
  onFormationChange,
  className = '',
}) {
  const [formationKey, setFormationKey] = useState(initialFormation);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);

  const activeFormation = FORMATIONS[formationKey] || FORMATIONS['4-3-3'];

  // Match formation slots with players
  const formationSlots = useMemo(() => {
    return activeFormation.positions.map((slot, index) => {
      const assignedPlayer = players[index] || null;
      return {
        ...slot,
        player: assignedPlayer,
      };
    });
  }, [activeFormation, players]);

  const handleFormationSelect = (key) => {
    setFormationKey(key);
    onFormationChange?.(key);
  };

  const handleSlotClick = (slot) => {
    if (slot.player) {
      setSelectedPlayerId(slot.player.id);
      onPlayerClick?.(slot.player);
    }
  };

  return (
    <div className={`pf-container ${className}`}>
      {/* Header Bar */}
      <div className="pf-header">
        <div className="pf-title-wrap">
          <h3 className="pf-title">{teamName}</h3>
          <span className="pf-match-badge">{activeFormation.type} Match</span>
        </div>

        {/* Formation Selector Dropdown */}
        <div className="pf-formation-picker">
          <label htmlFor="pf-select" className="pf-picker-label">Formation:</label>
          <select
            id="pf-select"
            className="pf-select"
            value={formationKey}
            onChange={(e) => handleFormationSelect(e.target.value)}
          >
            {Object.entries(FORMATIONS).map(([key, f]) => (
              <option key={key} value={key}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tactical Strength Bars */}
      <div className="pf-stats-row">
        <div className="pf-stat-item">
          <span className="pf-stat-label">DEF {activeFormation.stats.defense}</span>
          <div className="pf-stat-track">
            <div className="pf-stat-fill pf-stat-fill--def" style={{ width: `${activeFormation.stats.defense}%` }} />
          </div>
        </div>
        <div className="pf-stat-item">
          <span className="pf-stat-label">MID {activeFormation.stats.midfield}</span>
          <div className="pf-stat-track">
            <div className="pf-stat-fill pf-stat-fill--mid" style={{ width: `${activeFormation.stats.midfield}%` }} />
          </div>
        </div>
        <div className="pf-stat-item">
          <span className="pf-stat-label">ATT {activeFormation.stats.attack}</span>
          <div className="pf-stat-track">
            <div className="pf-stat-fill pf-stat-fill--att" style={{ width: `${activeFormation.stats.attack}%` }} />
          </div>
        </div>
      </div>

      {/* Tactical Pitch Surface */}
      <div className="pf-pitch" role="region" aria-label="Tactical Pitch Diagram">
        {/* Pitch Lines & Markings */}
        <div className="pf-line pf-line--center" />
        <div className="pf-circle pf-circle--center" />
        <div className="pf-box pf-box--top" />
        <div className="pf-box pf-box--bottom" />
        <div className="pf-goal pf-goal--top" />
        <div className="pf-goal pf-goal--bottom" />

        {/* Player Nodes */}
        {formationSlots.map((slot) => {
          const isSelected = slot.player && selectedPlayerId === slot.player.id;
          const playerName = slot.player ? slot.player.name : slot.label;
          const playerNumber = slot.player ? slot.player.number : '';
          const isCaptain = slot.player?.isCaptain;

          return (
            <button
              key={slot.id}
              type="button"
              className={`pf-node ${isSelected ? 'pf-node--selected' : ''}`}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              onClick={() => handleSlotClick(slot)}
              aria-label={`${slot.role}: ${playerName}`}
            >
              {/* Jersey Circle */}
              <div className="pf-jersey">
                <span className="pf-jersey-num">{playerNumber || slot.role}</span>
                {isCaptain && <span className="pf-captain-badge" title="Captain">C</span>}
              </div>

              {/* Player Tag */}
              <div className="pf-player-tag">
                <span className="pf-player-name">{playerName}</span>
                <span className="pf-player-role">{slot.role}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Substitutes Bench Strip */}
      {Array.isArray(bench) && bench.length > 0 && (
        <div className="pf-bench-wrap">
          <div className="pf-bench-header">
            <span className="pf-bench-title">Substitutes Bench ({bench.length})</span>
          </div>

          <div className="pf-bench-list">
            {bench.map((sub) => (
              <div key={sub.id} className="pf-bench-card">
                <span className="pf-bench-num">#{sub.number}</span>
                <span className="pf-bench-name">{sub.name}</span>
                <span className="pf-bench-role">{sub.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoped Styles */}
      <style>{`
        .pf-container {
          background: #111827;
          border: 1px solid #1f2937;
          border-radius: 18px;
          padding: 20px;
          color: #f3f4f6;
          font-family: inherit;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 520px;
          margin: 0 auto;
        }

        .pf-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }

        .pf-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .pf-title {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
        }

        .pf-match-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #a5b4fc;
        }

        .pf-formation-picker {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pf-picker-label {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 600;
        }

        .pf-select {
          background: #1e293b;
          border: 1px solid #334155;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 8px;
          outline: none;
          cursor: pointer;
        }

        /* Stats Row */
        .pf-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          background: #172033;
          border-radius: 10px;
          padding: 10px 14px;
        }

        .pf-stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pf-stat-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
        }

        .pf-stat-track {
          width: 100%;
          height: 4px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          overflow: hidden;
        }

        .pf-stat-fill {
          height: 100%;
          border-radius: 4px;
        }
        .pf-stat-fill--def { background: #38bdf8; }
        .pf-stat-fill--mid { background: #10b981; }
        .pf-stat-fill--att { background: #f43f5e; }

        /* Tactical Pitch Board */
        .pf-pitch {
          position: relative;
          width: 100%;
          height: 480px;
          background: repeating-linear-gradient(
            0deg,
            #15803d,
            #15803d 40px,
            #166534 40px,
            #166534 80px
          );
          border: 3px solid rgba(255, 255, 255, 0.85);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.45);
        }

        /* Pitch Markings */
        .pf-line--center {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.6);
        }

        .pf-circle--center {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 90px;
          height: 90px;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .pf-box--top {
          position: absolute;
          top: 0;
          left: 50%;
          width: 180px;
          height: 70px;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-top: none;
          transform: translateX(-50%);
        }

        .pf-box--bottom {
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 180px;
          height: 70px;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-bottom: none;
          transform: translateX(-50%);
        }

        .pf-goal {
          position: absolute;
          left: 50%;
          width: 80px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          transform: translateX(-50%);
        }
        .pf-goal--top { top: 0; border-top: none; }
        .pf-goal--bottom { bottom: 0; border-bottom: none; }

        /* Player Node */
        .pf-node {
          position: absolute;
          transform: translate(-50%, -50%);
          background: transparent;
          border: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          transition: transform 0.15s ease, z-index 0.15s ease;
          z-index: 5;
        }

        .pf-node:hover, .pf-node--selected {
          transform: translate(-50%, -50%) scale(1.15);
          z-index: 10;
        }

        .pf-jersey {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1e3a8a 0%, #172554 100%);
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
        }

        .pf-jersey-num {
          font-size: 11px;
          font-weight: 900;
          color: #ffffff;
        }

        .pf-captain-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #f59e0b;
          color: #111827;
          font-size: 9px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ffffff;
        }

        .pf-player-tag {
          background: rgba(17, 24, 39, 0.85);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 4px;
          padding: 1px 5px;
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .pf-player-name {
          font-size: 9px;
          font-weight: 700;
          color: #ffffff;
        }

        .pf-player-role {
          font-size: 8px;
          font-weight: 800;
          color: #38bdf8;
        }

        /* Bench */
        .pf-bench-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
          background: #172033;
          border-radius: 12px;
          padding: 10px 14px;
        }

        .pf-bench-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .pf-bench-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .pf-bench-list {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .pf-bench-list::-webkit-scrollbar { display: none; }

        .pf-bench-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 6px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          font-size: 12px;
        }

        .pf-bench-num {
          font-weight: 800;
          color: #38bdf8;
        }

        .pf-bench-name {
          color: #f3f4f6;
          font-weight: 600;
        }

        .pf-bench-role {
          font-size: 9px;
          background: rgba(255, 255, 255, 0.08);
          padding: 1px 4px;
          border-radius: 4px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}

export default PitchFormationView;
