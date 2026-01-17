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
  selectedOutpostId?: string | null;
  showTerrain?: boolean;
  showSolar?: boolean;
  showResource?: boolean;
}

export default function LunarMapCanvas({
  map,
  outposts,
  commLinks,
  onCellClick,
  onOutpostDragStart,
  onOutpostDrag,
  onOutpostDragEnd,
  selectedOutpostId,
  showTerrain = true,
  showSolar = false,
  showResource = false,
}: LunarMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedOutpostId, setDraggedOutpostId] = useState<string | null>(null);
  const cellSize = 8;

  // マップ描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズ設定
    canvas.width = map.width * cellSize;
    canvas.height = map.height * cellSize;

    // 背景（月面）
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // セル描画
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const cell = map.cells[y][x];
        let color = '#2a2a2a';

        if (showTerrain) {
          // 地形の荒さを赤みで表現
          const roughness = cell.terrain.roughness;
          const r = Math.floor(42 + roughness * 60);
          const g = Math.floor(42 + roughness * 20);
          const b = 42;
          color = `rgb(${r}, ${g}, ${b})`;
        } else if (showSolar) {
          // 日照をヒートマップで表現
          const solar = cell.solar.visibility;
          const intensity = Math.floor(solar * 200);
          color = `rgb(${intensity}, ${intensity}, 100)`;
        } else if (showResource) {
          // 資源を青みで表現
          const resource = cell.resource.expectedValue / 100;
          const intensity = Math.floor(resource * 150);
          color = `rgb(50, 100, ${100 + intensity})`;
        }

        ctx.fillStyle = color;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    // 通信リンク描画
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
    ctx.lineWidth = 1;

    for (const link of commLinks) {
      const fromOutpost = outposts.find((o) => o.id === link.from);
      const toOutpost = outposts.find((o) => o.id === link.to);

      if (fromOutpost && toOutpost) {
        ctx.beginPath();
        ctx.moveTo(
          fromOutpost.position.x * cellSize + cellSize / 2,
          fromOutpost.position.y * cellSize + cellSize / 2
        );
        ctx.lineTo(
          toOutpost.position.x * cellSize + cellSize / 2,
          toOutpost.position.y * cellSize + cellSize / 2
        );
        ctx.strokeStyle = link.isUnstable
          ? 'rgba(255, 100, 100, 0.5)'
          : 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = link.quality * 2 + 0.5;
        ctx.stroke();
      }
    }

    // 拠点描画
    for (const outpost of outposts) {
      const x = outpost.position.x * cellSize;
      const y = outpost.position.y * cellSize;
      const size = cellSize * 2;

      // 影（確定済みのみ）
      if (outpost.status === 'confirmed') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x + 2, y + 2, size, size);
      }

      // 拠点本体
      const isSelected = outpost.id === selectedOutpostId;
      const metadata = OUTPOST_METADATA[outpost.type];

      ctx.fillStyle = outpost.isUnstable
        ? '#ff6b6b'
        : outpost.status === 'provisional'
        ? '#ffd43b'
        : '#4dabf7';

      if (isSelected) {
        ctx.fillStyle = '#51cf66';
      }

      ctx.fillRect(x, y, size, size);

      // アイコン
      ctx.font = `${cellSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(metadata.icon, x + size / 2, y + size / 2);

      // 不安定マーカー
      if (outpost.isUnstable) {
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - 1, size + 2, size + 2);
      }
    }
  }, [map, outposts, commLinks, selectedOutpostId, showTerrain, showSolar, showResource, cellSize]);

  // マウスイベントハンドラ
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    // クリックされた拠点を探す
    const clickedOutpost = outposts.find(
      (o) =>
        Math.abs(o.position.x - x) <= 1 &&
        Math.abs(o.position.y - y) <= 1
    );

    if (clickedOutpost) {
      setIsDragging(true);
      setDraggedOutpostId(clickedOutpost.id);
      onOutpostDragStart?.(clickedOutpost.id);
    } else {
      onCellClick?.({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedOutpostId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    onOutpostDrag?.(draggedOutpostId, { x, y });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedOutpostId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / cellSize);
    const y = Math.floor((e.clientY - rect.top) / cellSize);

    onOutpostDragEnd?.(draggedOutpostId, { x, y });
    setIsDragging(false);
    setDraggedOutpostId(null);
  };

  return (
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
      className="border border-gray-700 cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
