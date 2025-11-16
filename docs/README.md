# Linework - Site Planning Tool

A professional browser-based CAD-style application for site planning and linework. Draw points, lines, polylines, add measurements and dimensions with precision snapping tools.

## Features

### Drawing Tools
- **Point Tool (P)**: Place individual survey points with coordinates
- **Line Tool (L)**: Draw straight lines between two points
- **Polyline Tool (Shift+L)**: Draw connected multi-segment lines
- **Dimension Tool (D)**: Add annotated dimension lines with measurements
- **Measure Tool (M)**: Temporary measurement of distances and angles

### Editing Tools
- **Select Tool (V)**: Select, move, and edit objects
- **Delete (Del/Backspace)**: Remove selected objects
- **Multi-select**: Hold Ctrl/Cmd while clicking to select multiple objects

### Precision Features
- **Snap to Grid**: Automatically align to grid intersections
- **Snap to Points**: Snap to existing points and line endpoints
- **Adjustable Grid**: Configure grid size (1-100 units)
- **Coordinate Display**: Real-time cursor position in world coordinates

### View Controls
- **Pan**: Shift+Click and drag, or Right-click and drag
- **Zoom**: Mouse wheel to zoom in/out
- **Keyboard Zoom**:
  - Ctrl/Cmd + Plus: Zoom in
  - Ctrl/Cmd + Minus: Zoom out
  - Ctrl/Cmd + 0: Reset view

### File Operations
- **New Project**: Start fresh canvas
- **Save Project**: Export to JSON format (preserves all data)
- **Load Project**: Import previously saved projects
- **Export DXF**: Export to AutoCAD DXF format
- **Export CSV**: Export point coordinates to CSV
- **Export SVG**: Export as scalable vector graphics

## Getting Started

### Installation
No installation required! Simply open `index.html` in a modern web browser.

```bash
# Open in your default browser
open index.html

# Or use a local server (recommended)
python -m http.server 8000
# Then visit http://localhost:8000
```

### Quick Start Guide

1. **Select a Tool**: Click any tool button or use keyboard shortcuts
2. **Draw Something**:
   - For points: Click anywhere
   - For lines: Click start point, then end point
   - For polylines: Click multiple points, press Enter to close or Escape to finish
3. **Edit Objects**: Use Select tool (V) to click and drag objects
4. **Add Measurements**: Use Measure tool (M) for temporary measurements
5. **Add Dimensions**: Use Dimension tool (D) for permanent dimension annotations
6. **Save Your Work**: Click "Save" to export your project

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| V | Select/Move tool |
| P | Point tool |
| L | Line tool |
| Shift+L | Polyline tool |
| M | Measure tool |
| D | Dimension tool |
| Del/Backspace | Delete selected |
| Esc | Cancel current operation / Deselect all |
| Ctrl/Cmd + 0 | Reset view |
| Ctrl/Cmd + Plus | Zoom in |
| Ctrl/Cmd + Minus | Zoom out |
| Enter | Close polyline (when using polyline tool) |

## Usage Tips

### Creating Site Plans
1. Set your grid size to match your project units (e.g., 1 meter, 5 feet)
2. Enable "Snap to Grid" for precise placement
3. Place key survey points first
4. Connect points with lines or polylines to define boundaries
5. Add dimensions to annotate critical measurements

### Working with Coordinates
- All coordinates are displayed relative to the origin (red/green axes)
- Red axis = X-axis (horizontal)
- Green axis = Y-axis (vertical)
- Hover over points to see their exact coordinates
- Export to CSV to get a list of all coordinates

### Best Practices
- Use points to mark important locations (corners, utilities, etc.)
- Use polylines for boundaries and continuous features
- Use dimensions to annotate critical measurements
- Save frequently to avoid losing work
- Export to DXF for compatibility with professional CAD software

## File Formats

### JSON (Native Format)
- Preserves all project data
- Human-readable
- Can be edited in text editor if needed
- Recommended for saving work-in-progress

### DXF (AutoCAD Exchange Format)
- Industry-standard CAD format
- Compatible with AutoCAD, QCAD, LibreCAD, etc.
- Exports points, lines, polylines, and dimensions
- Use for sharing with other professionals

### CSV (Comma-Separated Values)
- Exports all point coordinates
- Opens in Excel, Google Sheets, etc.
- Useful for surveying data and coordinate lists
- Includes point IDs and types

### SVG (Scalable Vector Graphics)
- Vector format for web and print
- Can be opened in Illustrator, Inkscape, etc.
- Maintains quality at any scale
- Good for presentations and documentation

## Browser Compatibility

Tested and working in:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires a modern browser with HTML5 Canvas support.

## Technical Details

### Architecture
- Pure JavaScript (no framework dependencies)
- HTML5 Canvas for rendering
- Modular architecture:
  - `geometry.js`: Geometric calculations and data structures
  - `canvas.js`: Canvas rendering and view management
  - `tools.js`: Drawing and editing tools
  - `export.js`: File import/export functionality
  - `app.js`: Main application logic

### Coordinate System
- Standard Cartesian coordinate system
- Origin (0, 0) at center of initial view
- Positive X to the right, positive Y upward
- All measurements in abstract "units" (interpret as needed)

## Future Enhancements

Potential features for future versions:
- Arc and circle drawing tools
- Text annotation tool
- Layer management
- Import DXF files
- Measurement units configuration
- Angle snapping (orthogonal, 45°, etc.)
- Object properties panel
- Undo/redo functionality

## License

Free to use for personal and commercial projects.

## Support

For issues or feature requests, please document your use case and desired functionality.

---

**Made for site planning, surveying, and CAD-style linework applications.**
