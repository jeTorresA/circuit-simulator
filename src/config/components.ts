export const COMPONENTS_CONFIG: Record<string, any>= {
    resistor: {
        label: 'R',
        labelPos: {
            x: 0,
            y: -13,
        },
        labelSize: 12,
        labelFill: '#000',
        fill: 'orange',
        stroke: 'black',
        width: 60,
        height: 20,
        pins: {
            left: {
                x: 0,
                y: 10,
            },
            right: {
                x: 60,
                y: 10,
            },
        }
    },
    battery: {
        label: 'BAT',
        labelPos: {
            x: 0,
            y: -13,
        },
        labelSize: 12,
        labelFill: '#000',
        fill: 'gold',
        stroke: 'black',
        radius: 25,
        width: 50,
        height: 50,
        pins: {
            pos: {
                x: 0,
                y: 25,
            },
            neg: {
                x: 50,
                y: 25,
            },
        }
    },
    capacitor: {
        label: 'C',
        labelPos: {
            x: 0,
            y: -13,
        },
        labelSize: 12,
        labelFill: '#000',
        fill: '#b3d9ff',
        stroke: 'black',
        width: 60,
        height: 20,
        pins: {
            left: {
                x: 0,
                y: 10,
            },
            right: {
                x: 60,
                y: 10,
            },
        },
    },
    inductor: {
        label: 'L',
        labelPos: {
            x: 0,
            y: -13,
        },
        labelSize: 12,
        labelFill: '#000',
        fill: '#d4b3ff',
        stroke: 'black',
        width: 60,
        height: 20,
        pins: {
            left: {
                x: 0,
                y: 10,
            },
            right: {
                x: 60,
                y: 10,
            },
        },
    },
};
