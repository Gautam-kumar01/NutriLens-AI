import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Droplets, Plus, Target, Flame } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const GOAL_OPTIONS = [
  { id: 'lose',     icon: '📉', label: 'Lose Weight',     desc: 'Calorie deficit approach',  color: '#ef4444' },
  { id: 'maintain', icon: '⚖️', label: 'Maintain Weight', desc: 'Balance calories in/out',   color: '#f59e0b' },
  { id: 'gain',     icon: '📈', label: 'Gain Muscle',     desc: 'Clean calorie surplus',     color: '#10b981' },
];

const ACTIVITY_OPTIONS = [
  { id: 'light',    icon: '🚶', label: 'Light',    desc: 'Desk job, little exercise'    },
  { id: 'moderate', icon: '🏃', label: 'Moderate', desc: '3–5 workouts per week'        },
  { id: 'active',   icon: '💪', label: 'Active',   desc: 'Daily training or physical job'},
];

// Mifflin-St Jeor TDEE calc
function calcTargets(profile) {
  const { age, gender, height, weight, activity, goalMode } = profile;
  const mult = { light: 1.375, moderate: 1.55, active: 1.725 }[activity] ?? 1.55;
  let bmr = 10 * weight + 6.25 * height - 5 * age + (gender === 'male' ? 5 : -161);
  let cal = Math.round(bmr * mult);
  if (goalMode === 'lose') cal -= 500;
  if (goalMode === 'gain') cal += 500;
  return {
    targetCalories: cal,
    targetProtein:  Math.round((cal * 0.30) / 4),
    targetCarbs:    Math.round((cal * 0.40) / 4),
    targetFat:      Math.round((cal * 0.30) / 9),
  };
}

export default function GoalsPage() {
  const { state, updateProfile, addWater } = useStore();
  const [saved, setSaved] = useState(false);
  const [localProfile, setLocalProfile] = useState({ ...state.profile });

  const set = (key, val) => {
    setSaved(false);
    setLocalProfile(prev => ({ ...prev, [key]: val }));
  };

  const preview = calcTargets(localProfile);
  const changed = JSON.stringify(localProfile) !== JSON.stringify(state.profile);

  const handleSave = () => {
    updateProfile(localProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const containerV = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const itemV      = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

  return (
    <motion.div variants={containerV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Calorie Preview ── */}
      <motion.div variants={itemV} className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
        border: '1px solid rgba(16,185,129,0.2)',
        display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: 20,
      }}>
        {[
          { label: 'Daily Cal', value: preview.targetCalories, unit: 'kcal', color: 'var(--green)' },
          { label: 'Protein',   value: preview.targetProtein,  unit: 'g/day', color: '#10b981'      },
          { label: 'Carbs',     value: preview.targetCarbs,    unit: 'g/day', color: '#3b82f6'      },
          { label: 'Fat',       value: preview.targetFat,      unit: 'g/day', color: '#f59e0b'      },
        ].map(({ label, value, unit, color }) => (
          <div key={label}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{unit}</div>
          </div>
        ))}
      </motion.div>

      {/* ── Goal – SINGLE SELECT ── */}
      <motion.section variants={itemV}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Target size={18} color="var(--green)" />
          <h3 style={{ fontSize: '1rem' }}>Weight Goal</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GOAL_OPTIONS.map(opt => {
            const isSelected = localProfile.goalMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set('goalMode', opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '14px 16px', width: '100%',
                  background: isSelected ? `${opt.color}12` : 'var(--bg-card)',
                  border: `2px solid ${isSelected ? opt.color : 'var(--border-hard)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s ease',
                  backdropFilter: 'blur(12px)',
                  outline: 'none',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: isSelected ? opt.color : 'var(--text)', fontFamily: 'var(--font)' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>{opt.desc}</div>
                </div>
                {/* Strict radio indicator */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? opt.color : 'var(--border-hard)'}`,
                  background: isSelected ? opt.color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s ease',
                }}>
                  {isSelected && <CheckCircle2 size={14} color="white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* ── Activity Level ── */}
      <motion.section variants={itemV}>
        <h3 style={{ fontSize: '1rem', marginBottom: 14 }}>Activity Level</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ACTIVITY_OPTIONS.map(opt => {
            const isSelected = localProfile.activity === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => set('activity', opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', width: '100%',
                  background: isSelected ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)',
                  border: `2px solid ${isSelected ? 'var(--green)' : 'var(--border-hard)'}`,
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s ease',
                  backdropFilter: 'blur(12px)',
                  outline: 'none',
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{opt.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: isSelected ? 'var(--green)' : 'var(--text)', fontFamily: 'var(--font)' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>{opt.desc}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--green)' : 'var(--border-hard)'}`,
                  background: isSelected ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.18s ease',
                }}>
                  {isSelected && <CheckCircle2 size={13} color="white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      {/* ── Weight Slider ── */}
      <motion.section variants={itemV} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 style={{ fontSize: '1rem' }}>Target Weight</h3>
          <span style={{ color: 'var(--green)', fontWeight: 800 }}>{localProfile.weight} kg</span>
        </div>
        <input type="range" min="35" max="160" value={localProfile.weight} onChange={e => set('weight', +e.target.value)} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
          <span>35 kg</span><span>160 kg</span>
        </div>
      </motion.section>

      {/* ── Water Tracker ── */}
      <motion.section variants={itemV} className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplets size={20} color="#3b82f6" />
            <h3 style={{ fontSize: '1rem' }}>Water Intake</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{state.water ?? 0}<span style={{ color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.85rem' }}>/8</span></span>
            <button onClick={addWater} style={{
              padding: '6px 14px', borderRadius: 'var(--r-full)',
              background: '#3b82f6', color: 'white', border: 'none',
              fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
            }}>+ Add</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{
              flex: 1, height: 20, borderRadius: 8,
              background: i < (state.water ?? 0) ? 'linear-gradient(135deg, #3b82f6, #60a5fa)' : 'var(--border-hard)',
              transition: 'background 0.3s ease',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem',
            }}>
              {i < (state.water ?? 0) ? '💧' : ''}
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: '0.75rem', marginTop: 8 }}>Tap "Add" after each glass</p>
      </motion.section>

      {/* ── Streak ── */}
      <motion.section variants={itemV} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Flame size={26} color="#ef4444" />
        </div>
        <div>
          <h3 style={{ fontSize: '1rem' }}>{state.streak ?? 0} Day Logging Streak</h3>
          <p className="muted" style={{ fontSize: '0.8rem', marginTop: 3 }}>Keep logging meals to build healthy habits.</p>
        </div>
      </motion.section>

      {/* ── Save Button ── */}
      {changed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <button className="btn-primary" onClick={handleSave} style={{ marginBottom: 8, borderRadius: 20 }}>
            {saved ? <><CheckCircle2 size={20} /> Saved!</> : 'Save Changes'}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
