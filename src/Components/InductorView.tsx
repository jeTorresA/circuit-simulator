import { Group, Text, Rect, Line } from "react-konva";
import Pin from "./PinView";
import { COMPONENTS_CONFIG } from "../config/components";

interface InductorProps {
    id: string;
    x: number;
    y: number;
    onPinClick: (pinId: string) => void;
    onDragMove?: (e: any) => void;
    onDragEnd?: (e: any) => void;
    onSelect?: (id: string) => void;
    onDblClick?: (id: string) => void;
    isSelected?: boolean;
    rotation?: number;
}

const Inductor = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, onDblClick, isSelected, rotation }: InductorProps) => {
    const config = COMPONENTS_CONFIG['inductor'];
    const rot = rotation || 0;

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
            <Group x={config.width / 2} y={config.height / 2} rotation={rot}>
                <Group x={-config.width / 2} y={-config.height / 2}>
                    <Rect
                        width={config.width}
                        height={config.height}
                        fill={config.fill}
                        stroke={isSelected ? '#f1c40f' : config.stroke}
                        strokeWidth={isSelected ? 3 : 1}
                        cornerRadius={4}
                        shadowColor={isSelected ? '#f1c40f' : undefined}
                        shadowBlur={isSelected ? 10 : 0}
                    />
                    <Line
                        points={[8, 15, 13, 5, 18, 15, 23, 5, 28, 15, 33, 5, 38, 15, 43, 5, 48, 15, 52, 10]}
                        stroke={isSelected ? '#f1c40f' : config.stroke}
                        strokeWidth={1.5}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.3}
                    />
                    <Pin id={id + ":left"} x={config.pins.left.x} y={config.pins.left.y} onPinClick={onPinClick} />
                    <Pin id={id + ":right"} x={config.pins.right.x} y={config.pins.right.y} onPinClick={onPinClick} />
                </Group>
            </Group>
            <Text
                text={config.label}
                x={config.labelPos.x}
                y={config.labelPos.y}
                fontSize={config.labelSize}
                fill={config.labelFill}
            />
        </Group>
    );
};

export default Inductor;
