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
        } else {
            // Clear selection if clicking empty space
            if (!e.ctrlKey && !e.metaKey) {
                this.canvas.clearSelection();
            }
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

        if (this.dragging && this.dragStart) {
            const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
            const dx = worldPos.x - this.dragStart.x;
            const dy = worldPos.y - this.dragStart.y;

            // Move selected objects
            this.canvas.moveSelected(dx, dy);
            this.dragStart = worldPos;
            this.canvas.render();
        }
    }

    onMouseUp(e) {
        this.dragging = false;
        this.dragStart = null;
        this.panning = false;
        this.panStart = null;
        this.canvas.canvas.style.cursor = 'default';
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
