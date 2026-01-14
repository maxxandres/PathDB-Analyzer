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
                levelSeparation: 100, // Increased for better spacing
                nodeSpacing: 200,
                treeSpacing: 200,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: true
            }
        },
        nodes: {
            shape: 'box',
            font: { size: 14, face: 'Inter' },
            borderWidth: 1,
            shadow: true,
            margin: 10,
            color: {
                background: '#ffffff',
                border: '#2563eb',
                highlight: { background: '#eff6ff', border: '#1d4ed8' }
            }
        },
        edges: {
            width: 1,
            color: '#94a3b8',
            smooth: { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 },
            arrows: 'null'
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
}
</style>
