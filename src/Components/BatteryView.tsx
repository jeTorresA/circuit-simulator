import { Group, Text, Circle } from "react-konva";
import Pin from "./PinView";
import { COMPONENTS_CONFIG } from "../config/components";

interface ResistorProps {
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

const Battery = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, onDblClick, isSelected }: ResistorProps) => {
    const config = COMPONENTS_CONFIG['battery'];

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
            <Circle
                radius={config.radius}
                x={config.radius}
                y={config.radius}
                fill={config.fill}
                stroke={isSelected ? '#f1c40f' : config.stroke}
                strokeWidth={isSelected ? 3 : 1}
                shadowColor={isSelected ? '#f1c40f' : undefined}
                shadowBlur={isSelected ? 10 : 0}
            />
            <Text text={config.label} x={config.labelPos.x} y={config.labelPos.y} fontSize={config.labelSize} fill={config.labelFill} />
        
            <Pin id={id + ":pos"} x={config.pins.pos.x} y={config.pins.pos.y} onPinClick={onPinClick} />
            <Pin id={id + ":neg"} x={config.pins.neg.x} y={config.pins.neg.y} onPinClick={onPinClick} />
        </Group>
    )
};

export default Battery;
