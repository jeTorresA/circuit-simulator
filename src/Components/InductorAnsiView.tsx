import { Group, Line, Text } from 'react-konva';
import Pin from './PinView';
import { COMPONENTS_CONFIG } from '../config/components';

const InductorAnsiView = ({ id, x, y, onPinClick, onDragMove, onDragEnd, onSelect, onDblClick, isSelected, rotation }: any) => {
  const config = COMPONENTS_CONFIG.inductor;
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
          <Line points={[0, 10, 10, 10]} stroke={stroke} strokeWidth={2} />
          <Line points={[10, 10, 14, 4, 20, 4, 24, 10]} stroke={stroke} strokeWidth={2} tension={0.6} lineCap="round" />
          <Line points={[24, 10, 28, 4, 34, 4, 38, 10]} stroke={stroke} strokeWidth={2} tension={0.6} lineCap="round" />
          <Line points={[38, 10, 42, 4, 48, 4, 52, 10]} stroke={stroke} strokeWidth={2} tension={0.6} lineCap="round" />
          <Line points={[52, 10, 60, 10]} stroke={stroke} strokeWidth={2} />
          <Pin id={id + ':left'} x={config.pins.left.x} y={config.pins.left.y} onPinClick={onPinClick} />
          <Pin id={id + ':right'} x={config.pins.right.x} y={config.pins.right.y} onPinClick={onPinClick} />
        </Group>
      </Group>
      <Text text={config.label} x={config.labelPos.x} y={config.labelPos.y} fontSize={config.labelSize} fill={config.labelFill} />
    </Group>
  );
};

export default InductorAnsiView;
