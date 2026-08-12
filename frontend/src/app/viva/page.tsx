'use client';

import React, { useState, useRef } from 'react';

export default function VivaInterviewPage() {
  const [sessionActive, setSessionActive] = useState(false);
  const [evaluationId, setEvaluationId] = useState('');
  const [streamPipe, setStreamPipe] = useState('ugboha-starlink-inactive');
  const [auditorMessages, setAuditorMessages] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [defenseText, setDefenseText] = useState('');
  const [bindError, setBindError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Initialize connection loop to the Express server using the evaluationId
  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluationId.trim()) {
      setBindError('Please input your unique Evaluation ID to bind terminal workspace');
      return;
    }

    setBindError(null);
    setAuditorMessages([]);
    setSessionActive(true);
    setStreamPipe('ugboha-starlink-connecting');

    // Connect to our server WebSocket pipe over localhost (maps to cloudflared tunnel in production)
    const wsBase =
      process.env.NEXT_PUBLIC_VIVA_WS_URL ||
      'ws://localhost:8080/api/rlhf/viva/stream';
    const wsUrl = `${wsBase}?evaluationId=${encodeURIComponent(evaluationId.trim())}`;
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      setStreamPipe('ugboha-starlink-live');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          setAuditorMessages((prev) => [
            ...prev,
            `${data.event || 'AUDITOR'}: ${data.message}`,
          ]);
        }
        if (data.toneAnchor) {
          setAuditorMessages((prev) => [
            ...prev,
            `SYSTEM: Persona mounted — ${data.toneAnchor}`,
          ]);
        }
      } catch {
        setAuditorMessages((prev) => [
          ...prev,
          'SYSTEM: Received non-JSON frame on Starlink pipe (ignored).',
        ]);
      }
    };

    ws.onerror = () => {
      setBindError('Starlink pipe failed to open. Confirm backend is on :8080.');
      setStreamPipe('ugboha-starlink-inactive');
    };

    ws.onclose = () => {
      setAuditorMessages((prev) => [
        ...prev,
        'SYSTEM: Starlink stream disconnected safely.',
      ]);
      setSessionActive(false);
      setStreamPipe('ugboha-starlink-inactive');
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  };

  // Toggle capturing pure hardware voice streams from client microphone headsets on the floor
  const toggleAudioRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/webm;codecs=opus';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (
          event.data.size > 0 &&
          socketRef.current?.readyState === WebSocket.OPEN
        ) {
          // Send binary raw audio stream data down the pipe directly to the Express server chunk listener
          socketRef.current.send(event.data);
        }
      };

      // Slice audio streams into tiny 500ms data buffers to ensure ultra-low latency over Starlink
      mediaRecorder.start(500);
      setIsRecording(true);
    } catch {
      alert('Could not access workstation microphone hardware configurations');
    }
  };

  // Allow textual fallback submission to directly verify the rationale defense schema
  const submitTextDefense = () => {
    if (!defenseText.trim()) return;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: 'CANDIDATE_DEFENSE_SUBMIT',
          text: defenseText.trim(),
        })
      );
      setAuditorMessages((prev) => [...prev, `YOU: ${defenseText.trim()}`]);
      setDefenseText('');
    }
  };

  return (
    <div
      style={{
        padding: '2rem',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid #334155',
          paddingBottom: '1rem',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ color: '#38bdf8' }}>🌅 VettedME Trust Infrastructure</h1>
        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          Ugboha Road Facility // Uromi Alignment Engine Node
        </p>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
          Pipe: {streamPipe}
        </p>
      </header>

      {!sessionActive ? (
        <form
          onSubmit={handleStartSession}
          style={{
            backgroundColor: '#1e293b',
            padding: '1.5rem',
            borderRadius: '8px',
            border: '1px solid #334155',
          }}
        >
          <h3 style={{ marginBottom: '1rem' }}>Bind Station Terminal Workspace</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              Evaluation Session ID
            </label>
            <input
              type="text"
              value={evaluationId}
              onChange={(e) => setEvaluationId(e.target.value)}
              placeholder="Paste evaluation ID from supervisor registration..."
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #475569',
                backgroundColor: '#0f172a',
                color: '#fff',
              }}
            />
          </div>
          {bindError ? (
            <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>
              {bindError}
            </p>
          ) : null}
          <button
            type="submit"
            style={{
              backgroundColor: '#38bdf8',
              color: '#0f172a',
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Initialize Stream Channel
          </button>
        </form>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              color: '#34d399',
              backgroundColor: '#111827',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
            }}
          >
            <span>● STARLINK CHANNEL FEED LIVE</span>
            <span>ID: {evaluationId.slice(0, 8)}...</span>
          </div>

          <div
            style={{
              height: '300px',
              overflowY: 'scroll',
              backgroundColor: '#020617',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '1rem',
              marginBottom: '1.5rem',
              fontSize: '0.9rem',
            }}
          >
            {auditorMessages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '0.75rem',
                  borderLeft: '2px solid #38bdf8',
                  paddingLeft: '0.5rem',
                  color: msg.startsWith('YOU:') ? '#34d399' : '#f1f5f9',
                }}
              >
                {msg}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button
              onClick={toggleAudioRecording}
              style={{
                flex: 1,
                padding: '1rem',
                fontWeight: 'bold',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isRecording ? '#ef4444' : '#10b981',
                color: '#fff',
              }}
            >
              {isRecording ? '🎙️ STOP TRANSMISSION' : '🎙️ STREAM VOICE DEFENSE'}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={defenseText}
              onChange={(e) => setDefenseText(e.target.value)}
              placeholder="Type your rationale defense arg matrix..."
              style={{
                flex: 4,
                padding: '0.75rem',
                borderRadius: '4px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#fff',
              }}
              onKeyDown={(e) => e.key === 'Enter' && submitTextDefense()}
            />
            <button
              onClick={submitTextDefense}
              style={{
                flex: 1,
                backgroundColor: '#475569',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Send Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
