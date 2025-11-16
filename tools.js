// Drawing and editing tools

class ToolManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.currentTool = 'select';
        this.tools = {};
        this.initializeTools();
    }

    initializeTools() {
        this.tools = {
            select: new SelectTool(this.canvas),
            point: new PointTool(this.canvas),
            line: new LineTool(this.canvas),
            polyline: new PolylineTool(this.canvas),
            rectangle: new RectangleTool(this.canvas),
            circle: new CircleTool(this.canvas),
            arc: new ArcTool(this.canvas),
            offset: new OffsetTool(this.canvas),
            measure: new MeasureTool(this.canvas),
            dimension: new DimensionTool(this.canvas)
        };
    }

    setTool(toolName) {
        // Deactivate current tool
        if (this.tools[this.currentTool]) {
            this.tools[this.currentTool].deactivate();
        }

        this.currentTool = toolName;

        // Activate new tool
        if (this.tools[this.currentTool]) {
            this.tools[this.currentTool].activate();
        }
    }

    getCurrentTool() {
        return this.tools[this.currentTool];
    }

    handleMouseDown(e) {
        const tool = this.getCurrentTool();
        if (tool && tool.onMouseDown) {
            tool.onMouseDown(e);
        }
    }

    handleMouseMove(e) {
        const tool = this.getCurrentTool();
        if (tool && tool.onMouseMove) {
            tool.onMouseMove(e);
        }
    }

    handleMouseUp(e) {
        const tool = this.getCurrentTool();
        if (tool && tool.onMouseUp) {
            tool.onMouseUp(e);
        }
    }

    handleKeyDown(e) {
        const tool = this.getCurrentTool();
        if (tool && tool.onKeyDown) {
            tool.onKeyDown(e);
        }
    }
}

// Base Tool class
class Tool {
    constructor(canvas) {
        this.canvas = canvas;
        this.isActive = false;
    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    getSnappedPoint(worldPos) {
        return this.canvas.getSnappedPoint(worldPos);
    }
}

// Select Tool - for selecting and moving objects
class SelectTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.dragStart = null;
        this.dragging = false;
        this.panStart = null;
        this.panning = false;
        this.selectionBoxStart = null;
        this.selectionBoxEnd = null;
        this.isDraggingObject = false;
    }

    onMouseDown(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        // Right click or space+click for panning
        if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
            this.panning = true;
            this.panStart = { x: e.offsetX, y: e.offsetY };
            this.canvas.canvas.style.cursor = 'grabbing';
            e.preventDefault();
            return;
        }

        // Check if clicking on existing object
        const clickedObject = this.canvas.findObjectAt(worldPos);

        if (clickedObject) {
            if (!e.ctrlKey && !e.metaKey) {
                // Clear other selections if not holding ctrl/cmd
                this.canvas.clearSelection();
            }
            clickedObject.selected = true;
            this.dragStart = worldPos;
            this.dragging = true;
            this.isDraggingObject = true;
        } else {
            // Start selection box
            if (!e.ctrlKey && !e.metaKey) {
                this.canvas.clearSelection();
            }
            this.selectionBoxStart = worldPos;
            this.selectionBoxEnd = worldPos;
            this.dragging = false;
            this.isDraggingObject = false;
        }

        this.canvas.render();
    }

    onMouseMove(e) {
        if (this.panning && this.panStart) {
            const dx = e.offsetX - this.panStart.x;
            const dy = e.offsetY - this.panStart.y;
            this.canvas.pan(dx, dy);
            this.panStart = { x: e.offsetX, y: e.offsetY };
            return;
        }

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        // Dragging selection box
        if (this.selectionBoxStart && !this.isDraggingObject) {
            this.selectionBoxEnd = worldPos;
            this.canvas.previewSelectionBox = {
                start: this.selectionBoxStart,
                end: this.selectionBoxEnd
            };
            this.canvas.render();
            return;
        }

        // Dragging selected objects
        if (this.dragging && this.dragStart && this.isDraggingObject) {
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;

            // Move selected objects
            this.canvas.moveSelected(dx, dy);
            this.dragStart = worldPos;
            this.canvas.render();
        }
    }

    onMouseUp(e) {
        // Complete selection box
        if (this.selectionBoxStart && this.selectionBoxEnd && !this.isDraggingObject) {
            const minX = Math.min(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const maxX = Math.max(this.selectionBoxStart.x, this.selectionBoxEnd.x);
            const minY = Math.min(this.selectionBoxStart.y, this.selectionBoxEnd.y);
            const maxY = Math.max(this.selectionBoxStart.y, this.selectionBoxEnd.y);

            // Select all objects within the box
            this.canvas.selectInBox(minX, minY, maxX, maxY, e.ctrlKey || e.metaKey);

            this.selectionBoxStart = null;
            this.selectionBoxEnd = null;
            this.canvas.previewSelectionBox = null;
            this.canvas.render();
        }

        this.dragging = false;
        this.isDraggingObject = false;
        this.dragStart = null;
        this.panning = false;
        this.panStart = null;
        this.canvas.canvas.style.cursor = 'default';
    }

    deactivate() {
        super.deactivate();
        this.selectionBoxStart = null;
        this.selectionBoxEnd = null;
        this.canvas.previewSelectionBox = null;
        this.canvas.render();
    }
}

// Point Tool - for placing individual points
class PointTool extends Tool {
    onMouseDown(e) {
        if (e.button !== 0) return; // Only left click

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        const point = new Point(snapped.x, snapped.y);
        this.canvas.addPoint(point);
        this.canvas.render();
    }

    onMouseMove(e) {
        // Show preview
        this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        this.canvas.render();
    }

    deactivate() {
        super.deactivate();
        this.canvas.previewPoint = null;
        this.canvas.render();
    }
}

// Line Tool - for drawing single lines
class LineTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.startPoint = null;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        if (!this.startPoint) {
            this.startPoint = snapped;
        } else {
            const line = new Line(
                { x: this.startPoint.x, y: this.startPoint.y },
                { x: snapped.x, y: snapped.y }
            );
            this.canvas.addLine(line);
            this.startPoint = null;
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        if (this.startPoint) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const snapped = this.getSnappedPoint(worldPos);
            this.canvas.previewLine = {
                start: this.startPoint,
                end: snapped
            };
        } else {
            this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        }
        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.startPoint = null;
            this.canvas.previewLine = null;
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        this.startPoint = null;
        this.canvas.previewLine = null;
        this.canvas.previewPoint = null;
        this.canvas.render();
    }
}

// Polyline Tool - for drawing connected lines
class PolylineTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.points = [];
        this.currentPolyline = null;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        this.points.push({ x: snapped.x, y: snapped.y });

        if (!this.currentPolyline) {
            this.currentPolyline = new Polyline(this.points);
        }

        this.canvas.render();
    }

    onMouseMove(e) {
        if (this.points.length > 0) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const snapped = this.getSnappedPoint(worldPos);
            this.canvas.previewPolyline = {
                points: [...this.points, snapped],
                closed: false
            };
        } else {
            this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        }
        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape' || e.key === 'Enter') {
            if (this.currentPolyline && this.points.length >= 2) {
                this.currentPolyline.points = [...this.points];
                if (e.key === 'Enter') {
                    this.currentPolyline.close();
                }
                this.canvas.addPolyline(this.currentPolyline);
            }
            this.points = [];
            this.currentPolyline = null;
            this.canvas.previewPolyline = null;
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        if (this.currentPolyline && this.points.length >= 2) {
            this.currentPolyline.points = [...this.points];
            this.canvas.addPolyline(this.currentPolyline);
        }
        this.points = [];
        this.currentPolyline = null;
        this.canvas.previewPolyline = null;
        this.canvas.previewPoint = null;
        this.canvas.render();
    }
}

// Measure Tool - for measuring distances
class MeasureTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.startPoint = null;
        this.measurements = [];
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        if (!this.startPoint) {
            this.startPoint = snapped;
        } else {
            const distance = Geometry.distance(this.startPoint, snapped);
            const angle = Geometry.angleDegrees(this.startPoint, snapped);

            this.measurements.push({
                start: this.startPoint,
                end: snapped,
                distance: distance,
                angle: angle
            });

            this.canvas.setStatus(
                `Distance: ${distance.toFixed(2)} units, Angle: ${angle.toFixed(2)}°`
            );

            this.startPoint = null;
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        if (this.startPoint) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const snapped = this.getSnappedPoint(worldPos);
            const distance = Geometry.distance(this.startPoint, snapped);
            const angle = Geometry.angleDegrees(this.startPoint, snapped);

            this.canvas.previewMeasurement = {
                start: this.startPoint,
                end: snapped,
                distance: distance,
                angle: angle
            };

            this.canvas.setStatus(
                `Distance: ${distance.toFixed(2)} units, Angle: ${angle.toFixed(2)}°`
            );
        } else {
            this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        }
        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.startPoint = null;
            this.canvas.previewMeasurement = null;
            this.canvas.setStatus('Ready');
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        this.startPoint = null;
        this.canvas.previewMeasurement = null;
        this.canvas.previewPoint = null;
        this.canvas.setStatus('Ready');
        this.canvas.render();
    }
}

// Dimension Tool - for adding permanent dimension annotations
class DimensionTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.startPoint = null;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        if (!this.startPoint) {
            this.startPoint = snapped;
        } else {
            const dimension = new Dimension(
                { x: this.startPoint.x, y: this.startPoint.y },
                { x: snapped.x, y: snapped.y },
                20 // Default offset
            );
            this.canvas.addDimension(dimension);
            this.startPoint = null;
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        if (this.startPoint) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const snapped = this.getSnappedPoint(worldPos);
            this.canvas.previewDimension = {
                start: this.startPoint,
                end: snapped,
                offset: 20
            };
        } else {
            this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        }
        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.startPoint = null;
            this.canvas.previewDimension = null;
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        this.startPoint = null;
        this.canvas.previewDimension = null;
        this.canvas.previewPoint = null;
        this.canvas.render();
    }
}

// Rectangle Tool - for drawing rectangles
class RectangleTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.startPoint = null;
        this.isSquare = false;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        if (!this.startPoint) {
            this.startPoint = snapped;
            this.isSquare = e.shiftKey; // Hold shift for square
        } else {
            let endPoint = snapped;

            // If square mode, constrain to square
            if (this.isSquare) {
                const width = Math.abs(endPoint.x - this.startPoint.x);
                const height = Math.abs(endPoint.y - this.startPoint.y);
                const size = Math.max(width, height);

                endPoint = {
                    x: this.startPoint.x + (endPoint.x > this.startPoint.x ? size : -size),
                    y: this.startPoint.y + (endPoint.y > this.startPoint.y ? size : -size)
                };
            }

            const rectangle = new Rectangle(
                { x: this.startPoint.x, y: this.startPoint.y },
                { x: endPoint.x, y: endPoint.y }
            );
            this.canvas.addRectangle(rectangle);
            this.startPoint = null;
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        this.isSquare = e.shiftKey;

        if (this.startPoint) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const snapped = this.getSnappedPoint(worldPos);
            let endPoint = snapped;

            // If square mode, constrain to square
            if (this.isSquare) {
                const width = Math.abs(endPoint.x - this.startPoint.x);
                const height = Math.abs(endPoint.y - this.startPoint.y);
                const size = Math.max(width, height);

                endPoint = {
                    x: this.startPoint.x + (endPoint.x > this.startPoint.x ? size : -size),
                    y: this.startPoint.y + (endPoint.y > this.startPoint.y ? size : -size)
                };
            }

            this.canvas.previewRectangle = {
                corner1: this.startPoint,
                corner2: endPoint
            };
        } else {
            this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        }
        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.startPoint = null;
            this.canvas.previewRectangle = null;
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        this.startPoint = null;
        this.canvas.previewRectangle = null;
        this.canvas.previewPoint = null;
        this.canvas.render();
    }
}

// Circle Tool - for drawing circles
class CircleTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.centerPoint = null;
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        if (!this.centerPoint) {
            this.centerPoint = snapped;
        } else {
            const radius = Geometry.distance(this.centerPoint, snapped);
            const circle = new Circle(
                { x: this.centerPoint.x, y: this.centerPoint.y },
                radius
            );
            this.canvas.addCircle(circle);
            this.centerPoint = null;
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        if (this.centerPoint) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const snapped = this.getSnappedPoint(worldPos);
            const radius = Geometry.distance(this.centerPoint, snapped);

            this.canvas.previewCircle = {
                center: this.centerPoint,
                radius: radius
            };

            this.canvas.setStatus(
                `Radius: ${radius.toFixed(2)} units`
            );
        } else {
            this.canvas.previewPoint = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        }
        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.centerPoint = null;
            this.canvas.previewCircle = null;
            this.canvas.setStatus('Ready');
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        this.centerPoint = null;
        this.canvas.previewCircle = null;
        this.canvas.previewPoint = null;
        this.canvas.setStatus('Ready');
        this.canvas.render();
    }
}

// Arc Tool - for drawing arcs through three points
class ArcTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.points = [];
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        this.points.push(snapped);

        if (this.points.length === 3) {
            const arc = Arc.fromThreePoints(this.points[0], this.points[1], this.points[2]);

            if (arc) {
                this.canvas.addArc(arc);
            } else {
                this.canvas.setStatus('Points are collinear - cannot create arc');
            }

            this.points = [];
            this.canvas.previewArc = null;
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.getSnappedPoint(worldPos);

        if (this.points.length === 0) {
            this.canvas.previewPoint = snapped;
        } else if (this.points.length === 1) {
            this.canvas.previewLine = {
                start: this.points[0],
                end: snapped
            };
        } else if (this.points.length === 2) {
            const previewArc = Arc.fromThreePoints(this.points[0], this.points[1], snapped);
            if (previewArc) {
                this.canvas.previewArc = previewArc;
            }
        }

        this.canvas.render();
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.points = [];
            this.canvas.previewArc = null;
            this.canvas.previewLine = null;
            this.canvas.previewPoint = null;
            this.canvas.setStatus('Ready');
            this.canvas.render();
        }
    }

    deactivate() {
        super.deactivate();
        this.points = [];
        this.canvas.previewArc = null;
        this.canvas.previewLine = null;
        this.canvas.previewPoint = null;
        this.canvas.setStatus('Ready');
        this.canvas.render();
    }
}

// Offset Tool - for creating offset lines
class OffsetTool extends Tool {
    constructor(canvas) {
        super(canvas);
        this.selectedLine = null;
        this.offsetDistance = 10; // Default offset distance
    }

    onMouseDown(e) {
        if (e.button !== 0) return;

        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        // Find a line near the click
        const nearestLine = this.findNearestLine(worldPos);

        if (nearestLine) {
            this.selectedLine = nearestLine;
            this.canvas.setStatus(`Line selected. Click to set offset distance, or enter distance (current: ${this.offsetDistance})`);
        } else if (this.selectedLine) {
            // Calculate which side to offset based on click position
            const lineAngle = this.selectedLine.angle();
            const perpAngle = lineAngle + Math.PI / 2;

            // Determine offset direction
            const lineMid = this.selectedLine.midpoint();
            const toClick = Math.atan2(worldPos.y - lineMid.y, worldPos.x - lineMid.x);
            const angleDiff = toClick - perpAngle;
            const distance = angleDiff > -Math.PI && angleDiff < 0 ? -this.offsetDistance : this.offsetDistance;

            const offsetLine = Geometry.offsetLine(this.selectedLine, distance);
            this.canvas.addLine(offsetLine);

            this.selectedLine = null;
            this.canvas.previewOffsetLine = null;
            this.canvas.setStatus('Ready');
            this.canvas.render();
        }
    }

    onMouseMove(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);

        if (this.selectedLine) {
            // Show preview of offset line
            const lineAngle = this.selectedLine.angle();
            const perpAngle = lineAngle + Math.PI / 2;

            const lineMid = this.selectedLine.midpoint();
            const toClick = Math.atan2(worldPos.y - lineMid.y, worldPos.x - lineMid.x);
            const angleDiff = toClick - perpAngle;
            const distance = angleDiff > -Math.PI && angleDiff < 0 ? -this.offsetDistance : this.offsetDistance;

            this.canvas.previewOffsetLine = Geometry.offsetLine(this.selectedLine, distance);
        }

        this.canvas.render();
    }

    findNearestLine(worldPos) {
        let nearestLine = null;
        let minDist = 10 / this.canvas.zoom; // 10 pixel threshold in world units

        this.canvas.lines.forEach(line => {
            const dist = line.distanceToPoint(worldPos);
            if (dist < minDist) {
                minDist = dist;
                nearestLine = line;
            }
        });

        return nearestLine;
    }

    onKeyDown(e) {
        if (e.key === 'Escape') {
            this.selectedLine = null;
            this.canvas.previewOffsetLine = null;
            this.canvas.setStatus('Ready');
            this.canvas.render();
        }

        // Allow entering numeric offset distance
        if (this.selectedLine && e.key >= '0' && e.key <= '9') {
            const distance = parseFloat(prompt('Enter offset distance:', this.offsetDistance));
            if (!isNaN(distance)) {
                this.offsetDistance = distance;
                this.canvas.setStatus(`Offset distance set to ${this.offsetDistance}`);
            }
        }
    }

    deactivate() {
        super.deactivate();
        this.selectedLine = null;
        this.canvas.previewOffsetLine = null;
        this.canvas.setStatus('Ready');
        this.canvas.render();
    }
}
