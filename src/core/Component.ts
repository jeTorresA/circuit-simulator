import { v4 as uuidv4 } from 'uuid';
import type { ComponentType, Component } from '../types';

export const DEFAULT_VALUES: Record<ComponentType, number> = {
  resistor: 1000,
  capacitor: 0.00001,
  inductor: 0.001,
  battery: 9,
};

export const UNIT_MAP: Record<ComponentType, string> = {
  resistor: 'Ω',
  capacitor: 'F',
  inductor: 'H',
  battery: 'V',
};

export const LABEL_MAP: Record<ComponentType, string> = {
  resistor: 'R',
  capacitor: 'C',
  inductor: 'L',
  battery: 'BAT',
};

export const createComponent = (
  type: ComponentType,
  x = 150,
  y = 150
): Component => ({
  id: `${type}-${uuidv4().slice(0, 4)}`,
  type,
  x,
  y,
  value: DEFAULT_VALUES[type],
});
