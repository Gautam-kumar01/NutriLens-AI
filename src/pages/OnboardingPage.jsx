import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, CheckCircle2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const STEPS = [
  { id: 'welcome',  title: 'Meet Cal AI',     subtitle: 'Your AI-powered nutrition coach',    emoji: '🥗' },
  { id: 'basic',    title: 'About You',        subtitle: 'Help us personalise your experience'             },
  { id: 'body',     title: 'Your Body',        subtitle: 'We use this to calculate your TDEE'              },
  { id: 'activity', title: 'Activity Level',   subtitle: 'How active are you on a typical day?'            },
  { id: 'goal',     title: 'Your Goal',        subtitle: 'What are you working towards?'                   },
];

const ACTIVITY_OPTIONS = [
  { id: 'light',    label: 'Light',    desc: 'Desk job, little or no exercise',  icon: '🚶' },
  { id: 'moderate', label: 'Moderate', desc: '3–5 workouts per week',             icon: '🏃' },
  { id: 'active',   label: 'Active',   desc: 'Daily training or physical job',    icon: '💪' },
];

const GOAL_OPTIONS = [
  { id: 'lose',     icon: '📉', label: 'Lose Weight',     desc: 'Calorie deficit approach',  color: '#ef4444' },
  { id: 'maintain', icon: '⚖️', label: 'Maintain Weight', desc: 'Balance calories in/out',   color: '#f59e0b' },
  { id: 'gain',     icon: '📈', label: 'Gain Muscle',     desc: 'Clean calorie surplus',     color: '#10b981' },
];

// ─── Reusable Radio Option ─────────────────────────────────────────
function RadioOption({ selected, onClick, icon, label, desc, color, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '16px 18px', width: '100%',
        background: selected ? `${color ?? 'var(--green)'}12` : 'var(--bg-card)',
        border: `2px solid ${selected ? (color ?? 'var(--green)') : 'var(--border-hard)'}`,
        borderRadius: 'var(--r-md)',
        cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        outline: 'none',
      }}
    >
      <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem', color: selected ? (color ?? 'var(--green)') : 'var(--text)', fontFamily: 'var(--font)' }}>
          {label}
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 3, fontFamily: 'var(--font)' }}>{desc}</div>
      </div>
      {/* Radio indicator – visually clear single-select */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? (color ?? 'var(--green)') : 'var(--border-hard)'}`,
        background: selected ? (color ?? 'var(--green)') : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}>
        {selected && <CheckCircle2 size={15} color="white" strokeWidth={3} />}
      </div>
    </button>
  );
}

export default function OnboardingPage() {
  const { updateProfile } = useStore();
  const [step, setStep] = useState(0);
  const [dir, setDir]   = useState(1);
  const [form, setForm] = useState({
    gender:   'male',
    age:      25,
    height:   170,
    weight:   68,
    activity: 'moderate',
    goalMode: '',          // empty so nothing pre-selected on goal step
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const isGoalStep = step === STEPS.length - 1;

  const next = () => {
    if (isGoalStep) {
      // Guard: must pick a goal
      if (!form.goalMode) return;
      updateProfile(form);
    } else {
      setDir(1);
      setStep(s => s + 1);
    }
  };

  const back = () => { if (step > 0) { setDir(-1); setStep(s => s - 1); } };

  const slideVariants = {
    enter:  d => ({ x: d * 48, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   d => ({ x: d * -48, opacity: 0 }),
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px 20px', position: 'relative', zIndex: 1, overflow: 'hidden' }}>
      <div className="bg-gradient-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-gradient-blob bg-blob-2" aria-hidden="true" />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28, paddingTop: 20 }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
          Cal <span className="gradient-text">AI</span>
        </h1>
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            height: 5, borderRadius: 99,
            flex: i === step ? 2 : 1,
            background: i <= step ? 'var(--green)' : 'var(--border-hard)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* Slide */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1 }}
        >
          {/* Step header */}
          <div style={{ marginBottom: 28 }}>
            {STEPS[step].emoji && (
              <div style={{ fontSize: '3rem', marginBottom: 12, textAlign: 'center' }}>{STEPS[step].emoji}</div>
            )}
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
              {STEPS[step].title}
            </h2>
            <p className="muted">{STEPS[step].subtitle}</p>
          </div>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: 28 }}>
              <p style={{ lineHeight: 1.7, color: 'var(--text-muted)', marginBottom: 20 }}>
                Snap any meal for instant calories, macros, and AI coaching.
                Built for Indian 🍛 and global 🥑 cuisine.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Instant AI Scan', 'Indian Food', 'Macro Tracking', 'Streak Goals'].map(f => (
                  <span key={f} className="chip active">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Basic ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Gender – radio style */}
              <div style={{ display: 'flex', gap: 12 }}>
                {[
                  { id: 'male', icon: '👨', label: 'Male' },
                  { id: 'female', icon: '👩', label: 'Female' },
                ].map(g => (
                  <button key={g.id} type="button" onClick={() => set('gender', g.id)} style={{
                    flex: 1, padding: '16px 12px',
                    borderRadius: 'var(--r-sm)',
                    background: form.gender === g.id ? 'rgba(16,185,129,0.12)' : 'var(--bg-card)',
                    border: `2px solid ${form.gender === g.id ? 'var(--green)' : 'var(--border-hard)'}`,
                    fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.95rem',
                    color: form.gender === g.id ? 'var(--green)' : 'var(--text)',
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s ease',
                  }}>
                    <span style={{ fontSize: '1.8rem' }}>{g.icon}</span>
                    {g.label}
                    {form.gender === g.id && (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={13} color="white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              {/* Age */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Age</span>
                  <span style={{ color: 'var(--green)', fontWeight: 800 }}>{form.age} yrs</span>
                </div>
                <input type="range" min="15" max="75" value={form.age} onChange={e => set('age', +e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>15</span><span>75</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Body ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Height</span>
                  <span style={{ color: 'var(--green)', fontWeight: 800 }}>{form.height} cm</span>
                </div>
                <input type="range" min="140" max="220" value={form.height} onChange={e => set('height', +e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>140 cm</span><span>220 cm</span>
                </div>
              </div>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>Weight</span>
                  <span style={{ color: 'var(--green)', fontWeight: 800 }}>{form.weight} kg</span>
                </div>
                <input type="range" min="35" max="160" value={form.weight} onChange={e => set('weight', +e.target.value)} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>35 kg</span><span>160 kg</span>
                </div>
              </div>
              {/* BMI hint */}
              {(() => {
                const bmi = (form.weight / Math.pow(form.height / 100, 2)).toFixed(1);
                const label = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Overweight' : 'Obese';
                const col   = bmi < 18.5 ? '#3b82f6' : bmi < 25 ? '#10b981' : bmi < 30 ? '#f59e0b' : '#ef4444';
                return (
                  <div style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    BMI: <strong style={{ color: col }}>{bmi}</strong> — {label}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── Step 3: Activity – SINGLE SELECT ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ACTIVITY_OPTIONS.map(opt => (
                <RadioOption
                  key={opt.id}
                  selected={form.activity === opt.id}
                  onClick={() => set('activity', opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  desc={opt.desc}
                  color="var(--green)"
                />
              ))}
            </div>
          )}

          {/* ── Step 4: Goal – STRICT SINGLE SELECT ── */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {GOAL_OPTIONS.map(opt => (
                <RadioOption
                  key={opt.id}
                  selected={form.goalMode === opt.id}
                  onClick={() => set('goalMode', opt.id)}
                  icon={opt.icon}
                  label={opt.label}
                  desc={opt.desc}
                  color={opt.color}
                />
              ))}
              {!form.goalMode && (
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  👆 Tap one option to select your goal
                </p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingBottom: 28 }}>
        {step > 0 && (
          <button type="button" onClick={back} className="btn-secondary" style={{ width: 56, height: 56, padding: 0, borderRadius: '50%', flexShrink: 0 }}>
            ←
          </button>
        )}
        <button
          type="button"
          onClick={next}
          className="btn-primary"
          style={{ flex: 1, opacity: isGoalStep && !form.goalMode ? 0.5 : 1 }}
          disabled={isGoalStep && !form.goalMode}
        >
          {isGoalStep ? <><Zap size={20} /> Let's Go!</> : <>Continue <ChevronRight size={20} /></>}
        </button>
      </div>
    </div>
  );
}
