import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Flame, Droplets, Plus, ChevronRight, Zap } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const MEAL_SECTIONS = [
  { id: 'breakfast', label: 'Breakfast',  emoji: '🌅', budgetPct: 0.30 },
  { id: 'lunch',     label: 'Lunch',      emoji: '☀️', budgetPct: 0.35 },
  { id: 'dinner',    label: 'Dinner',     emoji: '🌙', budgetPct: 0.25 },
  { id: 'snacks',    label: 'Snacks',     emoji: '🍎', budgetPct: 0.10 },
];

function CalorieRing({ eaten, goal }) {
  const pct    = Math.min((eaten / goal) * 100, 100);
  const R      = 52;
  const circ   = 2 * Math.PI * R;
  const dash   = (pct / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 130, height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx="65" cy="65" r={R} fill="none" stroke="var(--border-hard)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={R} fill="none"
          stroke="url(#ringGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          style={{ transition: 'stroke-dasharray 1.4s var(--ease-out)' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          {Math.max(goal - eaten, 0)}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          cal left
        </div>
      </div>
    </div>
  );
}

function MacroBar({ label, value, target, color }) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{value}g / {target}g</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function HomePage({ onScan, onAddMeal }) {
  const { state, addWater } = useStore();
  const fileRef = useRef(null);

  const today = new Date().toISOString().split('T')[0];
  const todayMeals = state.history.filter(m => m.date === today);
  const totals = todayMeals.reduce(
    (acc, m) => ({ calories: acc.calories + m.calories, protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fat: acc.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const streak    = state.streak   ?? 3;
  const water     = state.water    ?? 4;
  const goal      = state.targetCalories ?? 2000;
  const tProtein  = state.targetProtein  ?? 150;
  const tCarbs    = state.targetCarbs    ?? 200;
  const tFat      = state.targetFat      ?? 65;

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Daily Summary Hero ── */}
      <motion.section variants={itemVariants} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <CalorieRing eaten={totals.calories} goal={goal} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 2 }}>Daily Goal</p>
            <h2 style={{ fontSize: '1.15rem' }}>{totals.calories} / {goal} kcal</h2>
          </div>
          <MacroBar label="Protein" value={totals.protein} target={tProtein} color="var(--green)"  />
          <MacroBar label="Carbs"   value={totals.carbs}   target={tCarbs}   color="var(--blue)"   />
          <MacroBar label="Fat"     value={totals.fat}     target={tFat}     color="var(--orange)" />
        </div>
      </motion.section>

      {/* ── Main CTA ── */}
      <motion.div variants={itemVariants}>
        <button className="btn-primary" onClick={onScan} style={{ height: 64, fontSize: '1.1rem', borderRadius: 20 }}>
          <Camera size={22} />
          Scan Meal
        </button>
      </motion.div>

      {/* ── Streak & Water ── */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Streak */}
        <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(239,68,68,0.12)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse-ring 2.5s infinite',
          }}>
            <Flame size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{streak}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Day Streak</div>
          </div>
        </div>

        {/* Water */}
        <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }} onClick={addWater}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{water}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/8</span></div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Glasses</div>
              </div>
            </div>
            <Plus size={18} color="var(--blue)" />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: 4, borderRadius: 99,
                background: i < water ? 'var(--blue)' : 'var(--border-hard)',
                transition: 'background 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── AI Suggestion ── */}
      <motion.div variants={itemVariants} className="glass-card" style={{
        background: 'rgba(16,185,129,0.07)',
        border: '1px solid rgba(16,185,129,0.25)',
        display: 'flex', alignItems: 'center', gap: 14, padding: 16,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
          <Zap size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p className="eyebrow" style={{ color: 'var(--green)', marginBottom: 2 }}>AI Suggestion</p>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>
            {totals.calories < goal * 0.5
              ? 'You still have room — try a protein-rich Indian dinner like dal + roti + curd. 🍲'
              : 'Great progress! A light vegetable salad for dinner keeps you on track. 🥗'}
          </p>
        </div>
        <ChevronRight size={18} color="var(--text-muted)" />
      </motion.div>

      {/* ── Today's Meals ── */}
      <motion.section variants={itemVariants}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: 16 }}>Today's Meals</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MEAL_SECTIONS.map(section => {
            const sectionMeals = todayMeals.filter(m => m.type === section.id);
            const sectionCals  = sectionMeals.reduce((s, m) => s + m.calories, 0);
            const budget       = Math.round(goal * section.budgetPct);
            return (
              <div key={section.id} className="glass-card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sectionMeals.length > 0 ? 10 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>{section.emoji}</span>
                    <div>
                      <h3 style={{ fontSize: '0.95rem' }}>{section.label}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {sectionCals > 0 ? `${sectionCals} / ${budget} kcal` : `~${budget} kcal budget`}
                      </p>
                    </div>
                  </div>
                  <button onClick={onAddMeal} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--grad)', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                  }}>
                    <Plus size={18} />
                  </button>
                </div>
                {sectionMeals.length > 0 && sectionMeals.map(meal => (
                  <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border-hard)' }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{meal.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{meal.time} · P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: '0.95rem' }}>{meal.calories}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}
