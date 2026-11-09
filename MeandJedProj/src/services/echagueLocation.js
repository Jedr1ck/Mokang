import boundarySource from '../assets/geoBoundaries-Echague.geojson?raw';

export const ECHAGUE_BOUNDARY = JSON.parse(boundarySource);

function isPointOnSegment(point, start, end) {
    const [x, y] = point;
    const [startX, startY] = start;
    const [endX, endY] = end;
    const crossProduct = (y - startY) * (endX - startX) - (x - startX) * (endY - startY);

    if (Math.abs(crossProduct) > 1e-10) return false;

    return x >= Math.min(startX, endX) - 1e-10
        && x <= Math.max(startX, endX) + 1e-10
        && y >= Math.min(startY, endY) - 1e-10
        && y <= Math.max(startY, endY) + 1e-10;
}

function ringContainsPoint(point, ring) {
    let inside = false;

    for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
        const start = ring[previous];
        const end = ring[index];

        if (isPointOnSegment(point, start, end)) return true;

        const crossesLatitude = (start[1] > point[1]) !== (end[1] > point[1]);
        if (crossesLatitude) {
            const crossingLongitude = ((end[0] - start[0]) * (point[1] - start[1])) / (end[1] - start[1]) + start[0];
            if (point[0] < crossingLongitude) inside = !inside;
        }
    }

    return inside;
}

export function isWithinEchague(lat, lng) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

    const geometry = ECHAGUE_BOUNDARY.geometry;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    const point = [lng, lat];

    return polygons.some((polygon) => (
        ringContainsPoint(point, polygon[0])
        && !polygon.slice(1).some((hole) => ringContainsPoint(point, hole))
    ));
}
