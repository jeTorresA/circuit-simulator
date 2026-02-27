import { Group, Text, Rect } from "react-konva";
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
    isSelected?: boolean;
} 

const Resistor = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, isSelected }: ResistorProps) => {
    const config = COMPONENTS_CONFIG['resistor'];

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
        >
            {/* The body of the resistor */}
            <Rect
                width={config.width}
                height={config.height}
                fill={config.fill}
                stroke={isSelected ? '#f1c40f' : config.stroke}
                strokeWidth={isSelected ? 3 : 1}
                shadowColor={isSelected ? '#f1c40f' : undefined}
                shadowBlur={isSelected ? 10 : 0}
            />
            <Text text={config.label} x={config.labelPos.x} y={config.labelPos.y} fontSize={config.labelSize} fill={config.labelFill} />
        
            {/* The pins (Connection pins) */}
            <Pin id={id + ":left"} x={config.pins.left.x} y={config.pins.left.y} onPinClick={onPinClick} />
            <Pin id={id + ":right"} x={config.pins.right.x} y={config.pins.right.y} onPinClick={onPinClick} />
        </Group>
    )
};

export default Resistor;
