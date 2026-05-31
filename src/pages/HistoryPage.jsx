import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Utensils, Clock, Plus, X, BookMarked, History } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { mealsDB } from '../data/meals';

const FILTERS = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Indian'];

const TYPE_COLORS = {
  breakfast: '#f59e0b',
  lunch:     '#10b981',
  dinner:    '#8b5cf6',
  snacks:    '#3b82f6',
  indian:    '#ef4444',
};

// ─── Add Meal Bottom Sheet ─────────────────────────────────────────
function AddMealSheet({ onClose, onSave }) {
  const [search, setSearch] = useState('');
  const [mealType, setMealType] = useState('lunch');

  const results = mealsDB.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.ingredients.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430,
        background: 'var(--bg-card)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border)',
        borderRadius: '28px 28px 0 0',
        zIndex: 200,
        padding: '0 0 32px',
        maxHeight: '80vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.15)',
      }}
    >
      {/* Handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px' }}>
        <div style={{ width: 40, height: 4, borderRadius: 99, background: 'var(--border-hard)' }} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 16px' }}>
        <h3 style={{ fontSize: '1.2rem' }}>Add Meal to Diary</h3>
        <button onClick={onClose} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Meal Type Selector */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 14px', overflowX: 'auto' }}>
        {['breakfast', 'lunch', 'dinner', 'snacks'].map(t => (
          <button key={t} onClick={() => setMealType(t)}
            style={{
              padding: '6px 14px', borderRadius: 99, whiteSpace: 'nowrap',
              background: mealType === t ? TYPE_COLORS[t] + '22' : 'var(--bg-glass)',
              border: `1.5px solid ${mealType === t ? TYPE_COLORS[t] : 'var(--border-hard)'}`,
              color: mealType === t ? TYPE_COLORS[t] : 'var(--text-muted)',
              fontFamily: 'var(--font)', fontWeight: 600, fontSize: '0.82rem',
              cursor: 'pointer', textTransform: 'capitalize',
              transition: 'all 0.2s ease',
            }}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', padding: '0 20px 14px' }}>
        <Search size={16} style={{ position: 'absolute', left: 36, top: '50%', transform: 'translateY(-70%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          placeholder="Search meals, ingredients…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          autoFocus
          style={{ paddingLeft: 40, borderRadius: 'var(--r-full)', fontSize: '0.9rem' }}
        />
      </div>

      {/* Results */}
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 32, color: 'var(--text-muted)' }}>
            <p>No meals found for "{search}"</p>
            <p style={{ fontSize: '0.82rem', marginTop: 6 }}>Try "roti", "dal", "chicken" etc.</p>
          </div>
        ) : (
          results.map(meal => (
            <div key={meal.name} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 14px',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: meal.type === 'indian' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem',
              }}>
                {meal.type === 'indian' ? '🍛' : '🥗'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>{meal.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {meal.calories} kcal · P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g
                </div>
              </div>
              <button
                onClick={() => onSave(meal, mealType)}
                style={{
                  padding: '8px 14px', borderRadius: 'var(--r-full)',
                  background: 'var(--grad)', color: 'white', border: 'none',
                  fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.8rem',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                }}
              >
                + Add
              </button>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '40px 24px 20px' }}>
      <div style={{
        width: 110, height: 110, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1))',
        border: '2px dashed rgba(16,185,129,0.3)',
        margin: '0 auto 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Utensils size={48} color="var(--green)" strokeWidth={1.2} />
      </div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 10 }}>🍽️ Save Your Favourite Meals</h3>
      <p className="muted" style={{ fontSize: '0.88rem', lineHeight: 1.6, maxWidth: 260, margin: '0 auto 28px' }}>
        Add meals to your diary from our database or scan a new meal with the camera.
      </p>
      <button className="btn-primary" onClick={onAdd} style={{ width: 'auto', padding: '14px 28px' }}>
        <Plus size={18} /> Add Your First Meal
      </button>
    </motion.div>
  );
}

// ─── Meal Card ─────────────────────────────────────────────────────
function MealCard({ meal, onFavourite, isFav, onReLog }) {
  const [added, setAdded] = useState(false);
  const color = TYPE_COLORS[meal.type] ?? 'var(--green)';

  const handleReLog = () => {
    onReLog();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="glass-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Avatar */}
        <div style={{
          width: 50, height: 50, borderRadius: 14, flexShrink: 0,
          background: `${color}18`,
          border: `1.5px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem',
        }}>
          {meal.type === 'indian' ? '🍛' : meal.name.slice(0, 2).toUpperCase()}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {meal.name}
          </div>
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
            {meal.time && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} />{meal.time}</span>}
            <span>P:{meal.protein}g  C:{meal.carbs}g  F:{meal.fat}g</span>
          </div>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px', borderRadius: 99,
            background: `${color}18`, color,
            fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize',
          }}>
            {meal.type ?? 'meal'}
          </span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {meal.calories}<span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500 }}> kcal</span>
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onFavourite}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isFav ? '#ef4444' : 'var(--text-muted)', transition: 'transform 0.2s, color 0.2s', transform: isFav ? 'scale(1.2)' : 'scale(1)' }}>
              <Heart size={17} fill={isFav ? '#ef4444' : 'none'} />
            </button>
            <button onClick={handleReLog}
              style={{
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                background: added ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: 'var(--green)',
                fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.72rem',
                transition: 'all 0.2s',
              }}>
              {added ? '✓ Added' : '+ Log'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────
export default function HistoryPage() {
  const { state, addMeal } = useStore();
  const [search, setSearch]       = useState('');
  const [activeFilter, setFilter] = useState('All');
  const [favIds, setFavIds]       = useState(new Set());
  const [showAddSheet, setAddSheet] = useState(false);
  const [addedToast, setAddedToast] = useState('');

  // ── Filter history ──
  const filtered = state.history.filter(meal => {
    const matchSearch = meal.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All'    ? true :
      activeFilter === 'Indian' ? meal.type === 'indian' :
                                  meal.type === activeFilter.toLowerCase();
    return matchSearch && matchFilter;
  });

  // ── Also search from the DB when user types something ──
  const dbSuggestions = search.length > 1
    ? mealsDB.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) &&
        !filtered.some(f => f.name === m.name)
      )
    : [];

  const toggleFav = (id) => {
    setFavIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddFromSheet = (meal, mealType) => {
    addMeal({ ...meal, type: mealType });
    setAddSheet(false);
    setAddedToast(meal.name);
    setTimeout(() => setAddedToast(''), 2500);
  };

  const handleReLog = (meal) => {
    addMeal({
      ...meal,
      id:   Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
    });
  };

  const favourites = state.history.filter(m => favIds.has(m.id));

  return (
    <>
      {/* ── Toast ── */}
      <AnimatePresence>
        {addedToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--grad)', color: 'white',
              padding: '10px 20px', borderRadius: 99, zIndex: 300,
              fontWeight: 600, fontSize: '0.88rem',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              whiteSpace: 'nowrap',
            }}>
            ✓ {addedToast} added to diary
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add Sheet Backdrop ── */}
      <AnimatePresence>
        {showAddSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAddSheet(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 190, backdropFilter: 'blur(4px)' }}
            />
            <AddMealSheet onClose={() => setAddSheet(false)} onSave={handleAddFromSheet} />
          </>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Search ── */}
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text" placeholder="Search your diary…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 46, borderRadius: 'var(--r-full)' }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* ── Filter Chips ── */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`chip ${activeFilter === f ? 'active' : ''}`}>
              {f}
            </button>
          ))}
        </div>

        {/* ── Stats Banner ── */}
        {state.history.length > 0 && (
          <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 16px' }}>
            {[
              { label: 'Total logged', value: state.history.length },
              { label: 'Today',        value: state.history.filter(m => m.date === new Date().toISOString().split('T')[0]).length },
              { label: 'Favourites',   value: favIds.size },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Favourites Section ── */}
        {favourites.length > 0 && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Heart size={16} color="#ef4444" fill="#ef4444" />
              <h3 style={{ fontSize: '1rem' }}>Favourites</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {favourites.map(meal => (
                <MealCard key={`fav-${meal.id}`} meal={meal} isFav={favIds.has(meal.id)} onFavourite={() => toggleFav(meal.id)} onReLog={() => handleReLog(meal)} />
              ))}
            </div>
          </section>
        )}

        {/* ── Diary Log Section ── */}
        <section>
          {state.history.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <History size={16} color="var(--text-muted)" />
              <h3 style={{ fontSize: '1rem' }}>Meal Log</h3>
            </div>
          )}

          {filtered.length === 0 && !search ? (
            <EmptyState onAdd={() => setAddSheet(true)} />
          ) : filtered.length === 0 && search ? (
            <div>
              {/* No history match – show DB suggestions */}
              {dbSuggestions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>Not in your diary yet. Quick add from database:</p>
                  {dbSuggestions.map(meal => (
                    <div key={meal.name} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: meal.type === 'indian' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                        {meal.type === 'indian' ? '🍛' : '🥗'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{meal.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{meal.calories} kcal · P:{meal.protein}g C:{meal.carbs}g F:{meal.fat}g</div>
                      </div>
                      <button onClick={() => { addMeal({ ...meal, type: meal.type ?? 'lunch' }); setAddedToast(meal.name); setSearch(''); setTimeout(() => setAddedToast(''), 2500); }}
                        style={{ padding: '8px 14px', borderRadius: 'var(--r-full)', background: 'var(--grad)', color: 'white', border: 'none', fontFamily: 'var(--font)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', flexShrink: 0 }}>
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', paddingTop: 40 }}>
                  <p className="muted">No meals found for "{search}"</p>
                  <button className="btn-secondary" style={{ marginTop: 16 }} onClick={() => setSearch('')}>Clear search</button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AnimatePresence>
                {filtered.map(meal => (
                  <MealCard key={meal.id} meal={meal} isFav={favIds.has(meal.id)} onFavourite={() => toggleFav(meal.id)} onReLog={() => handleReLog(meal)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
      </motion.div>

      {/* ── Floating Add Button ── */}
      <button
        onClick={() => setAddSheet(true)}
        aria-label="Add meal"
        style={{
          position: 'fixed', bottom: 100, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: 'var(--grad)', color: 'white', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(16,185,129,0.45)',
          cursor: 'pointer', zIndex: 100,
          transition: 'transform 0.2s var(--ease-spring)',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Plus size={26} />
      </button>
    </>
  );
}
