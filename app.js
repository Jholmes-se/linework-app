// Main application logic

class LineworkApp {
    constructor() {
        this.canvas = null;
        this.toolManager = null;
        this.exportManager = new ExportManager();
        this.editOperations = null;

        this.init();
    }

    init() {
        // Initialize canvas
        this.canvas = new DrawingCanvas('mainCanvas');

        // Initialize tool manager
        this.toolManager = new ToolManager(this.canvas);

        // Initialize edit operations
        this.editOperations = new EditOperations(this.canvas);

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
            // Update properties panel if it's visible
            const propsPanel = document.getElementById('properties-panel');
            if (propsPanel && propsPanel.style.display !== 'none') {
                this.updatePropertiesPanel();
            }
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

        // Edit operations
        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copySelected();
        });

        document.getElementById('pasteBtn').addEventListener('click', () => {
            this.pasteFromClipboard();
        });

        document.getElementById('rotateBtn').addEventListener('click', () => {
            this.rotateSelected();
        });

        document.getElementById('scaleBtn').addEventListener('click', () => {
            this.scaleSelected();
        });

        document.getElementById('mirrorBtn').addEventListener('click', () => {
            this.mirrorSelected();
        });

        // File input
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileLoad(e);
        });

        // Layer panel
        document.getElementById('newLayer').addEventListener('click', () => {
            this.createNewLayer();
        });

        document.getElementById('deleteLayer').addEventListener('click', () => {
            this.deleteActiveLayer();
        });

        document.getElementById('toggleLayerPanel').addEventListener('click', () => {
            this.toggleLayerPanel();
        });

        document.getElementById('toggleLayers').addEventListener('click', () => {
            this.toggleLayerPanel();
        });

        // Properties panel
        document.getElementById('togglePropertiesPanel').addEventListener('click', () => {
            this.togglePropertiesPanel();
        });

        document.getElementById('toggleProperties').addEventListener('click', () => {
            this.togglePropertiesPanel();
        });

        // Initialize layer list
        this.updateLayerList();
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
            dimension: 'Dimension tool active - Click two points to add dimension annotation',
            text: 'Text tool active - Click to place text. You will be prompted for content and size'
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
                case 't':
                    this.activateToolButton('text');
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

        // Keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            // Copy/Paste operations
            if (e.key === 'c' || e.key === 'C') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.copySelected();
                }
            } else if (e.key === 'v' || e.key === 'V') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.pasteFromClipboard();
                }
            } else if (e.key === 'x' || e.key === 'X') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.cutSelected();
                }
            } else if (e.key === 'd' || e.key === 'D') {
                if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    this.duplicateSelected();
                }
            }
            // Zoom shortcuts and panel toggles
            else if (e.key === '0') {
                e.preventDefault();
                this.resetView();
            } else if (e.key === '=' || e.key === '+') {
                e.preventDefault();
                this.zoomIn();
            } else if (e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            } else if (e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                this.toggleLayerPanel();
            } else if (e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                this.togglePropertiesPanel();
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

    // Layer management methods
    updateLayerList() {
        const layerList = document.getElementById('layerList');
        const layerManager = this.canvas.layerManager;

        layerList.innerHTML = '';

        layerManager.layers.forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            if (layer.id === layerManager.activeLayerId) {
                layerItem.classList.add('active');
            }

            layerItem.innerHTML = `
                <div class="layer-item-name">${layer.name}</div>
                <div class="layer-controls">
                    <button class="layer-toggle-btn visibility-btn ${layer.visible ? '' : 'disabled'}"
                            data-layer-id="${layer.id}"
                            title="${layer.visible ? 'Hide' : 'Show'} layer">
                        ${layer.visible ? '👁' : '👁‍🗨'}
                    </button>
                    <button class="layer-toggle-btn lock-btn ${layer.locked ? '' : 'disabled'}"
                            data-layer-id="${layer.id}"
                            title="${layer.locked ? 'Unlock' : 'Lock'} layer">
                        ${layer.locked ? '🔒' : '🔓'}
                    </button>
                </div>
            `;

            // Click to select layer
            layerItem.addEventListener('click', (e) => {
                if (!e.target.classList.contains('layer-toggle-btn')) {
                    this.selectLayer(layer.id);
                }
            });

            // Visibility toggle
            const visibilityBtn = layerItem.querySelector('.visibility-btn');
            visibilityBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(layer.id);
            });

            // Lock toggle
            const lockBtn = layerItem.querySelector('.lock-btn');
            lockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerLock(layer.id);
            });

            layerList.appendChild(layerItem);
        });
    }

    createNewLayer() {
        const layerName = prompt('Enter layer name:', `Layer ${this.canvas.layerManager.layers.length}`);
        if (!layerName) return;

        const newLayer = this.canvas.layerManager.createLayer(layerName);
        this.canvas.layerManager.setActiveLayer(newLayer.id);
        this.updateLayerList();
        this.canvas.setStatus(`Created layer: ${layerName}`);
    }

    deleteActiveLayer() {
        const layerManager = this.canvas.layerManager;
        const activeLayer = layerManager.getActiveLayer();

        if (layerManager.layers.length === 1) {
            alert('Cannot delete the last layer');
            return;
        }

        if (!confirm(`Delete layer "${activeLayer.name}"? All objects on this layer will be removed.`)) {
            return;
        }

        // Remove all objects on this layer
        this.canvas.points = this.canvas.points.filter(p => p.layerId !== activeLayer.id);
        this.canvas.lines = this.canvas.lines.filter(l => l.layerId !== activeLayer.id);
        this.canvas.polylines = this.canvas.polylines.filter(pl => pl.layerId !== activeLayer.id);
        this.canvas.rectangles = this.canvas.rectangles.filter(r => r.layerId !== activeLayer.id);
        this.canvas.circles = this.canvas.circles.filter(c => c.layerId !== activeLayer.id);
        this.canvas.arcs = this.canvas.arcs.filter(a => a.layerId !== activeLayer.id);
        this.canvas.dimensions = this.canvas.dimensions.filter(d => d.layerId !== activeLayer.id);
        this.canvas.texts = this.canvas.texts.filter(t => t.layerId !== activeLayer.id);

        layerManager.deleteLayer(activeLayer.id);
        this.updateLayerList();
        this.canvas.render();
        this.canvas.setStatus(`Deleted layer: ${activeLayer.name}`);
    }

    selectLayer(layerId) {
        this.canvas.layerManager.setActiveLayer(layerId);
        this.updateLayerList();
        const layer = this.canvas.layerManager.getActiveLayer();
        this.canvas.setStatus(`Active layer: ${layer.name}`);
    }

    toggleLayerVisibility(layerId) {
        this.canvas.layerManager.toggleVisibility(layerId);
        this.updateLayerList();
        this.canvas.render();
    }

    toggleLayerLock(layerId) {
        this.canvas.layerManager.toggleLock(layerId);
        this.updateLayerList();
    }

    toggleLayerPanel() {
        const panel = document.getElementById('layer-panel');
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';
    }

    // Properties panel methods
    togglePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        const isHidden = panel.style.display === 'none';
        panel.style.display = isHidden ? 'flex' : 'none';

        // Update properties when opening
        if (!isHidden) {
            this.updatePropertiesPanel();
        }
    }

    updatePropertiesPanel() {
        const content = document.getElementById('propertiesContent');
        const selected = this.getSelectedObjects();

        if (selected.length === 0) {
            content.innerHTML = '<div class="no-selection">No object selected</div>';
            return;
        }

        if (selected.length > 1) {
            content.innerHTML = this.generateMultiSelectPropertiesHTML(selected);
            this.attachMultiSelectListeners(selected);
            return;
        }

        const obj = selected[0];
        content.innerHTML = this.generatePropertiesHTML(obj);
        this.attachPropertyListeners(obj);
    }

    getSelectedObjects() {
        const selected = [];
        selected.push(...this.canvas.points.filter(p => p.selected));
        selected.push(...this.canvas.lines.filter(l => l.selected));
        selected.push(...this.canvas.polylines.filter(pl => pl.selected));
        selected.push(...this.canvas.rectangles.filter(r => r.selected));
        selected.push(...this.canvas.circles.filter(c => c.selected));
        selected.push(...this.canvas.arcs.filter(a => a.selected));
        selected.push(...this.canvas.dimensions.filter(d => d.selected));
        selected.push(...this.canvas.texts.filter(t => t.selected));
        return selected;
    }

    generatePropertiesHTML(obj) {
        const layerOptions = this.canvas.layerManager.layers
            .map(layer => `<option value="${layer.id}" ${obj.layerId === layer.id ? 'selected' : ''}>${layer.name}</option>`)
            .join('');

        let html = `
            <div class="object-type-badge">${obj.type.toUpperCase()}</div>

            <div class="property-group">
                <div class="property-group-title">Layer</div>
                <div class="property-row">
                    <label class="property-label">Layer</label>
                    <select class="property-select" id="prop-layer">
                        ${layerOptions}
                    </select>
                </div>
            </div>
        `;

        // Type-specific properties
        if (obj.type === 'point') {
            html += `
                <div class="property-group">
                    <div class="property-group-title">Position</div>
                    <div class="property-row">
                        <label class="property-label">X</label>
                        <input type="number" class="property-input" id="prop-x" value="${obj.x.toFixed(2)}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Y</label>
                        <input type="number" class="property-input" id="prop-y" value="${obj.y.toFixed(2)}" step="0.1">
                    </div>
                </div>
            `;
        } else if (obj.type === 'line') {
            html += `
                <div class="property-group">
                    <div class="property-group-title">Start Point</div>
                    <div class="property-row">
                        <label class="property-label">X</label>
                        <input type="number" class="property-input" id="prop-start-x" value="${obj.start.x.toFixed(2)}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Y</label>
                        <input type="number" class="property-input" id="prop-start-y" value="${obj.start.y.toFixed(2)}" step="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">End Point</div>
                    <div class="property-row">
                        <label class="property-label">X</label>
                        <input type="number" class="property-input" id="prop-end-x" value="${obj.end.x.toFixed(2)}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Y</label>
                        <input type="number" class="property-input" id="prop-end-y" value="${obj.end.y.toFixed(2)}" step="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">Measurements</div>
                    <div class="property-row">
                        <label class="property-label">Length</label>
                        <input type="text" class="property-input" value="${obj.length().toFixed(2)}" readonly>
                    </div>
                    <div class="property-row">
                        <label class="property-label">Angle</label>
                        <input type="text" class="property-input" value="${obj.angleDegrees().toFixed(2)}°" readonly>
                    </div>
                </div>
            `;
        } else if (obj.type === 'circle') {
            html += `
                <div class="property-group">
                    <div class="property-group-title">Center</div>
                    <div class="property-row">
                        <label class="property-label">X</label>
                        <input type="number" class="property-input" id="prop-center-x" value="${obj.center.x.toFixed(2)}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Y</label>
                        <input type="number" class="property-input" id="prop-center-y" value="${obj.center.y.toFixed(2)}" step="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">Size</div>
                    <div class="property-row">
                        <label class="property-label">Radius</label>
                        <input type="number" class="property-input" id="prop-radius" value="${obj.radius.toFixed(2)}" step="0.1" min="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">Measurements</div>
                    <div class="property-row">
                        <label class="property-label">Circumference</label>
                        <input type="text" class="property-input" value="${obj.circumference().toFixed(2)}" readonly>
                    </div>
                    <div class="property-row">
                        <label class="property-label">Area</label>
                        <input type="text" class="property-input" value="${obj.area().toFixed(2)}" readonly>
                    </div>
                </div>
            `;
        } else if (obj.type === 'rectangle') {
            html += `
                <div class="property-group">
                    <div class="property-group-title">Position</div>
                    <div class="property-row">
                        <label class="property-label">X</label>
                        <input type="number" class="property-input" id="prop-x" value="${obj.corner1.x.toFixed(2)}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Y</label>
                        <input type="number" class="property-input" id="prop-y" value="${obj.corner1.y.toFixed(2)}" step="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">Size</div>
                    <div class="property-row">
                        <label class="property-label">Width</label>
                        <input type="number" class="property-input" id="prop-width" value="${obj.width.toFixed(2)}" step="0.1" min="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Height</label>
                        <input type="number" class="property-input" id="prop-height" value="${obj.height.toFixed(2)}" step="0.1" min="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">Measurements</div>
                    <div class="property-row">
                        <label class="property-label">Perimeter</label>
                        <input type="text" class="property-input" value="${obj.perimeter().toFixed(2)}" readonly>
                    </div>
                    <div class="property-row">
                        <label class="property-label">Area</label>
                        <input type="text" class="property-input" value="${obj.area().toFixed(2)}" readonly>
                    </div>
                </div>
            `;
        } else if (obj.type === 'text') {
            html += `
                <div class="property-group">
                    <div class="property-group-title">Position</div>
                    <div class="property-row">
                        <label class="property-label">X</label>
                        <input type="number" class="property-input" id="prop-x" value="${obj.position.x.toFixed(2)}" step="0.1">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Y</label>
                        <input type="number" class="property-input" id="prop-y" value="${obj.position.y.toFixed(2)}" step="0.1">
                    </div>
                </div>
                <div class="property-group">
                    <div class="property-group-title">Text</div>
                    <div class="property-row">
                        <label class="property-label">Content</label>
                        <input type="text" class="property-input" id="prop-content" value="${obj.content}">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Font Size</label>
                        <input type="number" class="property-input" id="prop-fontsize" value="${obj.fontSize}" step="1" min="8">
                    </div>
                </div>
            `;
        }

        return html;
    }

    attachPropertyListeners(obj) {
        // Layer change
        const layerInput = document.getElementById('prop-layer');
        if (layerInput) {
            layerInput.addEventListener('change', (e) => {
                obj.layerId = e.target.value;
                this.canvas.render();
                this.canvas.setStatus('Layer updated');
            });
        }

        // Type-specific property changes
        if (obj.type === 'point') {
            this.attachInputListener('prop-x', (val) => {
                obj.x = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-y', (val) => {
                obj.y = parseFloat(val);
                this.canvas.render();
            });
        } else if (obj.type === 'line') {
            this.attachInputListener('prop-start-x', (val) => {
                obj.start.x = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-start-y', (val) => {
                obj.start.y = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-end-x', (val) => {
                obj.end.x = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-end-y', (val) => {
                obj.end.y = parseFloat(val);
                this.canvas.render();
            });
        } else if (obj.type === 'circle') {
            this.attachInputListener('prop-center-x', (val) => {
                obj.center.x = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-center-y', (val) => {
                obj.center.y = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-radius', (val) => {
                obj.radius = Math.max(0.1, parseFloat(val));
                this.updatePropertiesPanel();
                this.canvas.render();
            });
        } else if (obj.type === 'rectangle') {
            this.attachInputListener('prop-x', (val) => {
                const deltaX = parseFloat(val) - obj.corner1.x;
                obj.corner1.x = parseFloat(val);
                obj.corner2.x += deltaX;
                this.canvas.render();
            });
            this.attachInputListener('prop-y', (val) => {
                const deltaY = parseFloat(val) - obj.corner1.y;
                obj.corner1.y = parseFloat(val);
                obj.corner2.y += deltaY;
                this.canvas.render();
            });
            this.attachInputListener('prop-width', (val) => {
                const newWidth = Math.max(0.1, parseFloat(val));
                obj.corner2.x = obj.corner1.x + newWidth;
                this.updatePropertiesPanel();
                this.canvas.render();
            });
            this.attachInputListener('prop-height', (val) => {
                const newHeight = Math.max(0.1, parseFloat(val));
                obj.corner2.y = obj.corner1.y + newHeight;
                this.updatePropertiesPanel();
                this.canvas.render();
            });
        } else if (obj.type === 'text') {
            this.attachInputListener('prop-x', (val) => {
                obj.position.x = parseFloat(val);
                this.canvas.render();
            });
            this.attachInputListener('prop-y', (val) => {
                obj.position.y = parseFloat(val);
                this.canvas.render();
            });
            const contentInput = document.getElementById('prop-content');
            if (contentInput) {
                contentInput.addEventListener('input', (e) => {
                    obj.content = e.target.value;
                    this.canvas.render();
                });
            }
            this.attachInputListener('prop-fontsize', (val) => {
                obj.fontSize = Math.max(8, parseInt(val));
                this.canvas.render();
            });
        }
    }

    attachInputListener(id, callback) {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', (e) => {
                callback(e.target.value);
            });
        }
    }

    // Multi-select properties
    generateMultiSelectPropertiesHTML(selected) {
        const layerOptions = this.canvas.layerManager.layers
            .map(layer => `<option value="${layer.id}">${layer.name}</option>`)
            .join('');

        // Count object types
        const typeCounts = {};
        selected.forEach(obj => {
            typeCounts[obj.type] = (typeCounts[obj.type] || 0) + 1;
        });

        const typeList = Object.entries(typeCounts)
            .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
            .join(', ');

        let html = `
            <div class="object-type-badge">MULTI-SELECT</div>
            <div style="color: #888; font-size: 13px; margin-bottom: 16px;">
                ${selected.length} objects selected<br>
                <span style="font-size: 12px;">${typeList}</span>
            </div>

            <div class="property-group">
                <div class="property-group-title">Bulk Operations</div>
                <div class="property-row">
                    <label class="property-label">Move to Layer</label>
                    <select class="property-select" id="prop-bulk-layer">
                        <option value="">Choose layer...</option>
                        ${layerOptions}
                    </select>
                </div>
            </div>

            <div class="property-group">
                <div class="property-group-title">Bounding Box</div>
                <div class="property-row">
                    <label class="property-label">Width</label>
                    <input type="text" class="property-input" id="prop-bbox-width" readonly>
                </div>
                <div class="property-row">
                    <label class="property-label">Height</label>
                    <input type="text" class="property-input" id="prop-bbox-height" readonly>
                </div>
            </div>
        `;

        return html;
    }

    attachMultiSelectListeners(selected) {
        // Bulk layer change
        const layerInput = document.getElementById('prop-bulk-layer');
        if (layerInput) {
            layerInput.addEventListener('change', (e) => {
                if (e.target.value) {
                    selected.forEach(obj => {
                        obj.layerId = e.target.value;
                    });
                    this.canvas.render();
                    this.updateLayerList();
                    this.canvas.setStatus(`Moved ${selected.length} objects to layer`);
                    e.target.value = ''; // Reset dropdown
                }
            });
        }

        // Calculate and display bounding box
        const bbox = Geometry.getBoundingBox(selected);
        if (bbox) {
            const widthInput = document.getElementById('prop-bbox-width');
            const heightInput = document.getElementById('prop-bbox-height');
            if (widthInput) widthInput.value = bbox.width.toFixed(2);
            if (heightInput) heightInput.value = bbox.height.toFixed(2);
        }
    }

    // Edit operations
    copySelected() {
        this.editOperations.copy();
        this.canvas.setStatus(`Copied ${this.editOperations.clipboard.length} object(s)`);
    }

    cutSelected() {
        const count = this.getSelectedObjects().length;
        if (count === 0) {
            this.canvas.setStatus('No objects selected');
            return;
        }
        this.editOperations.copy();
        this.canvas.deleteSelected();
        this.canvas.setStatus(`Cut ${count} object(s)`);
    }

    pasteFromClipboard() {
        if (this.editOperations.clipboard.length === 0) {
            this.canvas.setStatus('Nothing to paste');
            return;
        }
        this.editOperations.paste();
        this.canvas.setStatus(`Pasted ${this.editOperations.clipboard.length} object(s)`);
    }

    duplicateSelected() {
        const count = this.getSelectedObjects().length;
        if (count === 0) {
            this.canvas.setStatus('No objects selected');
            return;
        }
        this.editOperations.copy();
        this.editOperations.paste(10, 10);
        this.canvas.setStatus(`Duplicated ${count} object(s)`);
    }

    rotateSelected() {
        const selected = this.getSelectedObjects();
        if (selected.length === 0) {
            this.canvas.setStatus('No objects selected');
            return;
        }

        const angle = parseFloat(prompt('Enter rotation angle in degrees (positive = counterclockwise):', '90'));
        if (isNaN(angle)) return;

        const center = this.editOperations.getSelectionCenter();
        if (center) {
            this.editOperations.rotate(center.x, center.y, angle);
            this.canvas.setStatus(`Rotated ${selected.length} object(s) by ${angle}°`);

            // Update properties panel if visible
            const propsPanel = document.getElementById('properties-panel');
            if (propsPanel && propsPanel.style.display !== 'none') {
                this.updatePropertiesPanel();
            }
        }
    }

    scaleSelected() {
        const selected = this.getSelectedObjects();
        if (selected.length === 0) {
            this.canvas.setStatus('No objects selected');
            return;
        }

        const scaleStr = prompt('Enter scale factor (e.g., 2 for double, 0.5 for half):', '1.0');
        if (!scaleStr) return;
        const scale = parseFloat(scaleStr);
        if (isNaN(scale) || scale <= 0) {
            alert('Please enter a valid positive number');
            return;
        }

        const center = this.editOperations.getSelectionCenter();
        if (center) {
            this.editOperations.scale(center.x, center.y, scale);
            this.canvas.setStatus(`Scaled ${selected.length} object(s) by ${scale}x`);

            // Update properties panel if visible
            const propsPanel = document.getElementById('properties-panel');
            if (propsPanel && propsPanel.style.display !== 'none') {
                this.updatePropertiesPanel();
            }
        }
    }

    mirrorSelected() {
        const selected = this.getSelectedObjects();
        if (selected.length === 0) {
            this.canvas.setStatus('No objects selected');
            return;
        }

        const axis = prompt('Mirror axis: enter "h" for horizontal or "v" for vertical:', 'h');
        if (!axis) return;

        const center = this.editOperations.getSelectionCenter();
        if (center) {
            if (axis.toLowerCase() === 'h') {
                this.editOperations.mirror('horizontal', center.y);
                this.canvas.setStatus(`Mirrored ${selected.length} object(s) horizontally`);
            } else if (axis.toLowerCase() === 'v') {
                this.editOperations.mirror('vertical', center.x);
                this.canvas.setStatus(`Mirrored ${selected.length} object(s) vertically`);
            } else {
                alert('Invalid axis. Enter "h" for horizontal or "v" for vertical');
                return;
            }

            // Update properties panel if visible
            const propsPanel = document.getElementById('properties-panel');
            if (propsPanel && propsPanel.style.display !== 'none') {
                this.updatePropertiesPanel();
            }
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.lineworkApp = new LineworkApp();
});
