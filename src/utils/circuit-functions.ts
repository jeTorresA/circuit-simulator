import { COMPONENTS_CONFIG } from "../config/components";

// Recibe 'components' como segundo argumento
export const getPinGlobalPosition = (pinId: string, components: any[]) => {
    const [compId, pinName] = pinId.split(':');
    const comp = components.find(c => c.id === compId);
    
    if (!comp) return { x: 0, y: 0 };

    const config = COMPONENTS_CONFIG[comp.type];
    const offset = config?.pins?.[pinName] || { x: 0, y: 0 };

    return {
        x: comp.x + offset.x,
        y: comp.y + offset.y
    };
}

// Recibe 'updateComponentPos' como argumento
export const handleDragMove = (e: any, id: string, updateFn: Function) => {
    const pos = e.target.position();
    updateFn(id, pos.x, pos.y);
}

export const handleDragEnd = (e: any, id: string, updateFn: Function) => {
    const gridSize = 20;
    const newX = Math.round(e.target.x() / gridSize) * gridSize;
    const newY = Math.round(e.target.y() / gridSize) * gridSize;
    updateFn(id, newX, newY);
}