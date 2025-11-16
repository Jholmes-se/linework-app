// Advanced editing operations: copy, paste, rotate, scale, mirror

class EditOperations {
    constructor(canvas) {
        this.canvas = canvas;
        this.clipboard = [];
    }

    // Copy selected objects to clipboard
    copy() {
        this.clipboard = [];

        // Copy all selected objects
        this.canvas.points.forEach(p => {
            if (p.selected) {
                this.clipboard.push({ type: 'point', data: { x: p.x, y: p.y, layerId: p.layerId } });
            }
        });

        this.canvas.lines.forEach(l => {
            if (l.selected) {
                this.clipboard.push({
                    type: 'line',
                    data: {
                        start: { x: l.start.x, y: l.start.y },
                        end: { x: l.end.x, y: l.end.y },
                        layerId: l.layerId
                    }
                });
            }
        });

        this.canvas.polylines.forEach(pl => {
            if (pl.selected) {
                this.clipboard.push({
                    type: 'polyline',
                    data: {
                        points: pl.points.map(p => ({ x: p.x, y: p.y })),
                        closed: pl.closed,
                        layerId: pl.layerId
                    }
                });
            }
        });

        this.canvas.rectangles.forEach(r => {
            if (r.selected) {
                this.clipboard.push({
                    type: 'rectangle',
                    data: {
                        corner1: { x: r.corner1.x, y: r.corner1.y },
                        corner2: { x: r.corner2.x, y: r.corner2.y },
                        layerId: r.layerId
                    }
                });
            }
        });

        this.canvas.circles.forEach(c => {
            if (c.selected) {
                this.clipboard.push({
                    type: 'circle',
                    data: {
                        center: { x: c.center.x, y: c.center.y },
                        radius: c.radius,
                        layerId: c.layerId
                    }
                });
            }
        });

        this.canvas.arcs.forEach(a => {
            if (a.selected) {
                this.clipboard.push({
                    type: 'arc',
                    data: {
                        center: { x: a.center.x, y: a.center.y },
                        radius: a.radius,
                        startAngle: a.startAngle,
                        endAngle: a.endAngle,
                        layerId: a.layerId
                    }
                });
            }
        });

        this.canvas.dimensions.forEach(d => {
            if (d.selected) {
                this.clipboard.push({
                    type: 'dimension',
                    data: {
                        start: { x: d.start.x, y: d.start.y },
                        end: { x: d.end.x, y: d.end.y },
                        offset: d.offset,
                        layerId: d.layerId
                    }
                });
            }
        });

        this.canvas.texts.forEach(t => {
            if (t.selected) {
                this.clipboard.push({
                    type: 'text',
                    data: {
                        position: { x: t.position.x, y: t.position.y },
                        content: t.content,
                        fontSize: t.fontSize,
                        font: t.font,
                        color: t.color,
                        alignment: t.alignment,
                        layerId: t.layerId
                    }
                });
            }
        });

        return this.clipboard.length;
    }

    // Paste clipboard contents with offset
    paste(offsetX = 10, offsetY = 10) {
        if (this.clipboard.length === 0) return 0;

        this.canvas.clearSelection();

        this.clipboard.forEach(item => {
            switch (item.type) {
                case 'point':
                    const p = new Point(
                        item.data.x + offsetX,
                        item.data.y + offsetY,
                        null,
                        item.data.layerId
                    );
                    p.selected = true;
                    this.canvas.addPoint(p);
                    break;

                case 'line':
                    const l = new Line(
                        { x: item.data.start.x + offsetX, y: item.data.start.y + offsetY },
                        { x: item.data.end.x + offsetX, y: item.data.end.y + offsetY },
                        null,
                        item.data.layerId
                    );
                    l.selected = true;
                    this.canvas.addLine(l);
                    break;

                case 'polyline':
                    const pl = new Polyline(
                        item.data.points.map(p => ({ x: p.x + offsetX, y: p.y + offsetY })),
                        null,
                        item.data.layerId
                    );
                    pl.closed = item.data.closed;
                    pl.selected = true;
                    this.canvas.addPolyline(pl);
                    break;

                case 'rectangle':
                    const r = new Rectangle(
                        { x: item.data.corner1.x + offsetX, y: item.data.corner1.y + offsetY },
                        { x: item.data.corner2.x + offsetX, y: item.data.corner2.y + offsetY },
                        null,
                        item.data.layerId
                    );
                    r.selected = true;
                    this.canvas.addRectangle(r);
                    break;

                case 'circle':
                    const c = new Circle(
                        { x: item.data.center.x + offsetX, y: item.data.center.y + offsetY },
                        item.data.radius,
                        null,
                        item.data.layerId
                    );
                    c.selected = true;
                    this.canvas.addCircle(c);
                    break;

                case 'arc':
                    const a = new Arc(
                        { x: item.data.center.x + offsetX, y: item.data.center.y + offsetY },
                        item.data.radius,
                        item.data.startAngle,
                        item.data.endAngle,
                        null,
                        item.data.layerId
                    );
                    a.selected = true;
                    this.canvas.addArc(a);
                    break;

                case 'dimension':
                    const d = new Dimension(
                        { x: item.data.start.x + offsetX, y: item.data.start.y + offsetY },
                        { x: item.data.end.x + offsetX, y: item.data.end.y + offsetY },
                        item.data.offset,
                        null,
                        item.data.layerId
                    );
                    d.selected = true;
                    this.canvas.addDimension(d);
                    break;

                case 'text':
                    const t = new Text(
                        { x: item.data.position.x + offsetX, y: item.data.position.y + offsetY },
                        item.data.content,
                        item.data.fontSize,
                        null,
                        item.data.layerId
                    );
                    t.font = item.data.font;
                    t.color = item.data.color;
                    t.alignment = item.data.alignment;
                    t.selected = true;
                    this.canvas.addText(t);
                    break;
            }
        });

        this.canvas.render();
        return this.clipboard.length;
    }

    // Rotate selected objects around a center point
    rotate(centerX, centerY, angleDegrees) {
        const angleRad = angleDegrees * Math.PI / 180;
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);

        const rotatePoint = (point) => {
            const dx = point.x - centerX;
            const dy = point.y - centerY;
            return {
                x: centerX + dx * cos - dy * sin,
                y: centerY + dx * sin + dy * cos
            };
        };

        this.canvas.points.forEach(p => {
            if (p.selected) {
                const rotated = rotatePoint(p);
                p.x = rotated.x;
                p.y = rotated.y;
            }
        });

        this.canvas.lines.forEach(l => {
            if (l.selected) {
                const start = rotatePoint(l.start);
                const end = rotatePoint(l.end);
                l.start.x = start.x;
                l.start.y = start.y;
                l.end.x = end.x;
                l.end.y = end.y;
            }
        });

        this.canvas.polylines.forEach(pl => {
            if (pl.selected) {
                pl.points.forEach(p => {
                    const rotated = rotatePoint(p);
                    p.x = rotated.x;
                    p.y = rotated.y;
                });
            }
        });

        this.canvas.rectangles.forEach(r => {
            if (r.selected) {
                const c1 = rotatePoint(r.corner1);
                const c2 = rotatePoint(r.corner2);
                r.corner1.x = c1.x;
                r.corner1.y = c1.y;
                r.corner2.x = c2.x;
                r.corner2.y = c2.y;
            }
        });

        this.canvas.circles.forEach(c => {
            if (c.selected) {
                const center = rotatePoint(c.center);
                c.center.x = center.x;
                c.center.y = center.y;
            }
        });

        this.canvas.arcs.forEach(a => {
            if (a.selected) {
                const center = rotatePoint(a.center);
                a.center.x = center.x;
                a.center.y = center.y;
                a.startAngle += angleRad;
                a.endAngle += angleRad;
            }
        });

        this.canvas.dimensions.forEach(d => {
            if (d.selected) {
                const start = rotatePoint(d.start);
                const end = rotatePoint(d.end);
                d.start.x = start.x;
                d.start.y = start.y;
                d.end.x = end.x;
                d.end.y = end.y;
            }
        });

        this.canvas.texts.forEach(t => {
            if (t.selected) {
                const pos = rotatePoint(t.position);
                t.position.x = pos.x;
                t.position.y = pos.y;
            }
        });

        this.canvas.render();
    }

    // Scale selected objects from a center point
    scale(centerX, centerY, scaleX, scaleY = scaleX) {
        const scalePoint = (point) => {
            const dx = point.x - centerX;
            const dy = point.y - centerY;
            return {
                x: centerX + dx * scaleX,
                y: centerY + dy * scaleY
            };
        };

        this.canvas.points.forEach(p => {
            if (p.selected) {
                const scaled = scalePoint(p);
                p.x = scaled.x;
                p.y = scaled.y;
            }
        });

        this.canvas.lines.forEach(l => {
            if (l.selected) {
                const start = scalePoint(l.start);
                const end = scalePoint(l.end);
                l.start.x = start.x;
                l.start.y = start.y;
                l.end.x = end.x;
                l.end.y = end.y;
            }
        });

        this.canvas.polylines.forEach(pl => {
            if (pl.selected) {
                pl.points.forEach(p => {
                    const scaled = scalePoint(p);
                    p.x = scaled.x;
                    p.y = scaled.y;
                });
            }
        });

        this.canvas.rectangles.forEach(r => {
            if (r.selected) {
                const c1 = scalePoint(r.corner1);
                const c2 = scalePoint(r.corner2);
                r.corner1.x = c1.x;
                r.corner1.y = c1.y;
                r.corner2.x = c2.x;
                r.corner2.y = c2.y;
            }
        });

        this.canvas.circles.forEach(c => {
            if (c.selected) {
                const center = scalePoint(c.center);
                c.center.x = center.x;
                c.center.y = center.y;
                c.radius *= scaleX;
            }
        });

        this.canvas.arcs.forEach(a => {
            if (a.selected) {
                const center = scalePoint(a.center);
                a.center.x = center.x;
                a.center.y = center.y;
                a.radius *= scaleX;
            }
        });

        this.canvas.dimensions.forEach(d => {
            if (d.selected) {
                const start = scalePoint(d.start);
                const end = scalePoint(d.end);
                d.start.x = start.x;
                d.start.y = start.y;
                d.end.x = end.x;
                d.end.y = end.y;
            }
        });

        this.canvas.texts.forEach(t => {
            if (t.selected) {
                const pos = scalePoint(t.position);
                t.position.x = pos.x;
                t.position.y = pos.y;
                t.fontSize *= scaleX;
            }
        });

        this.canvas.render();
    }

    // Mirror/flip selected objects
    mirror(axis, value) {
        const mirrorPoint = (point) => {
            if (axis === 'x') {
                return { x: 2 * value - point.x, y: point.y };
            } else { // 'y'
                return { x: point.x, y: 2 * value - point.y };
            }
        };

        this.canvas.points.forEach(p => {
            if (p.selected) {
                const mirrored = mirrorPoint(p);
                p.x = mirrored.x;
                p.y = mirrored.y;
            }
        });

        this.canvas.lines.forEach(l => {
            if (l.selected) {
                const start = mirrorPoint(l.start);
                const end = mirrorPoint(l.end);
                l.start.x = start.x;
                l.start.y = start.y;
                l.end.x = end.x;
                l.end.y = end.y;
            }
        });

        this.canvas.polylines.forEach(pl => {
            if (pl.selected) {
                pl.points.forEach(p => {
                    const mirrored = mirrorPoint(p);
                    p.x = mirrored.x;
                    p.y = mirrored.y;
                });
            }
        });

        this.canvas.rectangles.forEach(r => {
            if (r.selected) {
                const c1 = mirrorPoint(r.corner1);
                const c2 = mirrorPoint(r.corner2);
                r.corner1.x = c1.x;
                r.corner1.y = c1.y;
                r.corner2.x = c2.x;
                r.corner2.y = c2.y;
            }
        });

        this.canvas.circles.forEach(c => {
            if (c.selected) {
                const center = mirrorPoint(c.center);
                c.center.x = center.x;
                c.center.y = center.y;
            }
        });

        this.canvas.arcs.forEach(a => {
            if (a.selected) {
                const center = mirrorPoint(a.center);
                a.center.x = center.x;
                a.center.y = center.y;
                // Mirror the angles as well
                if (axis === 'x') {
                    a.startAngle = Math.PI - a.startAngle;
                    a.endAngle = Math.PI - a.endAngle;
                } else {
                    a.startAngle = -a.startAngle;
                    a.endAngle = -a.endAngle;
                }
                // Swap angles if needed
                if (a.startAngle > a.endAngle) {
                    [a.startAngle, a.endAngle] = [a.endAngle, a.startAngle];
                }
            }
        });

        this.canvas.dimensions.forEach(d => {
            if (d.selected) {
                const start = mirrorPoint(d.start);
                const end = mirrorPoint(d.end);
                d.start.x = start.x;
                d.start.y = start.y;
                d.end.x = end.x;
                d.end.y = end.y;
            }
        });

        this.canvas.texts.forEach(t => {
            if (t.selected) {
                const pos = mirrorPoint(t.position);
                t.position.x = pos.x;
                t.position.y = pos.y;
            }
        });

        this.canvas.render();
    }

    // Get center of selection for rotation/scale operations
    getSelectionCenter() {
        let count = 0;
        let sumX = 0;
        let sumY = 0;

        const addPoint = (p) => {
            sumX += p.x;
            sumY += p.y;
            count++;
        };

        this.canvas.points.forEach(p => { if (p.selected) addPoint(p); });

        this.canvas.lines.forEach(l => {
            if (l.selected) {
                addPoint(l.start);
                addPoint(l.end);
            }
        });

        this.canvas.polylines.forEach(pl => {
            if (pl.selected) {
                pl.points.forEach(p => addPoint(p));
            }
        });

        this.canvas.rectangles.forEach(r => {
            if (r.selected) {
                addPoint(r.corner1);
                addPoint(r.corner2);
            }
        });

        this.canvas.circles.forEach(c => {
            if (c.selected) addPoint(c.center);
        });

        this.canvas.arcs.forEach(a => {
            if (a.selected) addPoint(a.center);
        });

        this.canvas.dimensions.forEach(d => {
            if (d.selected) {
                addPoint(d.start);
                addPoint(d.end);
            }
        });

        this.canvas.texts.forEach(t => {
            if (t.selected) addPoint(t.position);
        });

        if (count === 0) return null;

        return {
            x: sumX / count,
            y: sumY / count
        };
    }
}
