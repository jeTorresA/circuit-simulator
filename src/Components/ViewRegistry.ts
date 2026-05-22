import type { FC } from 'react';
import ResistorView from './ResistorView';
import BatteryView from './BatteryView';
import CapacitorView from './CapacitorView';
import InductorView from './InductorView';
import ResistorAnsiView from './ResistorAnsiView';
import BatteryAnsiView from './BatteryAnsiView';
import CapacitorAnsiView from './CapacitorAnsiView';
import InductorAnsiView from './InductorAnsiView';
import type { ComponentType, ComponentViewProfile } from '../types';

type ComponentView = FC<any>;

const BASE_COMPONENT_MAP: Record<ComponentType, ComponentView> = {
  resistor: ResistorView,
  battery: BatteryView,
  capacitor: CapacitorView,
  inductor: InductorView,
};

const PROFILE_VIEW_MAP: Record<ComponentViewProfile, Record<ComponentType, ComponentView>> = {
  symbolic_iec: BASE_COMPONENT_MAP,
  symbolic_ansi: {
    resistor: ResistorAnsiView,
    battery: BatteryAnsiView,
    capacitor: CapacitorAnsiView,
    inductor: InductorAnsiView,
  },
  realistic_2d: BASE_COMPONENT_MAP,
};

export const getComponentView = (type: ComponentType, profile: ComponentViewProfile): ComponentView | null => {
  return PROFILE_VIEW_MAP[profile]?.[type] || PROFILE_VIEW_MAP.symbolic_iec[type] || null;
};
