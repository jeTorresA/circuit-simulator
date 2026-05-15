import { Group, Text, Line } from "react-konva";
import Pin from "./PinView";
import { COMPONENTS_CONFIG } from "../config/components";

interface CapacitorProps {
    id: string;
    x: number;
    y: number;
    onPinClick: (pinId: string) => void;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
    onSelect?: (id: string) => void;
    onDblClick?: (id: string) => void;
    isSelected?: boolean;
}

const Capacitor = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, onDblClick, isSelected }: CapacitorProps) => {
    const config = COMPONENTS_CONFIG['capacitor'];

    return (
        <Group
            key={id}
            x={x}
            y={y}
            draggable
            onDragMove={onDragMove}
            onDragEnd={onDragEnd}
            onClick={(e) => {
                e.cancelBubble = true;
                onSelect?.(id);
            }}
            onDblClick={(e) => {
                e.cancelBubble = true;
                onDblClick?.(id);
            }}
        >
            <Line
                points={[0, 10, 24, 10]}
                stroke={isSelected ? '#f1c40f' : config.stroke}
                strokeWidth={2}
                lineCap="round"
            />
            <Line
                points={[24, 3, 24, 17]}
                stroke={isSelected ? '#f1c40f' : config.stroke}
                strokeWidth={2}
                lineCap="round"
            />
            <Line
                points={[30, 3, 30, 17]}
                stroke={isSelected ? '#f1c40f' : config.stroke}
                strokeWidth={2}
                lineCap="round"
            />
            <Line
                points={[30, 10, 60, 10]}
                stroke={isSelected ? '#f1c40f' : config.stroke}
                strokeWidth={2}
                lineCap="round"
            />

            <Text text={config.label} x={config.labelPos.x} y={config.labelPos.y} fontSize={config.labelSize} fill={config.labelFill} />

            <Pin id={id + ":left"} x={config.pins.left.x} y={config.pins.left.y} onPinClick={onPinClick} />
            <Pin id={id + ":right"} x={config.pins.right.x} y={config.pins.right.y} onPinClick={onPinClick} />
        </Group>
    );
};

export default Capacitor;
