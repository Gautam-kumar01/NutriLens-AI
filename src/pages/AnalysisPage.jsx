import React, { useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Check, RefreshCw, Edit2, Clock, Zap, Scale,
  Camera, Image, Sparkles, ChevronDown, ChevronUp, Info, AlertTriangle
} from 'lucide-react';
import OpenAI from 'openai';
import { useStore } from '../context/StoreContext';
import { mealsDB } from '../data/meals';

const MEAL_TYPES = [
  { id: 'breakfast', label: '🌅 Breakfast' },
  { id: 'lunch',     label: '☀️ Lunch'     },
  { id: 'dinner',    label: '🌙 Dinner'    },
  { id: 'snacks',    label: '🍎 Snacks'    },
];

// ─── Confidence bar for ingredients ───────────────────────────────
function IngredientRow({ name, confidence }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--border-hard)' }}>
      <span style={{ flex: 1, fontSize: '0.88rem', fontWeight: 500, textTransform: 'capitalize' }}>{name}</span>
      <div style={{ width: 80, height: 6, background: 'var(--border-hard)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${confidence}%`, background: 'var(--grad)', borderRadius: 99, transition: 'width 1.2s var(--ease-out)' }} />
      </div>
      <span style={{ width: 36, textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: 'var(--green)' }}>{confidence}%</span>
    </div>
  );
}

// ─── Vitamin / mineral row ─────────────────────────────────────────
function NutrientRow({ label, pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
      <span style={{ width: 90, fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--border-hard)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: 'width 1.2s var(--ease-out)' }} />
      </div>
      <span style={{ width: 36, textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color }}>{pct}%</span>
    </div>
  );
}

const FOOD_SCAN_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const DEFAULT_VITAMINS = { vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminB12: 0, iron: 0, calcium: 0, potassium: 0 };
const NUMBER_FIELDS = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium', 'cholesterol', 'healthy', 'confidence'];
const ALLOWED_GRADES = new Set(['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C']);

const clampNumber = (value, fallback, min = 0, max = Number.POSITIVE_INFINITY) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
};

const isNotFoodResult = (data) => {
  const marker = String(data?.name || data?.error || '').trim().toLowerCase();
  return marker === 'not_food' || marker === 'not food' || marker === 'no_food';
};

const extractJsonObject = (rawText) => {
  const text = String(rawText || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) return null;
  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
};

const normalizeMealData = (data) => {
  const normalized = { ...data };

  NUMBER_FIELDS.forEach(field => {
    normalized[field] = clampNumber(
      normalized[field],
      field === 'confidence' ? 72 : 0,
      0,
      field === 'confidence' || field === 'healthy' ? 99 : Number.POSITIVE_INFINITY
    );
  });

  normalized.name = String(normalized.name || '').trim() || 'Detected Meal';
  normalized.grade = ALLOWED_GRADES.has(normalized.grade) ? normalized.grade : 'B';
  normalized.type = normalized.type === 'indian' ? 'indian' : 'global';
  normalized.ingredients = Array.isArray(normalized.ingredients)
    ? normalized.ingredients.map(item => String(item).trim()).filter(Boolean).slice(0, 8)
    : [];
  normalized.vitamins = { ...DEFAULT_VITAMINS, ...(normalized.vitamins || {}) };
  Object.keys(DEFAULT_VITAMINS).forEach(key => {
    normalized.vitamins[key] = clampNumber(normalized.vitamins[key], 0, 0, 100);
  });
  normalized.coach = String(normalized.coach || '').trim() || 'Eat mindfully and enjoy your meal.';

  return normalized;
};

const getFoodPrompt = (retry = false) => `You are an expert food recognition and nutrition AI. Analyze this image for visible food and return nutrition data.
Return ONLY a valid JSON object (no markdown, no code fences, no extra text) in exactly this format:
{
  "name": "Specific dish name (e.g. 'South Indian Thali', 'Butter Chicken with Rice', 'Margherita Pizza')",
  "calories": 520,
  "protein": 22,
  "carbs": 60,
  "fat": 18,
  "fiber": 6,
  "sugar": 8,
  "sodium": 480,
  "cholesterol": 35,
  "grade": "B+",
  "healthy": 72,
  "confidence": 88,
  "type": "indian",
  "ingredients": ["rice", "dal", "sabzi", "roti"],
  "vitamins": {"vitaminA": 12, "vitaminC": 18, "vitaminD": 4, "vitaminB12": 6, "iron": 20, "calcium": 15, "potassium": 22},
  "coach": "One practical tip to make this meal healthier."
}
Rules:
- If the image contains any edible item, plate, bowl, cooked dish, snack, drink, fruit, or restaurant meal, make your best nutrition estimate.
- Do not reject real meals because they are mixed, partly cropped, homemade, dimly lit, or hard to identify exactly.
- Be specific with food name. If exact dish is uncertain, name the closest likely dish instead of using "Unknown" or "Food".
- For Indian meals name them precisely: "Dal Tadka", "Rajma Chawal", "Idli Sambar", "Veg Thali", etc.
- Set "name" to "not_food" only when the image clearly has no edible item at all, such as a car, document, landscape, room, or person-only photo.
- Estimate nutrition for one standard visible serving size.
- "confidence" should reflect certainty (50-99).
- "grade" should be A/A+/B/B+/C/C+ based on nutritional quality.
${retry ? '- This is a second pass after a possible false rejection. Look carefully for real food before returning "not_food".' : ''}`;

// ─── Upload / Picker screen ────────────────────────────────────────
function PickerScreen({ onFile, onDemo, onBack }) {
  const fileRef   = useRef(null);
  const cameraRef = useRef(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* Back */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} className="icon-btn"><ArrowLeft size={20} /></button>
        <div>
          <p className="eyebrow">AI Scanner</p>
          <h2 style={{ fontSize: '1.2rem' }}>Log Your Meal</h2>
        </div>
      </div>

      {/* Hero illustration */}
      <div style={{
        height: 220,
        borderRadius: 'var(--r-lg)',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(59,130,246,0.12) 100%)',
        border: '2px dashed rgba(16,185,129,0.35)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
        onClick={() => fileRef.current?.click()}
      >
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--grad)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
          animation: 'pulse-ring 2.5s infinite',
        }}>
          <Camera size={32} color="white" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 700, fontSize: '1rem' }}>Tap to Upload Photo</p>
          <p className="muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>JPG, PNG, HEIC supported</p>
        </div>
        {/* Hidden file input (gallery) */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }}
        />
      </div>

      {/* Or divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border-hard)' }} />
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>or choose an option</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border-hard)' }} />
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Camera (capture) */}
        <button
          className="glass-card"
          onClick={() => cameraRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 20px', cursor: 'pointer', border: '1px solid var(--border)', width: '100%', textAlign: 'left',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={22} color="var(--green)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font)' }}>Take a Photo</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Open camera and snap your meal</div>
          </div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); }} />
        </button>

        {/* Gallery */}
        <button
          className="glass-card"
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 20px', cursor: 'pointer', border: '1px solid var(--border)', width: '100%', textAlign: 'left',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Image size={22} color="#3b82f6" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font)' }}>Choose from Gallery</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Pick an existing photo</div>
          </div>
        </button>

        {/* Demo */}
        <button
          className="glass-card"
          onClick={onDemo}
          style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '16px 20px', cursor: 'pointer', border: '1px dashed rgba(139,92,246,0.4)', width: '100%', textAlign: 'left',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={22} color="#8b5cf6" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontFamily: 'var(--font)' }}>Try AI Demo</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}>Scan a sample meal to see how it works</div>
          </div>
        </button>
      </div>

      {/* Info note */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', background: 'rgba(59,130,246,0.07)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <Info size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          AI analyses your image to estimate calories, macros, vitamins & minerals. Results are estimates based on visual recognition.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Scanning animation ────────────────────────────────────────────
function ScanningScreen({ imageUrl }) {
  const STEPS = ['Identifying ingredients…', 'Estimating portions…', 'Calculating macros…', 'Analysing vitamins…'];
  const [currentStep, setCurrentStep] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => setCurrentStep(s => Math.min(s + 1, STEPS.length - 1)), 420);
    return () => clearInterval(interval);
  }, [STEPS.length]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: 20 }}>

      {/* Image preview with scanning overlay */}
      <div style={{ position: 'relative', width: 200, height: 200, borderRadius: 'var(--r-md)', overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.2)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            🍽️
          </div>
        )}
        {/* Scanning line animation */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 0%, rgba(16,185,129,0.3) 50%, transparent 100%)', animation: 'scanLine 1.4s ease-in-out infinite', backgroundSize: '100% 40px' }} />
        {/* Corner brackets */}
        {[['0','0','right','bottom'],['0','auto','right','auto'],['auto','0','auto','bottom'],['auto','auto','auto','auto']].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: i < 2 ? 8 : 'auto', bottom: i >= 2 ? 8 : 'auto',
            left: i % 2 === 0 ? 8 : 'auto', right: i % 2 === 1 ? 8 : 'auto',
            width: 20, height: 20,
            borderTop: i < 2 ? '3px solid #10b981' : 'none',
            borderBottom: i >= 2 ? '3px solid #10b981' : 'none',
            borderLeft: i % 2 === 0 ? '3px solid #10b981' : 'none',
            borderRight: i % 2 === 1 ? '3px solid #10b981' : 'none',
          }} />
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>Analysing your meal…</h2>
        <p className="muted" style={{ fontSize: '0.88rem' }}>AI is detecting ingredients & nutrition</p>
      </div>

      {/* Step indicators */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: i <= currentStep ? 1 : 0.3, transition: 'opacity 0.4s' }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: i < currentStep ? 'var(--green)' : i === currentStep ? 'var(--grad)' : 'var(--border-hard)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.4s',
            }}>
              {i < currentStep && <Check size={13} color="white" strokeWidth={3} />}
              {i === currentStep && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse-ring 1s infinite' }} />}
            </div>
            <span style={{ fontSize: '0.85rem', color: i <= currentStep ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === currentStep ? 600 : 400 }}>{step}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(600%); }
        }
      `}</style>
    </motion.div>
  );
}

// ─── Result screen ─────────────────────────────────────────────────
function ResultScreen({ meal, imageUrl, scanTime, onBack, onRescan, onSave, saved }) {
  const [mealType, setMealType] = useState('lunch');
  const [showVitamins, setShowVitamins] = useState(false);
  const [showIngredients, setShowIngredients] = useState(true);

  const confidenceIngredients = useMemo(() => meal.ingredients.map((ing, i) => {
    const jitter = ing.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
    return {
      name: ing,
      confidence: Math.max(50, Math.min(meal.confidence - i * 2 + jitter, 99)),
    };
  }), [meal.confidence, meal.ingredients]);

  const vitamins = meal.vitamins ?? {};

  const vitaminRows = [
    { label: 'Vitamin A',  pct: vitamins.vitaminA  ?? 0, color: '#f59e0b' },
    { label: 'Vitamin C',  pct: vitamins.vitaminC  ?? 0, color: '#ef4444' },
    { label: 'Vitamin D',  pct: vitamins.vitaminD  ?? 0, color: '#f59e0b' },
    { label: 'Vitamin B12',pct: vitamins.vitaminB12 ?? 0, color: '#8b5cf6' },
    { label: 'Iron',       pct: vitamins.iron       ?? 0, color: '#dc2626' },
    { label: 'Calcium',    pct: vitamins.calcium    ?? 0, color: '#3b82f6' },
    { label: 'Potassium',  pct: vitamins.potassium  ?? 0, color: '#10b981' },
  ];

  const gradeColors = { 'A': '#10b981', 'A-': '#10b981', 'A+': '#10b981', 'B+': '#84cc16', 'B': '#f59e0b', 'B-': '#f59e0b', 'C+': '#f97316', 'C': '#ef4444' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 32 }}
    >
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} className="icon-btn"><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <p className="eyebrow">Scan complete</p>
          <h2 style={{ fontSize: '1.2rem' }}>Nutrition Result</h2>
        </div>
        <button onClick={onRescan} className="icon-btn" title="Rescan"><RefreshCw size={18} /></button>
      </div>

      {/* ── Meal image ── */}
      <div style={{ position: 'relative', height: 210, borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt="Scanned meal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{ fontSize: '4rem' }}>{meal.type === 'indian' ? '🍛' : '🥗'}</span>
            <span className="muted" style={{ fontSize: '0.82rem' }}>{meal.type === 'indian' ? 'Indian Cuisine' : 'International'}</span>
          </div>
        )}
        {/* Overlay gradient */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />

        {/* Confidence badge */}
        <div style={{ position: 'absolute', top: 12, left: 12 }}>
          <span style={{ padding: '5px 12px', background: 'rgba(16,185,129,0.9)', color: 'white', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
            ✦ {meal.confidence}% AI Sure
          </span>
        </div>

        {/* Time badge */}
        <div style={{ position: 'absolute', bottom: 10, right: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          <Clock size={12} color="rgba(255,255,255,0.7)" />
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>{scanTime}</span>
        </div>

        {/* Meal name overlay */}
        <div style={{ position: 'absolute', bottom: 10, left: 14 }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>{meal.name}</span>
        </div>
      </div>

      {/* ── Calorie headline ── */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 4 }}>AI Analysis</p>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{meal.name}</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="chip active" style={{ fontSize: '0.72rem' }}><Scale size={11} /> Standard portion</span>
            <span className="chip active" style={{ fontSize: '0.72rem', background: `${gradeColors[meal.grade] ?? 'var(--green)'}18`, color: gradeColors[meal.grade] ?? 'var(--green)', borderColor: `${gradeColors[meal.grade] ?? 'var(--green)'}30` }}>
              Grade {meal.grade}
            </span>
            <span className="chip active" style={{ fontSize: '0.72rem' }}>{meal.type === 'indian' ? '🇮🇳 Indian' : '🌍 Global'}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '2.6rem', fontWeight: 800, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {meal.calories}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>kcal</div>
        </div>
      </div>

      {/* ── Macro breakdown ── */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 2 }}>Macro Breakdown</h3>

        {[
          { label: 'Protein', value: meal.protein, max: 60,  color: '#10b981', kcal: meal.protein * 4  },
          { label: 'Carbs',   value: meal.carbs,   max: 100, color: '#3b82f6', kcal: meal.carbs * 4   },
          { label: 'Fat',     value: meal.fat,     max: 50,  color: '#f59e0b', kcal: meal.fat * 9     },
        ].map(({ label, value, max, color, kcal }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>{label}</span>
              <span style={{ color }}><strong>{value}g</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({kcal} kcal)</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="progress-track" style={{ flex: 1 }}>
                <div className="progress-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', width: 32, textAlign: 'right' }}>{Math.round((value / max) * 100)}%</span>
            </div>
          </div>
        ))}

        {/* 4-grid micro nutrients */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--border-hard)' }}>
          {[
            { label: 'Fiber',  value: `${meal.fiber}g`,    color: '#10b981' },
            { label: 'Sugar',  value: `${meal.sugar}g`,    color: '#f59e0b' },
            { label: 'Sodium', value: `${meal.sodium}mg`,  color: '#ef4444' },
            { label: 'Chol.', value: `${meal.cholesterol ?? 0}mg`, color: '#8b5cf6' },
          ].map(({ label, value, color }) => (
            <div key={label} className="macro-badge">
              <span className="macro-badge-value" style={{ color, fontSize: '0.95rem' }}>{value}</span>
              <span className="macro-badge-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vitamins & Minerals ── */}
      <div className="glass-card">
        <button
          onClick={() => setShowVitamins(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}
        >
          <h3 style={{ fontSize: '0.95rem' }}>Vitamins &amp; Minerals <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>% Daily Value</span></h3>
          {showVitamins ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </button>

        <AnimatePresence>
          {showVitamins && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ paddingTop: 12 }}>
                {vitaminRows.map(row => (
                  <NutrientRow key={row.label} label={row.label} pct={row.pct} color={row.color} />
                ))}
                <p className="muted" style={{ fontSize: '0.72rem', marginTop: 8, lineHeight: 1.4 }}>
                  * Percentage of Recommended Daily Value based on 2000 kcal diet.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Detected Ingredients ── */}
      <div className="glass-card">
        <button
          onClick={() => setShowIngredients(v => !v)}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}
        >
          <h3 style={{ fontSize: '0.95rem' }}>Detected Ingredients</h3>
          {showIngredients ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
        </button>

        <AnimatePresence>
          {showIngredients && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{ overflow: 'hidden' }}
            >
              <p className="muted" style={{ fontSize: '0.78rem', margin: '8px 0 4px' }}>AI confidence per ingredient</p>
              {confidenceIngredients.map(ing => (
                <IngredientRow key={ing.name} name={ing.name} confidence={ing.confidence} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Why this estimate ── */}
      <div className="glass-card" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
            <Zap size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', marginBottom: 6 }}>Why this estimate?</h3>
            <p style={{ fontSize: '0.84rem', lineHeight: 1.6, color: 'var(--text-muted)' }}>{meal.coach}</p>
          </div>
        </div>
      </div>

      {/* ── Meal type picker ── */}
      <div>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Log as</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MEAL_TYPES.map(t => (
            <button key={t.id} onClick={() => setMealType(t.id)} className={`chip ${mealType === t.id ? 'active' : ''}`} style={{ fontSize: '0.82rem' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onRescan}>
          <RefreshCw size={17} /> Rescan
        </button>
        <button className="btn-secondary" style={{ flex: 1 }}>
          <Edit2 size={17} /> Edit
        </button>
      </div>

      <button
        className="btn-primary"
        style={{ borderRadius: 20, height: 60, fontSize: '1.05rem' }}
        onClick={() => onSave(mealType)}
        disabled={saved}
      >
        {saved ? <><Check size={22} /> Meal Saved!</> : '💾 Save Meal'}
      </button>
    </motion.div>
  );
}

// ─── Error screen (Not Food) ───────────────────────────────────────
function ErrorScreen({ onRetry, onBack, kind = 'not_food', message = '' }) {
  const isNotFood = kind === 'not_food';
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ minHeight: '75vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 20, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
        <AlertTriangle size={40} />
      </div>
      <div>
        <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>{isNotFood ? 'No Food Detected' : 'Scan Failed'}</h2>
        <p className="muted" style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
          {isNotFood
            ? "Our AI couldn't detect any meals in this image. Please make sure the photo clearly shows food."
            : (message || "The AI scanner couldn't finish this photo. Please try again in a moment.")}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn-secondary" onClick={onBack} style={{ borderRadius: 20, padding: '0 24px' }}>Cancel</button>
        <button className="btn-primary" onClick={onRetry} style={{ borderRadius: 20, padding: '0 24px' }}>Try Another Photo</button>
      </div>
    </motion.div>
  );
}

// ─── Main exported page ────────────────────────────────────────────
export default function AnalysisPage({ onBack }) {
  const { addMeal, addAiLog } = useStore();
  const [phase, setPhase]     = useState('picker');   // picker | scanning | result | error
  const [imageUrl, setImageUrl] = useState('');
  const [meal, setMeal]       = useState(null);
  const [scanTime, setScanTime] = useState('');
  const [saved, setSaved]     = useState(false);
  const [errorInfo, setErrorInfo] = useState({ kind: 'not_food', message: '' });

  const startScan = useCallback(async (url = '', file = null) => {
    setImageUrl(url);
    setMeal(null);
    setSaved(false);
    setErrorInfo({ kind: 'not_food', message: '' });
    setPhase('scanning');

    if (!url || !file) {
      // Demo mode bypasses
      setTimeout(() => {
        const pick = mealsDB[Math.floor(Math.random() * mealsDB.length)];
        setMeal(pick);
        setScanTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setPhase('result');
      }, 1900);
      return;
    }

    // ── startTime lives OUTSIDE try so catch can always read it ──
    const startTime = performance.now();
    let thumbnailData = '';
    let prompt = '';

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;
      const mimeType = file.type || 'image/jpeg';

      // Create compressed thumbnail (max 400px, 70% quality) for logs
      thumbnailData = await new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height = Math.round(height * MAX_SIZE / width); width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width = Math.round(width * MAX_SIZE / height); height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = () => resolve('');
        img.src = `data:${mimeType};base64,${base64Data}`;
      });

      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('Missing VITE_OPENAI_API_KEY. Add your Groq API key to the environment and restart the app.');
      }

      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
        dangerouslyAllowBrowser: true,
      });

      // ── Positive-first prompt: model should ALWAYS try to identify food ──
      prompt = `You are an expert food recognition and nutrition AI. This image contains food — analyze it and return nutrition data.
Return ONLY a valid JSON object (no markdown, no code fences, no extra text) in exactly this format:
{
  "name": "Specific dish name (e.g. 'South Indian Thali', 'Butter Chicken with Rice', 'Margherita Pizza')",
  "calories": 520,
  "protein": 22,
  "carbs": 60,
  "fat": 18,
  "fiber": 6,
  "sugar": 8,
  "sodium": 480,
  "cholesterol": 35,
  "grade": "B+",
  "healthy": 72,
  "confidence": 88,
  "type": "indian",
  "ingredients": ["rice", "dal", "sabzi", "roti"],
  "vitamins": {"vitaminA": 12, "vitaminC": 18, "vitaminD": 4, "vitaminB12": 6, "iron": 20, "calcium": 15, "potassium": 22},
  "coach": "One practical tip to make this meal healthier."
}
Rules:
- Be SPECIFIC with food name — never say 'Unknown' or 'Food'
- For Indian meals name them precisely: 'Dal Tadka', 'Rajma Chawal', 'Idli Sambar', etc.
- If you cannot identify the exact dish, make your best guess from visual cues
- Only if the image is CLEARLY not food at all (e.g. a car, a landscape, a person), set "name" to "not_food"
- Estimate nutrition for a standard serving size
- "confidence" should reflect how certain you are (50-99)
- "grade" should be A/A+/B/B+/C/C+ based on nutritional quality`;
      prompt = getFoodPrompt(false);

      // ── API call with 45-second timeout ──
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 45000);

      let response;
      try {
        response = await openai.chat.completions.create({
          model: FOOD_SCAN_MODEL,
          max_tokens: 700,
          temperature: 0.2,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}`, detail: 'high' } },
            ],
          }],
        }, { signal: controller.signal });
      } finally {
        clearTimeout(timeoutId);
      }

      const durationMs = Math.round(performance.now() - startTime);
      let text = (response.choices[0].message.content || '').trim();
      console.log('Groq raw response:', text);

      let parsedData;
      try {
        parsedData = extractJsonObject(text);
      } catch (parseErr) {
        console.warn('JSON parse failed:', parseErr);
        addAiLog({ status: 'error', error: 'JSON parse error: ' + parseErr.message, rawText: text, prompt, durationMs, thumbnail: thumbnailData });
        setErrorInfo({ kind: 'scan_failed', message: 'The AI returned an unreadable result. Please try the scan again.' });
        setPhase('error');
        return;
      }

      if (!parsedData) {
        console.warn('No JSON found in response');
        addAiLog({ status: 'error', error: 'AI returned no JSON. Raw: ' + text.slice(0, 200), rawText: text, prompt, durationMs, thumbnail: thumbnailData });
        setErrorInfo({ kind: 'scan_failed', message: 'The AI returned an empty result. Please try the scan again.' });
        setPhase('error');
        return;
      }

      // A second pass prevents real meals from being rejected too quickly.
      if (isNotFoodResult(parsedData)) {
        const retryPrompt = getFoodPrompt(true);
        prompt = retryPrompt;
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 45000);

        try {
          const retryResponse = await openai.chat.completions.create({
            model: FOOD_SCAN_MODEL,
            max_tokens: 700,
            temperature: 0.1,
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: retryPrompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}`, detail: 'high' } },
              ],
            }],
          }, { signal: retryController.signal });

          const retryText = (retryResponse.choices[0].message.content || '').trim();
          console.log('Groq retry response:', retryText);
          text = `${text}\n\n--- retry ---\n${retryText}`;
          const retryData = extractJsonObject(retryText);
          if (retryData) parsedData = retryData;
        } finally {
          clearTimeout(retryTimeoutId);
        }
      }

      if (isNotFoodResult(parsedData)) {
        addAiLog({ status: 'error', error: 'Image does not appear to contain food', rawText: text, parsedData, prompt, durationMs, thumbnail: thumbnailData });
        setErrorInfo({ kind: 'not_food', message: '' });
        setPhase('error');
        return;
      }

      parsedData = normalizeMealData(parsedData);

      addAiLog({
        status: 'success',
        model: FOOD_SCAN_MODEL,
        rawText: text,
        parsedData,
        prompt,
        durationMs,
        thumbnail: thumbnailData
      });

      setMeal(parsedData);
      setScanTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setPhase('result');

    } catch (err) {
      // startTime is declared before try so it's always readable here
      const durationMs = Math.round(performance.now() - startTime);
      const isTimeout = err.name === 'AbortError';
      const errorMsg = isTimeout
        ? 'Request timed out after 45 seconds'
        : (err.message || String(err));
      console.error('Groq API error:', errorMsg);
      addAiLog({ status: 'error', error: errorMsg, durationMs, thumbnail: thumbnailData, prompt });
      setErrorInfo({
        kind: 'scan_failed',
        message: isTimeout
          ? 'The AI scanner took too long to respond. Please try again.'
          : 'The AI scanner could not process this photo. Please try again.',
      });
      setPhase('error');
    }
  }, [addAiLog]);

  const handleFile = (file) => {
    const url = URL.createObjectURL(file);
    startScan(url, file);
  };

  const handleDemo = () => startScan('', null);

  const handleRescan = () => {
    setSaved(false);
    setPhase('picker');
  };

  const handleSave = (mealType) => {
    addMeal({ ...meal, type: mealType });
    setSaved(true);
    setTimeout(onBack, 1000);
  };

  return (
    <AnimatePresence mode="wait">
      {phase === 'picker' && (
        <PickerScreen key="picker" onFile={handleFile} onDemo={handleDemo} onBack={onBack} />
      )}
      {phase === 'scanning' && (
        <ScanningScreen key="scanning" imageUrl={imageUrl} />
      )}
      {phase === 'error' && (
        <ErrorScreen key="error" onRetry={handleRescan} onBack={onBack} kind={errorInfo.kind} message={errorInfo.message} />
      )}
      {phase === 'result' && meal && (
        <ResultScreen
          key="result"
          meal={meal}
          imageUrl={imageUrl}
          scanTime={scanTime}
          onBack={onBack}
          onRescan={handleRescan}
          onSave={handleSave}
          saved={saved}
        />
      )}
    </AnimatePresence>
  );
}
