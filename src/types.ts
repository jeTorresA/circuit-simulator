export type ComponentType = 'resistor';

export interface Point {
    x: number;
    y: number;
}

export interface Component {
    id: string;
    type: ComponentType;
    x: number;
    y: number;
    points: Point[];
}

export interface Pin {
    id: string;
    pinName: string;
    relX: number; // Relative position to the component
    relY: number;
}

export interface Wire {
    id: string;
    fromPinId: string;
    toPinId: string;
}