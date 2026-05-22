import type { ComponentType } from '../types';

export interface ComponentDefinition {
  type: ComponentType;
  label: string;
  displayName: string;
  unit: string;
  defaultValue: number;
}

export const COMPONENT_DEFINITIONS: Record<ComponentType, ComponentDefinition> = {
  resistor: {
    type: 'resistor',
    label: 'R',
    displayName: 'Resistencia',
    unit: 'Ohm',
    defaultValue: 1000,
  },
  capacitor: {
    type: 'capacitor',
    label: 'C',
    displayName: 'Capacitor',
    unit: 'F',
    defaultValue: 0.00001,
  },
  inductor: {
    type: 'inductor',
    label: 'L',
    displayName: 'Inductor',
    unit: 'H',
    defaultValue: 0.001,
  },
  battery: {
    type: 'battery',
    label: 'BAT',
    displayName: 'Bateria',
    unit: 'V',
    defaultValue: 9,
  },
};
