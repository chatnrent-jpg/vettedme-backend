import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket, type RawData } from 'ws';
import { prisma } from '../../lib/prisma';
import { getAuditorPersona } from './auditorMatrix';
import { logger } from '../../utils/logger';

interface ActiveSession {
  ws: WebSocket;
  candidateId: string;
  evaluationId: string;
  department: string;
  systemPrompt: string;
}

// Active memory mapping to manage concurrent connections on the Uromi workshop floor
const activeSessions = new Map<string, ActiveSession>();

/**
 * Initializes the Tier 2 Interactive Viva WebSocket server engine.
 * Attaches securely to the primary Express/HTTP server instance.
 */
export function initVivaSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  logger.info('📡 Real-time Tier 2 WebSocket Engine initialized. Monitoring Starlink pipes...');

  // Handle manual HTTP upgrade delegation from Express
  server.on('upgrade', (request, socket, head) => {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);

    if (url.pathname === '/api/rlhf/viva/stream') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }

    // Justice: reject unknown upgrade paths — do not leave the socket half-open
    socket.destroy();
  });

  wss.on('connection', async (ws: WebSocket, request: IncomingMessage) => {
    const host = request.headers.host || 'localhost';
    const url = new URL(request.url || '', `http://${host}`);
    const evaluationId = url.searchParams.get('evaluationId');

    if (!evaluationId) {
      ws.close(4001, 'Missing evaluationId parameter');
      return;
    }

    try {
      // 1. Fetch evaluation context and link it to the candidate's academic department
      const evaluation = await prisma.candidateEvaluation.findUnique({
        where: { id: evaluationId },
        include: { candidate: true, workstation: true },
      });

      if (!evaluation) {
        ws.close(4004, 'Evaluation session record not found');
        return;
      }

      const { candidate, workstation } = evaluation;

      // 2. Generate the dynamic, authoritative AI Auditor persona rules
      const persona = getAuditorPersona(
        candidate.department,
        candidate.fullName,
        evaluation.rollingMaeScore
      );

      // Register the active connection payload into server memory
      activeSessions.set(evaluationId, {
        ws,
        candidateId: candidate.id,
        evaluationId: evaluation.id,
        department: candidate.department,
        systemPrompt: persona.systemPromptTokens,
      });

      logger.info(
        `⚡ Station ${workstation.stationNumber} connected over pipe: ${workstation.starlinkStreamId}`
      );
      logger.info(
        `🤖 AI Auditor Persona mounted: [${persona.toneAnchor}] targeting ${candidate.fullName}`
      );

      // 3. Send initial challenge payload to kick off the audio/viva interaction
      ws.send(
        JSON.stringify({
          event: 'AUDITOR_CHALLENGE_INIT',
          toneAnchor: persona.toneAnchor,
          critiqueFocus: persona.critiqueFocus,
          failureCaseTitle: persona.failureCaseTitle,
          modelOutputAnomaly: persona.modelOutputAnomaly,
          expectedRaterAction: persona.expectedRaterAction,
          message: `System Calibration Complete. Initializing direct audit critique regarding your Tier 1 MAE score of ${evaluation.rollingMaeScore}. Failure case locked: ${persona.failureCaseTitle}.`,
        })
      );

      // 4. Listen for binary audio payloads or real-time defense transcripts from the workstation terminal
      ws.on('message', async (messageBuffer: RawData, isBinary: boolean) => {
        try {
          // ws delivers text frames as Buffer; try JSON first unless marked binary
          if (!isBinary) {
            const text =
              typeof messageBuffer === 'string'
                ? messageBuffer
                : Buffer.isBuffer(messageBuffer)
                  ? messageBuffer.toString('utf8')
                  : Buffer.from(messageBuffer as ArrayBuffer).toString('utf8');

            let data: { event?: string; text?: string };
            try {
              data = JSON.parse(text);
            } catch {
              logger.warn('Rejected non-JSON text frame on viva stream (Justice)');
              return;
            }

            // Process structured text payloads or defense annotations
            if (data.event === 'CANDIDATE_DEFENSE_SUBMIT') {
              logger.info(`🧠 Processing candidate logical defense: "${data.text}"`);

              // Compute mock real-time telemetry drift on defense logic consistency
              const logicalConsistencyDelta = Math.random() * 20 - 10; // Simple simulation drift mapping

              // Save telemetry historical footprint metrics to PostgreSQL
              await prisma.raterTelemetry.create({
                data: {
                  candidateId: candidate.id,
                  actionType: 'LOGIC_REVISION',
                  metricDelta: logicalConsistencyDelta,
                },
              });

              // Echo processing status back down the pipeline
              ws.send(
                JSON.stringify({
                  event: 'AUDITOR_PUSHBACK',
                  message:
                    'Analyzing defense logic... Your reasoning presents an alignment delta tracking drift. Defend the variance or adjust your model rubric parameter bounds immediately.',
                })
              );
            }
            return;
          }

          // Pure binary raw PCM audio from the client headset
          // Production: pipe chunk to speech-to-text model API
          const byteLen = Buffer.isBuffer(messageBuffer)
            ? messageBuffer.length
            : Buffer.from(messageBuffer as ArrayBuffer).length;
          logger.info(
            `🎙️ Streaming ${byteLen} bytes of raw audio data over Starlink from Candidate: ${candidate.fullName}`
          );
        } catch (err) {
          logger.error('Error handling WebSocket message frame:', err);
        }
      });

      ws.on('close', () => {
        logger.info(
          `🛑 Station ${workstation.stationNumber} disconnected. Tearing down stream channels.`
        );
        activeSessions.delete(evaluationId);
      });
    } catch (error) {
      logger.error('Failed to mount socket streaming pipe:', error);
      ws.close(5000, 'Internal runtime socket mapping failure');
    }
  });
}

/** Active duplex sessions on the workshop floor (read-only inspection helpers). */
export function getActiveVivaSessionCount(): number {
  return activeSessions.size;
}
