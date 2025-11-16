// Export and Import functionality

class ExportManager {
    constructor() {
        this.version = '1.0';
    }

    // Export to JSON (native format)
    exportToJSON(data) {
        const exportData = {
            version: this.version,
            timestamp: new Date().toISOString(),
            units: 'meters',
            points: data.points.map(p => ({
                id: p.id,
                x: p.x,
                y: p.y
            })),
            lines: data.lines.map(l => ({
                id: l.id,
                start: { x: l.start.x, y: l.start.y },
                end: { x: l.end.x, y: l.end.y }
            })),
            polylines: data.polylines.map(pl => ({
                id: pl.id,
                points: pl.points.map(p => ({ x: p.x, y: p.y })),
                closed: pl.closed
            })),
            rectangles: data.rectangles.map(r => ({
                id: r.id,
                corner1: { x: r.corner1.x, y: r.corner1.y },
                corner2: { x: r.corner2.x, y: r.corner2.y }
            })),
            circles: data.circles.map(c => ({
                id: c.id,
                center: { x: c.center.x, y: c.center.y },
                radius: c.radius
            })),
            arcs: data.arcs.map(a => ({
                id: a.id,
                center: { x: a.center.x, y: a.center.y },
                radius: a.radius,
                startAngle: a.startAngle,
                endAngle: a.endAngle
            })),
            dimensions: data.dimensions.map(d => ({
                id: d.id,
                start: { x: d.start.x, y: d.start.y },
                end: { x: d.end.x, y: d.end.y },
                offset: d.offset
            }))
        };
        return JSON.stringify(exportData, null, 2);
    }

    // Import from JSON
    importFromJSON(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            const points = (data.points || []).map(p => new Point(p.x, p.y, p.id));
            const lines = (data.lines || []).map(l => new Line(
                { x: l.start.x, y: l.start.y },
                { x: l.end.x, y: l.end.y },
                l.id
            ));
            const polylines = (data.polylines || []).map(pl => {
                const polyline = new Polyline(
                    pl.points.map(p => ({ x: p.x, y: p.y })),
                    pl.id
                );
                polyline.closed = pl.closed;
                return polyline;
            });
            const rectangles = (data.rectangles || []).map(r => new Rectangle(
                { x: r.corner1.x, y: r.corner1.y },
                { x: r.corner2.x, y: r.corner2.y },
                r.id
            ));
            const circles = (data.circles || []).map(c => new Circle(
                { x: c.center.x, y: c.center.y },
                c.radius,
                c.id
            ));
            const arcs = (data.arcs || []).map(a => new Arc(
                { x: a.center.x, y: a.center.y },
                a.radius,
                a.startAngle,
                a.endAngle,
                a.id
            ));
            const dimensions = (data.dimensions || []).map(d => new Dimension(
                { x: d.start.x, y: d.start.y },
                { x: d.end.x, y: d.end.y },
                d.offset,
                d.id
            ));

            return { points, lines, polylines, rectangles, circles, arcs, dimensions };
        } catch (error) {
            console.error('Error importing JSON:', error);
            return null;
        }
    }

    // Export to DXF (AutoCAD format)
    exportToDXF(data) {
        let dxf = '';

        // DXF Header
        dxf += '0\nSECTION\n';
        dxf += '2\nHEADER\n';
        dxf += '9\n$ACADVER\n1\nAC1015\n'; // AutoCAD 2000 format
        dxf += '0\nENDSEC\n';

        // Tables section
        dxf += '0\nSECTION\n';
        dxf += '2\nTABLES\n';
        dxf += '0\nTABLE\n';
        dxf += '2\nLTYPE\n';
        dxf += '70\n1\n';
        dxf += '0\nLTYPE\n';
        dxf += '2\nCONTINUOUS\n';
        dxf += '70\n64\n';
        dxf += '3\nSolid line\n';
        dxf += '72\n65\n';
        dxf += '73\n0\n';
        dxf += '40\n0.0\n';
        dxf += '0\nENDTAB\n';
        dxf += '0\nTABLE\n';
        dxf += '2\nLAYER\n';
        dxf += '70\n1\n';
        dxf += '0\nLAYER\n';
        dxf += '2\n0\n';
        dxf += '70\n0\n';
        dxf += '62\n7\n';
        dxf += '6\nCONTINUOUS\n';
        dxf += '0\nENDTAB\n';
        dxf += '0\nENDSEC\n';

        // Entities section
        dxf += '0\nSECTION\n';
        dxf += '2\nENTITIES\n';

        // Export points
        data.points.forEach(point => {
            dxf += '0\nPOINT\n';
            dxf += '8\n0\n'; // Layer
            dxf += `10\n${point.x.toFixed(6)}\n`; // X coordinate
            dxf += `20\n${point.y.toFixed(6)}\n`; // Y coordinate
            dxf += '30\n0.0\n'; // Z coordinate
        });

        // Export lines
        data.lines.forEach(line => {
            dxf += '0\nLINE\n';
            dxf += '8\n0\n'; // Layer
            dxf += `10\n${line.start.x.toFixed(6)}\n`;
            dxf += `20\n${line.start.y.toFixed(6)}\n`;
            dxf += '30\n0.0\n';
            dxf += `11\n${line.end.x.toFixed(6)}\n`;
            dxf += `21\n${line.end.y.toFixed(6)}\n`;
            dxf += '31\n0.0\n';
        });

        // Export polylines
        data.polylines.forEach(polyline => {
            dxf += '0\nLWPOLYLINE\n';
            dxf += '8\n0\n'; // Layer
            dxf += `90\n${polyline.points.length}\n`; // Number of vertices
            dxf += `70\n${polyline.closed ? 1 : 0}\n`; // Closed flag
            polyline.points.forEach(point => {
                dxf += `10\n${point.x.toFixed(6)}\n`;
                dxf += `20\n${point.y.toFixed(6)}\n`;
            });
        });

        // Export dimensions as lines with text
        data.dimensions.forEach(dim => {
            // Dimension line
            dxf += '0\nLINE\n';
            dxf += '8\n0\n';
            dxf += `10\n${dim.start.x.toFixed(6)}\n`;
            dxf += `20\n${dim.start.y.toFixed(6)}\n`;
            dxf += '30\n0.0\n';
            dxf += `11\n${dim.end.x.toFixed(6)}\n`;
            dxf += `21\n${dim.end.y.toFixed(6)}\n`;
            dxf += '31\n0.0\n';
        });

        dxf += '0\nENDSEC\n';
        dxf += '0\nEOF\n';

        return dxf;
    }

    // Export to CSV (Points with coordinates)
    exportToCSV(data) {
        let csv = 'ID,X,Y,Type\n';

        // Export all points
        data.points.forEach(point => {
            csv += `${point.id},${point.x.toFixed(6)},${point.y.toFixed(6)},Point\n`;
        });

        // Export line endpoints
        data.lines.forEach(line => {
            csv += `${line.id}_start,${line.start.x.toFixed(6)},${line.start.y.toFixed(6)},Line Start\n`;
            csv += `${line.id}_end,${line.end.x.toFixed(6)},${line.end.y.toFixed(6)},Line End\n`;
        });

        // Export polyline points
        data.polylines.forEach((polyline, plIndex) => {
            polyline.points.forEach((point, pIndex) => {
                csv += `${polyline.id}_${pIndex},${point.x.toFixed(6)},${point.y.toFixed(6)},Polyline Point\n`;
            });
        });

        return csv;
    }

    // Export to SVG
    exportToSVG(data, width = 1000, height = 1000) {
        // Calculate bounds
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        const updateBounds = (x, y) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        };

        data.points.forEach(p => updateBounds(p.x, p.y));
        data.lines.forEach(l => {
            updateBounds(l.start.x, l.start.y);
            updateBounds(l.end.x, l.end.y);
        });
        data.polylines.forEach(pl => {
            pl.points.forEach(p => updateBounds(p.x, p.y));
        });

        const padding = 50;
        const viewWidth = maxX - minX + padding * 2;
        const viewHeight = maxY - minY + padding * 2;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" `;
        svg += `viewBox="${minX - padding} ${minY - padding} ${viewWidth} ${viewHeight}">\n`;
        svg += `  <g transform="scale(1, -1) translate(0, ${-(2 * minY + viewHeight - 2 * padding)})">\n`;

        // Draw lines
        data.lines.forEach(line => {
            svg += `    <line x1="${line.start.x}" y1="${line.start.y}" `;
            svg += `x2="${line.end.x}" y2="${line.end.y}" `;
            svg += `stroke="black" stroke-width="1" />\n`;
        });

        // Draw polylines
        data.polylines.forEach(polyline => {
            const points = polyline.points.map(p => `${p.x},${p.y}`).join(' ');
            svg += `    <polyline points="${points}" `;
            svg += `fill="none" stroke="black" stroke-width="1" `;
            if (polyline.closed) svg += `stroke-linejoin="miter" `;
            svg += `/>\n`;
        });

        // Draw points
        data.points.forEach(point => {
            svg += `    <circle cx="${point.x}" cy="${point.y}" r="2" fill="red" />\n`;
        });

        svg += `  </g>\n`;
        svg += `</svg>`;

        return svg;
    }

    // Download file helper
    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
