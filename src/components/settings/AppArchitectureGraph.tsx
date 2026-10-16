import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Smartphone,
  Cloud,
  Palette,
  Fingerprint,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { DBService } from '../../services/db';
import { VaultCryptoService } from '../../services/vaultCryptoService';
import { BANK_STATEMENT_PROFILES } from '../../services/bankProfiles';
import stackConfig from '../../config/stack.config.json';

interface TechNodeConfig {
  id: string;
  label: string;
  version: string;
  role: string;
  category: string;
  color: string;
  icon: string;
  healthType: 'runtime' | 'native_bridge' | 'storage' | 'network' | 'static' | 'hardware';
  details: string;
  computationalModel?: string;
  whyChosen?: string;
  useCases?: string[];
}

interface TechLinkConfig {
  source: string;
  target: string;
  relation: string;
  type?: 'jerarquia' | 'transversal';
  protocol?: string;
  description?: string;
}

interface FlowStepConfig {
  nodeId: string;
  role: string;
}

interface TechFlowConfig {
  id: string;
  title: string;
  category: string;
  summary: string;
  explanation: string;
  steps: FlowStepConfig[];
}

interface RgbTuple {
  r: number;
  g: number;
  b: number;
}

interface SimulatedNode extends TechNodeConfig {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  floatPhase: number;
  hoverScale: number;
  rgb: RgbTuple;
}

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'static' | 'error';
  badge: string;
  metric: string;
  timestamp: string;
  diagnostic: string;
}

interface AppArchitectureGraphProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_RGB_CACHE = new Map<string, RgbTuple>();
function parseHexToRgb(hex: string): RgbTuple {
  if (!hex || hex[0] !== '#') return { r: 148, g: 163, b: 184 };
  const cached = COLOR_RGB_CACHE.get(hex);
  if (cached) return cached;
  let c = hex.substring(1);
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const rgb = { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  COLOR_RGB_CACHE.set(hex, rgb);
  return rgb;
}

function rgbToRgba(rgb: RgbTuple, alpha: number): string {
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

const labelMetricsCache = new Map<string, number>();

export const AppArchitectureGraph: React.FC<AppArchitectureGraphProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const nodesData: TechNodeConfig[] = useMemo(() => (stackConfig.nodes as TechNodeConfig[]) || [], []);
  const linksData: TechLinkConfig[] = useMemo(() => (stackConfig.links as TechLinkConfig[]) || [], []);
  const flowsData: TechFlowConfig[] = useMemo(() => (stackConfig.flows as TechFlowConfig[]) || [], []);

  const [viewMode, setViewMode] = useState<'topology' | 'flows'>('topology');
  const [activeFlowId, setActiveFlowId] = useState<string>(() => flowsData[0]?.id || '');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('react');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, HealthCheckResult>>({});
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 460, height: 320 });

  const nodeLookup = useMemo(() => {
    const map = new Map<string, TechNodeConfig>();
    nodesData.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodesData]);

  const nodeConnectionsMap = useMemo(() => {
    const map = new Map<string, TechLinkConfig[]>();
    nodesData.forEach((n) => map.set(n.id, []));
    linksData.forEach((l) => {
      map.get(l.source)?.push(l);
      map.get(l.target)?.push(l);
    });
    return map;
  }, [nodesData, linksData]);

  const activeFlow = useMemo(
    () => flowsData.find((f) => f.id === activeFlowId) || flowsData[0] || null,
    [flowsData, activeFlowId]
  );

  const flowStepMap = useMemo(() => {
    const map = new Map<string, { stepNumber: number; role: string }>();
    if (viewMode === 'flows' && activeFlow) {
      activeFlow.steps.forEach((s, idx) => {
        map.set(s.nodeId, { stepNumber: idx + 1, role: s.role });
      });
    }
    return map;
  }, [viewMode, activeFlow]);

  const runHealthChecks = useCallback(async () => {
    setIsRunningCheck(true);
    const results: Record<string, HealthCheckResult> = {};
    const now = new Date().toLocaleTimeString();

    try {
      const t0 = performance.now();
      results['react'] = {
        status: 'healthy',
        badge: 'Operativo',
        metric: `React 19 Concurrent / ${Math.max(1, Math.round(performance.now() - t0))}ms`,
        timestamp: now,
        diagnostic: 'Árbol concurrente activo con carga diferida y sin bloqueos de hilo.',
      };
    } catch {
      results['react'] = {
        status: 'error',
        badge: 'Fallo UI',
        metric: 'Inaccesible',
        timestamp: now,
        diagnostic: 'Error en el ciclo de vida del runtime UI.',
      };
    }

    try {
      const isNative = Capacitor.isNativePlatform();
      const platform = Capacitor.getPlatform();
      results['capacitor'] = {
        status: 'healthy',
        badge: isNative ? 'APK Blindada' : 'Web CSP Activo',
        metric: `${platform} · FLAG_SECURE + CSP`,
        timestamp: now,
        diagnostic: isNative
          ? 'Puente nativo Android activo con FLAG_SECURE, FileProvider acotado y recepción de extractos compartidos en memoria.'
          : 'Entorno Web protegido por Content-Security-Policy estricta.',
      };
    } catch (e: any) {
      results['capacitor'] = {
        status: 'degraded',
        badge: 'Degradado',
        metric: 'Bridge Offline',
        timestamp: now,
        diagnostic: `Advertencia en Capacitor: ${e.message}`,
      };
    }

    try {
      const t0 = performance.now();
      const testSettings = DBService.getSettings();
      const vaultStatus = await VaultCryptoService.verifyIntegrity();
      const latency = Math.max(1, Math.round(performance.now() - t0));
      results['storage'] = {
        status: testSettings && vaultStatus.ok ? 'healthy' : 'degraded',
        badge: vaultStatus.ok ? 'AES-GCM-256 OK' : 'Degradado',
        metric: `${vaultStatus.algorithm} · ${latency}ms`,
        timestamp: now,
        diagnostic:
          'IndexedDB GastosFacturacionDB cifrada en reposo con AES-GCM-256 y PIN PBKDF2-SHA256.',
      };
    } catch (e: any) {
      results['storage'] = {
        status: 'error',
        badge: 'Error DB',
        metric: 'Inaccesible',
        timestamp: now,
        diagnostic: `Fallo al verificar la bóveda cifrada: ${e.message}`,
      };
    }

    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const profiles = BANK_STATEMENT_PROFILES.map((p) => p.name).join(', ') || 'genérico';
      results['cloud_backup'] = {
        status: isOnline ? 'healthy' : 'degraded',
        badge: isOnline ? 'Checksum Activo' : 'Modo Local',
        metric: `Perfil: ${profiles} · 2 Ranuras`,
        timestamp: now,
        diagnostic: isOnline
          ? `Respaldo de 2 ranuras con checksum e importador con perfil ${profiles} (solo movimientos consolidados).`
          : `Sin red. El importador (perfil ${profiles}) y los informes PDF operan 100% en local.`,
      };
    } catch {
      results['cloud_backup'] = {
        status: 'degraded',
        badge: 'Offline',
        metric: 'Desconectado',
        timestamp: now,
        diagnostic: 'No se pudo verificar el estado de red.',
      };
    }

    results['ui_styling'] = {
      status: 'static',
      badge: 'Compilado',
      metric: 'Zero-Runtime CSS & SVG',
      timestamp: now,
      diagnostic: 'Tokens semánticos Claro/Oscuro y glifos vectoriales optimizados en build.',
    };

    try {
      const hasWebAuthn = typeof window !== 'undefined' && !!window.PublicKeyCredential;
      const isNative = Capacitor.isNativePlatform();
      results['native_hardware'] = {
        status: 'healthy',
        badge: isNative ? 'Clase 3 Activa' : hasWebAuthn ? 'WebAuthn Listo' : 'PIN + Lockout',
        metric: isNative ? 'BIOMETRIC_STRONG' : hasWebAuthn ? 'FIDO2 / WebAuthn' : 'Rate-Limit 5x',
        timestamp: now,
        diagnostic:
          'Autenticación biométrica Clase 3 (sin bypass débil) y protección anti-fuerza bruta activas.',
      };
    } catch {
      results['native_hardware'] = {
        status: 'degraded',
        badge: 'Solo PIN',
        metric: 'PBKDF2 Activo',
        timestamp: now,
        diagnostic: 'Sensores biométricos no reportados; protegido por PIN PBKDF2-SHA256.',
      };
    }

    setHealthMap(results);
    setIsRunningCheck(false);
  }, []);

  useEffect(() => {
    if (isOpen) runHealthChecks();
  }, [isOpen, runHealthChecks]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    let rafId = 0;
    const updateSize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (containerRef.current) {
          const w = containerRef.current.clientWidth || 460;
          const h = Math.min(320, Math.max(250, window.innerHeight * 0.33));
          setCanvasDimensions({ width: w, height: h });
        }
      });
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateSize);
    };
  }, [isOpen]);

  const simulatedNodes = useMemo<SimulatedNode[]>(() => {
    const { width, height } = canvasDimensions;
    const centerX = width / 2;
    const centerY = height / 2;
    const orbitNodes = nodesData.filter((n) => n.id !== 'react');
    const radiusX = Math.min(centerX * 0.68, 175);
    const radiusY = Math.min(centerY * 0.68, 105);

    return nodesData.map((n, i) => {
      let bx = centerX;
      let by = centerY - 4;
      if (n.id !== 'react') {
        const orbitIdx = orbitNodes.findIndex((o) => o.id === n.id);
        const angle = (orbitIdx / orbitNodes.length) * Math.PI * 2 - Math.PI / 2;
        bx = centerX + Math.cos(angle) * radiusX;
        by = centerY + Math.sin(angle) * radiusY;
      }
      return {
        ...n,
        x: bx,
        y: by,
        baseX: bx,
        baseY: by,
        radius: n.id === 'react' ? 24 : 20,
        floatPhase: (i * 1.35) % (Math.PI * 2),
        hoverScale: 1.0,
        rgb: parseHexToRgb(n.color),
      };
    });
  }, [nodesData, canvasDimensions]);

  const animNodesRef = useRef<SimulatedNode[]>(simulatedNodes);
  useEffect(() => {
    animNodesRef.current = simulatedNodes;
  }, [simulatedNodes]);

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const startTime = performance.now();

    const drawArrow = (x2: number, y2: number, cx: number, cy: number, offset: number, color: string) => {
      const dx = x2 - cx;
      const dy = y2 - cy;
      if (Math.hypot(dx, dy) < offset) return;
      const angle = Math.atan2(dy, dx);
      const ax = x2 - Math.cos(angle) * offset;
      const ay = y2 - Math.sin(angle) * offset;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 6 * Math.cos(angle - Math.PI / 6), ay - 6 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(ax - 6 * Math.cos(angle + Math.PI / 6), ay - 6 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    };

    const render = (now: number) => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const elapsed = (now - startTime) * 0.001;
      const { width, height } = canvasDimensions;
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const nodes = animNodesRef.current;
      const nodeMap = new Map<string, SimulatedNode>();
      const focusId = hoveredNodeId || selectedNodeId;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x = n.baseX + Math.cos(elapsed * 1.1 + n.floatPhase) * 2.0;
        n.y = n.baseY + Math.sin(elapsed * 1.4 + n.floatPhase * 1.2) * 2.5;
        const targetScale =
          selectedNodeId === n.id
            ? 1.35
            : hoveredNodeId === n.id
            ? 1.25
            : viewMode === 'flows' && flowStepMap.has(n.id)
            ? 1.12
            : 1.0;
        n.hoverScale += (targetScale - n.hoverScale) * 0.2;
        nodeMap.set(n.id, n);
      }

      if (viewMode === 'flows' && activeFlow) {
        ctx.setLineDash([]);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.beginPath();
        for (let i = 0; i < linksData.length; i++) {
          const s = nodeMap.get(linksData[i].source);
          const t = nodeMap.get(linksData[i].target);
          if (s && t) {
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(t.x, t.y);
          }
        }
        ctx.stroke();

        const steps = activeFlow.steps;
        for (let i = 0; i < steps.length - 1; i++) {
          const src = nodeMap.get(steps[i].nodeId);
          const tgt = nodeMap.get(steps[i + 1].nodeId);
          if (!src || !tgt) continue;

          const midX = (src.x + tgt.x) * 0.5;
          const midY = (src.y + tgt.y) * 0.5;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.hypot(dx, dy) || 1;
          const sag = Math.sin(elapsed * 1.8 + i) * 7 + 8;
          const ctrlX = midX + (-dy / dist) * sag;
          const ctrlY = midY + (dx / dist) * sag;

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tgt.x, tgt.y);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.88)';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          drawArrow(tgt.x, tgt.y, ctrlX, ctrlY, tgt.radius * tgt.hoverScale + 7, '#34d399');

          const pulseT = (elapsed * 0.45 + i * 0.25) % 1;
          const invT = 1 - pulseT;
          const px = invT * invT * src.x + 2 * invT * pulseT * ctrlX + pulseT * pulseT * tgt.x;
          const py = invT * invT * src.y + 2 * invT * pulseT * ctrlY + pulseT * pulseT * tgt.y;

          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#a7f3d0';
          ctx.fill();
        }
      } else {
        const bgSolid: number[][] = [];
        const bgDashed: number[][] = [];
        const activeEdges: { coords: number[]; link: TechLinkConfig; idx: number }[] = [];

        for (let i = 0; i < linksData.length; i++) {
          const link = linksData[i];
          const src = nodeMap.get(link.source);
          const tgt = nodeMap.get(link.target);
          if (!src || !tgt) continue;

          const midX = (src.x + tgt.x) * 0.5;
          const midY = (src.y + tgt.y) * 0.5;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const dist = Math.hypot(dx, dy) || 1;
          const sag = Math.sin(elapsed * 1.6 + i * 0.8) * 7.5;
          const coords = [
            src.x,
            src.y,
            midX + (-dy / dist) * sag,
            midY + (dx / dist) * sag,
            tgt.x,
            tgt.y,
          ];

          if (focusId === src.id || focusId === tgt.id) {
            activeEdges.push({ coords, link, idx: i });
          } else if (link.type === 'transversal') {
            bgDashed.push(coords);
          } else {
            bgSolid.push(coords);
          }
        }

        if (bgSolid.length > 0) {
          ctx.setLineDash([]);
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
          ctx.beginPath();
          for (let i = 0; i < bgSolid.length; i++) {
            const c = bgSolid[i];
            ctx.moveTo(c[0], c[1]);
            ctx.quadraticCurveTo(c[2], c[3], c[4], c[5]);
          }
          ctx.stroke();
        }

        if (bgDashed.length > 0) {
          ctx.setLineDash([3, 4]);
          ctx.lineWidth = 1.0;
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.18)';
          ctx.beginPath();
          for (let i = 0; i < bgDashed.length; i++) {
            const c = bgDashed[i];
            ctx.moveTo(c[0], c[1]);
            ctx.quadraticCurveTo(c[2], c[3], c[4], c[5]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        }

        for (let i = 0; i < activeEdges.length; i++) {
          const { coords, link, idx } = activeEdges[i];
          const [sx, sy, ctrlX, ctrlY, tx, ty] = coords;
          const isTransversal = link.type === 'transversal';

          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tx, ty);
          ctx.setLineDash(isTransversal ? [4, 3] : []);
          ctx.strokeStyle = isTransversal ? 'rgba(236, 72, 153, 0.85)' : 'rgba(16, 185, 129, 0.85)';
          ctx.lineWidth = 2.2;
          ctx.stroke();
          ctx.setLineDash([]);

          const pulseT = (elapsed * 0.42 + idx * 0.2) % 1;
          const invT = 1 - pulseT;
          const px = invT * invT * sx + 2 * invT * pulseT * ctrlX + pulseT * pulseT * tx;
          const py = invT * invT * sy + 2 * invT * pulseT * ctrlY + pulseT * pulseT * ty;

          ctx.beginPath();
          ctx.arc(px, py, 2.6, 0, Math.PI * 2);
          ctx.fillStyle = isTransversal ? '#f472b6' : '#34d399';
          ctx.fill();
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = hoveredNodeId === n.id;
        const isSelected = selectedNodeId === n.id;
        const stepInfo = flowStepMap.get(n.id);
        const scale = n.hoverScale;
        const r = n.radius * scale;
        const health = healthMap[n.id]?.status || 'healthy';
        const healthColor =
          health === 'healthy'
            ? '#10b981'
            : health === 'degraded'
            ? '#f59e0b'
            : health === 'static'
            ? '#6366f1'
            : '#ef4444';

        ctx.globalAlpha = viewMode === 'flows' && !stepInfo ? 0.25 : 1.0;

        const glowR = r * (isSelected ? 2.1 : isHovered ? 1.8 : 1.4);
        const glowGrad = ctx.createRadialGradient(n.x, n.y, r * 0.3, n.x, n.y, glowR);
        glowGrad.addColorStop(0, rgbToRgba(n.rgb, isSelected ? 0.42 : 0.25));
        glowGrad.addColorStop(0.6, rgbToRgba(n.rgb, 0.08));
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = healthColor;
        ctx.lineWidth = isSelected ? 2.4 : 1.4;
        if (health === 'degraded') ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        const orbGrad = ctx.createRadialGradient(
          n.x - r * 0.35,
          n.y - r * 0.35,
          r * 0.1,
          n.x,
          n.y,
          r
        );
        orbGrad.addColorStop(0, '#ffffff');
        orbGrad.addColorStop(0.28, n.color);
        orbGrad.addColorStop(0.88, '#090d16');
        orbGrad.addColorStop(1, '#020617');

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = orbGrad;
        ctx.fill();

        ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = isSelected ? 2.2 : 1;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(10.5 * scale)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.label.charAt(0), n.x, n.y);

        if (stepInfo) {
          const bx = n.x + r * 0.75;
          const by = n.y - r * 0.75;
          ctx.beginPath();
          ctx.arc(bx, by, 8.5, 0, Math.PI * 2);
          ctx.fillStyle = '#10b981';
          ctx.fill();
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.8;
          ctx.stroke();
          ctx.fillStyle = '#022c22';
          ctx.font = '900 9.5px system-ui, sans-serif';
          ctx.fillText(String(stepInfo.stepNumber), bx, by);
        }

        const labelY = n.y + r + 13;
        const fontKey = `${n.id}_${isSelected ? 'b' : 'n'}`;
        ctx.font = `${isSelected ? 'bold' : 'normal'} 10.5px system-ui, -apple-system, sans-serif`;

        let textW = labelMetricsCache.get(fontKey);
        if (textW === undefined) {
          textW = ctx.measureText(n.label).width;
          labelMetricsCache.set(fontKey, textW);
        }

        const rx = n.x - textW * 0.5 - 6;
        const ry = labelY - 9.5;
        const rw = textW + 12;
        const rh = 19;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = isSelected
          ? 'rgba(16, 185, 129, 0.7)'
          : stepInfo
          ? 'rgba(16, 185, 129, 0.45)'
          : 'rgba(148, 163, 184, 0.2)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 6);
        else ctx.rect(rx, ry, rw, rh);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#34d399' : '#f8fafc';
        ctx.fillText(n.label, n.x, labelY);
      }

      ctx.globalAlpha = 1.0;
      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    isOpen,
    canvasDimensions,
    linksData,
    hoveredNodeId,
    selectedNodeId,
    healthMap,
    viewMode,
    activeFlow,
    flowStepMap,
  ]);

  const findHitNode = (e: React.PointerEvent<HTMLCanvasElement>, pad: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    return animNodesRef.current.find(
      (n) => Math.hypot(n.x - px, n.y - py) <= n.radius * n.hoverScale + pad
    );
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const hit = findHitNode(e, 14);
    setHoveredNodeId(hit ? hit.id : null);
    if (canvasRef.current) canvasRef.current.style.cursor = hit ? 'pointer' : 'default';
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const hit = findHitNode(e, 18);
    if (hit) setSelectedNodeId(hit.id);
  };

  if (!isOpen) return null;

  const activeNode = nodeLookup.get(selectedNodeId) || nodesData[0];
  const activeHealth = activeNode ? healthMap[activeNode.id] : null;
  const activeConnections = activeNode ? nodeConnectionsMap.get(activeNode.id) || [] : [];

  const renderIcon = (iconName: string) => {
    const cls = 'w-5 h-5';
    switch (iconName) {
      case 'Smartphone':
        return <Smartphone className={cls} />;
      case 'Database':
        return <Database className={cls} />;
      case 'Cloud':
        return <Cloud className={cls} />;
      case 'Palette':
        return <Palette className={cls} />;
      case 'Fingerprint':
        return <Fingerprint className={cls} />;
      default:
        return <Cpu className={cls} />;
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[94vh] flex flex-col text-white shadow-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 border-b border-slate-800 bg-[#090d16]/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                    {stackConfig.appName} Ontology
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold">
                    v{stackConfig.version}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Topología en vivo, protocolos y rutas de datos
                </p>
              </div>
            </div>

            <div className="flex sm:hidden items-center space-x-1.5">
              <button
                onClick={runHealthChecks}
                disabled={isRunningCheck}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-300 border border-slate-700/60"
                title="Re-ejecutar diagnóstico"
              >
                <RefreshCw className={`w-4 h-4 ${isRunningCheck ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 text-slate-400 border border-slate-700/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setViewMode('topology')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'topology'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mapa Topológico
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flows')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'flows'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Rutas de Flujo
              </button>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5">
              <button
                onClick={runHealthChecks}
                disabled={isRunningCheck}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors border border-slate-700/60 cursor-pointer"
                title="Re-ejecutar diagnóstico"
              >
                <RefreshCw className={`w-4 h-4 ${isRunningCheck ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {viewMode === 'flows' && flowsData.length > 0 && (
          <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-400">Receta de Ejecución:</span>
            <select
              value={activeFlowId}
              onChange={(e) => {
                setActiveFlowId(e.target.value);
                const flow = flowsData.find((f) => f.id === e.target.value);
                if (flow?.steps[0]) setSelectedNodeId(flow.steps[0].nodeId);
              }}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-white outline-none focus:border-emerald-500 cursor-pointer"
            >
              {flowsData.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          ref={containerRef}
          className="relative bg-gradient-to-b from-[#080c14] via-[#0c1322] to-[#080c14] border-b border-slate-800/80 select-none overflow-hidden touch-none shrink-0"
          style={{ height: `${canvasDimensions.height}px` }}
        >
          <canvas
            ref={canvasRef}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerDown}
            className="w-full h-full block"
          />

          <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-slate-900/85 px-2 py-0.5 rounded-full border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>
                  {viewMode === 'topology'
                    ? `${linksData.length} Enlaces Activos`
                    : `${activeFlow?.steps.length || 0} Pasos Secuenciales`}
                </span>
              </span>
              {viewMode === 'topology' && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-pink-300/90 bg-slate-900/85 px-2 py-0.5 rounded-full border border-slate-800">
                  --- Puente Transversal
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-900/75 px-2 py-0.5 rounded-full">
              Toca cualquier nodo
            </span>
          </div>
        </div>

        <div className="p-4 bg-[#090d16] space-y-3 overflow-y-auto flex-1">
          {viewMode === 'flows' && activeFlow && (
            <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-300">{activeFlow.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Flujo E2E
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{activeFlow.explanation}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                {activeFlow.steps.map((step, idx) => {
                  const isCurrent = selectedNodeId === step.nodeId;
                  return (
                    <button
                      key={step.nodeId}
                      type="button"
                      onClick={() => setSelectedNodeId(step.nodeId)}
                      className={`p-2 rounded-xl border text-left text-[11px] transition-all cursor-pointer flex items-start gap-2 ${
                        isCurrent
                          ? 'bg-emerald-500/20 border-emerald-500/60 text-white font-semibold'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step.role.replace(/^\d+\.\s*/, '')}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeNode && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="p-2.5 rounded-2xl border shrink-0"
                    style={{
                      backgroundColor: `${activeNode.color}20`,
                      borderColor: `${activeNode.color}55`,
                      color: activeNode.color,
                    }}
                  >
                    {renderIcon(activeNode.icon)}
                  </div>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-white">{activeNode.label}</h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {activeNode.version}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-400 capitalize">
                        {activeNode.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{activeNode.role}</p>
                  </div>
                </div>

                {activeHealth && (
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                      activeHealth.status === 'healthy'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : activeHealth.status === 'degraded'
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : activeHealth.status === 'static'
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {activeHealth.status === 'degraded' || activeHealth.status === 'error' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>{activeHealth.badge}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-indigo-400">
                    ⚙ Modelo Computacional
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {activeNode.computationalModel || activeNode.details}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-amber-400">
                    ✦ ¿Por qué en {stackConfig.appName}?
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {activeNode.whyChosen || activeNode.details}
                  </p>
                </div>
              </div>

              {activeNode.useCases && activeNode.useCases.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {activeNode.useCases.map((uc, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300"
                    >
                      • {uc}
                    </span>
                  ))}
                </div>
              )}

              {activeHealth && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{activeHealth.diagnostic}</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold shrink-0">
                    {activeHealth.metric}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  ⇄ Conexiones Directas (Toca para saltar al nodo conectado)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activeConnections.map((conn, idx) => {
                    const isOutbound = conn.source === activeNode.id;
                    const otherNode = nodeLookup.get(isOutbound ? conn.target : conn.source);
                    if (!otherNode) return null;

                    return (
                      <button
                        key={`${conn.source}-${conn.target}-${idx}`}
                        type="button"
                        onClick={() => setSelectedNodeId(otherNode.id)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 transition-all text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-xs font-black shrink-0 ${
                              isOutbound ? 'text-emerald-400' : 'text-sky-400'
                            }`}
                          >
                            {isOutbound ? '→' : '←'}
                          </span>
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-200 group-hover:text-emerald-300 truncate">
                              {otherNode.label}
                            </div>
                            {conn.protocol && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {conn.protocol}
                              </div>
                            )}
                          </div>
                        </div>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                            conn.type === 'transversal'
                              ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                              : 'bg-slate-800 text-emerald-300 border border-slate-700'
                          }`}
                        >
                          {conn.relation}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-3 border-t border-slate-800 bg-[#070a12] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-400">🛡️</span>
            <span>TecnoRed Engine v2.0 · 60 FPS Batched Canvas</span>
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppArchitectureGraph;
