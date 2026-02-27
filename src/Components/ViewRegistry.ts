import ResistorView from './ResistorView';

// Mapeo dinámico: el "tipo" del JSON coincide con el Componente React
export const ComponentMap: Record<string, React.FC<any>> = {
    resistor: ResistorView,
    //   battery: BatteryView,
    // led: LEDView, ...
};