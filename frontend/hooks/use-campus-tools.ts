'use client';

import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { ROOMS, getRoomState, formatTime } from '@/lib/campus';

type Snapshot = {
  floor: number;
  date: string;
  time: number;
  selectedId: number;
};
type Actions = {
  setFloor: (floor: number) => void;
  setSelectedId: (id: number) => void;
};
type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
  execute: (input: unknown) => unknown;
};
type Context = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export function useCampusTools(snapshot: Snapshot, actions: Actions) {
  const latest = useRef({ snapshot, actions });
  useEffect(() => {
    latest.current = { snapshot, actions };
  }, [snapshot, actions]);
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const tools: Tool[] = [
      {
        name: 'get_coworkings',
        title: 'Коворкинги кампуса',
        description:
          'Read all 23 demo coworkings and their availability at the date and time currently selected in the interface. Does not book anything.',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute(input) {
          if (
            typeof input !== 'object' ||
            input === null ||
            Array.isArray(input) ||
            Object.keys(input).length
          )
            throw new Error('Expected an empty object.');
          const { date, time, selectedId } = latest.current.snapshot;
          return {
            date,
            time: formatTime(time),
            selectedId,
            demo: true,
            rooms: ROOMS.map((room) => ({
              id: room.id,
              number: room.number,
              floor: room.floor,
              capacity: room.capacity,
              ...getRoomState(room, date, time),
            })),
          };
        },
      },
      {
        name: 'select_coworking',
        title: 'Показать выбранный коворкинг',
        description:
          'Select a coworking and show its floor and details using the current date and time. This only changes the frontend selection; it never creates a reservation.',
        inputSchema: {
          type: 'object',
          properties: { roomId: { type: 'integer', minimum: 1, maximum: 23 } },
          required: ['roomId'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (
            typeof input !== 'object' ||
            input === null ||
            Array.isArray(input) ||
            Object.keys(input).some((key) => key !== 'roomId')
          )
            throw new Error('Expected only roomId.');
          const id = (input as { roomId?: unknown }).roomId;
          if (typeof id !== 'number' || !Number.isInteger(id))
            throw new Error('roomId must be an integer.');
          const room = ROOMS.find((value) => value.id === id);
          if (!room) throw new Error('Coworking not found.');
          const { date, time } = latest.current.snapshot;
          flushSync(() => {
            latest.current.actions.setFloor(room.floor);
            latest.current.actions.setSelectedId(room.id);
          });
          return {
            selectedId: room.id,
            floor: room.floor,
            date,
            time: formatTime(time),
            status: getRoomState(room, date, time).status,
            reservationCreated: false,
          };
        },
      },
    ];
    for (const tool of tools) {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {
        /* Optional browser capability; regular controls remain available. */
      }
    }
    return () => lifecycle.abort();
  }, []);
}
