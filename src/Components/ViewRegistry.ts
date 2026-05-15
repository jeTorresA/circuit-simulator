import ResistorView from './ResistorView';
import BatteryView from './BatteryView';
import CapacitorView from './CapacitorView';
import InductorView from './InductorView';

export const ComponentMap: Record<string, React.FC<any>> = {
    resistor: ResistorView,
    battery: BatteryView,
    capacitor: CapacitorView,
    inductor: InductorView,
};
