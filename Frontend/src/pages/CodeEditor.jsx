import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/CodeEditor.css';

  const CodeEditor = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('Generating code...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      generateCode();
    }
  }, [sessionId]);

  const generateCode = async () => {
    try {
      setLoading(true);
      setCode(`<!DOCTYPE html>
<html>
<head><title>AI Product - ${sessionId}</title>
<style>body { font-family: system-ui; padding: 2rem; background: linear-gradient(135deg, #667eea, #764ba2); color: white; }
.container { max-width: 600px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; }
</style></head>
<body><div class="container"><h1>🚀 AI Generated MVP</h1><p>Session: ${sessionId}</p><p>Market intel integrated - ready for launch!</p></div></body></html>`);
    } catch (error) {
      console.error('Code gen error:', error);
      setCode('<h1>Error - check console</h1>');
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-product.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container code-editor-container" style={{ background: 'linear-gradient(135deg, var(--bg-primary, #0f0f23), #1a1a2e)', minHeight: '100vh' }}>
      <div className="dash-topbar code-header" style={{ padding: '20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/dashboard')} className="back-btn glass" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            &larr; Back to Boardroom
          </button>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 700, background: 'linear-gradient(135deg, #10b981, #34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Generated MVP - {sessionId}
          </h2>
        </div>
        <div className="code-controls">
          <button 
            onClick={downloadCode} 
            disabled={loading} 
            className="exec-btn"
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, background: 'linear-gradient(135deg, var(--primary, #6366f1), #8b5cf6)' }}
          >
            💾 Download HTML
          </button>
        </div>
      </div>
      <div className="code-split" style={{ flex: 1, display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
        <div className="code-pane" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>CODE EDITOR</span>
          </div>
          <textarea 
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="code-textarea"
            placeholder="AI generating code from chat..."
            style={{ background: 'rgba(15,15,35,0.95)', border: 'none' }}
          />
        </div>
        <div className="preview-pane" style={{ flex: 1, position: 'relative' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>LIVE PREVIEW</span>
          </div>
          <iframe 
            srcDoc={code}
            sandbox="allow-scripts allow-same-origin allow-popups"
            className="preview-iframe"
            title="Product Preview"
            style={{ background: 'white', borderRadius: '0 0 12px 12px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

