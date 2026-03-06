<template>
  <div class="tree-container">
    <div id="query-tree-network" class="network-canvas"></div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue';

const props = defineProps({
  treeData: {
    type: Object,
    default: () => null
  }
});

const emit = defineEmits(['node-select']);

let network = null;

const renderTree = () => {
    if (!props.treeData) return;
    
    // Ensure Vis is available
    const vis = window.vis;
    if (!vis) {
        console.error("Vis.js not loaded");
        return;
    }

    const container = document.getElementById('query-tree-network');
    const data = {
        nodes: new vis.DataSet(props.treeData.nodes),
        edges: new vis.DataSet(props.treeData.edges)
    };
    
    // Hierarchical layout options for tree visualization
    const options = {
        layout: {
            hierarchical: {
                direction: 'UD', // Up-Down
                sortMethod: 'directed',
                levelSeparation: 100, // Increased for better vertical spacing
                nodeSpacing: 250, // Significantly increased to prevent long labels from overlapping horizontally
                treeSpacing: 250,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: true
            }
        },
        nodes: {
            shape: 'box',
            font: { 
                size: 14, 
                face: 'Inter', 
                color: '#1e293b',
                multi: 'html',
                bold: { size: 14, vadjust: 0, mod: 'bold' },
                ital: { size: 10, vadjust: 4, mod: 'bold' },
                mono: { size: 10, vadjust: -8, mod: 'bold' }
            },
            borderWidth: 1,
            borderWidthSelected: 3,
            shadow: true,
            margin: { top: 12, bottom: 12, left: 16, right: 16 },
            color: {
                background: '#ffffff',
                border: '#2563eb',
                highlight: { background: '#dbeafe', border: '#1d4ed8' }
            },
            chosen: {
                node: function(values, id, selected, hovering) {
                    if (selected) {
                        values.shadowSize = 15;
                        values.shadowColor = 'rgba(37, 99, 235, 0.5)';
                        values.borderColor = '#1d4ed8';
                    }
                },
                label: function(values, id, selected, hovering) {
                    if (selected) {
                        values.size = 18;
                        values.mod = 'bold';
                        values.color = '#1e3a8a';
                    }
                }
            }
        },
        edges: {
            width: 1,
            color: '#94a3b8',
            smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 }         
        },
        physics: false, // Disable physics for static tree layout
        interaction: {
            dragNodes: false, // Keep tree static structure
            zoomView: true,
            dragView: true,
            hover: true
        }
    };

    if (network) network.destroy();
    network = new vis.Network(container, data, options);

    network.on("click", (params) => {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = data.nodes.get(nodeId);
            emit('node-select', node);
        } else {
            emit('node-select', null);
        }
    });
};

watch(() => props.treeData, () => {
    renderTree();
});

const downloadImage = () => {
    if (!network) return;
    
    // Get the canvas element from vis-network
    const canvas = document.querySelector('#query-tree-network canvas');
    if (!canvas) return;
    
    // Create a temporary link to download
    const link = document.createElement('a');
    link.download = `pathdb-query-tree-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
};

const focusNode = (nodeId) => {
    if (!network) return;
    network.selectNodes([nodeId]);
    
    // Pan to the node but retain the current view scale, or use a general view scale
    const currentScale = network.getScale();
    const targetScale = currentScale > 1.2 ? 1.0 : currentScale; // Prevent aggressive zoom
    
    network.focus(nodeId, {
        scale: targetScale,
        animation: {
            duration: 800,
            easingFunction: 'easeInOutQuad'
        }
    });
};

defineExpose({
    downloadImage,
    focusNode
});

onMounted(() => {
    if (props.treeData) renderTree();
});

</script>

<style scoped>
.tree-container {
    position: relative;
    width: 100%;
    height: 100%;
}

.network-canvas {
    width: 100%;
    height: 100%;
    outline: none;
    background-color: var(--bg-primary);
}
</style>
