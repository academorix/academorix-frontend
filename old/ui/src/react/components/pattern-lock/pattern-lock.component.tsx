/**
 * @file pattern-lock.component.tsx
 * @module @stackra/ui/react/components/pattern-lock
 * @description Android-style pattern lock input for lock screens.
 *   Renders a grid of dots that users connect by dragging.
 *   Supports touch and mouse, error/success states, and invisible mode.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

import type { PatternLockProps, Point2D } from "./pattern-lock.interface";

// ============================================================================
// Geometry Utilities
// ============================================================================

/**
 * Calculate positions of all points in the grid.
 *
 * @param activeSize - Touch target size per point.
 * @param width - Total grid width.
 * @param size - Grid dimension (size x size).
 * @returns Array of point positions.
 */
function getPointPositions(activeSize: number, width: number, size: number): Point2D[] {
  const points: Point2D[] = [];
  const cellSize = width / size;

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      points.push({
        x: col * cellSize + cellSize / 2 - activeSize / 2,
        y: row * cellSize + cellSize / 2 - activeSize / 2,
      });
    }
  }

  return points;
}

/**
 * Find which point (if any) the cursor is over.
 *
 * @param pos - Cursor position relative to container.
 * @param points - Array of point positions.
 * @param activeSize - Active area size.
 * @returns Index of collided point, or -1.
 */
function getCollidedPointIndex(pos: Point2D, points: Point2D[], activeSize: number): number {
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!;

    if (pos.x >= p.x && pos.x <= p.x + activeSize && pos.y >= p.y && pos.y <= p.y + activeSize) {
      return i;
    }
  }

  return -1;
}

/**
 * Get intermediate points between two points in a grid.
 *
 * @param from - Start index.
 * @param to - End index.
 * @param size - Grid size.
 * @returns Array of intermediate point indices.
 */
function getPointsInTheMiddle(from: number, to: number, size: number): number[] {
  const fromRow = Math.floor(from / size);
  const fromCol = from % size;
  const toRow = Math.floor(to / size);
  const toCol = to % size;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;
  const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));

  if (steps <= 1) return [];

  const middle: number[] = [];

  for (let i = 1; i < steps; i++) {
    const r = fromRow + (rowDiff * i) / steps;
    const c = fromCol + (colDiff * i) / steps;

    if (Number.isInteger(r) && Number.isInteger(c)) {
      middle.push(r * size + c);
    }
  }

  return middle;
}

/**
 * Get the center point of a touch target.
 *
 * @param point - Point position.
 * @param activeSize - Active area size.
 * @param thickness - Connector thickness.
 * @returns Center coordinates adjusted for connector.
 */
function getConnectorPoint(point: Point2D, activeSize: number, thickness: number): Point2D {
  return {
    x: point.x + activeSize / 2,
    y: point.y + activeSize / 2 - thickness / 2,
  };
}

/**
 * Calculate distance between two points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns Distance in pixels.
 */
function getDistance(a: Point2D, b: Point2D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Calculate angle between two points.
 *
 * @param a - First point.
 * @param b - Second point.
 * @returns Angle in radians.
 */
function getAngle(a: Point2D, b: Point2D): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

// ============================================================================
// Component
// ============================================================================

/**
 * PatternLock — Touch/mouse-driven pattern input grid.
 *
 * Users draw a pattern by connecting dots. Fully controlled —
 * parent manages the `path` state.
 *
 * @param props - Component props.
 * @returns The pattern lock grid element.
 *
 * @example
 * ```tsx
 * const [path, setPath] = useState<number[]>([]);
 *
 * <PatternLock
 *   path={path}
 *   onChange={setPath}
 *   onFinish={() => verifyPattern(path)}
 *   size={3}
 *   width={280}
 * />
 * ```
 */
export const PatternLock = React.memo(function PatternLock({
  path,
  onChange,
  onFinish,
  size = 3,
  width = 280,
  pointSize = 12,
  pointActiveSize = 40,
  connectorThickness = 3,
  isDisabled = false,
  isError = false,
  isSuccess = false,
  isInvisible = false,
  allowJumping = false,
  className,
}: PatternLockProps): React.ReactElement {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point2D[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mousePos, setMousePos] = useState<Point2D | null>(null);

  useEffect(() => {
    setPoints(getPointPositions(pointActiveSize, width, size));
  }, [pointActiveSize, width, size]);

  const getRelativeCoords = useCallback((clientX: number, clientY: number): Point2D | null => {
    if (!wrapperRef.current) return null;
    const rect = wrapperRef.current.getBoundingClientRect();

    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  const checkCollision = useCallback(
    (clientX: number, clientY: number) => {
      const relative = getRelativeCoords(clientX, clientY);

      if (!relative) return;
      setMousePos(relative);

      const index = getCollidedPointIndex(relative, points, pointActiveSize);
      const lastIdx = path[path.length - 1] as number | undefined;

      if (index !== -1 && lastIdx !== index && !path.includes(index)) {
        if (allowJumping || path.length === 0) {
          onChange([...path, index]);
        } else {
          const middle = getPointsInTheMiddle(lastIdx!, index, size);
          const filtered = middle.filter((p) => !path.includes(p));

          onChange([...path, ...filtered, index]);
        }
      }
    },
    [points, pointActiveSize, path, onChange, allowJumping, size, getRelativeCoords],
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (isDisabled) return;
      setIsDrawing(true);
      checkCollision(clientX, clientY);
    },
    [isDisabled, checkCollision],
  );

  useEffect(() => {
    const handleEnd = () => {
      if (isDrawing) {
        setIsDrawing(false);
        setMousePos(null);
        if (path.length > 0) onFinish();
      }
    };

    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDrawing, path.length, onFinish]);

  useEffect(() => {
    if (!isDrawing) return;
    const handleMouseMove = (e: MouseEvent) => checkCollision(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];

      if (touch) checkCollision(touch.clientX, touch.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDrawing, checkCollision]);

  const stateColor = useMemo(() => {
    if (isError) return "bg-danger";
    if (isSuccess) return "bg-success";
    if (isDisabled) return "bg-foreground/20";

    return "bg-primary";
  }, [isError, isSuccess, isDisabled]);

  const percentPerItem = 100 / size;

  return (
    <div
      ref={wrapperRef}
      aria-disabled={isDisabled}
      aria-label="Pattern lock input"
      className={`relative touch-none select-none ${isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${className ?? ""}`.trim()}
      data-component="pattern-lock"
      role="application"
      style={{ width, height: width }}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        const touch = e.touches[0];

        if (touch) handleStart(touch.clientX, touch.clientY);
      }}
    >
      {/* Points grid */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-wrap">
        {Array.from({ length: size ** 2 }, (_, i) => {
          const isSelected = path.includes(i);
          const isLastSelected = isDrawing && path[path.length - 1] === i;

          return (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ width: `${percentPerItem}%`, height: `${percentPerItem}%` }}
            >
              <div
                className="flex items-center justify-center"
                style={{ width: pointActiveSize, height: pointActiveSize }}
              >
                <div
                  className={`rounded-full transition-transform duration-200 ${
                    isSelected ? stateColor : "bg-foreground/20"
                  } ${isLastSelected ? "scale-150" : "scale-100"}`}
                  style={{ width: pointSize, height: pointSize }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Connectors */}
      {!isInvisible && points.length > 0 && (
        <div className="pointer-events-none absolute inset-0 z-10">
          {path.slice(0, -1).map((fromIdx, i) => {
            const toIdx = path[i + 1]!;
            const fromPoint = points[fromIdx]!;
            const toPoint = points[toIdx]!;
            const from = getConnectorPoint(fromPoint, pointActiveSize, connectorThickness);
            const to = getConnectorPoint(toPoint, pointActiveSize, connectorThickness);
            const distance = getDistance(from, to);
            const angle = getAngle(from, to);

            return (
              <div
                key={`${fromIdx}-${toIdx}`}
                className={`absolute origin-left rounded-full ${stateColor}`}
                style={{
                  left: from.x,
                  top: from.y,
                  width: distance,
                  height: connectorThickness,
                  transform: `rotate(${angle}rad)`,
                }}
              />
            );
          })}

          {/* Trailing connector to cursor */}
          {isDrawing &&
            mousePos &&
            path.length > 0 &&
            (() => {
              const lastIdx = path[path.length - 1]!;
              const lastPoint = points[lastIdx]!;
              const from = getConnectorPoint(lastPoint, pointActiveSize, connectorThickness);
              const to = { x: mousePos.x, y: mousePos.y - connectorThickness / 2 };
              const distance = getDistance(from, to);
              const angle = getAngle(from, to);

              return (
                <div
                  className={`absolute origin-left rounded-full opacity-50 ${stateColor}`}
                  style={{
                    left: from.x,
                    top: from.y,
                    width: distance,
                    height: connectorThickness,
                    transform: `rotate(${angle}rad)`,
                  }}
                />
              );
            })()}
        </div>
      )}
    </div>
  );
});

PatternLock.displayName = "PatternLock";
