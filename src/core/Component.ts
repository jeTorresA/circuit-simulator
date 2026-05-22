import { v4 as uuidv4 } from 'uuid';
import type { ComponentType, Component } from '../types';
import { COMPONENT_DEFINITIONS } from '../config/componentDefinitions';

export const DEFAULT_VALUES: Record<ComponentType, number> = {
  resistor: COMPONENT_DEFINITIONS.resistor.defaultValue,
  capacitor: COMPONENT_DEFINITIONS.capacitor.defaultValue,
  inductor: COMPONENT_DEFINITIONS.inductor.defaultValue,
  battery: COMPONENT_DEFINITIONS.battery.defaultValue,
};

export const UNIT_MAP: Record<ComponentType, string> = {
  resistor: COMPONENT_DEFINITIONS.resistor.unit,
  capacitor: COMPONENT_DEFINITIONS.capacitor.unit,
  inductor: COMPONENT_DEFINITIONS.inductor.unit,
  battery: COMPONENT_DEFINITIONS.battery.unit,
};

export const LABEL_MAP: Record<ComponentType, string> = {
  resistor: COMPONENT_DEFINITIONS.resistor.label,
  capacitor: COMPONENT_DEFINITIONS.capacitor.label,
  inductor: COMPONENT_DEFINITIONS.inductor.label,
  battery: COMPONENT_DEFINITIONS.battery.label,
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
  rotation: 0,
});
