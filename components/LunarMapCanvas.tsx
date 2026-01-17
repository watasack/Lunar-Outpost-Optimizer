'use client';

import { useEffect, useRef, useState } from 'react';
import { LunarMap, Outpost, CommLink, Position } from '@/lib/types';
import { OUTPOST_METADATA } from '@/lib/constants';

interface LunarMapCanvasProps {
  map: LunarMap;
  outposts: Outpost[];
  commLinks: CommLink[];
  onCellClick?: (position: Position) => void;
  onOutpostDragStart?: (outpostId: string) => void;
  onOutpostDrag?: (outpostId: string, position: Position) => void;
  onOutpostDragEnd?: (outpostId: string, position: Position) => void;
  onOutpostClick?: (outpostId: string) => void;
  selectedOutpostId?: string | null;
  showTerrain?: boolean;
  showSolar?: boolean;
  showResource?: boolean;
  day?: number;
}

export default function LunarMapCanvas({
  map,
  outposts,
  commLinks,
  onCellClick,
  onOutpostDragStart,
  onOutpostDrag,
  onOutpostDragEnd,
  onOutpostClick,
  selectedOutpostId,
  showTerrain = true,
  showSolar = false,
  showResource = false,
  day = 0,
}: LunarMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOutpostId, setDraggedOutpostId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const cellSize = 12; // 拡大して地形を見やすく

  // 太陽の方向（月面の光源）
  const sunAngle = Math.PI / 4; // 45度

  // 星空背景を一度だけ描画
  useEffect(() => {
    const canvas = starsCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = map.width * cellSize;
    canvas.height = map.height * cellSize;

    // 宇宙の暗闇
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 星を描画
    const starCount = 300;
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const brightness = Math.random();
      const size = Math.random() * 2;

      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // 太陽を描画（左上）
    const sunX = canvas.width * 0.15;
    const sunY = canvas.height * 0.15;
    const sunRadius = 30;

    // 太陽のグロー
    const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    sunGradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    sunGradient.addColorStop(0.3, 'rgba(255, 255, 150, 0.8)');
    sunGradient.addColorStop(0.6, 'rgba(255, 200, 100, 0.3)');
    sunGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // 太陽本体
    ctx.fillStyle = '#FFFFCC';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    // 地球を描画（右上、小さく）
    const earthX = canvas.width * 0.85;
    const earthY = canvas.height * 0.12;
    const earthRadius = 20;

    // 地球のグロー
    const earthGradient = ctx.createRadialGradient(earthX, earthY, 0, earthX, earthY, earthRadius * 1.5);
    earthGradient.addColorStop(0, 'rgba(100, 150, 255, 0.6)');
    earthGradient.addColorStop(1, 'rgba(100, 150, 255, 0)');

    ctx.fillStyle = earthGradient;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // 地球本体（青と白のマーブル）
    const earthBodyGradient = ctx.createRadialGradient(
      earthX - 5, earthY - 5, 0,
      earthX, earthY, earthRadius
    );
    earthBodyGradient.addColorStop(0, '#88CCFF');
    earthBodyGradient.addColorStop(0.5, '#4488CC');
    earthBodyGradient.addColorStop(1, '#2255AA');

    ctx.fillStyle = earthBodyGradient;
    ctx.beginPath();
    ctx.arc(earthX, earthY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // 地球の雲（白い模様）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(earthX - 5, earthY - 3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(earthX + 4, earthY + 5, 6, 0, Math.PI * 2);
    ctx.fill();
  }, [map.width, map.height, cellSize]);

  // 月面と拠点を描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = map.width * cellSize;
    canvas.height = map.height * cellSize;

    // 透明にクリア（星空が透けて見える）
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 昼夜判定
    const dayPhase = (day % 14) / 14;
    const isDaytime = dayPhase < 0.5;
    const nightDarkness = isDaytime ? 0 : 0.6;

    // 月面地形を描画
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.cells[y][x];
        let baseColor = { r: 50, g: 50, b: 50 }; // 月面の基本色（より暗く）

        if (showTerrain) {
          // 地形の荒さとクレーターを表現（コントラストを大幅強化）
          const roughness = cell.terrain.roughness;
          const slope = cell.terrain.slope;

          // 月面のコントラストを強化（暗部は非常に暗く、明部は明るく）
          const baseBrightness = 35 + roughness * 120 - slope * 50;
          const brightness = Math.max(20, Math.min(180, baseBrightness));

          baseColor = {
            r: brightness,
            g: brightness * 0.96,
            b: brightness * 0.92,
          };

          // 太陽の方向からの影を追加
          const shadowFromSun = Math.cos(sunAngle) * (x / map.width - 0.15) +
                                Math.sin(sunAngle) * (y / map.height - 0.15);

          if (shadowFromSun > 0.3) {
            // 太陽光が当たる側は明るく
            const lightBoost = Math.min(40, shadowFromSun * 60);
            baseColor.r += lightBoost;
            baseColor.g += lightBoost * 0.95;
            baseColor.b += lightBoost * 0.9;
          } else if (shadowFromSun < -0.1) {
            // 影の側は暗く
            const shadowDarken = Math.abs(shadowFromSun) * 0.5;
            baseColor.r *= (1 - shadowDarken);
            baseColor.g *= (1 - shadowDarken);
            baseColor.b *= (1 - shadowDarken);
          }

        } else if (showSolar) {
          // 日照をオレンジ-イエローのヒートマップで
          const solar = cell.solar.visibility;
          const intensity = solar * 220;
          baseColor = {
            r: 50 + intensity,
            g: 50 + intensity * 0.85,
            b: 50 + intensity * 0.4,
          };
        } else if (showResource) {
          // 資源を青-シアンで表現
          const resource = cell.resource.expectedValue / 100;
          const intensity = resource * 180;
          baseColor = {
            r: 50 + intensity * 0.3,
            g: 50 + intensity * 0.75,
            b: 50 + intensity,
          };
        }

        // 夜間の暗転を適用
        const finalR = Math.floor(Math.max(0, Math.min(255, baseColor.r * (1 - nightDarkness))));
        const finalG = Math.floor(Math.max(0, Math.min(255, baseColor.g * (1 - nightDarkness))));
        const finalB = Math.floor(Math.max(0, Math.min(255, baseColor.b * (1 - nightDarkness))));

        ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // 通信リンク描画（拠点の下に描画）
    for (const link of commLinks) {
      const fromOutpost = outposts.find((o) => o.id === link.from);
      const toOutpost = outposts.find((o) => o.id === link.to);

      if (fromOutpost && toOutpost) {
        const fromX = fromOutpost.position.x * cellSize + cellSize / 2;
        const fromY = fromOutpost.position.y * cellSize + cellSize / 2;
        const toX = toOutpost.position.x * cellSize + cellSize / 2;
        const toY = toOutpost.position.y * cellSize + cellSize / 2;

        // リンクのグロー効果
        ctx.strokeStyle = link.isUnstable
          ? 'rgba(255, 80, 80, 0.4)'
          : 'rgba(100, 200, 255, 0.5)';
        ctx.lineWidth = link.quality * 3 + 1;
        ctx.shadowBlur = 8;
        ctx.shadowColor = link.isUnstable ? '#ff5050' : '#64c8ff';

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 不安定リンクは点滅パターン
        if (link.isUnstable) {
          ctx.setLineDash([5, 5]);
          ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    }

    // 拠点描画
    for (const outpost of outposts) {
      const isDragged = outpost.id === draggedOutpostId;
      const x = outpost.position.x * cellSize;
      const y = outpost.position.y * cellSize;
      const size = cellSize * 2.5;

      // 影（確定済みまたはドラッグ中でない場合）
      if (outpost.status === 'confirmed' && !isDragged) {
        const shadowOffset = 3;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.ellipse(
          x + size / 2 + shadowOffset,
          y + size / 2 + shadowOffset,
          size * 0.4,
          size * 0.2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // ドラッグ中は浮いている感じ
      const yOffset = isDragged ? -5 : 0;
      const actualY = y + yOffset;

      // 拠点本体の背景（より立体的に）
      const isSelected = outpost.id === selectedOutpostId;
      const metadata = OUTPOST_METADATA[outpost.type];

      // グラデーション背景
      const gradient = ctx.createRadialGradient(
        x + size / 2, actualY + size / 2, 0,
        x + size / 2, actualY + size / 2, size / 2
      );

      if (outpost.isUnstable) {
        gradient.addColorStop(0, '#ff8080');
        gradient.addColorStop(1, '#ff3030');
      } else if (isSelected) {
        gradient.addColorStop(0, '#70e070');
        gradient.addColorStop(1, '#40c040');
      } else if (outpost.status === 'provisional') {
        gradient.addColorStop(0, '#ffe080');
        gradient.addColorStop(1, '#ffb020');
      } else {
        gradient.addColorStop(0, '#60b0ff');
        gradient.addColorStop(1, '#3080e0');
      }

      // 外枠
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = gradient;
      ctx.shadowBlur = isDragged ? 15 : 8;
      ctx.shadowColor = isSelected ? '#70e070' : '#ffffff';

      ctx.beginPath();
      ctx.arc(x + size / 2, actualY + size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.shadowBlur = 0;

      // アイコン
      ctx.font = `${cellSize * 1.5}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(metadata.icon, x + size / 2, actualY + size / 2);

      // 不安定マーカー（パルス効果）
      if (outpost.isUnstable) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(x + size / 2, actualY + size / 2, size / 2 + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 選択インジケーター
      if (isSelected) {
        ctx.strokeStyle = '#70ff70';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x + size / 2, actualY + size / 2, size / 2 + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [map, outposts, commLinks, selectedOutpostId, showTerrain, showSolar, showResource, day, draggedOutpostId, cellSize]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = Math.floor((e.clientX - rect.left) / cellSize);
    const mouseY = Math.floor((e.clientY - rect.top) / cellSize);

    // クリックされた拠点を探す（範囲を広げて検出しやすく）
    const clickedOutpost = outposts.find((o) => {
      const dx = o.position.x - mouseX;
      const dy = o.position.y - mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 2;
    });

    if (clickedOutpost) {
      setIsDragging(true);
      setDraggedOutpostId(clickedOutpost.id);
      setDragOffset({
        x: mouseX - clickedOutpost.position.x,
        y: mouseY - clickedOutpost.position.y,
      });
      onOutpostDragStart?.(clickedOutpost.id);
      onOutpostClick?.(clickedOutpost.id);
    } else {
      onCellClick?.({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedOutpostId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = Math.floor((e.clientX - rect.left) / cellSize);
    const mouseY = Math.floor((e.clientY - rect.top) / cellSize);

    onOutpostDrag?.(draggedOutpostId, {
      x: mouseX - dragOffset.x,
      y: mouseY - dragOffset.y,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedOutpostId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = Math.floor((e.clientX - rect.left) / cellSize);
    const mouseY = Math.floor((e.clientY - rect.top) / cellSize);

    onOutpostDragEnd?.(draggedOutpostId, {
      x: mouseX - dragOffset.x,
      y: mouseY - dragOffset.y,
    });
    setIsDragging(false);
    setDraggedOutpostId(null);
  };

  return (
    <div className="relative inline-block">
      <canvas
        ref={starsCanvasRef}
        className="absolute top-0 left-0"
        style={{ imageRendering: 'pixelated' }}
      />
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          if (isDragging && draggedOutpostId) {
            setIsDragging(false);
            setDraggedOutpostId(null);
          }
        }}
        className="relative cursor-crosshair border-2 border-gray-700"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
