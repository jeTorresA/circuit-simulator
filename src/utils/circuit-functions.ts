import { COMPONENTS_CONFIG } from "../config/components";
import type { JunctionPoint } from "../types";

export const getPinGlobalPosition = (pinId: string, components: any[]) => {
    const [compId, pinName] = pinId.split(':');
    const comp = components.find(c => c.id === compId);
    
    if (!comp) return { x: 0, y: 0 };

    const config = COMPONENTS_CONFIG[comp.type];
    const offset = config?.pins?.[pinName] || { x: 0, y: 0 };

    if (!comp.rotation || comp.rotation === 0) {
        return { x: comp.x + offset.x, y: comp.y + offset.y };
    }

    const cx = config.width / 2;
    const cy = config.height / 2;
    const dx = offset.x - cx;
    const dy = offset.y - cy;
    const rad = (comp.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const rx = dx * cos - dy * sin + cx;
    const ry = dx * sin + dy * cos + cy;

    return { x: comp.x + rx, y: comp.y + ry };
}

export const getNodePosition = (nodeId: string, components: any[], junctions: JunctionPoint[]) => {
    if (nodeId.startsWith('jct:')) {
        const jct = junctions.find(j => j.id === nodeId);
        return jct ? { x: jct.x, y: jct.y } : { x: 0, y: 0 };
    }
    return getPinGlobalPosition(nodeId, components);
};

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
