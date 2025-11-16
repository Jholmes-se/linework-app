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

class Rectangle {
    constructor(corner1, corner2, id = null) {
        this.corner1 = corner1; // {x, y}
        this.corner2 = corner2; // {x, y}
        this.id = id || this.generateId();
        this.type = 'rectangle';
        this.selected = false;
    }

    generateId() {
        return 'rectangle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    get x() {
        return Math.min(this.corner1.x, this.corner2.x);
    }

    get y() {
        return Math.min(this.corner1.y, this.corner2.y);
    }

    get width() {
        return Math.abs(this.corner2.x - this.corner1.x);
    }

    get height() {
        return Math.abs(this.corner2.y - this.corner1.y);
    }

    get center() {
        return {
            x: (this.corner1.x + this.corner2.x) / 2,
            y: (this.corner1.y + this.corner2.y) / 2
        };
    }

    perimeter() {
        return 2 * (this.width + this.height);
    }

    area() {
        return this.width * this.height;
    }
}

class Circle {
    constructor(center, radius, id = null) {
        this.center = center; // {x, y}
        this.radius = radius;
        this.id = id || this.generateId();
        this.type = 'circle';
        this.selected = false;
    }

    generateId() {
        return 'circle_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    circumference() {
        return 2 * Math.PI * this.radius;
    }

    area() {
        return Math.PI * this.radius * this.radius;
    }

    distanceToPoint(point) {
        const dist = Math.sqrt(
            Math.pow(point.x - this.center.x, 2) +
            Math.pow(point.y - this.center.y, 2)
        );
        return Math.abs(dist - this.radius);
    }
}

class Arc {
    constructor(center, radius, startAngle, endAngle, id = null) {
        this.center = center; // {x, y}
        this.radius = radius;
        this.startAngle = startAngle; // in radians
        this.endAngle = endAngle;     // in radians
        this.id = id || this.generateId();
        this.type = 'arc';
        this.selected = false;
    }

    generateId() {
        return 'arc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Create arc from three points
    static fromThreePoints(p1, p2, p3, id = null) {
        // Calculate center using perpendicular bisectors
        const mid1 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        const mid2 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };

        const slope1 = (p2.y - p1.y) / (p2.x - p1.x);
        const slope2 = (p3.y - p2.y) / (p3.x - p2.x);

        if (Math.abs(slope1 - slope2) < 0.0001) {
            // Points are collinear
            return null;
        }

        const perpSlope1 = -1 / slope1;
        const perpSlope2 = -1 / slope2;

        // Find intersection of perpendicular bisectors
        const centerX = (perpSlope1 * mid1.x - perpSlope2 * mid2.x + mid2.y - mid1.y) / (perpSlope1 - perpSlope2);
        const centerY = perpSlope1 * (centerX - mid1.x) + mid1.y;

        const center = { x: centerX, y: centerY };
        const radius = Math.sqrt(Math.pow(p1.x - centerX, 2) + Math.pow(p1.y - centerY, 2));

        // Calculate angles
        const startAngle = Math.atan2(p1.y - centerY, p1.x - centerX);
        const endAngle = Math.atan2(p3.y - centerY, p3.x - centerX);

        return new Arc(center, radius, startAngle, endAngle, id);
    }

    arcLength() {
        let angle = this.endAngle - this.startAngle;
        if (angle < 0) angle += 2 * Math.PI;
        return this.radius * angle;
    }

    get startPoint() {
        return {
            x: this.center.x + this.radius * Math.cos(this.startAngle),
            y: this.center.y + this.radius * Math.sin(this.startAngle)
        };
    }

    get endPoint() {
        return {
            x: this.center.x + this.radius * Math.cos(this.endAngle),
            y: this.center.y + this.radius * Math.sin(this.endAngle)
        };
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
            } else if (obj.type === 'rectangle') {
                minX = Math.min(minX, obj.x);
                minY = Math.min(minY, obj.y);
                maxX = Math.max(maxX, obj.x + obj.width);
                maxY = Math.max(maxY, obj.y + obj.height);
            } else if (obj.type === 'circle') {
                minX = Math.min(minX, obj.center.x - obj.radius);
                minY = Math.min(minY, obj.center.y - obj.radius);
                maxX = Math.max(maxX, obj.center.x + obj.radius);
                maxY = Math.max(maxY, obj.center.y + obj.radius);
            } else if (obj.type === 'arc') {
                minX = Math.min(minX, obj.center.x - obj.radius);
                minY = Math.min(minY, obj.center.y - obj.radius);
                maxX = Math.max(maxX, obj.center.x + obj.radius);
                maxY = Math.max(maxY, obj.center.y + obj.radius);
            }
        });

        return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
    },

    // Create offset line from an existing line
    offsetLine(line, distance) {
        const angle = line.angle();
        const perpAngle = angle + Math.PI / 2;

        const offsetStart = {
            x: line.start.x + Math.cos(perpAngle) * distance,
            y: line.start.y + Math.sin(perpAngle) * distance
        };

        const offsetEnd = {
            x: line.end.x + Math.cos(perpAngle) * distance,
            y: line.end.y + Math.sin(perpAngle) * distance
        };

        return new Line(offsetStart, offsetEnd);
    }
};
