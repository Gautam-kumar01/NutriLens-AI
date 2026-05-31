import React from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, Droplets, Trophy, Target, TrendingUp, Star, Dumbbell, Salad } from 'lucide-react';
import { useStore } from '../context/StoreContext';

// Unique keys using full day names avoid the 'T' duplicate warning
const WEEK_DAYS = [
  { key: 'monday',    short: 'M',  label: 'Mon' },
  { key: 'tuesday',   short: 'T1', label: 'Tue' },
  { key: 'wednesday', short: 'W',  label: 'Wed' },
  { key: 'thursday',  short: 'T2', label: 'Thu' },
  { key: 'friday',    short: 'F',  label: 'Fri' },
  { key: 'saturday',  short: 'S1', label: 'Sat' },
  { key: 'sunday',    short: 'S2', label: 'Sun' },
];

const WEEKLY_DATA = [1540, 1820, 1690, 2010, 1750, 1880, 1260];

const ACHIEVEMENTS = [
  { id: 'first-scan',    emoji: '🥇', title: 'First Scan',      desc: 'Logged your first meal',       condition: s => s.history.length > 0 },
  { id: 'streak-7',      emoji: '🔥', title: '7 Day Streak',    desc: 'Logged 7 days in a row',        condition: s => s.streak >= 7        },
  { id: 'protein-master',emoji: '💪', title: 'Protein Master',  desc: 'Hit protein goal 3x',           condition: s => s.history.length > 3 },
  { id: 'healthy-eater', emoji: '🥗', title: 'Healthy Eater',   desc: 'Ate a healthy meal',            condition: s => true                 },
  { id: 'hydration-hero',emoji: '💧', title: 'Hydration Hero',  desc: 'Drank 8 glasses in a day',      condition: s => s.water >= 8         },
  { id: 'indian-food',   emoji: '🍛', title: 'Indian Food Pro', desc: 'Tracked an Indian meal',        condition: s => s.history.some(m => m.type === 'indian') },
];

export default function StatsPage() {
  const { state } = useStore();

  const goal = state.targetCalories ?? 2000;
  const maxH  = Math.max(...WEEKLY_DATA, goal);
  const avg   = Math.round(WEEKLY_DATA.reduce((a, b) => a + b, 0) / WEEKLY_DATA.length);
  const bestDay  = WEEK_DAYS[WEEKLY_DATA.indexOf(Math.min(...WEEKLY_DATA))].label;
  const completion = Math.round((WEEKLY_DATA.filter(d => d <= goal).length / 7) * 100);

  const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const itemV      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <motion.div variants={containerV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary Cards ── */}
      <motion.div variants={itemV} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { icon: <Target size={18} color="var(--green)" />, label: 'Daily Avg', value: avg, unit: 'kcal', bg: 'rgba(16,185,129,0.08)' },
          { icon: <TrendingUp size={18} color="#3b82f6"  />, label: 'Goal Hit',  value: `${completion}%`, unit: 'this week', bg: 'rgba(59,130,246,0.08)' },
          { icon: <Flame size={18} color="#ef4444"       />, label: 'Streak',    value: state.streak ?? 3, unit: 'days', bg: 'rgba(239,68,68,0.08)' },
          { icon: <Star size={18} color="#f59e0b"        />, label: 'Best Day',  value: bestDay, unit: 'fewest cals', bg: 'rgba(245,158,11,0.08)' },
        ].map(({ icon, label, value, unit, bg }) => (
          <div key={label} className="glass-card" style={{ background: bg, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              {icon}
              <span className="eyebrow" style={{ fontSize: '0.68rem' }}>{label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{unit}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Weekly Bar Chart ── */}
      <motion.section variants={itemV} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <p className="eyebrow">Weekly Overview</p>
            <h2 style={{ fontSize: '1.15rem', marginTop: 2 }}>Calorie Trend</h2>
          </div>
          <span style={{ padding: '6px 14px', background: 'rgba(16,185,129,0.12)', color: 'var(--green)', borderRadius: 99, fontSize: '0.8rem', fontWeight: 700 }}>
            Avg {avg}
          </span>
        </div>

        {/* Goal line label */}
        <div style={{ position: 'relative', height: 160 }}>
          {/* Goal dotted line */}
          <div style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${(goal / maxH) * 100}%`,
            borderTop: '1.5px dashed rgba(16,185,129,0.4)',
            zIndex: 1,
          }}>
            <span style={{ position: 'absolute', right: 0, top: -9, fontSize: '0.65rem', color: 'var(--green)', fontWeight: 600 }}>Goal</span>
          </div>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: 8 }}>
            {WEEK_DAYS.map((day, i) => {
              const hPct  = Math.max((WEEKLY_DATA[i] / maxH) * 100, 6);
              const isToday = i === 6;
              return (
                <div key={day.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{
                    width: '100%', height: `${hPct}%`,
                    background: isToday ? 'var(--grad)' : 'var(--bg-glass)',
                    border: `1px solid ${isToday ? 'transparent' : 'var(--border-hard)'}`,
                    borderRadius: 8,
                    boxShadow: isToday ? 'var(--shadow-green)' : 'none',
                    transition: 'height 1s var(--ease-out)',
                    cursor: 'default',
                  }} />
                  <span style={{ fontSize: '0.7rem', color: isToday ? 'var(--green)' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── Macro Averages ── */}
      <motion.section variants={itemV} className="glass-card">
        <p className="eyebrow" style={{ marginBottom: 4 }}>Weekly Macro Averages</p>
        <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Per Day</h2>
        {[
          { label: 'Protein', avg: 112, target: state.targetProtein ?? 150, color: '#10b981' },
          { label: 'Carbs',   avg: 185, target: state.targetCarbs   ?? 200, color: '#3b82f6' },
          { label: 'Fat',     avg: 58,  target: state.targetFat     ?? 65,  color: '#f59e0b' },
        ].map(({ label, avg, target, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ width: 56, fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>{label}</span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.min((avg / target) * 100, 100)}%`, background: color }} />
            </div>
            <span style={{ width: 60, fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{avg}g/{target}g</span>
          </div>
        ))}
      </motion.section>

      {/* ── Achievements ── */}
      <motion.section variants={itemV}>
        <h2 style={{ fontSize: '1.15rem', marginBottom: 14 }}>Achievements</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {ACHIEVEMENTS.map(ach => {
            const unlocked = ach.condition(state);
            return (
              <div key={ach.id} className="glass-card" style={{
                padding: 14,
                opacity: unlocked ? 1 : 0.45,
                border: unlocked ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)',
                background: unlocked ? 'rgba(16,185,129,0.06)' : 'var(--bg-card)',
              }}>
                <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>{ach.emoji}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{ach.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{ach.desc}</div>
                {unlocked && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(16,185,129,0.15)', borderRadius: 99 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--green)', fontWeight: 700 }}>Unlocked ✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>
    </motion.div>
  );
}
