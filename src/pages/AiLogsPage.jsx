import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Activity, Clock, Target, Search, Calendar, Image as ImageIcon,
  Zap, PieChart, X
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// ── Safely extract parsedData from a log (handles old logs that only have rawText) ──
function resolveData(log) {
  if (log.parsedData && log.parsedData.name) return log.parsedData;
  if (log.rawText) {
    try {
      const cleaned = log.rawText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed && parsed.name) return parsed;
      }
    } catch (_) {}
  }
  return null;
}

function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;
  const isHigh   = confidence >= 85;
  const isMedium = confidence >= 60;
  const color = isHigh ? '#10b981' : isMedium ? '#f59e0b' : '#ef4444';
  const bg    = isHigh ? 'rgba(16,185,129,0.1)' : isMedium ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
  const emoji = isHigh ? '🟢' : isMedium ? '🟡' : '🔴';
  const label = isHigh ? 'High' : isMedium ? 'Medium' : 'Low';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', background: bg, color, borderRadius: 99, fontSize: '0.72rem', fontWeight: 700 }}>
      {emoji} {label} · {confidence}%
    </span>
  );
}

function GradeBadge({ grade }) {
  if (!grade) return null;
  const colors = { 'A+': '#10b981', A: '#10b981', 'A-': '#10b981', 'B+': '#84cc16', B: '#f59e0b', 'B-': '#f59e0b', 'C+': '#f97316', C: '#ef4444' };
  const color = colors[grade] ?? '#6b7280';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', background: `${color}18`, color, border: `1px solid ${color}40`, borderRadius: 99, fontSize: '0.72rem', fontWeight: 800 }}>
      Grade {grade}
    </span>
  );
}

export default function AiLogsPage() {
  const { state, clearAiLogs } = useStore();
  const logs = state.aiLogs || [];

  const [expandedId, setExpandedId]   = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter]   = useState('all');

  // ── Filtered logs ──────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (timeFilter !== 'all') {
        const logDate  = new Date(log.timestamp);
        const now      = new Date();
        const diffDays = (now - logDate) / (1000 * 60 * 60 * 24);
        if (timeFilter === 'today' && diffDays > 1)  return false;
        if (timeFilter === '7d'    && diffDays > 7)  return false;
        if (timeFilter === '30d'   && diffDays > 30) return false;
      }
      if (searchQuery) {
        const q    = searchQuery.toLowerCase();
        const data = resolveData(log);
        const name = (data?.name || '').toLowerCase();
        const ings = (data?.ingredients || []).join(' ').toLowerCase();
        if (!name.includes(q) && !ings.includes(q)) return false;
      }
      return true;
    });
  }, [logs, timeFilter, searchQuery]);

  // ── Dashboard metrics ──────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total       = filteredLogs.length;
    const successes   = filteredLogs.filter(l => l.status === 'success');
    const successRate = total > 0 ? Math.round((successes.length / total) * 100) : 0;
    const avgTime     = successes.length > 0
      ? Math.round(successes.reduce((a, l) => a + (l.durationMs || 0), 0) / successes.length)
      : 0;
    const avgConf = successes.length > 0
      ? Math.round(successes.reduce((a, l) => {
          const d = resolveData(l);
          return a + (d?.confidence || 0);
        }, 0) / successes.length)
      : 0;

    const foodMap = {};
    successes.forEach(l => {
      const d    = resolveData(l);
      const name = d?.name || 'Unknown';
      foodMap[name] = (foodMap[name] || 0) + 1;
    });
    const mostDetected = Object.entries(foodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return { total, successRate, avgTime, avgConf, mostDetected };
  }, [filteredLogs]);

  // ── Chart data ─────────────────────────────────────────────────────
  const chartData = useMemo(() =>
    [...filteredLogs].reverse().map((l, i) => {
      const d = resolveData(l);
      return { name: `#${i + 1}`, confidence: d?.confidence || 0, time: l.durationMs || 0 };
    }),
  [filteredLogs]);

  // ── Metric card helper ─────────────────────────────────────────────
  const MetricCard = ({ icon: Icon, label, value, color }) => (
    <div className="glass-card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 8 }}>
        <Icon size={13} /> {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color || 'var(--text)' }}>{value}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      style={{ paddingBottom: 110, display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Developer Tools</p>
          <h2 style={{ fontSize: '1.4rem' }}>AI Analytics</h2>
        </div>
        {logs.length > 0 && (
          <button
            onClick={clearAiLogs}
            className="icon-btn"
            style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
            title="Clear All Logs"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* ── Empty State ── */}
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: 'linear-gradient(135deg,rgba(16,185,129,.15),rgba(59,130,246,.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(16,185,129,.2)',
            fontSize: '2.8rem',
          }}>🤖</div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: 8 }}>No AI Logs Yet</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto' }}>
            Scan your first meal to view AI analysis history, confidence scores, and nutrition insights.
          </p>
        </div>
      ) : (
        <>
          {/* ── Metrics grid ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <MetricCard icon={Activity} label="Total Scans"     value={metrics.total} />
            <MetricCard icon={Target}   label="Success Rate"    value={`${metrics.successRate}%`} color="var(--green)" />
            <MetricCard icon={Clock}    label="Avg Response"    value={`${metrics.avgTime}ms`} />
            <MetricCard icon={PieChart} label="Avg Confidence"  value={`${metrics.avgConf}%`} />
          </div>

          {/* Most detected food */}
          <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(16,185,129,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Most Detected Food</div>
              <div style={{ fontWeight: 700 }}>{metrics.mostDetected}</div>
            </div>
          </div>

          {/* ── Active model pill ── */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Terminal size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active model:</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', background: 'rgba(139,92,246,.1)', color: '#8b5cf6', borderRadius: 99 }}>
              llama-4-scout-17b-16e (Groq)
            </span>
          </div>

          {/* ── Search & Filter ── */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search food or ingredient…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '10px 10px 10px 34px', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '0.85rem',
                  outline: 'none',
                }}
              />
            </div>
            <select
              value={timeFilter}
              onChange={e => setTimeFilter(e.target.value)}
              style={{
                padding: '0 14px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)', background: 'var(--bg)',
                color: 'var(--text)', fontFamily: 'var(--font)', fontSize: '0.85rem',
                outline: 'none', cursor: 'pointer',
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* ── Confidence Trend chart ── */}
          {filteredLogs.length > 1 && (
            <div className="glass-card" style={{ padding: '16px 16px 8px' }}>
              <h3 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>Confidence Trend</h3>
              <div style={{ height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hard)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={28} />
                    <RechartsTooltip
                      contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                      itemStyle={{ color: 'var(--text)' }}
                    />
                    <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Scan Cards ── */}
          {filteredLogs.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', padding: '24px 0' }}>
              No logs match your filter.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {filteredLogs.map(log => {
                const isSuccess = log.status === 'success';
                const pData     = resolveData(log);
                const isOpen    = expandedId === log.id;

                return (
                  <motion.div
                    key={log.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card"
                    style={{
                      padding: 0, overflow: 'hidden',
                      border: isSuccess
                        ? '1px solid rgba(16,185,129,0.25)'
                        : '1px solid rgba(239,68,68,0.25)',
                    }}
                  >
                    {/* ── Card header: image + info ── */}
                    <div style={{ display: 'flex', gap: 14, padding: '14px 16px', alignItems: 'flex-start' }}>
                      {/* Thumbnail */}
                      <div
                        onClick={() => log.thumbnail && setPreviewImage(log.thumbnail)}
                        style={{
                          width: 68, height: 68, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                          background: 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: log.thumbnail ? 'pointer' : 'default',
                          boxShadow: log.thumbnail ? '0 4px 12px rgba(0,0,0,0.12)' : 'none',
                          transition: 'transform 0.2s',
                        }}
                        onMouseEnter={e => { if (log.thumbnail) e.currentTarget.style.transform = 'scale(1.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                      >
                        {log.thumbnail ? (
                          <img src={log.thumbnail} alt="Scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <ImageIcon size={22} color="var(--text-muted)" />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {isSuccess && pData ? pData.name : (isSuccess ? 'Scan Result' : 'Scan Failed')}
                          </h3>
                          {isSuccess
                            ? <CheckCircle2 size={17} color="var(--green)" style={{ flexShrink: 0 }} />
                            : <XCircle      size={17} color="#ef4444"      style={{ flexShrink: 0 }} />
                          }
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          <Calendar size={11} />
                          {log.timestamp}
                          {log.durationMs ? (
                            <>
                              <span style={{ margin: '0 2px' }}>·</span>
                              <Clock size={11} />
                              {log.durationMs}ms
                            </>
                          ) : null}
                        </div>

                        {/* Confidence + Grade badges */}
                        {isSuccess && pData && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            <ConfidenceBadge confidence={pData.confidence} />
                            <GradeBadge grade={pData.grade} />
                          </div>
                        )}

                        {/* Error message */}
                        {!isSuccess && log.error && (
                          <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 6, lineHeight: 1.4 }}>{log.error}</p>
                        )}
                      </div>
                    </div>

                    {/* ── Macros row ── */}
                    {isSuccess && pData && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)' }}>
                        {[
                          { emoji: '🔥', value: pData.calories || 0, label: 'kcal' },
                          { emoji: '🥩', value: `${pData.protein || 0}g`, label: 'Protein' },
                          { emoji: '🍚', value: `${pData.carbs || 0}g`,   label: 'Carbs' },
                          { emoji: '🥑', value: `${pData.fat || 0}g`,     label: 'Fat' },
                        ].map(({ emoji, value, label }) => (
                          <div key={label} style={{ textAlign: 'center', padding: '12px 4px', borderRight: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{emoji} {value}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Ingredient chips ── */}
                    {isSuccess && pData?.ingredients?.length > 0 && (
                      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Detected Ingredients
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {pData.ingredients.map((ing, i) => (
                            <span
                              key={i}
                              style={{
                                padding: '4px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 500,
                                background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)',
                                color: 'var(--text)',
                              }}
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Technical details accordion ── */}
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <button
                        onClick={() => setExpandedId(isOpen ? null : log.id)}
                        style={{
                          width: '100%', padding: '11px 16px',
                          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6,
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font)',
                        }}
                      >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isOpen ? 'Hide Technical Details' : 'View Technical Details'}
                      </button>

                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            key="details"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {/* Meta row */}
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.75rem' }}>
                                {log.model && (
                                  <span style={{ padding: '3px 10px', background: 'rgba(139,92,246,.1)', color: '#8b5cf6', borderRadius: 99 }}>
                                    Model: {log.model}
                                  </span>
                                )}
                                {log.durationMs ? (
                                  <span style={{ padding: '3px 10px', background: 'rgba(59,130,246,.1)', color: '#3b82f6', borderRadius: 99 }}>
                                    {log.durationMs}ms
                                  </span>
                                ) : null}
                                <span style={{
                                  padding: '3px 10px', borderRadius: 99,
                                  background: isSuccess ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                                  color: isSuccess ? '#10b981' : '#ef4444',
                                }}>
                                  {log.status}
                                </span>
                              </div>

                              {/* Raw JSON */}
                              {log.rawText && (
                                <div>
                                  <p style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Full AI Response</p>
                                  <pre style={{
                                    background: 'var(--bg)', padding: 12, borderRadius: 8,
                                    fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word', border: '1px solid var(--border)',
                                    maxHeight: 240, overflowY: 'auto', lineHeight: 1.5,
                                  }}>
                                    {log.rawText}
                                  </pre>
                                </div>
                              )}

                              {/* Prompt */}
                              {log.prompt && (
                                <div>
                                  <p style={{ fontSize: '0.72rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prompt Used</p>
                                  <pre style={{
                                    background: 'var(--bg)', padding: 12, borderRadius: 8,
                                    fontSize: '0.68rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                                    border: '1px solid var(--border)', maxHeight: 140, overflowY: 'auto',
                                    color: 'var(--text-muted)', lineHeight: 1.5,
                                  }}>
                                    {log.prompt}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Image Preview Modal ── */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.88)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
          >
            <motion.img
              initial={{ scale: 0.88 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.88 }}
              src={previewImage}
              alt="Food scan preview"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            />
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute', top: 20, right: 20,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: 'none', color: 'white', borderRadius: '50%',
                width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '1.1rem',
              }}
            >
              <X size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
