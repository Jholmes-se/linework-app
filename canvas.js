// Canvas rendering and interaction management

class DrawingCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Drawing data
        this.points = [];
        this.lines = [];
        this.polylines = [];
        this.dimensions = [];
        this.rectangles = [];
        this.circles = [];
        this.arcs = [];

        // View transformation
        this.offsetX = 0;
        this.offsetY = 0;
        this.zoom = 1;

        // Grid settings
        this.gridSize = 10;
        this.showGrid = true;
        this.snapToGrid = true;
        this.snapToPoints = true;
        this.snapDistance = 10; // pixels

        // Preview objects
        this.previewPoint = null;
        this.previewLine = null;
        this.previewPolyline = null;
        this.previewDimension = null;
        this.previewMeasurement = null;
        this.previewRectangle = null;
        this.previewCircle = null;
        this.previewArc = null;
        this.previewOffsetLine = null;

        // Setup canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Center the view on first load
        if (this.offsetX === 0 && this.offsetY === 0) {
            this.offsetX = this.canvas.width / 2;
            this.offsetY = this.canvas.height / 2;
        }

        this.render();
    }

    handleWheel(e) {
        e.preventDefault();

        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        // Get world position before zoom
        const worldBefore = this.screenToWorld(mouseX, mouseY);

        // Update zoom
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom *= zoomFactor;
        this.zoom = Math.max(0.1, Math.min(10, this.zoom)); // Clamp zoom

        // Get world position after zoom
        const worldAfter = this.screenToWorld(mouseX, mouseY);

        // Adjust offset to keep mouse position stable
        this.offsetX += (worldAfter.x - worldBefore.x) * this.zoom;
        this.offsetY += (worldAfter.y - worldBefore.y) * this.zoom;

        this.render();
        this.updateZoomDisplay();
    }

    pan(dx, dy) {
        this.offsetX += dx;
        this.offsetY += dy;
        this.render();
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / this.zoom,
            y: (screenY - this.offsetY) / this.zoom
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: worldX * this.zoom + this.offsetX,
            y: worldY * this.zoom + this.offsetY
        };
    }

    getSnappedPoint(worldPos) {
        let snapped = { ...worldPos };

        // Snap to points first (higher priority)
        if (this.snapToPoints) {
            const screenPos = this.worldToScreen(worldPos.x, worldPos.y);
            let minDist = this.snapDistance;
            let nearestPoint = null;

            // Check all points
            this.points.forEach(point => {
                const sp = this.worldToScreen(point.x, point.y);
                const dist = Math.sqrt(
                    Math.pow(sp.x - screenPos.x, 2) +
                    Math.pow(sp.y - screenPos.y, 2)
                );
                if (dist < minDist) {
                    minDist = dist;
                    nearestPoint = point;
                }
            });

            // Check line endpoints
            this.lines.forEach(line => {
                [line.start, line.end].forEach(point => {
                    const sp = this.worldToScreen(point.x, point.y);
                    const dist = Math.sqrt(
                        Math.pow(sp.x - screenPos.x, 2) +
                        Math.pow(sp.y - screenPos.y, 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearestPoint = point;
                    }
                });
            });

            // Check polyline points
            this.polylines.forEach(polyline => {
                polyline.points.forEach(point => {
                    const sp = this.worldToScreen(point.x, point.y);
                    const dist = Math.sqrt(
                        Math.pow(sp.x - screenPos.x, 2) +
                        Math.pow(sp.y - screenPos.y, 2)
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        nearestPoint = point;
                    }
                });
            });

            if (nearestPoint) {
                return { x: nearestPoint.x, y: nearestPoint.y };
            }
        }

        // Snap to grid
        if (this.snapToGrid) {
            snapped.x = Math.round(worldPos.x / this.gridSize) * this.gridSize;
            snapped.y = Math.round(worldPos.y / this.gridSize) * this.gridSize;
        }

        return snapped;
    }

    findObjectAt(worldPos, threshold = 5) {
        const screenPos = this.worldToScreen(worldPos.x, worldPos.y);
        const worldThreshold = threshold / this.zoom;

        // Check points
        for (const point of this.points) {
            if (Geometry.distance(worldPos, point) < worldThreshold) {
                return point;
            }
        }

        // Check lines
        for (const line of this.lines) {
            if (line.distanceToPoint(worldPos) < worldThreshold) {
                return line;
            }
        }

        // Check polylines
        for (const polyline of this.polylines) {
            for (let i = 0; i < polyline.points.length - 1; i++) {
                const tempLine = new Line(polyline.points[i], polyline.points[i + 1]);
                if (tempLine.distanceToPoint(worldPos) < worldThreshold) {
                    return polyline;
                }
            }
        }

        // Check dimensions
        for (const dimension of this.dimensions) {
            if (Geometry.distance(worldPos, dimension.start) < worldThreshold ||
                Geometry.distance(worldPos, dimension.end) < worldThreshold) {
                return dimension;
            }
        }

        // Check rectangles
        for (const rectangle of this.rectangles) {
            if (worldPos.x >= rectangle.x && worldPos.x <= rectangle.x + rectangle.width &&
                worldPos.y >= rectangle.y && worldPos.y <= rectangle.y + rectangle.height) {
                return rectangle;
            }
        }

        // Check circles
        for (const circle of this.circles) {
            if (circle.distanceToPoint(worldPos) < worldThreshold) {
                return circle;
            }
        }

        // Check arcs
        for (const arc of this.arcs) {
            const dist = Math.sqrt(
                Math.pow(worldPos.x - arc.center.x, 2) +
                Math.pow(worldPos.y - arc.center.y, 2)
            );
            if (Math.abs(dist - arc.radius) < worldThreshold) {
                // Check if point is within arc angle range
                const angle = Math.atan2(worldPos.y - arc.center.y, worldPos.x - arc.center.x);
                let startAngle = arc.startAngle;
                let endAngle = arc.endAngle;

                // Normalize angles
                while (endAngle < startAngle) endAngle += 2 * Math.PI;
                let checkAngle = angle;
                while (checkAngle < startAngle) checkAngle += 2 * Math.PI;

                if (checkAngle >= startAngle && checkAngle <= endAngle) {
                    return arc;
                }
            }
        }

        return null;
    }

    clearSelection() {
        this.points.forEach(p => p.selected = false);
        this.lines.forEach(l => l.selected = false);
        this.polylines.forEach(pl => pl.selected = false);
        this.dimensions.forEach(d => d.selected = false);
        this.rectangles.forEach(r => r.selected = false);
        this.circles.forEach(c => c.selected = false);
        this.arcs.forEach(a => a.selected = false);
    }

    moveSelected(dx, dy) {
        this.points.forEach(point => {
            if (point.selected) {
                point.x += dx;
                point.y += dy;
            }
        });

        this.lines.forEach(line => {
            if (line.selected) {
                line.start.x += dx;
                line.start.y += dy;
                line.end.x += dx;
                line.end.y += dy;
            }
        });

        this.polylines.forEach(polyline => {
            if (polyline.selected) {
                polyline.points.forEach(point => {
                    point.x += dx;
                    point.y += dy;
                });
            }
        });

        this.dimensions.forEach(dimension => {
            if (dimension.selected) {
                dimension.start.x += dx;
                dimension.start.y += dy;
                dimension.end.x += dx;
                dimension.end.y += dy;
            }
        });

        this.rectangles.forEach(rectangle => {
            if (rectangle.selected) {
                rectangle.corner1.x += dx;
                rectangle.corner1.y += dy;
                rectangle.corner2.x += dx;
                rectangle.corner2.y += dy;
            }
        });

        this.circles.forEach(circle => {
            if (circle.selected) {
                circle.center.x += dx;
                circle.center.y += dy;
            }
        });

        this.arcs.forEach(arc => {
            if (arc.selected) {
                arc.center.x += dx;
                arc.center.y += dy;
            }
        });
    }

    deleteSelected() {
        this.points = this.points.filter(p => !p.selected);
        this.lines = this.lines.filter(l => !l.selected);
        this.polylines = this.polylines.filter(pl => !pl.selected);
        this.dimensions = this.dimensions.filter(d => !d.selected);
        this.rectangles = this.rectangles.filter(r => !r.selected);
        this.circles = this.circles.filter(c => !c.selected);
        this.arcs = this.arcs.filter(a => !a.selected);
        this.render();
    }

    // Add objects
    addPoint(point) {
        this.points.push(point);
    }

    addLine(line) {
        this.lines.push(line);
    }

    addPolyline(polyline) {
        this.polylines.push(polyline);
    }

    addDimension(dimension) {
        this.dimensions.push(dimension);
    }

    addRectangle(rectangle) {
        this.rectangles.push(rectangle);
    }

    addCircle(circle) {
        this.circles.push(circle);
    }

    addArc(arc) {
        this.arcs.push(arc);
    }

    // Clear all
    clearAll() {
        this.points = [];
        this.lines = [];
        this.polylines = [];
        this.dimensions = [];
        this.rectangles = [];
        this.circles = [];
        this.arcs = [];
        this.render();
    }

    // Rendering
    render() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        ctx.save();

        // Draw grid
        if (this.showGrid) {
            this.drawGrid();
        }

        // Draw axes
        this.drawAxes();

        // Draw all objects
        this.drawRectangles();
        this.drawCircles();
        this.drawArcs();
        this.drawLines();
        this.drawPolylines();
        this.drawDimensions();
        this.drawPoints();

        // Draw preview objects
        if (this.previewRectangle) {
            this.drawPreviewRectangle(this.previewRectangle);
        }
        if (this.previewCircle) {
            this.drawPreviewCircle(this.previewCircle);
        }
        if (this.previewArc) {
            this.drawPreviewArc(this.previewArc);
        }
        if (this.previewOffsetLine) {
            this.drawPreviewLine(this.previewOffsetLine);
        }
        if (this.previewLine) {
            this.drawPreviewLine(this.previewLine);
        }
        if (this.previewPolyline) {
            this.drawPreviewPolyline(this.previewPolyline);
        }
        if (this.previewDimension) {
            this.drawPreviewDimension(this.previewDimension);
        }
        if (this.previewMeasurement) {
            this.drawMeasurement(this.previewMeasurement);
        }
        if (this.previewPoint) {
            this.drawPreviewPoint(this.previewPoint);
        }

        ctx.restore();
    }

    drawGrid() {
        const ctx = this.ctx;
        const gridWorldSize = this.gridSize;
        const gridScreenSize = gridWorldSize * this.zoom;

        // Only draw grid if it's not too dense or too sparse
        if (gridScreenSize < 5 || gridScreenSize > 200) return;

        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1;

        // Calculate visible grid range
        const startWorld = this.screenToWorld(0, 0);
        const endWorld = this.screenToWorld(this.canvas.width, this.canvas.height);

        const startX = Math.floor(startWorld.x / gridWorldSize) * gridWorldSize;
        const startY = Math.floor(startWorld.y / gridWorldSize) * gridWorldSize;
        const endX = Math.ceil(endWorld.x / gridWorldSize) * gridWorldSize;
        const endY = Math.ceil(endWorld.y / gridWorldSize) * gridWorldSize;

        // Vertical lines
        for (let x = startX; x <= endX; x += gridWorldSize) {
            const screenPos = this.worldToScreen(x, 0);
            ctx.beginPath();
            ctx.moveTo(screenPos.x, 0);
            ctx.lineTo(screenPos.x, this.canvas.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += gridWorldSize) {
            const screenPos = this.worldToScreen(0, y);
            ctx.beginPath();
            ctx.moveTo(0, screenPos.y);
            ctx.lineTo(this.canvas.width, screenPos.y);
            ctx.stroke();
        }
    }

    drawAxes() {
        const ctx = this.ctx;
        const origin = this.worldToScreen(0, 0);

        // X axis
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(this.canvas.width, origin.y);
        ctx.stroke();

        // Y axis
        ctx.strokeStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, this.canvas.height);
        ctx.stroke();
    }

    drawPoints() {
        const ctx = this.ctx;

        this.points.forEach(point => {
            const screen = this.worldToScreen(point.x, point.y);

            ctx.fillStyle = point.selected ? '#4a9eff' : '#ff4444';
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 4, 0, Math.PI * 2);
            ctx.fill();

            // Draw point coordinates
            if (this.zoom > 0.5) {
                ctx.fillStyle = '#aaa';
                ctx.font = '11px monospace';
                ctx.fillText(
                    `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`,
                    screen.x + 8,
                    screen.y - 8
                );
            }
        });
    }

    drawLines() {
        const ctx = this.ctx;

        this.lines.forEach(line => {
            const start = this.worldToScreen(line.start.x, line.start.y);
            const end = this.worldToScreen(line.end.x, line.end.y);

            ctx.strokeStyle = line.selected ? '#4a9eff' : '#ffffff';
            ctx.lineWidth = line.selected ? 3 : 2;
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Draw endpoints
            ctx.fillStyle = line.selected ? '#4a9eff' : '#888';
            [start, end].forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    drawPolylines() {
        const ctx = this.ctx;

        this.polylines.forEach(polyline => {
            if (polyline.points.length < 2) return;

            ctx.strokeStyle = polyline.selected ? '#4a9eff' : '#ffffff';
            ctx.lineWidth = polyline.selected ? 3 : 2;
            ctx.beginPath();

            const firstPoint = this.worldToScreen(polyline.points[0].x, polyline.points[0].y);
            ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < polyline.points.length; i++) {
                const point = this.worldToScreen(polyline.points[i].x, polyline.points[i].y);
                ctx.lineTo(point.x, point.y);
            }

            if (polyline.closed) {
                ctx.closePath();
            }

            ctx.stroke();

            // Draw vertices
            ctx.fillStyle = polyline.selected ? '#4a9eff' : '#888';
            polyline.points.forEach(point => {
                const screen = this.worldToScreen(point.x, point.y);
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    }

    drawDimensions() {
        const ctx = this.ctx;

        this.dimensions.forEach(dimension => {
            const start = this.worldToScreen(dimension.start.x, dimension.start.y);
            const end = this.worldToScreen(dimension.end.x, dimension.end.y);

            // Calculate perpendicular offset
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const perpAngle = angle + Math.PI / 2;
            const offsetDist = dimension.offset * this.zoom;

            const offsetStart = {
                x: start.x + Math.cos(perpAngle) * offsetDist,
                y: start.y + Math.sin(perpAngle) * offsetDist
            };
            const offsetEnd = {
                x: end.x + Math.cos(perpAngle) * offsetDist,
                y: end.y + Math.sin(perpAngle) * offsetDist
            };

            ctx.strokeStyle = dimension.selected ? '#4a9eff' : '#ffff00';
            ctx.lineWidth = 1;

            // Extension lines
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(offsetStart.x, offsetStart.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(offsetEnd.x, offsetEnd.y);
            ctx.stroke();

            // Dimension line
            ctx.setLineDash([]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(offsetStart.x, offsetStart.y);
            ctx.lineTo(offsetEnd.x, offsetEnd.y);
            ctx.stroke();

            // Arrows
            this.drawArrow(ctx, offsetStart, offsetEnd, 10);
            this.drawArrow(ctx, offsetEnd, offsetStart, 10);

            // Text
            const midX = (offsetStart.x + offsetEnd.x) / 2;
            const midY = (offsetStart.y + offsetEnd.y) / 2;
            const length = dimension.length();

            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(length.toFixed(2), midX, midY - 5);
        });

        ctx.setLineDash([]);
    }

    drawArrow(ctx, from, to, size) {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(
            from.x + size * Math.cos(angle - Math.PI / 6),
            from.y + size * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(
            from.x + size * Math.cos(angle + Math.PI / 6),
            from.y + size * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }

    drawPreviewLine(line) {
        const ctx = this.ctx;
        const start = this.worldToScreen(line.start.x, line.start.y);
        const end = this.worldToScreen(line.end.x, line.end.y);

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw length
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const length = Geometry.distance(line.start, line.end);

        ctx.fillStyle = '#4a9eff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(length.toFixed(2), midX, midY - 5);
    }

    drawPreviewPolyline(polyline) {
        const ctx = this.ctx;
        if (polyline.points.length < 2) return;

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();

        const firstPoint = this.worldToScreen(polyline.points[0].x, polyline.points[0].y);
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < polyline.points.length; i++) {
            const point = this.worldToScreen(polyline.points[i].x, polyline.points[i].y);
            ctx.lineTo(point.x, point.y);
        }

        ctx.stroke();
        ctx.setLineDash([]);
    }

    drawPreviewDimension(dimension) {
        this.drawDimensions(); // Will draw all dimensions including preview
    }

    drawMeasurement(measurement) {
        const ctx = this.ctx;
        const start = this.worldToScreen(measurement.start.x, measurement.start.y);
        const end = this.worldToScreen(measurement.end.x, measurement.end.y);

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw measurement text
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${measurement.distance.toFixed(2)} units`, midX, midY - 10);
        ctx.fillText(`${measurement.angle.toFixed(2)}°`, midX, midY + 10);
    }

    drawPreviewPoint(point) {
        const ctx = this.ctx;
        const snapped = this.getSnappedPoint(point);
        const screen = this.worldToScreen(snapped.x, snapped.y);

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawRectangles() {
        const ctx = this.ctx;

        this.rectangles.forEach(rectangle => {
            const topLeft = this.worldToScreen(rectangle.x, rectangle.y);
            const width = rectangle.width * this.zoom;
            const height = rectangle.height * this.zoom;

            ctx.strokeStyle = rectangle.selected ? '#4a9eff' : '#ffffff';
            ctx.lineWidth = rectangle.selected ? 3 : 2;
            ctx.beginPath();
            ctx.rect(topLeft.x, topLeft.y, width, height);
            ctx.stroke();

            // Draw corner points
            if (rectangle.selected) {
                ctx.fillStyle = '#4a9eff';
                [
                    { x: rectangle.x, y: rectangle.y },
                    { x: rectangle.x + rectangle.width, y: rectangle.y },
                    { x: rectangle.x, y: rectangle.y + rectangle.height },
                    { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height }
                ].forEach(corner => {
                    const screen = this.worldToScreen(corner.x, corner.y);
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 3, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        });
    }

    drawCircles() {
        const ctx = this.ctx;

        this.circles.forEach(circle => {
            const center = this.worldToScreen(circle.center.x, circle.center.y);
            const radius = circle.radius * this.zoom;

            ctx.strokeStyle = circle.selected ? '#4a9eff' : '#ffffff';
            ctx.lineWidth = circle.selected ? 3 : 2;
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            ctx.stroke();

            // Draw center point
            ctx.fillStyle = circle.selected ? '#4a9eff' : '#888';
            ctx.beginPath();
            ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw radius line if selected
            if (circle.selected) {
                ctx.strokeStyle = '#4a9eff';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(center.x, center.y);
                ctx.lineTo(center.x + radius, center.y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });
    }

    drawArcs() {
        const ctx = this.ctx;

        this.arcs.forEach(arc => {
            const center = this.worldToScreen(arc.center.x, arc.center.y);
            const radius = arc.radius * this.zoom;

            ctx.strokeStyle = arc.selected ? '#4a9eff' : '#ffffff';
            ctx.lineWidth = arc.selected ? 3 : 2;
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, arc.startAngle, arc.endAngle);
            ctx.stroke();

            // Draw center and endpoints
            if (arc.selected) {
                ctx.fillStyle = '#4a9eff';

                // Center
                ctx.beginPath();
                ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
                ctx.fill();

                // Start point
                const start = this.worldToScreen(arc.startPoint.x, arc.startPoint.y);
                ctx.beginPath();
                ctx.arc(start.x, start.y, 4, 0, Math.PI * 2);
                ctx.fill();

                // End point
                const end = this.worldToScreen(arc.endPoint.x, arc.endPoint.y);
                ctx.beginPath();
                ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    drawPreviewRectangle(rectangle) {
        const ctx = this.ctx;
        const topLeft = this.worldToScreen(
            Math.min(rectangle.corner1.x, rectangle.corner2.x),
            Math.min(rectangle.corner1.y, rectangle.corner2.y)
        );
        const width = Math.abs(rectangle.corner2.x - rectangle.corner1.x) * this.zoom;
        const height = Math.abs(rectangle.corner2.y - rectangle.corner1.y) * this.zoom;

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.rect(topLeft.x, topLeft.y, width, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw dimensions
        ctx.fillStyle = '#4a9eff';
        ctx.font = '12px monospace';
        const w = Math.abs(rectangle.corner2.x - rectangle.corner1.x);
        const h = Math.abs(rectangle.corner2.y - rectangle.corner1.y);
        ctx.fillText(`${w.toFixed(2)} × ${h.toFixed(2)}`, topLeft.x + 5, topLeft.y - 5);
    }

    drawPreviewCircle(circle) {
        const ctx = this.ctx;
        const center = this.worldToScreen(circle.center.x, circle.center.y);
        const radius = circle.radius * this.zoom;

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw radius line
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(center.x + radius, center.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw center
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawPreviewArc(arc) {
        const ctx = this.ctx;
        const center = this.worldToScreen(arc.center.x, arc.center.y);
        const radius = arc.radius * this.zoom;

        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, arc.startAngle, arc.endAngle);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw center
        ctx.fillStyle = '#4a9eff';
        ctx.beginPath();
        ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    setStatus(text) {
        const statusElement = document.getElementById('statusText');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }

    updateZoomDisplay() {
        const zoomElement = document.getElementById('zoomLevel');
        if (zoomElement) {
            zoomElement.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }
}
