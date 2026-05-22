import { Group, Line, Text } from 'react-konva';
import Pin from './PinView';
import { COMPONENTS_CONFIG } from '../config/components';

const ResistorAnsiView = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, onDblClick, isSelected, rotation }: any) => {
  const config = COMPONENTS_CONFIG.resistor;
  const rot = rotation || 0;
  const stroke = isSelected ? '#f1c40f' : config.stroke;

  return (
    <Group
      key={id}
      x={x}
      y={y}
      draggable
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.cancelBubble = true; onSelect?.(id); }}
      onDblClick={(e) => { e.cancelBubble = true; onDblClick?.(id); }}
    >
      <Group x={config.width / 2} y={config.height / 2} rotation={rot}>
        <Group x={-config.width / 2} y={-config.height / 2}>
          <Line points={[0, 10, 8, 10]} stroke={stroke} strokeWidth={2} />
          <Line points={[8, 10, 12, 4, 18, 16, 24, 4, 30, 16, 36, 4, 42, 16, 48, 10]} stroke={stroke} strokeWidth={2} lineCap="round" lineJoin="round" />
          <Line points={[48, 10, 60, 10]} stroke={stroke} strokeWidth={2} />
          <Pin id={id + ':left'} x={config.pins.left.x} y={config.pins.left.y} onPinClick={onPinClick} />
          <Pin id={id + ':right'} x={config.pins.right.x} y={config.pins.right.y} onPinClick={onPinClick} />
        </Group>
      </Group>
      <Text text={config.label} x={config.labelPos.x} y={config.labelPos.y} fontSize={config.labelSize} fill={config.labelFill} />
    </Group>
  );
};

export default ResistorAnsiView;
