import { Group, Line, Text } from 'react-konva';
import Pin from './PinView';
import { COMPONENTS_CONFIG } from '../config/components';

const BatteryAnsiView = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, onDblClick, isSelected, rotation }: any) => {
  const config = COMPONENTS_CONFIG.battery;
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
          <Line points={[0, 25, 16, 25]} stroke={stroke} strokeWidth={2} />
          <Line points={[16, 12, 16, 38]} stroke={stroke} strokeWidth={3} />
          <Line points={[27, 16, 27, 34]} stroke={stroke} strokeWidth={2} />
          <Line points={[27, 25, 50, 25]} stroke={stroke} strokeWidth={2} />
          <Pin id={id + ':pos'} x={config.pins.pos.x} y={config.pins.pos.y} onPinClick={onPinClick} />
          <Pin id={id + ':neg'} x={config.pins.neg.x} y={config.pins.neg.y} onPinClick={onPinClick} />
        </Group>
      </Group>
      <Text text={config.label} x={config.labelPos.x} y={config.labelPos.y} fontSize={config.labelSize} fill={config.labelFill} />
    </Group>
  );
};

export default BatteryAnsiView;
