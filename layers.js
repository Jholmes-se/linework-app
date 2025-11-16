// Layer management system

class Layer {
    constructor(name, id = null) {
        this.id = id || `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = name;
        this.visible = true;
        this.locked = false;
        this.color = '#ffffff';
        this.opacity = 1.0;
    }

    clone() {
        const layer = new Layer(this.name, null);
        layer.visible = this.visible;
        layer.locked = this.locked;
        layer.color = this.color;
        layer.opacity = this.opacity;
        return layer;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            visible: this.visible,
            locked: this.locked,
            color: this.color,
            opacity: this.opacity
        };
    }

    static fromJSON(data) {
        const layer = new Layer(data.name, data.id);
        layer.visible = data.visible !== undefined ? data.visible : true;
        layer.locked = data.locked !== undefined ? data.locked : false;
        layer.color = data.color || '#ffffff';
        layer.opacity = data.opacity !== undefined ? data.opacity : 1.0;
        return layer;
    }
}

class LayerManager {
    constructor() {
        this.layers = [];
        this.activeLayerId = null;

        // Create default layer
        const defaultLayer = new Layer('Layer 0');
        this.layers.push(defaultLayer);
        this.activeLayerId = defaultLayer.id;
    }

    createLayer(name) {
        const layer = new Layer(name || `Layer ${this.layers.length}`);
        this.layers.push(layer);
        return layer;
    }

    deleteLayer(layerId) {
        // Don't allow deleting the last layer
        if (this.layers.length <= 1) {
            return false;
        }

        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return false;

        this.layers.splice(index, 1);

        // If we deleted the active layer, switch to the first layer
        if (this.activeLayerId === layerId) {
            this.activeLayerId = this.layers[0].id;
        }

        return true;
    }

    getLayer(layerId) {
        return this.layers.find(l => l.id === layerId);
    }

    getActiveLayer() {
        return this.getLayer(this.activeLayerId);
    }

    setActiveLayer(layerId) {
        if (this.getLayer(layerId)) {
            this.activeLayerId = layerId;
            return true;
        }
        return false;
    }

    moveLayer(layerId, direction) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index === -1) return false;

        if (direction === 'up' && index > 0) {
            [this.layers[index], this.layers[index - 1]] = [this.layers[index - 1], this.layers[index]];
            return true;
        } else if (direction === 'down' && index < this.layers.length - 1) {
            [this.layers[index], this.layers[index + 1]] = [this.layers[index + 1], this.layers[index]];
            return true;
        }

        return false;
    }

    toggleVisibility(layerId) {
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.visible = !layer.visible;
            return true;
        }
        return false;
    }

    toggleLock(layerId) {
        const layer = this.getLayer(layerId);
        if (layer) {
            layer.locked = !layer.locked;
            return true;
        }
        return false;
    }

    toJSON() {
        return {
            layers: this.layers.map(l => l.toJSON()),
            activeLayerId: this.activeLayerId
        };
    }

    fromJSON(data) {
        if (data.layers && data.layers.length > 0) {
            this.layers = data.layers.map(l => Layer.fromJSON(l));
            this.activeLayerId = data.activeLayerId || this.layers[0].id;
        }
    }
}
