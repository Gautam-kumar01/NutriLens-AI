import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Trash2, ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export default function AiLogsPage() {
  const { state, clearAiLogs } = useStore();
  const logs = state.aiLogs || [];
  const [expandedLog, setExpandedLog] = useState(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      style={{ paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 16 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Developer Tools</p>
          <h2 style={{ fontSize: '1.4rem' }}>AI Logs (Groq)</h2>
        </div>
        {logs.length > 0 && (
          <button onClick={clearAiLogs} className="icon-btn" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }} title="Clear Logs">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Terminal size={32} color="#8b5cf6" />
          </div>
          <p>No AI logs yet.</p>
          <p style={{ fontSize: '0.85rem' }}>Scan a meal to see API responses here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {logs.map((log) => {
            const isExpanded = expandedLog === log.id;
            const isSuccess = log.status === 'success';

            return (
              <div key={log.id} className="glass-card" style={{ padding: 12, border: isSuccess ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)' }}>
                <div 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isSuccess ? <CheckCircle2 size={18} color="var(--green)" /> : <XCircle size={18} color="var(--red)" />}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{isSuccess ? 'Scan Request' : 'Scan Failed'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.timestamp} • {log.model || 'Unknown Model'}</div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-hard)' }}>
                        {log.error && (
                          <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 8 }}>
                            <strong>Error:</strong> {log.error}
                          </div>
                        )}
                        {log.rawText && (
                          <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Raw Response:</p>
                            <pre style={{ 
                              background: 'var(--bg)', 
                              padding: 10, 
                              borderRadius: 8, 
                              fontSize: '0.75rem', 
                              overflowX: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              border: '1px solid var(--border)'
                            }}>
                              {log.rawText}
                            </pre>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
