import { Circle } from "react-konva";

interface PinProps {
    id: string;
    x: number;
    y: number;
    onPinClick: (pinId: string) => void;
}

const Pin = ({ id, x, y, onPinClick }: PinProps) => (
    <Circle
        id={id}
        x={x}
        y={y}
        radius={5}
        fill="red"
        onClick={(e) => {
            e.cancelBubble = true;
            onPinClick(id)
        }}
        onMouseEnter={(e: any) => e.target.scale({ x: 1.2, y: 1.2 })}
        onMouseLeave={(e: any) => e.target.scale({ x: 1, y: 1 })}
    />
);

export default Pin;