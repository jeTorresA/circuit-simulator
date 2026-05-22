export type ComponentType = 'resistor' | 'capacitor' | 'inductor' | 'battery';
export type ComponentViewProfile = 'symbolic_iec' | 'symbolic_ansi' | 'realistic_2d';

export interface Point {
    x: number;
    y: number;
}

export interface Component {
    id: string;
    type: ComponentType;
    x: number;
    y: number;
    value: number;
    rotation: number;
}

export interface Pin {
    id: string;
    pinName: string;
    relX: number;
    relY: number;
}

export interface Wire {
    id: string;
    from: string;
    to: string;
    bendPoints?: Point[];
}

export interface JunctionPoint {
    id: string;
    x: number;
    y: number;
}
