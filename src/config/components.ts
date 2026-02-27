export const COMPONENTS_CONFIG: Record<string, any>= {
    resistor: {
        label: 'RESISTOR',
        labelPos: {
            x: 0,
            y: -13,
        },
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
        label: 'BATTERY',
        labelPos: {
            x: 0,
            y: -13,
        },
        width: 100,
        height: 50,
        pins: {
            pos: {
                x: 0,
                y: 25,
            },
            neg: {
                x: 100,
                y: 25,
            },
        }
    }
}