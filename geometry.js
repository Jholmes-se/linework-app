// Geometry utility functions for linework calculations

class Point {
    constructor(x, y, id = null) {
        this.x = x;
        this.y = y;
        this.id = id || this.generateId();
        this.type = 'point';
        this.selected = false;
    }

    generateId() {
        return 'point_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    distanceTo(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
    }

    clone() {
        return new Point(this.x, this.y);
    }
}

class Line {
    constructor(start, end, id = null) {
        this.start = start; // Point object or {x, y}
        this.end = end;     // Point object or {x, y}
        this.id = id || this.generateId();
        this.type = 'line';
        this.selected = false;
    }

    generateId() {
        return 'line_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    length() {
        return Math.sqrt(
            Math.pow(this.end.x - this.start.x, 2) +
            Math.pow(this.end.y - this.start.y, 2)
        );
    }

    angle() {
        return Math.atan2(this.end.y - this.start.y, this.end.x - this.start.x);
    }

    angleDegrees() {
        return this.angle() * 180 / Math.PI;
    }

    midpoint() {
        return {
            x: (this.start.x + this.end.x) / 2,
            y: (this.start.y + this.end.y) / 2
        };
    }

    distanceToPoint(point) {
        const A = point.x - this.start.x;
        const B = point.y - this.start.y;
        const C = this.end.x - this.start.x;
        const D = this.end.y - this.start.y;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;

        if (param < 0) {
            xx = this.start.x;
            yy = this.start.y;
        } else if (param > 1) {
            xx = this.end.x;
            yy = this.end.y;
        } else {
            xx = this.start.x + param * C;
            yy = this.start.y + param * D;
        }

        const dx = point.x - xx;
        const dy = point.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Polyline {
    constructor(points = [], id = null) {
        this.points = points; // Array of Point objects or {x, y}
        this.id = id || this.generateId();
        this.type = 'polyline';
        this.selected = false;
        this.closed = false;
    }

    generateId() {
        return 'polyline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    addPoint(point) {
        this.points.push(point);
    }

    totalLength() {
        let length = 0;
        for (let i = 0; i < this.points.length - 1; i++) {
            const dx = this.points[i + 1].x - this.points[i].x;
            const dy = this.points[i + 1].y - this.points[i].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        if (this.closed && this.points.length > 2) {
            const last = this.points[this.points.length - 1];
            const first = this.points[0];
            const dx = first.x - last.x;
            const dy = first.y - last.y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    close() {
        this.closed = true;
    }
}

class Dimension {
    constructor(start, end, offset = 20, id = null) {
        this.start = start;
        this.end = end;
        this.offset = offset; // Perpendicular offset from the line
        this.id = id || this.generateId();
        this.type = 'dimension';
        this.selected = false;
    }

    generateId() {
        return 'dimension_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    length() {
        return Math.sqrt(
            Math.pow(this.end.x - this.start.x, 2) +
            Math.pow(this.end.y - this.start.y, 2)
        );
    }
}

// Geometric utility functions
const Geometry = {
    // Calculate distance between two points
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    },

    // Calculate angle between two points in radians
    angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    },

    // Calculate angle between two points in degrees
    angleDegrees(p1, p2) {
        return this.angle(p1, p2) * 180 / Math.PI;
    },

    // Snap point to grid
    snapToGrid(point, gridSize) {
        return {
            x: Math.round(point.x / gridSize) * gridSize,
            y: Math.round(point.y / gridSize) * gridSize
        };
    },

    // Find nearest point from array of points
    findNearestPoint(point, points, maxDistance = Infinity) {
        let nearest = null;
        let minDist = maxDistance;

        for (const p of points) {
            const dist = this.distance(point, p);
            if (dist < minDist) {
                minDist = dist;
                nearest = p;
            }
        }

        return { point: nearest, distance: minDist };
    },

    // Check if point is near line
    isPointNearLine(point, line, threshold = 5) {
        return line.distanceToPoint(point) <= threshold;
    },

    // Get perpendicular point
    perpendicularPoint(point, line, distance) {
        const angle = line.angle();
        const perpAngle = angle + Math.PI / 2;
        return {
            x: point.x + Math.cos(perpAngle) * distance,
            y: point.y + Math.sin(perpAngle) * distance
        };
    },

    // Check if point is inside rectangle
    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    },

    // Calculate bounding box for objects
    getBoundingBox(objects) {
        if (objects.length === 0) return null;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        objects.forEach(obj => {
            if (obj.type === 'point') {
                minX = Math.min(minX, obj.x);
                minY = Math.min(minY, obj.y);
                maxX = Math.max(maxX, obj.x);
                maxY = Math.max(maxY, obj.y);
            } else if (obj.type === 'line' || obj.type === 'dimension') {
                minX = Math.min(minX, obj.start.x, obj.end.x);
                minY = Math.min(minY, obj.start.y, obj.end.y);
                maxX = Math.max(maxX, obj.start.x, obj.end.x);
                maxY = Math.max(maxY, obj.start.y, obj.end.y);
            } else if (obj.type === 'polyline') {
                obj.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
            }
        });

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    }
};
