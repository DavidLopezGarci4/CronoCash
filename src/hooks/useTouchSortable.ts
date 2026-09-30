import { useState, useRef, useCallback } from 'react';

interface UseTouchSortableProps<T> {
  items: T[];
  onReorder: (newItems: T[]) => void | Promise<void>;
  enabled?: boolean;
}

export function useTouchSortable<T>({
  items,
  onReorder,
  enabled = true,
}: UseTouchSortableProps<T>) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      // Solo botón principal en ratón
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      e.stopPropagation();

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback si el entorno no soporta captura
      }

      activePointerIdRef.current = e.pointerId;
      isDraggingRef.current = true;
      setDragIndex(index);
      setOverIndex(index);
    },
    [enabled]
  );

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (!isDraggingRef.current || activePointerIdRef.current !== e.pointerId) return;

    // Detectar el elemento tarjeta sobre el que se encuentra el puntero/dedo
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const targetCard = elements.find((el) => el.getAttribute('data-sortable-index') !== null);

    if (targetCard) {
      const idxStr = targetCard.getAttribute('data-sortable-index');
      if (idxStr !== null) {
        const targetIdx = parseInt(idxStr, 10);
        if (!isNaN(targetIdx) && targetIdx >= 0 && targetIdx < itemsRef.current.length) {
          setOverIndex(targetIdx);
        }
      }
    }
  }, []);

  const handlePointerUp = useCallback(
    async (e: React.PointerEvent<HTMLElement>) => {
      if (!isDraggingRef.current || activePointerIdRef.current !== e.pointerId) return;

      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignorar
      }

      const from = dragIndex;
      const to = overIndex;

      isDraggingRef.current = false;
      activePointerIdRef.current = null;
      setDragIndex(null);
      setOverIndex(null);

      if (from !== null && to !== null && from !== to) {
        const updated = [...itemsRef.current];
        const [movedItem] = updated.splice(from, 1);
        updated.splice(to, 0, movedItem);

        await onReorder(updated);
      }
    },
    [dragIndex, overIndex, onReorder]
  );

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (activePointerIdRef.current === e.pointerId) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignorar
      }
      isDraggingRef.current = false;
      activePointerIdRef.current = null;
      setDragIndex(null);
      setOverIndex(null);
    }
  }, []);

  return {
    dragIndex,
    overIndex,
    isDragging: dragIndex !== null,
    getHandleProps: (index: number) => ({
      onPointerDown: (e: React.PointerEvent<HTMLElement>) => handlePointerDown(index, e),
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      style: { touchAction: 'none' as const },
    }),
    getItemProps: (index: number) => ({
      'data-sortable-index': index,
    }),
  };
}
