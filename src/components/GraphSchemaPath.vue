<template>
  <div ref="container" class="schema-path-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { Network } from "vis-network";
import "vis-network/styles/vis-network.css";

const props = defineProps({
  schemaData: { type: Object, required: true },
  labelColors: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["node-click", "edge-click"]);

const container = ref(null);
let network = null;

function destroyNetwork() {
  if (network) {
    network.destroy();
    network = null;
  }
}

function buildDataFromSchema() {
  const s = props.schemaData || {};
  const nodeSchema = s.nodeSchema || {};
  const edgeConnections = s.edgeConnections || {};
  const edgeCountByLabel = s.edgeCountByLabel || {};
  const edgeSchema = s.edgeSchema || {};

  const nodes = [];
  const edges = [];

  for (const [label, propsObj] of Object.entries(nodeSchema)) {
    nodes.push({
      id: label,
      label,
      shape: "box",
      margin: 8,
      color: {
        background: "#ffffff",
        border: props.labelColors[label] || "#6B7280",
      },
      font: { color: "#1F2937", size: 14, face: "Inter", bold: true },
      meta: { count: s.nodeCountByLabel?.[label], propsObj },
    });
  }

  for (const [edgeLabel, conns] of Object.entries(edgeConnections)) {
    const count = edgeCountByLabel[edgeLabel] ?? 0;
    const propsObj = edgeSchema[edgeLabel] || {};

    for (const c of conns) {
      edges.push({
        id: "e-" + edgeLabel + "-" + c.srcLabel + "-" + c.dstLabel,
        from: c.srcLabel,
        to: c.dstLabel,
        arrows: "to",
        label: edgeLabel,
        font: { align: "horizontal", size: 11 },
        smooth: true,
        meta: { edgeLabel, count, propsObj },
      });
    }
  }

  return { nodes, edges };
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function createNetwork() {
  if (!container.value) return;
  destroyNetwork();

  const { nodes, edges } = buildDataFromSchema();
  if (!nodes.length && !edges.length) return;

  const options = {
    layout: { improvedLayout: true, hierarchical: false },
    physics: {
      enabled: true,
      solver: "repulsion",
      repulsion: { nodeDistance: 200, centralGravity: 0.05 },
    },
    interaction: { hover: true, multiselect: false, zoomView: true, dragView: true },
    nodes: { borderWidth: 2, shadow: true },
    edges: { width: 2, color: { color: "#3b82f6", highlight: "#2563EB" } },
  };

  network = new Network(container.value, { nodes, edges }, options);

  network.on("click", (params) => {
    const nodeId = params.nodes[0];
    if (nodeId && !nodeId.startsWith("e-")) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const propsObject = node.meta.propsObj || {};
      const outgoing = [];
      const incoming = [];
      for (const [edgeLabel, conns] of Object.entries(props.schemaData?.edgeConnections || {})) {
        conns.forEach((c) => {
          if (c.srcLabel === node.id) outgoing.push({ edgeLabel, otherLabel: c.dstLabel });
          if (c.dstLabel === node.id) incoming.push({ edgeLabel, otherLabel: c.srcLabel });
        });
      }

      emit("node-click", {
        type: "Node",
        id: node.id.toLowerCase(),
        label: node.label,
        properties: {
          Label: node.label,
          Color: props.labelColors[node.label] || "#6B7280",
          "Property Count": Object.keys(propsObject).length,
          Properties: propsObject,
        },
        schemaEdges: { outgoing, incoming },
        schemaProps: Object.keys(propsObject),
      });
    } else if (params.edges.length > 0) {
      const edgeId = params.edges[0];
      const edge = edges.find((e) => e.id === edgeId);
      handleEdgeClick(edge, edges);
    }
  });
}

function handleEdgeClick(edge, edges) {
  if (!edge) return;
  const { edgeLabel, count, propsObj } = edge.meta || {};
  const finalLabel = edgeLabel || edge.label || "Unknown";

  const allEdgesWithLabel = edges.filter((e) => e.meta?.edgeLabel === finalLabel);
  const sources = Array.from(new Set(allEdgesWithLabel.map((e) => e.from))).map((nodeLabel) => ({ nodeLabel }));
  const targets = Array.from(new Set(allEdgesWithLabel.map((e) => e.to))).map((nodeLabel) => ({ nodeLabel }));

  emit("edge-click", {
    type: "Edge",
    id: finalLabel.toLowerCase(),
    label: finalLabel,
    properties: {
      Label: finalLabel,
      "Edge Type": finalLabel,
      Count: formatNumber(count || 0),
      "Property Count": Object.keys(propsObj || {}).length,
      Properties: propsObj || {},
    },
    schemaProps: Object.keys(propsObj || {}),
    schemaConnections: { sources, targets },
  });
}

onMounted(() => { createNetwork(); });
onBeforeUnmount(() => { destroyNetwork(); });
watch(() => props.schemaData, () => { createNetwork(); }, { deep: true });
</script>

<style scoped>
.schema-path-container {
  width: 100%;
  height: 100%;
}
</style>
