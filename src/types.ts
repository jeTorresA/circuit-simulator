export type ComponentType = 'resistor' | 'capacitor' | 'inductor' | 'battery';

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
}

export interface Pin {
    id: string;
    pinName: string;
    relX: number;
    relY: number;
}

export interface Wire {
    id: string;
    fromPinId: string;
    toPinId: string;
}

export interface JunctionPoint {
    id: string;
    x: number;
    y: number;
}
