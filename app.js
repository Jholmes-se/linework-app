// Main application logic

class LineworkApp {
    constructor() {
        this.canvas = null;
        this.toolManager = null;
        this.exportManager = new ExportManager();

        this.init();
    }

    init() {
        // Initialize canvas
        this.canvas = new DrawingCanvas('mainCanvas');

        // Initialize tool manager
        this.toolManager = new ToolManager(this.canvas);

        // Setup event listeners
        this.setupEventListeners();

        // Set initial status
        this.canvas.setStatus('Ready - Select a tool to begin');

        console.log('Linework app initialized');
    }

    setupEventListeners() {
        // Tool buttons
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = btn.getAttribute('data-tool');
                this.setTool(tool);

                // Update active button
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Canvas mouse events
        this.canvas.canvas.addEventListener('mousedown', (e) => {
            this.toolManager.handleMouseDown(e);
            this.updateCursorCoords(e);
        });

        this.canvas.canvas.addEventListener('mousemove', (e) => {
            this.toolManager.handleMouseMove(e);
            this.updateCursorCoords(e);
        });

        this.canvas.canvas.addEventListener('mouseup', (e) => {
            this.toolManager.handleMouseUp(e);
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Snap options
        document.getElementById('snapToGrid').addEventListener('change', (e) => {
            this.canvas.snapToGrid = e.target.checked;
            this.canvas.render();
        });

        document.getElementById('snapToPoints').addEventListener('change', (e) => {
            this.canvas.snapToPoints = e.target.checked;
            this.canvas.render();
        });

        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.canvas.showGrid = e.target.checked;
            this.canvas.render();
        });

        document.getElementById('gridSize').addEventListener('change', (e) => {
            const size = parseInt(e.target.value);
            if (size > 0) {
                this.canvas.gridSize = size;
                this.canvas.render();
            }
        });

        // File operations
        document.getElementById('newProject').addEventListener('click', () => {
            this.newProject();
        });

        document.getElementById('saveProject').addEventListener('click', () => {
            this.saveProject();
        });

        document.getElementById('loadProject').addEventListener('click', () => {
            this.loadProject();
        });

        // Export operations
        document.getElementById('exportDXF').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportDXF();
        });

        document.getElementById('exportCSV').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportCSV();
        });

        document.getElementById('exportSVG').addEventListener('click', (e) => {
            e.preventDefault();
            this.exportSVG();
        });

        // Delete selected
        document.getElementById('deleteSelected').addEventListener('click', () => {
            this.deleteSelected();
        });

        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileLoad(e);
        });

        // Toggle panel
        const toggleBtn = document.getElementById('togglePanel');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                console.log('Toggle button clicked');
                this.togglePropertiesPanel();
            });
        } else {
            console.error('Toggle panel button not found!');
        }
    }

    togglePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        const canvasContainer = document.getElementById('canvas-container');

        if (panel) {
            console.log('Toggling panel, current state:', panel.classList.contains('collapsed'));
            panel.classList.toggle('collapsed');

            // Also toggle the canvas container class
            if (canvasContainer) {
                canvasContainer.classList.toggle('panel-collapsed');
            }

            console.log('Panel toggled, new state:', panel.classList.contains('collapsed'));

            // Resize the canvas after the animation completes
            setTimeout(() => {
                if (this.canvas) {
                    this.canvas.resizeCanvas();
                }
            }, 300); // Match the CSS transition duration
        } else {
            console.error('Properties panel not found!');
        }
    }

    setTool(toolName) {
        this.toolManager.setTool(toolName);

        // Update cursor
        if (toolName === 'select') {
            this.canvas.canvas.classList.add('select-tool');
        } else {
            this.canvas.canvas.classList.remove('select-tool');
        }

        // Update status
        const toolNames = {
            select: 'Select/Move tool active - Click to select, drag to move. Shift+Click to pan.',
            point: 'Point tool active - Click to place points',
            line: 'Line tool active - Click two points to draw a line',
            polyline: 'Polyline tool active - Click to add points. Press Enter to close, Escape to finish',
            rectangle: 'Rectangle tool active - Click two corners. Hold Shift for square',
            circle: 'Circle tool active - Click center, then radius point',
            arc: 'Arc tool active - Click three points to define arc',
            offset: 'Offset tool active - Click a line, then click to set offset direction',
            measure: 'Measure tool active - Click two points to measure distance and angle',
            dimension: 'Dimension tool active - Click two points to add dimension annotation'
        };

        this.canvas.setStatus(toolNames[toolName] || 'Tool selected');
    }

    updateCursorCoords(e) {
        const worldPos = this.canvas.screenToWorld(e.offsetX, e.offsetY);
        const snapped = this.canvas.getSnappedPoint(worldPos);
        const coordsElement = document.getElementById('cursorCoords');

        if (coordsElement) {
            coordsElement.textContent = `X: ${snapped.x.toFixed(2)}, Y: ${snapped.y.toFixed(2)}`;
        }
    }

    handleKeyDown(e) {
        // Tool shortcuts
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
            switch (e.key.toLowerCase()) {
                case 'v':
                    this.activateToolButton('select');
                    break;
                case 'p':
                    this.activateToolButton('point');
                    break;
                case 'l':
                    if (e.shiftKey) {
                        this.activateToolButton('polyline');
                    } else {
                        this.activateToolButton('line');
                    }
                    break;
                case 'r':
                    this.activateToolButton('rectangle');
                    break;
                case 'c':
                    this.activateToolButton('circle');
                    break;
                case 'a':
                    this.activateToolButton('arc');
                    break;
                case 'o':
                    this.activateToolButton('offset');
                    break;
                case 'm':
                    this.activateToolButton('measure');
                    break;
                case 'd':
                    this.activateToolButton('dimension');
                    break;
                case 'delete':
                case 'backspace':
                    if (e.target.tagName !== 'INPUT') {
                        e.preventDefault();
                        this.deleteSelected();
                    }
                    break;
            }
        }

        // Pass to tool manager
        this.toolManager.handleKeyDown(e);

        // Zoom shortcuts
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '0') {
                e.preventDefault();
                this.resetView();
            } else if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                this.zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            }
        }

        // Escape to deselect
        if (e.key === 'Escape') {
            this.canvas.clearSelection();
            this.canvas.render();
        }
    }

    activateToolButton(toolName) {
        const btn = document.querySelector(`[data-tool="${toolName}"]`);
        if (btn) {
            btn.click();
        }
    }

    deleteSelected() {
        const hasSelection = this.canvas.points.some(p => p.selected) ||
                           this.canvas.lines.some(l => l.selected) ||
                           this.canvas.polylines.some(pl => pl.selected) ||
                           this.canvas.dimensions.some(d => d.selected);

        if (hasSelection) {
            if (confirm('Delete selected objects?')) {
                this.canvas.deleteSelected();
                this.canvas.setStatus('Objects deleted');
            }
        } else {
            this.canvas.setStatus('No objects selected');
        }
    }

    newProject() {
        if (this.hasUnsavedChanges()) {
            if (!confirm('Start new project? Unsaved changes will be lost.')) {
                return;
            }
        }

        this.canvas.clearAll();
        this.canvas.setStatus('New project created');
    }

    saveProject() {
        const data = {
            points: this.canvas.points,
            lines: this.canvas.lines,
            polylines: this.canvas.polylines,
            rectangles: this.canvas.rectangles,
            circles: this.canvas.circles,
            arcs: this.canvas.arcs,
            dimensions: this.canvas.dimensions
        };

        const json = this.exportManager.exportToJSON(data);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `linework_project_${timestamp}.json`;

        this.exportManager.downloadFile(json, filename, 'application/json');
        this.canvas.setStatus('Project saved');
    }

    loadProject() {
        const fileInput = document.getElementById('fileInput');
        fileInput.value = ''; // Reset
        fileInput.click();
    }

    handleFileLoad(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const imported = this.exportManager.importFromJSON(event.target.result);

                if (imported) {
                    this.canvas.points = imported.points;
                    this.canvas.lines = imported.lines;
                    this.canvas.polylines = imported.polylines;
                    this.canvas.rectangles = imported.rectangles;
                    this.canvas.circles = imported.circles;
                    this.canvas.arcs = imported.arcs;
                    this.canvas.dimensions = imported.dimensions;
                    this.canvas.render();
                    this.canvas.setStatus('Project loaded successfully');
                } else {
                    alert('Error loading project file');
                }
            } catch (error) {
                alert('Error loading project: ' + error.message);
            }
        };

        reader.readAsText(file);
    }

    exportDXF() {
        const data = {
            points: this.canvas.points,
            lines: this.canvas.lines,
            polylines: this.canvas.polylines,
            rectangles: this.canvas.rectangles,
            circles: this.canvas.circles,
            arcs: this.canvas.arcs,
            dimensions: this.canvas.dimensions
        };

        const dxf = this.exportManager.exportToDXF(data);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `linework_export_${timestamp}.dxf`;

        this.exportManager.downloadFile(dxf, filename, 'application/dxf');
        this.canvas.setStatus('Exported to DXF');
    }

    exportCSV() {
        const data = {
            points: this.canvas.points,
            lines: this.canvas.lines,
            polylines: this.canvas.polylines,
            rectangles: this.canvas.rectangles,
            circles: this.canvas.circles,
            arcs: this.canvas.arcs,
            dimensions: this.canvas.dimensions
        };

        const csv = this.exportManager.exportToCSV(data);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `linework_coordinates_${timestamp}.csv`;

        this.exportManager.downloadFile(csv, filename, 'text/csv');
        this.canvas.setStatus('Exported coordinates to CSV');
    }

    exportSVG() {
        const data = {
            points: this.canvas.points,
            lines: this.canvas.lines,
            polylines: this.canvas.polylines,
            rectangles: this.canvas.rectangles,
            circles: this.canvas.circles,
            arcs: this.canvas.arcs,
            dimensions: this.canvas.dimensions
        };

        const svg = this.exportManager.exportToSVG(data);
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `linework_export_${timestamp}.svg`;

        this.exportManager.downloadFile(svg, filename, 'image/svg+xml');
        this.canvas.setStatus('Exported to SVG');
    }

    hasUnsavedChanges() {
        return this.canvas.points.length > 0 ||
               this.canvas.lines.length > 0 ||
               this.canvas.polylines.length > 0 ||
               this.canvas.rectangles.length > 0 ||
               this.canvas.circles.length > 0 ||
               this.canvas.arcs.length > 0 ||
               this.canvas.dimensions.length > 0;
    }

    resetView() {
        this.canvas.zoom = 1;
        this.canvas.offsetX = this.canvas.canvas.width / 2;
        this.canvas.offsetY = this.canvas.canvas.height / 2;
        this.canvas.render();
        this.canvas.updateZoomDisplay();
    }

    zoomIn() {
        const center = {
            x: this.canvas.canvas.width / 2,
            y: this.canvas.canvas.height / 2
        };

        const worldBefore = this.canvas.screenToWorld(center.x, center.y);
        this.canvas.zoom *= 1.2;
        this.canvas.zoom = Math.min(10, this.canvas.zoom);
        const worldAfter = this.canvas.screenToWorld(center.x, center.y);

        this.canvas.offsetX += (worldAfter.x - worldBefore.x) * this.canvas.zoom;
        this.canvas.offsetY += (worldAfter.y - worldBefore.y) * this.canvas.zoom;

        this.canvas.render();
        this.canvas.updateZoomDisplay();
    }

    zoomOut() {
        const center = {
            x: this.canvas.canvas.width / 2,
            y: this.canvas.canvas.height / 2
        };

        const worldBefore = this.canvas.screenToWorld(center.x, center.y);
        this.canvas.zoom *= 0.8;
        this.canvas.zoom = Math.max(0.1, this.canvas.zoom);
        const worldAfter = this.canvas.screenToWorld(center.x, center.y);

        this.canvas.offsetX += (worldAfter.x - worldBefore.x) * this.canvas.zoom;
        this.canvas.offsetY += (worldAfter.y - worldBefore.y) * this.canvas.zoom;

        this.canvas.render();
        this.canvas.updateZoomDisplay();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.lineworkApp = new LineworkApp();
});
