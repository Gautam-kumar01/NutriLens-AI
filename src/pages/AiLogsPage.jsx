import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle,
  Activity, Clock, Target, Search, Calendar, Image as ImageIcon,
  Zap, PieChart
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

export default function AiLogsPage() {
  const { state, clearAiLogs } = useStore();
  const logs = state.aiLogs || [];
  
  const [expandedDetails, setExpandedDetails] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');

  // 1. Filtering Logic
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (timeFilter !== 'all') {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - logDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (timeFilter === 'today' && diffDays > 1) return false;
        if (timeFilter === '7d' && diffDays > 7) return false;
        if (timeFilter === '30d' && diffDays > 30) return false;
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const foodName = log.parsedData?.name?.toLowerCase() || '';
        const ingredients = log.parsedData?.ingredients?.join(' ').toLowerCase() || '';
        if (!foodName.includes(query) && !ingredients.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }, [logs, timeFilter, searchQuery]);

  // 2. Metrics Calculation
  const metrics = useMemo(() => {
    const total = filteredLogs.length;
    const successLogs = filteredLogs.filter(l => l.status === 'success');
    const successRate = total > 0 ? Math.round((successLogs.length / total) * 100) : 0;
    
    const avgTime = successLogs.length > 0 
      ? Math.round(successLogs.reduce((acc, l) => acc + (l.durationMs || 0), 0) / successLogs.length) 
      : 0;
      
    const avgConfidence = successLogs.length > 0
      ? Math.round(successLogs.reduce((acc, l) => acc + (l.parsedData?.confidence || 0), 0) / successLogs.length)
      : 0;

    const foodCounts = {};
    successLogs.forEach(l => {
      const name = l.parsedData?.name || 'Unknown';
      foodCounts[name] = (foodCounts[name] || 0) + 1;
    });
    let mostDetected = 'None';
    let maxCount = 0;
    Object.entries(foodCounts).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostDetected = name;
      }
    });

    return { total, successRate, avgTime, avgConfidence, mostDetected };
  }, [filteredLogs]);

  // 3. Chart Data
  const chartData = useMemo(() => {
    const sorted = [...filteredLogs].reverse();
    return sorted.map((l, i) => ({
      name: `Scan ${i+1}`,
      time: l.durationMs || 0,
      confidence: l.parsedData?.confidence || 0
    }));
  }, [filteredLogs]);

  const toggleDetails = (id) => {
    setExpandedDetails(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getConfBadge = (conf) => {
    if (!conf) return { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', text: 'Unknown' };
    if (conf >= 85) return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '🟢 High' };
    if (conf >= 60) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: '🟡 Medium' };
    return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: '🔴 Low' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      style={{ paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Developer Tools</p>
          <h2 style={{ fontSize: '1.4rem' }}>AI Analytics</h2>
        </div>
        {logs.length > 0 && (
          <button onClick={clearAiLogs} className="icon-btn" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }} title="Clear Logs">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(16,185,129,0.2)' }}>
            <span style={{ fontSize: '2.5rem' }}>🤖</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', color: 'var(--text)', marginBottom: 8 }}>No AI Logs Yet</h3>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}>
            Scan your first meal to view AI analysis history, confidence scores, and nutrition insights.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.8rem', alignItems: 'center' }}>
                <Activity size={14} /> Total Scans
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{metrics.total}</div>
            </div>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.8rem', alignItems: 'center' }}>
                <Target size={14} /> Success Rate
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)' }}>{metrics.successRate}%</div>
            </div>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.8rem', alignItems: 'center' }}>
                <Clock size={14} /> Avg Time
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{metrics.avgTime}ms</div>
            </div>
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.8rem', alignItems: 'center' }}>
                <PieChart size={14} /> Avg Confidence
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{metrics.avgConfidence}%</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)', marginBottom: 8, fontSize: '0.8rem', alignItems: 'center' }}>
              <Zap size={14} /> Most Detected Food
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--blue)' }}>{metrics.mostDetected}</div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search food..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <select 
              value={timeFilter} 
              onChange={e => setTimeFilter(e.target.value)}
              style={{ padding: '0 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', outline: 'none' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {filteredLogs.length > 1 && (
            <div className="glass-card" style={{ padding: '16px 16px 24px', height: 220 }}>
              <h3 style={{ fontSize: '0.9rem', marginBottom: 16, color: 'var(--text-muted)' }}>Confidence Trend</h3>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-hard)" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} hide />
                  <RechartsTooltip 
                    contentStyle={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                  <Line type="monotone" dataKey="confidence" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredLogs.map(log => {
              const isSuccess = log.status === 'success';
              const pData = log.parsedData || {};
              const conf = getConfBadge(pData.confidence);
              
              return (
                <div key={log.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', border: isSuccess ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
                  
                  <div style={{ display: 'flex', padding: 16, gap: 16, borderBottom: '1px solid var(--border)' }}>
                    <div 
                      onClick={() => log.thumbnail && setPreviewImage(log.thumbnail)}
                      style={{ 
                        width: 70, height: 70, borderRadius: 12, flexShrink: 0,
                        background: 'var(--border-hard)', overflow: 'hidden',
                        cursor: log.thumbnail ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {log.thumbnail ? (
                        <img src={log.thumbnail} alt="Food scan" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={24} color="var(--text-muted)" />
                      )}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px', lineHeight: 1.2 }}>
                          {isSuccess ? (pData.name || 'Unknown Food') : 'Scan Failed'}
                        </h3>
                        {isSuccess ? <CheckCircle2 size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Calendar size={12} /> {log.timestamp}
                      </div>
                      
                      {isSuccess && (
                        <div style={{ marginTop: 8, display: 'inline-block', padding: '2px 8px', background: conf.bg, color: conf.color, borderRadius: 12, fontSize: '0.7rem', fontWeight: 600 }}>
                          {conf.text} {pData.confidence}% Confidence
                        </div>
                      )}
                    </div>
                  </div>

                  {isSuccess && (
                    <div style={{ display: 'flex', padding: '12px 16px', gap: 12, background: 'rgba(0,0,0,0.02)' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>🔥 {pData.calories || 0}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>kcal</div></div>
                      <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>🥩 {pData.protein || 0}g</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Protein</div></div>
                      <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>🍚 {pData.carbs || 0}g</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Carbs</div></div>
                      <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>🥑 {pData.fat || 0}g</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fat</div></div>
                    </div>
                  )}

                  {isSuccess && pData.ingredients && pData.ingredients.length > 0 && (
                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>Detected Ingredients</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {pData.ingredients.map((ing, idx) => (
                          <span key={idx} style={{ padding: '4px 10px', background: 'var(--bg)', border: '1px solid var(--border-hard)', borderRadius: 16, fontSize: '0.75rem' }}>
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button 
                      onClick={() => toggleDetails(log.id)}
                      style={{ width: '100%', padding: '12px 16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font)' }}
                    >
                      {expandedDetails[log.id] ? '▲ Hide Technical Details' : '▼ View Technical Details'}
                    </button>
                    
                    <AnimatePresence>
                      {expandedDetails[log.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', background: 'rgba(0,0,0,0.03)', padding: 8, borderRadius: 8 }}>
                              <div><strong>Model:</strong> {log.model || 'Unknown'}</div>
                              <div><strong>Time:</strong> {log.durationMs || 0}ms</div>
                            </div>
                            
                            {log.error && (
                              <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>
                                <strong>Error:</strong> {log.error}
                              </div>
                            )}
                            
                            <div>
                              <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>Raw Output:</p>
                              <pre style={{ 
                                background: 'var(--bg)', padding: 12, borderRadius: 8, 
                                fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', 
                                wordBreak: 'break-word', border: '1px solid var(--border)',
                                maxHeight: 250, overflowY: 'auto'
                              }}>
                                {log.rawText || JSON.stringify(log, null, 2)}
                              </pre>
                            </div>
                            
                            {log.prompt && (
                              <div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4 }}>System Prompt:</p>
                                <pre style={{ 
                                  background: 'var(--bg)', padding: 12, borderRadius: 8, 
                                  fontSize: '0.7rem', overflowX: 'auto', whiteSpace: 'pre-wrap', 
                                  wordBreak: 'break-word', border: '1px solid var(--border)',
                                  maxHeight: 150, overflowY: 'auto', color: 'var(--text-muted)'
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
                  
                </div>
              );
            })}
          </div>
        </>
      )}

      <AnimatePresence>
        {previewImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
            }}
          >
            <motion.img 
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={previewImage} 
              alt="Preview" 
              style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
            />
            <button 
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <XCircle size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
