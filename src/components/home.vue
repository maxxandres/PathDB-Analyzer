<template>
  <div class="app-container">


    <!-- MAIN CONTENT -->
    <main class="main-content">
        <header class="main-header">
            <div class="query-section">
                <div class="query-bar-container">
                    <div class="query-input-wrapper">
                        <i data-lucide="terminal" class="query-icon"></i>
                        <QueryInput 
                            v-model="queryInput" 
                            class="header-query-input"
                            :schemaData="{}"
                            placeholder="Enter PathDB query..."
                            @keyup.enter.ctrl="runQuery"
                        />
                    </div>
                    
                    <button @click="runQuery" :disabled="isLoading" class="header-run-btn">
                        <i data-lucide="play" class="btn-icon"></i>
                        <span>{{ isLoading ? '...' : 'Run Query' }}</span>
                    </button>
                </div>

                <div class="header-actions-query">
                    <div class="presets-dropdown-container">
                        <button class="presets-action-btn" @click="showPresets = !showPresets">
                            <i data-lucide="list" class="icon-tiny"></i>
                            Examples
                            <i data-lucide="chevron-down" class="icon-tiny"></i>
                        </button>
                        <div v-if="showPresets" class="presets-dropdown">
                            <div v-for="(q, i) in presets" :key="i" @click="selectPreset(q)" class="preset-item">
                                <span class="preset-label">{{ q.label }}</span>
                                <span class="preset-query-preview">{{ q.query }}</span>
                            </div>
                        </div>
                    </div>

                    <button class="presets-action-btn" @click="openGraphModal" style="margin-left: 0.5rem;" title="View Default Graph">
                        <i data-lucide="image" class="icon-tiny"></i>
                        Graph
                    </button>
                </div>
            </div>
            <div class="header-actions">
                <div class="header-actions-top">
                    <!-- Theme Toggle -->
                    <button class="action-btn" @click="$emit('toggle-theme')" :title="theme === 'light' ? 'Dark Mode' : 'Light Mode'">
                        <i :data-lucide="theme === 'light' ? 'moon' : 'sun'" class="icon-small"></i>
                    </button>
                    
                    <!-- Logout -->
                    <button class="action-btn logout-btn" @click="$emit('logout')" title="Logout">
                        <i data-lucide="log-out" class="icon-small"></i>
                    </button>
                </div>
                
                
                <!-- User Info -->
                <div v-if="session" class="user-session-compact">
                    <i data-lucide="user" class="icon-xtiny"></i>
                    <span>{{ session.user }}</span>
                </div>
            </div>
        </header>

                    <!-- Export Tree Button
                <div v-if="treeData" class="panel-header-actions">
                    <button @click="triggerExport" class="export-btn" title="Export as PNG">
                        <i data-lucide="download" class="icon-tiny"></i>
                        Export Tree
                    </button>
            <!-- Graph Image Modal -->
            <div v-if="showGraphModal" class="sequence-modal-overlay" @click.self="showGraphModal = false" style="z-index: 9999;">
                <div class="sequence-modal-content" style="max-width: 80vw; max-height: 80vh; display: flex; flex-direction: column;">
                    <div class="sequence-modal-header">
                        <h3 class="sequence-modal-title">Default Graph</h3>
                        <button @click="showGraphModal = false" class="sequence-modal-close-btn">
                            <i data-lucide="x" class="icon-small"></i>
                        </button>
                    </div>
                    <div class="sequence-modal-body" style="flex: 1; display: flex; justify-content: center; align-items: center; overflow: auto; padding: 1rem; background-color: var(--bg-secondary);">
                        <img src="../assets/graph.png" alt="Default Graph" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                    </div>
                </div>
            </div>

        <div class="content-area" :class="`pos-${panelPosition}`">
            


                <div v-if="!treeData" class="empty-state">
                    <div class="empty-icon-wrapper">
                        <i data-lucide="tree-deciduous" class="empty-icon"></i>
                    </div>
                    <h2 class="empty-title">No Query Executed</h2>
                    <p class="empty-desc">
                        Write a query and run it to see the Query Tree.
                    </p>
                </div>

                <div v-else class="tree-wrapper" style="position: relative;">
                    <QueryTree ref="treeRef" :treeData="treeData" @node-select="handleNodeSelect" />
                    
                    <!-- Sequence Detail Modal (Now in Canvas side) -->
                    <div v-if="isSequenceModalOpen" class="sequence-modal-overlay" @click.self="closeSequenceModal">
                        <div class="sequence-modal-content">
                            <div class="sequence-modal-header">
                                <h3 class="sequence-modal-title">Path Sequence Details</h3>
                                <button @click="closeSequenceModal" class="sequence-modal-close-btn">
                                    <i data-lucide="x" class="icon-small"></i>
                                </button>
                            </div>
                            <div class="sequence-modal-body" style="display: flex; flex-direction: column; width: 100%;">
                                <!-- Path Summary Table -->
                                <div class="sequence-summary-wrapper" style="margin: 0 auto 2rem auto; width: fit-content; max-width: 90%;">
                                    <table class="premium-table sequence-summary-table" style="margin: 0; min-width: 300px; text-align: center; border: 1px solid black;">
                                        <thead>
                                            <tr>
                                                <th>Source</th>
                                                <th>Target</th>
                                                <th>Length</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-if="selectedSequence && selectedSequence.length > 0">
                                                <td>{{ selectedSequence.filter(s => s.type === 'node')[0]?.id || '?' }}</td>
                                                <td>{{ selectedSequence.filter(s => s.type === 'node').slice(-1)[0]?.id || '?' }}</td>
                                                <td>{{ selectedSequence.filter(s => s.type === 'edge').length }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h4 style="color: var(--text-color); margin-bottom: 1rem; font-size: 0.9rem; font-weight: 600;">Path Sequence</h4>
                                <div class="sequential-path horizontal">
                                    <template v-for="(segment, segmentIdx) in selectedSequence" :key="segmentIdx">
                                        
                                        <div class="sequence-row" :class="segment.type">
                                            <div class="sequence-symbol">
                                                {{ segment.type === 'node' ? '●' : '→' }}
                                            </div>
                                            <div class="sequence-details-card">
                                                <div class="sequence-card-header">
                                                     <span class="branded-label">{{ segment.label }}</span>
                                                     <span class="symbolic-sep">›</span>
                                                     <span class="branded-id">{{ segment.id }}</span>
                                                </div>
                                                
                                                <div v-if="segment.type === 'edge' && (segment.source || segment.target)" class="sequence-badges mt-1">
                                                    <span v-if="segment.source" class="mini-badge-outline">Src: {{ segment.source }}</span>
                                                    <span v-if="segment.target" class="mini-badge-outline">Tgt: {{ segment.target }}</span>
                                                </div>

                                                <div class="sequence-properties mt-2" v-if="segment.properties && Object.keys(segment.properties).filter(k => !['id', 'label', 'type', 'source', 'target'].includes(k)).length > 0">
                                                    <template v-for="(val, key) in segment.properties" :key="key">
                                                        <div v-if="!['id', 'label', 'type', 'source', 'target'].includes(key)" class="sequence-kv">
                                                            <span class="prop-key">{{ key }}:</span>
                                                            <span class="prop-val">{{ val }}</span>
                                                        </div>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>

                                        <div v-if="segmentIdx < selectedSequence.length - 1 && segment.type === 'node'" class="sequence-connector"></div>

                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            <!-- Object Viewer -->
            <div 
              class="details-panel" 
              :class="[{ 'details-open': selectedNode, 'details-closed': !selectedNode }, `panel-${panelPosition}`]"
              :style="panelPosition === 'right' ? { width: detailsPanelWidth + 'px' } : { height: detailsPanelHeight + 'px' }"
            >
                 <!-- Resize Handle -->
                 <div 
                   class="resize-handle" 
                   :class="`handle-${panelPosition}`"
                   @mousedown="startResize"
                 ></div>
                  <div class="details-header">
                      <div class="details-header-left">
                          <span class="details-title">Object Viewer</span>
                      </div>
                      <button @click="selectedNode = null" class="close-btn">
                          <i data-lucide="x" class="icon-small"></i>
                      </button>
                  </div>

                 <div v-if="selectedNode" class="details-content">
                     <!-- Selected Object Header -->
                     <div class="object-header" v-if="selectedNodeHeader">
                         <div class="generic-title">Algebra Expression:</div>
                         <div class="object-label" v-html="selectedNodeHeader.title"></div>
                         
                         <hr class="header-divider" />
                         
                         <div class="operator-info-line">
                             <span class="info-label">Operator Name:</span>
                             <span class="info-value">{{ selectedNodeHeader.operatorName }}</span>
                         </div>
                         <div class="operator-info-line">
                             <span class="info-label">Operator structure:</span>
                             <span class="info-value" v-html="selectedNodeHeader.operatorStructure"></span>
                         </div>

                         <!-- Node Parameters -->
                         <div v-if="selectedNodeParams" class="node-parameters-container">
                             <div class="params-list">
                                 <div v-for="(param, idx) in selectedNodeParams" :key="idx" class="param-item">
                                     <span class="param-key">- {{ param.key }} :</span>
                                     <button v-if="param.node" class="param-node-btn" @click="handleNodeSelect(param.node)" v-html="formatNodeButtonLabel(param.node)">
                                     </button>
                                     <span v-else class="param-value-plain" v-html="param.value"></span>
                                 </div>
                             </div>
                         </div>
                     </div>

                     <!-- Data Content -->
                     <div v-if="currentNodeData.rows">

                         <div v-if="pathTableData.length > 0" class="path-results-container">
                             <div class="results-header-wrapper">
                                 <h3 class="data-title">
                                     <i data-lucide="database" class="icon-tiny"></i>
                                     Results 
                                     <span class="path-count-badge">
                                         <template v-if="pathSearchQuery || pathFilterColumn.length > 0">
                                             {{ filteredPathTableData.length }} matching / {{ pathTableData.length }} total
                                         </template>
                                         <template v-else>
                                             {{ pathTableData.length }} paths
                                         </template>
                                     </span>
                                 </h3>
                                 <div class="unified-search-wrapper">
                                     <i data-lucide="search" class="icon-xtiny"></i>
                                     <input v-model="pathSearchQuery" type="text" 
                                            :placeholder="pathFilterColumn.length === 0 ? 'Search all columns...' : `Search in: ${pathFilterColumn.join(', ')}...`"
                                            class="unified-search-input">
                                 </div>
                             </div>
                         </div>
                        
                        <!-- Results Content -->
                        <template v-if="currentNodeData.data && currentNodeData.data[0]?.segments">
                            <!-- mode: table (Path Table View) -->
                            <div class="path-table-view">


                                <!-- Path Table - Now at the bottom (Always visible) -->
                                <div class="table-container-scroll">
                                    <table class="premium-table">
                                         <thead>
                                            <tr>
                                                <th @click="setTableSort('source')" :class="{ 'active-filter': pathFilterColumn.includes('source') }">
                                                    <button class="sort-btn" @click.stop="toggleSort('source')" :class="{ 'active': tableSortKey === 'source' }">
                                                        <span class="sort-icon">{{ tableSortKey === 'source' && tableSortOrder === 1 ? '↑' : '↓' }}</span>
                                                    </button>
                                                    <span v-if="pathFilterColumn.includes('source')" class="filter-emoji">🔍</span>
                                                    Source
                                                </th>
                                                <th @click="setTableSort('target')" :class="{ 'active-filter': pathFilterColumn.includes('target') }">
                                                    <button class="sort-btn" @click.stop="toggleSort('target')" :class="{ 'active': tableSortKey === 'target' }">
                                                        <span class="sort-icon">{{ tableSortKey === 'target' && tableSortOrder === 1 ? '↑' : '↓' }}</span>
                                                    </button>
                                                    <span v-if="pathFilterColumn.includes('target')" class="filter-emoji">🔍</span>
                                                    Target
                                                </th>
                                                <th @click="setTableSort('length')" :class="{ 'active-filter': pathFilterColumn.includes('length') }">
                                                    <button class="sort-btn" @click.stop="toggleSort('length')" :class="{ 'active': tableSortKey === 'length' }">
                                                        <span class="sort-icon">{{ tableSortKey === 'length' && tableSortOrder === 1 ? '↑' : '↓' }}</span>
                                                    </button>
                                                    <span v-if="pathFilterColumn.includes('length')" class="filter-emoji">🔍</span>
                                                    Length
                                                </th>
                                                <th>Sequence</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="row in sortedPathTableData" :key="row.id" 
                                                :class="{ 
                                                    'selected-row': selectedTablePath?.id === row.id && selectedTablePath?.context === activeJoinTab,
                                                    'highlighted-child-row': isSubPath(row, activeJoinTab)
                                                }"
                                                @click="selectRowFromTable(row)">
                                                <td>{{ row.source }}</td>
                                                <td>{{ row.target }}</td>
                                                <td>{{ row.length }}</td>
                                                <td>
                                                    <button class="action-btn-small" @click.stop="openSequenceModal(row.segments)">
                                                        <i data-lucide="eye" class="icon-xtiny"></i> See Path
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </template>

                        <!-- Table Display (Only for non-path results) -->
                        <div v-else class="path-table-view">
                            <div class="table-container-scroll">
                                <table class="premium-table">
                                    <thead>
                                        <tr>
                                            <th v-for="(header, idx) in currentNodeData.headers" :key="idx">
                                                {{ header }}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="(row, rowIdx) in currentNodeData.rows" :key="rowIdx"
                                            :class="{ 'selected-row': expandedRow === rowIdx }"
                                            @click="toggleRow(rowIdx)">
                                            <td v-for="(cell, cellIdx) in row" :key="cellIdx" :title="isPathCell(cell) ? 'Path Data' : cell">
                                                <span v-if="cell === null || cell === undefined || cell === ''" class="null-value">(null)</span>
                                                <template v-else-if="isPathCell(cell)">
                                                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                                                        <span style="font-weight: 500; font-size: 0.85rem; color: var(--text-primary);">Path {{ rowIdx + 1 }}</span>
                                                        <button class="action-btn-small" @click.stop="openSequenceModal(parsePathCell(cell))">
                                                            <i data-lucide="eye" class="icon-xtiny"></i> See Path
                                                        </button>
                                                    </div>
                                                </template>
                                                <span v-else>{{ cell }}</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        
                     </div>
                 </div>

                 <div v-else class="empty-details">
                     <i data-lucide="mouse-pointer-click" class="empty-details-icon"></i>
                     <p class="empty-details-text">Select a item in the query tree to inspect its details and data.</p>
                 </div>
            </div>

        </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue';
import QueryTree from './QueryTree.vue';
import QueryInput from './QueryInput.vue';
import { api } from '../services/api';

const props = defineProps(['session', 'theme']);
const emit = defineEmits(['node-select', 'logout', 'toggle-theme']);

const queryInput = ref('   ');
const isLoading = ref(false);
const treeData = ref(null);
const selectedNode = ref(null);
const treeRef = ref(null);
const treeMode = ref('raw'); // 'logical' or 'raw'
const expandedRow = ref(null); // Track which row is expanded for details
const expandedSegments = ref({}); // Track which segments within a path are expanded
const selectedPathElement = ref(null); // Track clicked element in visual path
const pathViewMode = ref('table'); // Default to table
const tableSortKey = ref('length');
const tableSortOrder = ref(-1); // -1 for descending, 1 for ascending
const selectedTablePath = ref(null);
const showPathTable = ref(true);
const panelPosition = ref('right'); // 'right' or 'bottom'
const activeJoinTab = ref('join'); // 'join', 'left', 'right'

// Filtering state for Path Table
const pathSearchQuery = ref('');
const pathFilterColumn = ref([]); // Array of active columns: 'source', 'target', 'length'

// Sidebar state
const sidebarExpanded = ref(false);
const showPresets = ref(false);
const showGraphModal = ref(false);

const openGraphModal = () => {
    showGraphModal.value = true;
    nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
    });
};

const toggleSegment = (idx) => {
    expandedSegments.value[idx] = !expandedSegments.value[idx];
    nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
    });
};

watch(pathViewMode, () => {
    nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
    });
});

// Resizable Object Viewer
const detailsPanelWidth = ref(500);
const detailsPanelHeight = ref(350);
const isResizing = ref(false);

// Sequence Modal State
const isSequenceModalOpen = ref(false);
const selectedSequence = ref([]);

const openSequenceModal = async (segments) => {
    // Deep clone to safely update properties without affecting other components prematurely
    const clonedSegments = JSON.parse(JSON.stringify(segments));
    selectedSequence.value = clonedSegments;
    isSequenceModalOpen.value = true;
    
    nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    // Fetch details for any pseudo-nodes (like source/target in Paths1G)
    if (props.session) {
        const { loginToken, sessionToken } = props.session;
        for (let i = 0; i < selectedSequence.value.length; i++) {
            let segment = selectedSequence.value[i];
            if (segment.type === 'node' && segment.label === '?') {
                try {
                    const result = await api.search({
                        type: 'node',
                        properties: { id: segment.id },
                        limit: 1,
                        loginToken,
                        sessionToken
                    });
                    
                    if (result.success && result.data && result.data.length > 0) {
                        let parsed = parseBackendString(result.data[0]);
                        
                        // Update reactivity wrapper dynamically
                        selectedSequence.value[i].label = parsed.label || '?';
                        const nodeProps = { ...parsed };
                        delete nodeProps.segments;
                        selectedSequence.value[i].properties = nodeProps;
                    }
                } catch (e) {

                }
            }
        }
    }
};

const closeSequenceModal = () => {
    isSequenceModalOpen.value = false;
    selectedSequence.value = [];
};

const startResize = (e) => {
    isResizing.value = true;
    document.addEventListener('mousemove', doResize);
    document.addEventListener('mouseup', stopResize);
};

const doResize = (e) => {
    if (!isResizing.value) return;
    
    if (panelPosition.value === 'right') {
        const containerRight = window.innerWidth;
        const newWidth = containerRight - e.clientX;
        if (newWidth >= 200 && newWidth <= 800) {
            detailsPanelWidth.value = newWidth;
        }
    } else {
        const containerBottom = window.innerHeight;
        const newHeight = containerBottom - e.clientY;
        if (newHeight >= 150 && newHeight <= 600) {
            detailsPanelHeight.value = newHeight;
        }
    }
};

const stopResize = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', doResize);
    document.removeEventListener('mouseup', stopResize);
};

const triggerExport = () => {
    if (treeRef.value) {
        treeRef.value.downloadImage();
    }
}

const presets = [
    { label: "Join Query", query: 'MATCH TRAIL p = (x)-[(Knows.Likes)]->(y) where x.name = "Moe" RETURN y.txt;' },
    { label: "Union Query", query: 'MATCH TRAIL p = (x)-[(Knows|Likes)]->(y) where x.name = "Moe" RETURN y.name,y.txt;' },
    { label: "Transitive Closure Query", query: 'MATCH TRAIL p = (x)-[(Knows+)]-> (y) RETURN p;'},
    { label: "Kleene Query", query:'MATCH TRAIL p = (x)-[(Knows*)]-> (y) RETURN p;'},  
    { label: "Complex Query 1 ", query: 'MATCH TRAIL p = (x)-[((Likes.HasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3'},
    { label: "Complex Query 2 ", query: 'MATCH TRAIL p = (x)-[((Knows+.Likes))]->(y) WHERE x.name = "Moe" RETURN y.txt;'}
];

const loadPreset = (preset) => {
    queryInput.value = preset.query;
}

const selectPreset = (preset) => {
    queryInput.value = preset.query;
    showPresets.value = false;
    runQuery();
}

const toggleRow = (index) => {
    // Only toggle if the row has segments
    if (currentNodeData.value.data[index]?.segments) {
        expandedRow.value = expandedRow.value === index ? null : index;
        selectedPathElement.value = null; // Reset element selection
        nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
        });
    }
}

const handleNodeSelect = (node) => {
    selectedNode.value = node;
    expandedRow.value = null; // Reset expansion on new selection
    selectedTablePath.value = null; // Reset path sequence view
    
    // Safety check: node can be null if clicking background
    if (!node) return;

    // Focus and center the node in the tree visually
    if (treeRef.value && typeof treeRef.value.focusNode === 'function') {
        treeRef.value.focusNode(node.id);
    }

    // Auto-select first path if available
    nextTick(() => {
        if (currentNodeData.value.data && currentNodeData.value.data[0]?.segments) {
            expandedRow.value = 0;
            nextTick(() => {
                if (window.lucide) window.lucide.createIcons();
            });
        }
    });

    const label = node.label || "";
    const isRootNode = treeData.value && !treeData.value.edges.some(e => e.to === node.id);
    
    // Check for specialized operator nodes
    if (isRootNode && queryInput.value) {
        performOperatorEnrichment(node, 'root');
    } else if (label.includes("⋈")) { // JOIN
        performOperatorEnrichment(node, 'join');
    } else if (label.includes("∪")) { // UNION
        performOperatorEnrichment(node, 'union');
    } else if (label.includes("Φ")) { // RECURSIVE / KLEENE
        performOperatorEnrichment(node, 'recursive');
    } else if (label.includes("Paths₁") || label.includes("Paths₀")) {
        // Collect all filters in this sub-tree to allow nested/chained filters
        const filters = collectSubtreeFilters(node.id);
        performSearch(node, filters);
    } else if (label.includes("σ")) {
         // Distinguish between structural label selections (Search) and property filter selections (Query)
         if (label.includes("label(")) {
             const filters = collectSubtreeFilters(node.id);
             performSearch(node, filters);
         } else {
             performOperatorEnrichment(node, 'selection');
         }
    }
}

/**
 * Performs specialized enrichment for complex operators
 */
/**
 * Performs specialized enrichment for complex operators
 */
const performOperatorEnrichment = async (node, operatorType, targetTab = 'join') => {
    // Cache Check: If data for this tab already exists, just switch tab (if applicable) and return
    if (node.apiResults) {
        if (operatorType === 'join' && node.apiResults[targetTab]) {
            activeJoinTab.value = targetTab;
            return;
        } else if (operatorType !== 'join' && node.apiResults.success) {
            return; // Already loaded standard results
        }
    }

    // Initialize apiResults structure if new
    if (!node.apiResults) {
        node.apiResults = { 
            type: operatorType, 
            success: true, 
            message: "Loading...",
            join: null, 
            left: null, 
            right: null 
        };
        // Force Vue reactivity for the currently selected node
        if (selectedNode.value && selectedNode.value.id === node.id) {
            selectedNode.value = { ...selectedNode.value, apiResults: node.apiResults };
        }
    }

    isLoading.value = true;

    try {
        const { loginToken, sessionToken } = props.session;
        
        // 1. Get Restrictor (Generic for all types)
        const restrictorMatch = node.label.match(/(?:⋈|Φ|<b>⋈<\/b>|<b>Φ<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
        const restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : "WALK";

        if (operatorType === 'join') {
            // Identify Children
            const children = treeData.value.edges
                .filter(e => e.from === node.id)
                .map(e => treeData.value.nodes.find(n => n.id === e.to))
                .filter(n => n);
            
            // Sort by ID to ensure consistent Left/Right assignment (heuristic)
            children.sort((a,b) => String(a.id || "").localeCompare(String(b.id || "")));

            const leftChild = children[0]; // Heuristic: First child is left
            const rightChild = children[1]; // Heuristic: Second child is right

            // 2. Generate Query based on targetTab
            let queryToRun = null;
            if (targetTab === 'join') {
                queryToRun = generateSubtreeQuery(node, 'join');
            } else if (targetTab === 'left') {
                queryToRun = leftChild ? generateChildQuery(leftChild, restrictor) : null;
            } else if (targetTab === 'right') {
                queryToRun = rightChild ? generateChildQuery(rightChild, restrictor) : null;
            }





            if (!queryToRun) {
                // Handle empty query case
                node.apiResults[targetTab] = { success: false, message: "No query generated" };
                activeJoinTab.value = targetTab;
                return;
            }

            // 3. Execute
            console.log(`[JOIN Node - tab: ${targetTab}] Executing query:`, queryToRun);
            const result = await api.executeQuery(queryToRun, loginToken, sessionToken);

            // 4. Process Results (Reusable function)
            const processResult = (res) => {
                 if (!res.success || !res.data) return { headers: [], rows: [], data: [], message: res.message || "No data" };
                 
                 let paths = [];
                 let rawData = res.data;

                 // Header check
                 const first = rawData[0];
                 let isHeader = false;
                 const getFirstContent = (item) => {
                     if (item && item.content && Array.isArray(item.content)) return item.content[0];
                     if (Array.isArray(item)) return item[0];
                     return item;
                 }
                 const firstVal = getFirstContent(first);
                 if (typeof firstVal === 'string' && (firstVal === 'p' || firstVal.toLowerCase() === 'path' || firstVal.includes('ID Camino'))) {
                     isHeader = true;
                 }
                 if (isHeader) rawData = rawData.slice(1);
                 
                 paths = rawData.map(item => getFirstContent(item));
                 
                 const joinedPaths = paths.map((pathItem, index) => {
                    let segments = [];
                    let rawStr = "";
                    let parsedObj = null;

                    const mapBackendItemToSegment = (item) => {
                        if (item.source || item.target || item.dir) {
                             return { type: 'edge', label: item.label, id: item.id, direction: item.dir === 'T' || item.dir === true ? '->' : '<-', properties: item };
                        } else {
                             return { type: 'node', label: item.label, id: item.id, properties: item };
                        }
                    };

                    try {
                        if (typeof pathItem === 'object' && pathItem !== null) {
                            parsedObj = pathItem;
                        } else {
                            rawStr = String(pathItem);
                             if (rawStr.trim().startsWith('{') || rawStr.trim().startsWith('[')) {
                                 parsedObj = JSON.parse(rawStr);
                             }
                        }

                        if (parsedObj) {
                             const rawSegments = parsedObj.content || parsedObj.segments;
                             if (Array.isArray(rawSegments)) {
                                 segments = rawSegments.map(mapBackendItemToSegment);
                             }
                        }
                        
                        if (segments.length === 0 && rawStr) {
                             segments = parsePathString(rawStr);
                        }

                    } catch (e) {
                         if (rawStr) segments = parsePathString(rawStr);
                    }

                    return { "Path ID": `P${index + 1}`, segments: segments };
                 });

                 return {
                     data: formatDataForTable(joinedPaths),
                     success: true
                 };
            };

            // 5. Update Cache and Tab
            node.apiResults[targetTab] = processResult(result);
            activeJoinTab.value = targetTab;
            
            // Force Vue reactivity for the currently selected node
            if (selectedNode.value && selectedNode.value.id === node.id) {
                selectedNode.value = { ...selectedNode.value, apiResults: node.apiResults };
            }

        } else if (operatorType === 'union') {
             console.log(`[UNION Node] Processing union for:`, node.label);
             const children = treeData.value.edges
                 .filter(e => e.from === node.id)
                 .map(e => treeData.value.nodes.find(nod => nod.id === e.to))
                 .filter(n => n)
                 .sort((a,b) => String(a.id || "").localeCompare(String(b.id || "")));
             
             // Ensure children are evaluated before unioning
             for (const child of children) {
                 if (!child.apiResults) {
                     const label = child.label || "";
                     // Temporarily release the loading lock so child queries can run sequentially
                     isLoading.value = false;
                     try {
                         if (label.includes("⋈")) await performOperatorEnrichment(child, 'join');
                         else if (label.includes("∪")) await performOperatorEnrichment(child, 'union');
                         else if (label.includes("Φ")) await performOperatorEnrichment(child, 'recursive');
                         else if (label.includes("Paths₁") || label.includes("Paths₀")) {
                             const filters = collectSubtreeFilters(child.id);
                             await performSearch(child, filters);
                         } else if (label.includes("σ")) {
                             if (label.includes("label(")) {
                                 const filters = collectSubtreeFilters(child.id);
                                 await performSearch(child, filters);
                             } else {
                                 await performOperatorEnrichment(child, 'selection');
                             }
                         }
                     } finally {
                         // Restore the loading lock for the parent
                         isLoading.value = true;
                     }
                 }
             }
             
             let headers = null;
             let pathCounter = 1;
             
             const extractPaths = (childNode) => {
                 if (!childNode || !childNode.apiResults || !childNode.apiResults.success) return [];
                 let d = [];
                 if (childNode.apiResults.type === 'join' && childNode.apiResults.join && childNode.apiResults.join.success && childNode.apiResults.join.data) {
                     d = childNode.apiResults.join.data;
                 } else if (childNode.apiResults.data) {
                     d = childNode.apiResults.data;
                 }
                 if (!d || d.length === 0) return [];
                 
                 if (!headers && d[0] && d[0].content && Array.isArray(d[0].content)) {
                     headers = d[0].content;
                 }
                 return d.slice(1);
             };

             const leftPaths = children.length > 0 ? extractPaths(children[0]) : [];
             const rightPaths = children.length > 1 ? extractPaths(children[1]) : [];
             
             // Merge and reassign Path IDs if it represents paths (first column "Path ID")
             const allPaths = [...leftPaths, ...rightPaths].map((row) => {
                 let newRow = { ...row };
                 if (newRow.content && Array.isArray(newRow.content) && newRow.content.length > 0) {
                     // Check if first column is likely a Path ID
                     if (typeof newRow.content[0] === 'string' && newRow.content[0].startsWith('P')) {
                         let contentCopy = [...newRow.content];
                         contentCopy[0] = `P${pathCounter++}`;
                         newRow.content = contentCopy;
                     }
                 }
                 return newRow;
             });
             
             const restrictorMatch = node.label.match(/(?:∪|<b>∪<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
             const restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : "WALK";
             
             let finalData = [];
             if (headers) {
                 finalData = [{ content: headers }, ...allPaths];
             }
             
             node.apiResults = {
                 type: 'standard',
                 success: true,
                 insight: `Unioned results of ${children.length} child nodes locally. Semantics: ${restrictor}.`,
                 data: finalData
             };
             
             if (selectedNode.value && selectedNode.value.id === node.id) {
                 selectedNode.value = { ...selectedNode.value, apiResults: node.apiResults };
             }

        } else if (operatorType === 'recursive' || operatorType === 'selection' || operatorType === 'root') {
             // Standard single query processing for others
             const query = operatorType === 'root' ? queryInput.value : generateSubtreeQuery(node, operatorType);
             
             if (!query) return;

             console.log(`[${operatorType.toUpperCase()} Node] Executing query:`, query);

             const result = await api.executeQuery(query, loginToken, sessionToken);
             
             if (result.success && result.data) {
                  let paths = [];
                  let rawData = result.data;
                  const first = rawData[0];
                  let isHeader = false;
                  
                  const getFirstContent = (item) => {
                        if (item && item.content && Array.isArray(item.content)) return item.content[0];
                        if (Array.isArray(item)) return item[0];
                        return item;
                  }
                  
                  const firstVal = getFirstContent(first);
                  if (typeof firstVal === 'string' && (firstVal === 'p' || firstVal.toLowerCase() === 'path' || firstVal.includes('ID Camino'))) {
                      isHeader = true;
                  }
                  if (isHeader) rawData = rawData.slice(1);
                  paths = rawData.map(item => getFirstContent(item));

                  const joinedPaths = paths.map((pathItem, index) => {
                        let segments = [];
                        let rawStr = "";
                        let parsedObj = null;
                        const mapBackendItemToSegment = (item) => {
                            if (item.source || item.target || item.dir) {
                                return { type: 'edge', label: item.label, id: item.id, direction: item.dir === 'T' || item.dir === true ? '->' : '<-', properties: item };
                            } else {
                                return { type: 'node', label: item.label, id: item.id, properties: item };
                            }
                        };
                        try {
                            if (typeof pathItem === 'object' && pathItem !== null) {
                                parsedObj = pathItem;
                            } else {
                                rawStr = String(pathItem);
                                if (rawStr.trim().startsWith('{') || rawStr.trim().startsWith('[')) parsedObj = JSON.parse(rawStr);
                            }
                            if (parsedObj) {
                                const rawSegments = parsedObj.content || parsedObj.segments;
                                if (Array.isArray(rawSegments)) segments = rawSegments.map(mapBackendItemToSegment);
                            }
                            if (segments.length === 0 && rawStr) segments = parsePathString(rawStr);
                        } catch (e) { if (rawStr) segments = parsePathString(rawStr); }
                        return { "Path ID": `P${index + 1}`, segments: segments };
                   });
                   
                   const restrictorMatch = node.label.match(/(?:⋈|Φ|<b>⋈<\/b>|<b>Φ<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
                   const restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : "WALK";

                   node.apiResults = {
                       type: 'standard',
                       success: true,
                       insight: `Executed Sub-Query for ${operatorType}. Semantics: ${restrictor}.`,
                       data: formatDataForTable(joinedPaths)
                   };
                   
                   // Force Vue reactivity
                   if (selectedNode.value && selectedNode.value.id === node.id) {
                       selectedNode.value = { ...selectedNode.value, apiResults: node.apiResults };
                   }
             }
        }
    } catch (e) {

        if (operatorType === 'join') {
            node.apiResults[targetTab] = { success: false, message: "Error executing query" };
        } else {
            node.apiResults = { success: false, message: "Error executing query" };
        }
        
        // Force Vue reactivity
        if (selectedNode.value && selectedNode.value.id === node.id) {
            selectedNode.value = { ...selectedNode.value, apiResults: node.apiResults };
        }
    } finally {
        isLoading.value = false;
    }
}

const generateSubtreeQuery = (node, type) => {
    // 1. Get Restrictor
    const restrictorMatch = node.label.match(/(?:⋈|Φ|<b>⋈<\/b>|<b>Φ<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
    let restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : null;

    // If node label doesn't specify restrictor (e.g. Selection), fallback to global query input
    if (!restrictor && queryInput.value) {
        const globalRestrictorMatch = queryInput.value.match(/MATCH\s+(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
        if (globalRestrictorMatch) {
            restrictor = globalRestrictorMatch[1].toUpperCase();
        }
    }
    
    // Default fallback
    if (!restrictor) restrictor = "WALK";
    
    // Helper to strip outer redundant parenthesis
    const stripRedundantParens = (str) => {
        let current = str.trim();
        let changed = true;
        while (changed) {
            changed = false;
            if (current.startsWith('(') && current.endsWith(')')) {
                let depth = 0;
                let isValid = true;
                for (let i = 0; i < current.length - 1; i++) {
                    if (current[i] === '(') depth++;
                    else if (current[i] === ')') depth--;
                    
                    if (depth === 0) {
                        isValid = false;
                        break;
                    }
                }
                if (isValid && depth === 1) {
                    current = current.substring(1, current.length - 1).trim();
                    changed = true;
                }
            }
        }
        return current;
    };
    
    // Helper: recursively build pattern string
    const buildPattern = (n) => {
        if (!n) return "";
        const label = n.label || "";
        
        // JOIN
        if (label.includes("⋈")) {
             const children = treeData.value.edges
                .filter(e => e.from === n.id)
                .map(e => treeData.value.nodes.find(nod => nod.id === e.to))
                .filter(nod => nod)
                .sort((a,b) => String(a.id).localeCompare(String(b.id)));
             
             // Join usually implies sequence, so A.B
             // We map each child to its pattern
             const childPatterns = children.map(c => buildPattern(c)).filter(p => p);
             return childPatterns.join(".");
        }
        
        // UNION
        if (label.includes("∪")) {
             const children = treeData.value.edges
                .filter(e => e.from === n.id)
                .map(e => treeData.value.nodes.find(nod => nod.id === e.to))
                .filter(nod => nod)
                .sort((a,b) => String(a.id).localeCompare(String(b.id)));
             
             // Check if one of the children is Paths₀(G), indicating a Kleene Star (A*) pattern
             const hasZeroPath = children.some(c => c.label && (c.label.includes("Paths₀(G)") || c.label === "allnodes"));
             
             if (hasZeroPath) {
                 const otherChildren = children.filter(c => c.label && !c.label.includes("Paths₀(G)") && c.label !== "allnodes");
                 const childPatterns = otherChildren.map(c => buildPattern(c)).filter(p => p);
                 
                 if (childPatterns.length === 1) {
                     let p = childPatterns[0].trim();
                     // If the other branch (e.g. Φ) ends with '+', replace it with '*'
                     if (p.endsWith("+")) {
                         let body = p.substring(0, p.length - 1).trim();
                         body = stripRedundantParens(body);
                         return `(${body})*`;
                     }
                     return `(${stripRedundantParens(p)})*`;
                 }
             }

             // Union implies choice, so (A|B)
             const childPatterns = children.map(c => buildPattern(c)).filter(p => p);
             // Verify if we need parens (safe to add)
             return `(${childPatterns.join("|")})`;
        }

        // SELECTION (σ)
        if (label.includes("σ")) {
             // Check if it is a label selection (structural constraint like :Person)
             const labelMatch = label.match(/label\((?:<sub>|<code>|<i>)?(?:node|edge)\(\d+\)(?:<\/sub>|<\/code>|<\/i>)?\)\s*=\s*(\w+)/);
             if (labelMatch) {
                 return labelMatch[1];
             }

             // Otherwise, it represents a property filter (WHERE), so return the underlying path structure
             const children = treeData.value.edges
                .filter(e => e.from === n.id)
                .map(e => treeData.value.nodes.find(nod => nod.id === e.to));
             
             if (children.length > 0) {
                 // Verify if we need parens for safety? usually direct child
                 return buildPattern(children[0]);
             }
             return "";
        }

        // RECURSIVE (Φ)
        if (label.includes("Φ")) {
             let kleene = "+"; // Always use + for subqueries per user requirement
             
             const children = treeData.value.edges
                .filter(e => e.from === n.id)
                .map(e => treeData.value.nodes.find(nod => nod.id === e.to));
             
             if (children.length > 0) {
                 const body = stripRedundantParens(buildPattern(children[0]));
                 return `(${body})${kleene}`;
             }
             return "";
        }
        
        // LEAF (Label - Fallback if standard LEAF node)
        const labelMatch = label.match(/label\((?:node|edge)\(\d+\)\)\s*=\s*(?:<b>)?(\w+)(?:<\/b>)?/);
        if (labelMatch) return labelMatch[1];
        
        // Base paths fallback
        if (label.includes("Paths₀")) return ""; // Usually handled by Union above, but just in case
        if (label.includes("Paths₁")) return ""; // Empty string here will result in (x)-[]->(y) for blank edges

        // Fallback for unknown or empty
        return "";
    };
    
    let pathPattern = "";
    
    // Unified pattern building
    let pattern = buildPattern(node);
    if (pattern !== null && pattern !== undefined) {
        pattern = stripRedundantParens(pattern);
        pathPattern = `(x)-[${pattern}]->(y)`;
    }
    
    if (!pathPattern) return null;
    
    let finalQuery = `MATCH ${restrictor} p = ${pathPattern} `;
    
    // Append WHERE clause ONLY for Selection nodes (σ)
    if (type === 'selection' && queryInput.value) {
        const whereMatch = queryInput.value.match(/\s(WHERE\s+.*?)(\s+RETURN|\s+LIMIT|\s+ORDER|$)/i);
        if (whereMatch) {
            finalQuery += whereMatch[1] + " ";
        }
    }
    
    // Add default return/limit for preview
    finalQuery += "RETURN p LIMIT 50;";
    
    return finalQuery;
}

// Generate query for a single child branch (used for Left/Right tabs)
const generateChildQuery = (childNode, parentRestrictor = "WALK") => {
    // Traverse down from childNode to find labels
    const labels = [];
    const traverse = (n) => {
        if (!n) return;
        const labelMatch = n.label.match(/label\((?:node|edge)\(\d+\)\)\s*=\s*(\w+)/);
        if (labelMatch) labels.push(labelMatch[1]);
        
        const childEdges = treeData.value.edges.filter(e => e.from === n.id);
        childEdges.forEach(ce => traverse(treeData.value.nodes.find(cn => cn.id === ce.to)));
    }
    traverse(childNode);
    
    if (labels.length === 0) return null;
    
    // Construct query "MATCH ... p = (x)-[(Label)]->(y) RETURN p LIMIT 50"
    // Use the parent's restrictor (e.g. TRAIL)
    return `MATCH ${parentRestrictor} p = (x)-[(${labels.join('.')})]->(y) RETURN p LIMIT 50;`;
}

const parsePathString = (str) => {
    const segments = [];
    
    // Check if input is empty or null
    if (!str) return segments;
    
    // Check if str is actually a JSON object (if passed directly)
    if (typeof str === 'object') {
        // Adapt object structure if needed
        return []; // Parsing object logic handled upstream or here if widely used
    }

    let remaining = str.toString().trim();
    
    // If it starts with { or [, treat as JSON string
    if (remaining.startsWith('{') || remaining.startsWith('[')) {
         // Attempt to extract meaningful path info from JSON string
         // Only if upstream didn't handle it
         try {
             const obj = JSON.parse(remaining);
             // If obj has segments, return them?
             // For now, let's stick to the Regex parser for "Path Composition" string style
             // Unless strict JSON
         } catch(e) {}
    }

    let i = 0;
    
    while (remaining.length > 0 && i < 100) { // Safety break
        i++;
        
        // Match Node: (Label:id {props})
        const nodeMatch = remaining.match(/^\(([^)]+)\)/);
        if (nodeMatch) {
            const content = nodeMatch[1];
            segments.push(parseElementContent('node', content));
            remaining = remaining.substring(nodeMatch[0].length).trim();
            continue;
        }
        
        // Match Edge (Forward): -[Label:id]->
        const edgeMatch = remaining.match(/^-\[([^\]]+)\]->/);
        if (edgeMatch) {
            const content = edgeMatch[1];
            segments.push(parseElementContent('edge', content, '->'));
            remaining = remaining.substring(edgeMatch[0].length).trim();
            continue;
        }
        
        // Match Edge (Backward): <-[Label:id]-
        const edgeBackMatch = remaining.match(/^<-\[([^\]]+)\]-/);
        if (edgeBackMatch) {
             const content = edgeBackMatch[1];
             segments.push(parseElementContent('edge', content, '<-'));
             remaining = remaining.substring(edgeBackMatch[0].length).trim();
             continue;
        }

        // If no match, break (or skip char)
        break;
    }
    
    return segments;
}

const parseElementContent = (type, content, direction = "") => {
    // Content e.g., "Person:p1 {name:'Bart'}" or just "Person:p1"
    
    // Extract properties {}
    let properties = {};
    const propMatch = content.match(/\{(.+)\}/);
    if (propMatch) {
        const propStr = propMatch[1];
        // simple parsing of "key: 'val', key2: val2"
        propStr.split(',').forEach(p => {
            const [k, v] = p.split(':');
            if (k && v) {
                properties[k.trim()] = v.trim().replace(/['"]/g, '');
            }
        });
        content = content.replace(propMatch[0], '').trim();
    }
    
    // Extract Label and ID
    const parts = content.split(':');
    let label = "";
    let id = "";
    
    if (parts.length > 1) {
        label = parts[0].trim();
        id = parts[1].trim();
    } else {
        id = parts[0].trim(); // Just ID
    }
    
    return { type, label, id, properties, direction };
}

const parseBackendString = (item) => {
    // 1. Try JSON
    try {
        return JSON.parse(item);
    } catch (e) {
        // 2. Try Pipe-Delimited format (key:value|key:value)
        if (typeof item === 'string' && item.includes('|') && item.includes(':')) {
            const obj = {};
            const pairs = item.split('|');
            pairs.forEach(pair => {
                const [key, ...valParts] = pair.split(':');
                if (key) {
                    obj[key.trim()] = valParts.join(':').trim();
                }
            });
            return obj;
        }
        // 3. Fallback
        return { raw: item };
    }
}

const formatDataForTable = (parsedItems) => {
    if (!parsedItems || parsedItems.length === 0) return [];
    
    const allKeys = new Set();
    parsedItems.forEach(item => {
        Object.keys(item).forEach(key => {
            if (key !== 'raw' && key !== 'segments') allKeys.add(key);
        });
    });
    
    const headers = Array.from(allKeys).sort((a, b) => {
        if (a.toLowerCase() === 'id') return -1;
        if (b.toLowerCase() === 'id') return 1;
        if (a.toLowerCase() === 'label') return -1;
        if (b.toLowerCase() === 'label') return 1;
        return a.localeCompare(b);
    });

    if (parsedItems.some(item => item.raw)) {
        headers.push('raw');
    }

    const rows = parsedItems.map(item => {
        return headers.map(h => {
            const val = item[h];
            if (val === undefined || val === null) return '';
            
            // DIR Visualization: Arrow for true/T, Line for false/F
            if (h.toLowerCase() === 'dir') {
                 if (val === true || val === 'true' || val === 'T') return '→';
                 if (val === false || val === 'false' || val === 'F') return '—';
            }
            
            return typeof val === 'object' ? JSON.stringify(val) : String(val);
        });
    });
    
    // Attach segments to rows if present, for the detail view
    const formattedRows = rows.map((r, i) => ({ 
        content: r,
        segments: parsedItems[i].segments 
    }));

    return [
        { content: headers },
        ...formattedRows
    ];
}

/**
 * Collects all selection filters (labels, properties) in the sub-tree of a given node.
 * This allows "nested" searches where child filters are applied to parent nodes.
 */
const collectSubtreeFilters = (nodeId) => {
    const filters = { type: 'edge', label: null, properties: {} };
    if (!treeData.value) return filters;
    
    const nodes = treeData.value.nodes;
    const edges = treeData.value.edges;
    
    const traverse = (currentId) => {
        const node = nodes.find(n => n.id === currentId);
        if (!node) return;
        
        const labelText = node.label || "";
        
        // Match σ label(edge(1)) = hasCreator (also handles <code>, <i> or <sub> wrappers)
        const labelSearch = labelText.match(/(?:σ|<b>σ<\/b>)\s*label\((?:<sub>|<code>|<i>)?(node|edge)\(\d+\)(?:<\/sub>|<\/code>|<\/i>)?\)\s*=\s*([^\s<]+)/);
        if (labelSearch) {
            filters.type = labelSearch[1];
            filters.label = labelSearch[2];
        } else {
            // Match σ node(1).name="Moe" (also handles <code>, <i> or <sub> wrappers)
            const propSearch = labelText.match(/(?:σ|<b>σ<\/b>)\s*(?:<sub>|<code>|<i>)?(node|edge)\(\d+\)(?:<\/sub>|<\/code>|<\/i>)?\.([^\s=<]+)\s*=\s*["']?([^"'<]+)["']?/);
            if (propSearch) {
                filters.type = propSearch[1];
                filters.properties[propSearch[2]] = propSearch[3];
            }
        }
        
        if (labelText.includes("Paths₁(G)")) filters.type = 'edge';
        if (labelText.includes("Paths₀(G)")) filters.type = 'node';

        // Traverse children
        edges.filter(e => e.from === currentId).forEach(e => traverse(e.to));
    };

    traverse(nodeId);
    return filters;
}

const performSearch = async (node, filters) => {
    if (node.apiResults || isLoading.value) return;

    console.log(`[SEARCH Node] Executing search with filters:`, filters);
    isLoading.value = true;
    try {
        const { loginToken, sessionToken } = props.session;
        const result = await api.search({
            type: filters.type,
            label: filters.label,
            properties: filters.properties,
            limit: 100,
            loginToken,
            sessionToken
        });

        if (result.success && result.data) {
            const parsedItems = result.data.map((item, index) => {
                const parsed = parseBackendString(item);
                const props = { ...parsed };
                delete props.segments;
                
                if (filters.type === 'node') {
                    parsed.segments = [{
                        type: 'node',
                        label: parsed.label || '',
                        id: parsed.id || '?',
                        properties: props
                    }];
                } else if (filters.type === 'edge') {
                    parsed.segments = [
                        {
                            type: 'node',
                            label: '?', // Unknown label without joining, but PathDB might provide it in some cases
                            id: parsed.source || '?',
                            properties: { id: parsed.source }
                        },
                        {
                            type: 'edge',
                            label: parsed.label || '',
                            id: parsed.id || '?',
                            direction: parsed.dir === 'T' || parsed.dir === true ? '->' : '<-',
                            properties: props
                        },
                        {
                            type: 'node',
                            label: '?',
                            id: parsed.target || '?',
                            properties: { id: parsed.target }
                        }
                    ];
                }
                return parsed;
            });

            if (parsedItems.length > 0) {
                const formatted = formatDataForTable(parsedItems);

                node.apiResults = {
                    success: true,
                    data: formatted
                };
            } else {
                node.apiResults = {
                    success: true,
                    message: "No results found",
                    data: []
                };
            }
        }
    } catch (e) {

        node.apiResults = {
            success: false,
            message: "Search failed: " + e.message,
            data: []
        };
    } finally {
        isLoading.value = false;
    }
}

// Simulated backend response structure
// Format: { success: boolean, message: string, data: array, metadata?: object }
// data[0] = headers, data[1..n] = solutions (paths)


// Computed property to get data for current selected node
// Computed property to get data for current selected node
const currentNodeData = computed(() => {

    if (!selectedNode.value) return { headers: [], rows: [] };
    
    // If the node has its own result data
    if (selectedNode.value.apiResults) {
        const res = selectedNode.value.apiResults;
        
        // Handle JOIN Tab Switched Data
        if (res.type === 'join') {
            const activeData = res[activeJoinTab.value]; // 'join', 'left', 'right'
            if (activeData && activeData.success && activeData.data && activeData.data.length > 0) {

                 return {
                    headers: activeData.data[0].content, 
                    rows: activeData.data.slice(1).map(item => item.content),
                    data: activeData.data.slice(1), 
                    message: res.message,
                    success: true,
                    insight: res.insight
                };
            } else {
                 return {
                    headers: [], rows: [], data: [],
                    message: "No results for this branch",
                    success: false,
                    insight: res.insight
                };
            }
        }

        // Standard Results
        if (res.data && res.data.length > 0) {
            let limitAmount = null;
            if (selectedNode.value && selectedNode.value.label && selectedNode.value.label.includes('π')) {
                const limitMatch = queryInput.value.match(/LIMIT\s+(\d+)/i);
                if (limitMatch) {
                    limitAmount = parseInt(limitMatch[1], 10);
                }
            }
            
            let finalData = res.data.slice(1);
            let finalRows = finalData.map(item => item.content);
            
            if (limitAmount !== null && !isNaN(limitAmount) && limitAmount > 0) {
                finalData = finalData.slice(0, limitAmount);
                finalRows = finalRows.slice(0, limitAmount);
            }

            return {
                headers: res.data[0].content, // In executeQuery response, it's an array of objects with content
                rows: finalRows,
                data: finalData, // Raw data objects containing segments
                message: res.message,
                success: res.success,
                insight: res.insight // Expose insight from API results
            };
        } else {
            return {
                headers: [],
                rows: [],
                message: res.message || "No results found",
                success: res.success,
                insight: res.insight
            };
        }
    }

    // If we get here, no valid API results were found on the node.
    return { headers: [], rows: [], message: 'No Data', success: false };
});


// Helper to format node button labels, converting Vis.js bold/ital tags into proper HTML
const formatNodeButtonLabel = (node) => {
    let lbl = node.label ? node.label.split('\n')[0] : (node.properties?.Name || 'Unknown Node');
    // Convert <b> to <sup> and <i> to <sub> for the button display
    lbl = lbl.replace(/<b>/g, '').replace(/<\/b>/g, '');
    lbl = lbl.replace(/<code>/g, '<sup>').replace(/<\/code>/g, '</sup>');
    lbl = lbl.replace(/<i>/g, '<sub>').replace(/<\/i>/g, '</sub>');
    return lbl;
};

// Computed property for Selected Object Header
const selectedNodeHeader = computed(() => {
    if (!selectedNode.value) return null;
    const label = selectedNode.value.label || "";
    const name = selectedNode.value.properties?.Name || "";
    
    let title = label.split('\n')[0];
    let operatorName = '';
    let operatorStructure = '';

    if (label.includes("⋈")) {
        const restrictorMatch = label.match(/(?:⋈|Φ|<b>⋈<\/b>|<b>Φ<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
        const restrictor = restrictorMatch ? restrictorMatch[1] : "WALK";
        title = `⋈<sup style="font-size:0.5em;">${restrictor}</sup>`;
        operatorName = "Join";
        operatorStructure = ` S₁ ⋈<sup>τ</sup> S₂ `;
    } else if (label.includes("∪")) {
        const restrictorMatch = label.match(/(?:∪|<b>∪<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
        const restrictor = restrictorMatch ? restrictorMatch[1] : "WALK";
        title = `∪<sup style="font-size:0.5em;">${restrictor}</sup>`;
        operatorName = "Union";
        operatorStructure = ` S ∪ S′ `;
    } else if (label.includes("Φ")) {
        const restrictorMatch = label.match(/(?:Φ|⋈|<b>Φ<\/b>|<b>⋈<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)(?:<\/b>|<\/code>)?/i);
        const restrictor = restrictorMatch ? restrictorMatch[1] : "WALK";
        title = `Φ<sup style="font-size:0.5em;">${restrictor}</sup>`;
        operatorName = "Recursive Join";
        operatorStructure = ` Φ<sup>τ</sup>(S) `;
    } else if (label.includes("σ") || name.toLowerCase().includes("selection")) {
        // Extract condition from tree label format: <b>σ</b><i>[condition]</i> or <b>σ</b> [condition]
        // Use a more inclusive regex that matches σ with or without <b> and captures the rest
        const conditionMatch = label.match(/(?:σ|<b>σ)<\/b>?\s*(.*)/i);
        let rawCondition = conditionMatch ? conditionMatch[1] : label;
        // Strip ALL tags for the condition title/value to get clean text
        rawCondition = rawCondition.replace(/<\/?(b|i|code|sub).*?>/g, '').trim();
        
        // In Object Viewer title, use <sub> for proper subscripting
        title = `<span style="text-transform: none;">σ</span><sub>${rawCondition}</sub>`;
        operatorName = "Selection";
        operatorStructure = ` <span class="large-sigma">σ</span><sub>c</sub>(S) `;
    } else if (label.includes("π") || name === "Manual Projection") {
        // Clean Canvas tags out of the label if parsing from selected node
        let cleanLabel = label.replace(/<\/?(b|i|code).*?>/g, ''); 
        
        let limitAmount = null;
        let limitSuperscript = "";
        let attributes = cleanLabel;
        
        // Extract the limit (if any)
        const limitMatch = cleanLabel.match(/^π([⁰¹²³⁴⁵⁶⁷⁸⁹0-9]+)\s*/);
        if(limitMatch) {
            limitSuperscript = limitMatch[1];
            attributes = cleanLabel.replace(/^π[⁰¹²³⁴⁵⁶⁷⁸⁹0-9]+\s*/, '');
        } else {
            attributes = cleanLabel.replace(/^π\s*/, '');
        }
        
        let titleLimit = limitSuperscript ? `<sup>${limitSuperscript}</sup>` : "";
        let titleAttrs = attributes ? `<sub>${attributes}</sub>` : "";
        title = `π${titleLimit}${titleAttrs}`;
        operatorName = "Projection";
        operatorStructure = `π<sup>j</sup><sub>α</sub>(S)`;
    } else if (label.includes("Paths₀") || name === "Paths₀(G)") {
        title = "Paths₀(G)";
        operatorName = "Paths₀";
        operatorStructure = `Paths₀(G)`;
    } else if (label.includes("Paths₁") || name === "Paths₁(G)") {
        title = "Paths₁(G)";
        operatorName = "Paths₁";
        operatorStructure = `Paths₁(G)`;
    }

    return { title, operatorName, operatorStructure };
});

// Computed property for Selected Object Parameters
const selectedNodeParams = computed(() => {
    if (!selectedNode.value) return null;
    const label = selectedNode.value.label || "";
    const params = [];

    // Find children
    const children = treeData.value.edges
        .filter(e => e.from === selectedNode.value.id)
        .map(e => treeData.value.nodes.find(n => n.id === e.to))
        .filter(n => n)
        .sort((a,b) => String(a.id || "").localeCompare(String(b.id || "")));

    if (label.includes("⋈")) {
        // JOIN
        const restrictorMatch = label.match(/(?:⋈|Φ|<b>⋈<\/b>|<b>Φ<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
        const restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : "WALK";

        if (children[0]) params.push({ key: "Left Path Set (S₁)", node: children[0] });
        if (children[1]) params.push({ key: "Right Path Set (S₂)", node: children[1] });
        params.push({ key: "Restrictor (τ)", value: restrictor });
    } else if (label.includes("∪")) {
        // UNION
        const restrictorMatch = label.match(/(?:∪|<b>∪<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
        const restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : "WALK";

        if (children[0]) params.push({ key: "Left Path Set (S)", node: children[0] });
        if (children[1]) params.push({ key: "Right Path Set (S')", node: children[1] });
        params.push({ key: "Restrictor (τ)", value: restrictor });
    } else if (label.includes("Φ")) {
        // RECURSIVE JOIN
        const restrictorMatch = label.match(/(?:Φ|⋈|<b>Φ<\/b>|<b>⋈<\/b>)\s+(?:<b>|<code>)?(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
        const restrictor = restrictorMatch ? restrictorMatch[1].toUpperCase() : "WALK";
        
        if (children[0]) params.push({ key: "Path Set (S)", node: children[0] });
        params.push({ key: "Restrictor (τ)", value: restrictor });
    } else if (label.includes("σ") || label.startsWith("Selection")) {
        // Selection
        const conditionMatch = label.match(/(?:σ|<b>σ)<\/b>?\s*(.*)/i);
        let condition = conditionMatch ? conditionMatch[1] : label;
        // Strip ALL tags for the params list to avoid italics/mono/bold rendering
        condition = condition.replace(/<\/?(b|i|code|sub).*?>/g, '').trim();
        
        if (children[0]) params.push({ key: "Path Set (S)", node: children[0] });
        params.push({ key: "Selection condition (C)", value: condition });
    } else if (label.includes("π") || selectedNode.value.properties?.Name === "Manual Projection") {
        // Projection
        // Clean Canvas tags if extracting from label
        let cleanLabel = label.replace(/<\/?(b|i|code).*?>/g, '');
        let attributes = cleanLabel.replace(/^π[⁰¹²³⁴⁵⁶⁷⁸⁹0-9]*\s*/, '');
        let limitAmount = null;
        
        if (selectedNode.value.properties?.Details) {
            const limitMatch = selectedNode.value.properties.Details.match(/LIMIT\s+(\d+)/i);
            if (limitMatch && limitMatch[1]) {
                limitAmount = limitMatch[1];
            }
        }
        
        if (children[0]) params.push({ key: "Path Set (S)", node: children[0] });
        params.push({ key: "Projection Term (α)", value: attributes });
        if (limitAmount !== null) params.push({ key: "Limit (j)", value: limitAmount });
    } else if (label.includes("Paths₀") || label.includes("Paths₁")) {
        // Base Relations
        params.push({ key: "Graph (G)", value: "G" });
    }

    return params.length > 0 ? params : null;
});

const pathTableData = computed(() => {
    if (!currentNodeData.value.data) return [];
    


    return currentNodeData.value.data
        .filter(item => item.segments && item.segments.length > 0)
        .map((item, index) => {
            const nodes = item.segments.filter(s => s.type === 'node');
            const edges = item.segments.filter(s => s.type === 'edge');
            
            return {
                id: index,
                source: nodes[0]?.id || '?',
                target: nodes[nodes.length - 1]?.id || '?',
                length: edges.length,
                segments: item.segments
            };
        });
});

// Computed property for filtered path table data
const filteredPathTableData = computed(() => {
    let data = [...pathTableData.value];
    const query = pathSearchQuery.value.toLowerCase().trim();
    
    if (!query) return data;
    
    return data.filter(item => {
        const sourceMatch = item.source.toLowerCase().includes(query);
        const targetMatch = item.target.toLowerCase().includes(query);
        const lengthMatch = item.length.toString().includes(query);
        
        // If no specific columns are selected, search in all columns
        if (pathFilterColumn.value.length === 0) {
            return sourceMatch || targetMatch || lengthMatch;
        }
        
        // Search only in selected columns
        let matches = false;
        if (pathFilterColumn.value.includes('source')) matches = matches || sourceMatch;
        if (pathFilterColumn.value.includes('target')) matches = matches || targetMatch;
        if (pathFilterColumn.value.includes('length')) matches = matches || lengthMatch;
        
        return matches;
    });
});

// Computed property for sorted path table data
const sortedPathTableData = computed(() => {
    const data = [...filteredPathTableData.value];
    if (!tableSortKey.value) return data;
    
    return data.sort((a, b) => {
        const valA = a[tableSortKey.value];
        const valB = b[tableSortKey.value];
        
        if (typeof valA === 'number') {
            return (valA - valB) * tableSortOrder.value;
        }
        return String(valA).localeCompare(String(valB)) * tableSortOrder.value;
    });
});

const clearFilters = () => {
    pathSearchQuery.value = '';
    pathFilterColumn.value = [];
};

const setTableSort = (key) => {
    // Toggle the column in/out of the filter array
    const index = pathFilterColumn.value.indexOf(key);
    if (index > -1) {
        // Remove if already selected
        pathFilterColumn.value = pathFilterColumn.value.filter(col => col !== key);
    } else {
        // Add if not selected
        pathFilterColumn.value = [...pathFilterColumn.value, key];
    }
};

const toggleSort = (key) => {
    // Handle sorting separately from filtering
    if (tableSortKey.value === key) {
        tableSortOrder.value *= -1;
    } else {
        tableSortKey.value = key;
        tableSortOrder.value = 1;
    }
};

const getSegmentSignature = (segments) => {
    if (!segments || !Array.isArray(segments)) return "";
    return segments.map(s => s.id).join("|");
};

const isSubPath = (row, context) => {
    // Only apply highlighting if we are in Left/Right tabs and have a Join selection
    if (context === 'join') return false; 
    if (!selectedTablePath.value || selectedTablePath.value.context !== 'join') return false;

    const selectedSig = getSegmentSignature(selectedTablePath.value.segments);
    const rowSig = getSegmentSignature(row.segments);

    if (!selectedSig || !rowSig) return false;

    if (context === 'left') {
        // Left child should be the START of the Join path
        return selectedSig.startsWith(rowSig);
    } else if (context === 'right') {
         // Right child should be the END of the Join path
        return selectedSig.endsWith(rowSig);
    }
    return false;
};

const selectRowFromTable = (row) => {
    selectedTablePath.value = { ...row, context: activeJoinTab.value };
    selectedPathElement.value = null; // Reset element selection when switching paths
    nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
    });
};

const handlePathElementClick = (segment) => {
    selectedPathElement.value = segment;
    nextTick(() => {
        if (window.lucide) window.lucide.createIcons();
    });
};

const safelyEnrichQueryResults = (res) => {
    if (!res || !res.success || !res.data || res.data.length === 0) return res;
    
    let rawData = res.data;
    const firstRow = rawData[0];
    const headerCols = firstRow?.content || firstRow;
    
    let isPathResult = false;
    let isHeader = false;
    if (Array.isArray(headerCols) && headerCols.length === 1) {
        const firstVal = headerCols[0];
        if (typeof firstVal === 'string' && (firstVal === 'p' || firstVal.toLowerCase() === 'path' || firstVal.toLowerCase() === 'paths' || firstVal.includes('ID Camino'))) {
            isPathResult = true;
            isHeader = true;
        }
    }
    
    if (!isPathResult && Array.isArray(headerCols) && headerCols.length === 1) {
         const firstValStr = String(headerCols[0]).trim();
         if (firstValStr.startsWith('[') && firstValStr.includes('"id"') && (firstValStr.includes('"source"') || firstValStr.includes('"label"'))) {
             isPathResult = true;
         } else if (firstValStr.startsWith('{') && firstValStr.includes('"id"') && (firstValStr.includes('"source"') || firstValStr.includes('"label"'))) {
             isPathResult = true;
         }
    }

    if (isPathResult) {
        if (isHeader) rawData = rawData.slice(1);
        
        const getFirstContent = (item) => {
             if (item && item.content && Array.isArray(item.content)) return item.content[0];
             if (Array.isArray(item)) return item[0];
             return item;
        }
        
        const paths = rawData.map(item => getFirstContent(item));
        
        const joinedPaths = paths.map((pathItem, index) => {
           let segments = [];
           let rawStr = "";
           let parsedObj = null;

           const mapBackendItemToSegment = (item) => {
               if (item.source || item.target || item.dir) {
                    return { type: 'edge', label: item.label, id: item.id, direction: item.dir === 'T' || item.dir === true ? '->' : '<-', properties: item };
               } else {
                    return { type: 'node', label: item.label, id: item.id, properties: item };
               }
           };

           try {
               if (typeof pathItem === 'object' && pathItem !== null) {
                   parsedObj = pathItem;
               } else {
                   rawStr = String(pathItem);
                    if (rawStr.trim().startsWith('{') || rawStr.trim().startsWith('[')) {
                        parsedObj = JSON.parse(rawStr);
                    }
               }

               if (parsedObj) {
                    const rawSegments = parsedObj.content || parsedObj.segments || (Array.isArray(parsedObj) ? parsedObj : null);
                    if (Array.isArray(rawSegments)) {
                        segments = rawSegments.map(mapBackendItemToSegment);
                    } else if (parsedObj.type && parsedObj.label) {
                         segments = [mapBackendItemToSegment(parsedObj)];
                    }
               }
               
               if (segments.length === 0 && rawStr) {
                    segments = parsePathString(rawStr);
               }
           } catch (e) {
                if (rawStr) segments = parsePathString(rawStr);
           }

           return { "Path ID": `P${index + 1}`, segments: segments };
        });

        const formattedData = formatDataForTable(joinedPaths);
        return {
            ...res,
            data: formattedData,
            isEnrichedPath: true
        };
    }
    
    return res;
};

const isPathCell = (cell) => {
    if (!cell) return false;
    
    if (typeof cell === 'object') {
        const hasIdAndLabel = (obj) => obj && obj.id !== undefined && obj.label !== undefined;
        if (cell.content && Array.isArray(cell.content) && cell.content.length > 0 && hasIdAndLabel(cell.content[0])) return true;
        if (cell.segments && Array.isArray(cell.segments) && cell.segments.length > 0 && hasIdAndLabel(cell.segments[0])) return true;
        if (Array.isArray(cell) && cell.length > 0 && hasIdAndLabel(cell[0])) return true;
        if (hasIdAndLabel(cell)) return true;
    }

    if (typeof cell === 'string') {
        const str = cell.trim();
        if ((str.startsWith('{') || str.startsWith('[')) && str.includes('"id"') && str.includes('"label"')) {
            return true;
        }
    }
    return false;
};

const parsePathCell = (cell) => {
    let parsedObj = null;
    let rawStr = "";
    
    if (typeof cell === 'object' && cell !== null) {
        parsedObj = cell;
    } else {
        rawStr = String(cell).trim();
        if (rawStr.startsWith('{') || rawStr.startsWith('[')) {
            try {
                parsedObj = JSON.parse(rawStr);
            } catch(e) {}
        }
    }
    
    let segments = [];
    const mapBackendItemToSegment = (item) => {
        if (item.source || item.target || item.dir) {
            return { type: 'edge', label: item.label, id: item.id, direction: item.dir === 'T' || item.dir === true ? '->' : '<-', properties: item };
        } else {
            return { type: 'node', label: item.label, id: item.id, properties: item };
        }
    };
    
    if (parsedObj) {
        const rawSegments = parsedObj.content || parsedObj.segments || (Array.isArray(parsedObj) ? parsedObj : null);
        if (Array.isArray(rawSegments)) {
            segments = rawSegments.map(mapBackendItemToSegment);
        } else if (parsedObj.type && parsedObj.label) {
            segments = [mapBackendItemToSegment(parsedObj)];
        } else if (parsedObj.id && parsedObj.label) {
            segments = [mapBackendItemToSegment(parsedObj)];
        }
    }
    
    if (segments.length === 0 && rawStr) {
         segments = parsePathString(rawStr);
    }
    
    return segments;
};

const runQuery = async () => {
    if (!queryInput.value.trim()) return;

    isLoading.value = true;
    selectedNode.value = null; 
    treeData.value = { nodes: [], edges: [] }; // Explicitly clear old nodes to avoid them getting stuck
    
    try {
        const { loginToken, sessionToken } = props.session;

        // 1. Fetch live results
     
        const queryResults = await api.executeQuery(queryInput.value, loginToken, sessionToken);

        // 2. Fetch logical or raw plan tree based on mode
        let plan;
        if (treeMode.value === 'logical') {
            plan = await api.getQueryTree(queryInput.value, loginToken, sessionToken);
            console.log("LOGICAL PLAN FROM API:", JSON.stringify(plan, null, 2));
        } else {
            plan = await api.getRawQueryTree(queryInput.value, loginToken, sessionToken);
        }

        // 3. Transform plan to Tree format
        const transformedTree = transformLogicalPlan(plan, queryInput.value);
        
        // Attach results to the true root of the tree (the one with no incoming edges)
        const rootNode = transformedTree.nodes.find(node => 
            !transformedTree.edges.some(edge => edge.to === node.id)
        );

        if (rootNode) {
            rootNode.apiResults = safelyEnrichQueryResults(queryResults);
        }

        treeData.value = transformedTree;

        nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
            
            // Automatically select the root node after rendering the tree
            if (rootNode) {
                // Add a small delay to ensure Vis.js has rendered the nodes before focusing
                setTimeout(() => {
                    handleNodeSelect(rootNode);
                }, 100);
            }
        });
    } catch (e) {

        // Fallback or show error
        treeData.value = { 
            nodes: [{ id: 1, label: "Error", color: { background: '#ffffff' }, properties: { Error: e.message } }], 
            edges: [] 
        };
    } finally {
        isLoading.value = false;
    }
}

/**
 * Transforms the nested logical plan from the backend into a flat nodes/edges structure for Vis.js
 */
const transformLogicalPlan = (plan, query = "") => {
    const nodes = [];
    const edges = [];
    let idCounter = 1;

    // Extract path restrictor from query (e.g., MATCH TRAIL -> TRAIL)
    let queryRestrictor = "WALK"; // Default
    const restrictorMatch = query.match(/MATCH\s+(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
    if (restrictorMatch) {
        const r = restrictorMatch[1];
        queryRestrictor = r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
    }

    // Helper to convert number to superscript
    const toSuperscript = (num) => {
        const sups = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
        return String(num).split('').map(d => sups[d] || d).join('');
    };

    // Helper to wrap node(...) / edge(...) references in <sub> tags for σ labels
    const subscriptNodeRefs = (str) => {
        return str.replace(/(node|edge)(\([^)]+\))/g, '<sub>$1$2</sub>');
    };

    // Helper to count selection nodes in a branch
    const countSelections = (node) => {
        if (!node) return 0;
        let count = 0;
        if (node.name && node.name.toLowerCase().includes('selection')) {
            count = 1;
        }
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                count += countSelections(child);
            }
        }
        return count;
    };

    const traverse = (node, parentId = null) => {
        if (!node) return null; 

        // Skip backend projection nodes as we add a manual root projection
        const lowName = node.name ? node.name.toLowerCase() : "";
        if (lowName.includes('projection')) {
            let lastChildId = null;
            if (node.children && Array.isArray(node.children)) {
                node.children.forEach(child => {
                    lastChildId = traverse(child, parentId);
                });
            }
            return lastChildId;
        }

        const id = idCounter++;
        let label = node.name || "Unknown";
        let details = node.details || "";
        let color = "#ffffff";
        const props = {
            Name: node.name,
            Details: node.details
        };

        // Handle expansion of SelectionByLabel[Label(X) (Leaf)]
        if (node.name === 'SelectionByLabel' && details.includes('(Leaf)')) {
            // Extract the label name, e.g., "Label(likes)" -> "likes"
            const labelMatch = details.match(/Label\(([^)]+)\)/);
            const extractedLabel = labelMatch ? labelMatch[1] : "unknown";
            
            // 1. Create the Selection node (σ) - use <i> for subscript in tree
            const selectionLabel = `<b>σ</b><i>label(edge(1)) = ${extractedLabel}</i>`;
            nodes.push({ 
                id, 
                label: selectionLabel, 
                color: { background: "#ffffff" },
                properties: props 
            });

            if (parentId !== null) {
                edges.push({ from: parentId, to: id });
            }

            // 2. Create the child node Paths₁(G)
            const childId = idCounter++;
            nodes.push({
                id: childId,
                label: "Paths₁(G)",
                color: { background: "#ffffff" },
                properties: { Name: "Paths₁(G)", Details: "Base Relation" }
            });
            edges.push({ from: id, to: childId });

            // Since it's a leaf by definition in this case, we don't traverse children further
            return id;
        }

        // Determine node style based on name for other nodes
        if (node.name) {
            const lowName = node.name.toLowerCase();
            
            if (lowName.includes('recursive') || lowName.includes('kleene') || lowName.includes('pathsemantics')) {
                color = "#ffffff";
                label = `<b>Φ</b> <code>${queryRestrictor}</code>`;
            } else if (lowName.includes('join')) {
                color = "#ffffff";
                label = `<b>⋈</b> <code>${queryRestrictor}</code>`;
            } else if (lowName.includes('selection')) {
                color = "#ffffff";
                let condition = details || "";
                let detectedPrefix = 'node(1)'; // Default

                if ((condition === "[AND condition]" || condition.includes("AND condition")) && queryInput.value) {
                    const whereClauseMatch = queryInput.value.match(/WHERE\s+(.*?)(?:\s+(?:RETURN|ORDER|LIMIT|SKIP|GROUP)\b|$)/i);
                    if (whereClauseMatch) {
                        const whereStr = whereClauseMatch[1];
                        const andConditions = whereStr.split(/\s+AND\s+/i);
                        
                        let sourceAlias = 'x';
                        let targetAlias = 'y';
                        const matchPattern = queryInput.value.match(/\(([\w_]+)\)\s*-[^-]*->?\s*\(([\w_]+)\)/) || queryInput.value.match(/\(([\w_]+)\)\s*-[^-]*-\s*\(([\w_]+)\)/);
                        if (matchPattern) {
                            sourceAlias = matchPattern[1];
                            targetAlias = matchPattern[2];
                        }

                        const formattedExprs = andConditions.map(expr => {
                            let modExpr = expr.trim();
                            if (modExpr.includes('.')) {
                                const sourceRegex = new RegExp(`\\b${sourceAlias}\\.`, 'g');
                                const targetRegex = new RegExp(`\\b${targetAlias}\\.`, 'g');
                                modExpr = modExpr.replace(sourceRegex, 'node(1).').replace(targetRegex, 'node(len()+1).');
                            }
                            return modExpr;
                        });
                        
                        label = `<b>σ</b><i>${formattedExprs.join(' , ')}</i>`;
                    } else {
                        label = `<b>σ</b><i>${condition}</i>`;
                    }
                } else {
                    if (queryInput.value) {
                        // Try to infer standard aliases from global query if possible
                        let sourceAlias = 'x';
                        let targetAlias = 'y';
                        const matchPattern = queryInput.value.match(/\(([\w_]+)\)\s*-[^-]*->?\s*\(([\w_]+)\)/) || queryInput.value.match(/\(([\w_]+)\)\s*-[^-]*-\s*\(([\w_]+)\)/);
                        if (matchPattern) {
                            sourceAlias = matchPattern[1];
                            targetAlias = matchPattern[2];
                        }

                        // Parse pattern [property = value] and support operators like <, >, =, <=, >=, !=
                        const bracketMatch = condition.match(/\[([\w.]+)\s*([<>=!]+)\s*(.*?)\]/);
                        if (bracketMatch) {
                            let prop = bracketMatch[1];
                            const op = bracketMatch[2];
                            let val = bracketMatch[3].trim();
                            
                            // Check if the property has an alias prefix (e.g., x.name)
                            if (prop.includes('.')) {
                                const parts = prop.split('.');
                                const alias = parts[0];
                                prop = parts.slice(1).join('.'); // Remove alias from property name
                                
                                if (alias === sourceAlias) detectedPrefix = 'node(1)';
                                else if (alias === targetAlias) detectedPrefix = 'node(len()+1)';
                            } else {
                                // If no alias is in the details, try to find the property in the WHERE clause of the global query
                                const whereClauseMatch = queryInput.value.match(/WHERE\s+(.*?)(?:\s+(?:RETURN|ORDER|LIMIT|SKIP|GROUP)\b|$)/i);
                                if (whereClauseMatch) {
                                    const whereClause = whereClauseMatch[1];
                                    const whereRegex = new RegExp(`\\b([\\w_]+)\\.${prop}\\b`, 'i');
                                    const wMatch = whereClause.match(whereRegex);
                                    if (wMatch) {
                                        if (wMatch[1] === sourceAlias) detectedPrefix = 'node(1)';
                                        else if (wMatch[1] === targetAlias) detectedPrefix = 'node(len()+1)';
                                    }
                                }
                            }

                            // Ensure quotes around the value if they're not there
                            if (!val.startsWith('"') && !val.startsWith("'") && isNaN(val)) {
                                val = `"${val}"`;
                            }
                            condition = condition.replace(bracketMatch[0], `${prop}${op}${val}`);
                        }
                    } else {
                        // Fallback to original logic
                        const bracketMatch = condition.match(/\[([\w.]+)\s*([<>=!]+)\s*(.*?)\]/);
                        if (bracketMatch) {
                            let prop = bracketMatch[1];
                            const op = bracketMatch[2];
                            let val = bracketMatch[3].trim();
                            if (prop.includes('.')) prop = prop.split('.').slice(1).join('.');
                            if (!val.startsWith('"') && !val.startsWith("'")) {
                                val = `"${val}"`;
                            }
                            condition = condition.replace(bracketMatch[0], `${prop}${op}${val}`);
                        }
                    }
                    
                    // Format condition: prepend appropriate prefix if missing
                    if (condition && !condition.startsWith('node(') && !condition.startsWith('edge(') && !condition.startsWith('label(')) {
                        condition = `${detectedPrefix}.${condition}`;
                    }
                    label = `<b>σ</b><i>${condition}</i>`;
                }
            } else if (lowName.includes('union')) {
                color = "#ffffff";
                label = `<b>∪</b> <code>${queryRestrictor}</code>`;
            } else if (lowName === 'allnodes') {
                label = "Paths₀(G)";
            }
        }
        
        nodes.push({ 
            id, 
            label, 
            color: { background: color }, 
            properties: props 
        });

        if (parentId !== null) {
            edges.push({ from: parentId, to: id });
            
        }

        if (node.children && Array.isArray(node.children)) {
            // Fix: Kleene Star (Recursive) nodes sometimes duplicate their children in the backend.
            // We treat them as unary at this level by only processing the first child if redundant.
            const lowName = node.name ? node.name.toLowerCase() : "";
            const isKleene = lowName.includes('recursive') || lowName.includes('kleene');
            
            if (isKleene && node.children.length > 1) {
                // Heuristic: The backend might return duplicate children for Kleene nodes.
                // We prefer the child that contains 'Selection' nodes (filters), as the other might be a raw duplicate.
                let bestChild = node.children[0];
                let maxSelections = -1; // Start -1 so even 0 selections works if that's the max

                for (const child of node.children) {
                    const score = countSelections(child);
                    if (score > maxSelections) {
                        maxSelections = score;
                        bestChild = child;
                    }
                }
                traverse(bestChild, id);
            } else {
                node.children.forEach(child => traverse(child, id));
            }
        }

        return id;
    };

    // First traverse to build the tree from PathDB
    const backendRootId = traverse(plan);

    // Now check for RETURN and LIMIT to add a manual projection root if needed
    const returnMatch = query.match(/RETURN\s+(.*?)(?:\s+LIMIT|;|$)/i);
    if (returnMatch && backendRootId) {
        const returnExprs = returnMatch[1].trim().split(',').map(expr => expr.trim());
        const limitMatch = query.match(/LIMIT\s+(\d+)/i);
        const limit = limitMatch ? limitMatch[1] : "";
        const limitSuperscript = limit ? toSuperscript(limit) : "";

        // Try to identify aliases from the query
        let sourceAlias = 'x';
        let targetAlias = 'y';
        let pathAlias = 'p';

        // Extract aliases from the MATCH clause
        const matchPattern = query.match(/([a-zA-Z0-9_]+)\s*=\s*\(([\w_]+)\)\s*-[^-]*->?\s*\(([\w_]+)\)/) || query.match(/([a-zA-Z0-9_]+)\s*=\s*\(([\w_]+)\)\s*-[^-]*-\s*\(([\w_]+)\)/);
        if (matchPattern) {
            pathAlias = matchPattern[1];
            sourceAlias = matchPattern[2];
            targetAlias = matchPattern[3];
        }

        const formattedExprs = returnExprs.map(expr => {
            let detectedPrefix = '';

            // Handle explicit aliases: alias.property (e.g., y.name)
            if (expr.includes('.')) {
                const parts = expr.split('.');
                const alias = parts[0];
                const prop = parts.slice(1).join('.');

                if (alias === sourceAlias) detectedPrefix = `node(1).${prop}`;
                else if (alias === targetAlias) detectedPrefix = `node(len()+1).${prop}`;
                else detectedPrefix = expr; // Fallback
            }
            // Handle single variables (x, y, p, length(p), etc.)
            else {
                if (expr === sourceAlias) detectedPrefix = 'node(1)';
                else if (expr === targetAlias) detectedPrefix = 'node(len()+1)';
                else if (expr === pathAlias) detectedPrefix = expr; // p -> p
                else if (expr.startsWith('length(') && expr.includes(pathAlias)) detectedPrefix = expr; // length(p) -> length(p)
                else detectedPrefix = expr; // Fallback for unknowns
            }
            return detectedPrefix;
        }).join(' , ');

        const projectionLabel = `π${limitSuperscript} ${formattedExprs}`;

        const rootId = idCounter++;
        let limitSuperscriptCanvas = "";
        // Extract limit using a cleaner regex match. The limit is at the end of the query (e.g. LIMIT 3)
        const limitMatchCanvas = query.match(/LIMIT\s+(\d+)/i);
        if (limitMatchCanvas) {
            limitSuperscriptCanvas = limitMatchCanvas[1];
        }
        
        // Remove 'RETURN' prefix if present for the subscript (attributes)
        let cleanAttributes = projectionLabel.replace(/^π[⁰¹²³⁴⁵⁶⁷⁸⁹]*\s*/, '').trim(); // Adjusted regex to remove π and superscript

        let formattedCanvasLabel = `<b>π</b>`;
        if (limitSuperscriptCanvas) {
            formattedCanvasLabel += `<code>${limitSuperscriptCanvas}</code>`;
        }
        if (cleanAttributes) {
            formattedCanvasLabel += `<i>${cleanAttributes}</i>`;
        }

        nodes.push({
            id: rootId,
            label: formattedCanvasLabel,
            color: { background: "#ffffff" },
            properties: { Name: "Manual Projection", Details: query.substring(query.indexOf("RETURN")) }
        });

        // Link new root to old root
        edges.push({ from: rootId, to: backendRootId });
    }

    return { nodes, edges };
};



const generateMockTreeFallback = () => {
   // Legacy fallback if needed
   return { nodes: [{id:1, label: "Error Parsing"}], edges: [] };
}

onMounted(() => {
    if (window.lucide) window.lucide.createIcons();
});

</script>

<style scoped>
.user-session {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.75rem;
    background-color: var(--bg-secondary);
    border-radius: 2rem;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--text-primary);
    border: 1px solid var(--border-color);
}

.action-btn {
    background: none;
    border: 1px solid var(--border-color);
    color: var(--text-secondary);
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background-color: var(--bg-secondary);
    color: #2563eb;
    border-color: #2563eb;
}

.logout-btn:hover {
    color: #ef4444;
    border-color: #ef4444;
}

.app-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    overflow: hidden;
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    transition: background-color 0.3s;
}

/* Sidebar */
.sidebar {
    width: 25rem;
    flex-shrink: 0;
    background-color: var(--bg-primary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    z-index: 10;
}

.sidebar-header {
    height: 4rem;
    padding: 0 1rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-primary);
    display: flex;
    align-items: center;
    flex-shrink: 0;
}

/* Operator Insight Styles */
.operator-insight {
    margin: 1rem;
    padding: 0.875rem;
    background-color: rgba(37, 99, 235, 0.05);
    border: 1px solid rgba(37, 99, 235, 0.2);
    border-radius: 0.75rem;
}

.insight-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.025em;
    color: #2563eb;
    margin-bottom: 0.5rem;
}

.insight-content {
    font-size: 0.8125rem;
    line-height: 1.4;
    color: var(--text-secondary);
}

.selection-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #3b82f6;
    margin-left: auto;
}

.selected-path-details {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--border-color);
}

.path-details-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
}

.path-segment-wrapper {
    width: 100%;
}

.path-card {
    width: 100%;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    position: relative;
    border-width: 1px;
    border-style: solid;
    transition: all 0.2s ease;
    cursor: default;
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
}

.node-card {
    background-color: #daf5f3; /* Light teal */
    border-color: #26a69a;
    color: #00695c;
}

.node-card:hover {
    background-color: #c9efec;
}

.edge-card {
    background-color: #d8ecf9; /* Light blue */
    border-color: #42a5f5;
    color: #1565c0;
}

.edge-card:hover {
    background-color: #cde6f7;
}

.header-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.node-dot {
    width: 8px;
    height: 8px;
    background-color: #00897b;
    border-radius: 50%;
}

.edge-arrow-icon {
    color: #1e88e5;
}

.card-title {
    font-weight: 700;
    font-size: 1rem;
}

.card-body {
    display: flex;
    flex-direction: column;
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.card-prop {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.card-prop:last-child {
    border-bottom: none;
}

.prop-key {
    width: 80px;
    font-weight: 600;
    opacity: 0.8;
}

.prop-val {
    flex: 1;
    font-weight: 400;
}

.path-connector {
    display: none;
}

.card-arrow {
    display: none;
}



.header-content {
    display: flex;
    align-items: center;
    gap: 0.75rem; /* gap-3 */
}

.logo-container {
    background-color: rgba(37, 99, 235, 0.1); /* bg-primary/10 */
    padding: 0.5rem;
    border-radius: 0.5rem;
}

.icon-primary {
    color: #3b82f6;
    width: 1.5rem;
    height: 1.5rem;
}

.app-title {
    font-weight: 700;
    color: var(--text-primary);
    font-size: 1.125rem; /* text-lg */
    margin: 0;
}

.app-subtitle {
    font-size: 0.75rem; /* text-xs */
    color: var(--text-secondary);
    margin: 0;
}

/* Form */
.sidebar-form {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem; /* space-y-6 */
    background-color: var(--bg-primary);
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; /* space-y-2 */
}

.form-label {
    font-size: 0.875rem; /* text-sm */
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.icon-small {
    width: 1rem;
    height: 1rem;
    color: var(--text-secondary);
}

.query-input-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    align-items: center;
    
}

.info-box {
    background-color: var(--bg-secondary);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
}

.info-text {
    font-size: 0.8125rem;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-top: 0.5rem;
}

.sidebar-footer-minimal {
    padding: 1rem;
    border-top: 1px solid var(--border-color);
    text-align: center;
}

.footer-note {
    font-size: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.6;
}

.presets-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 0.5rem;
}

.preset-btn {
    text-align: left;
    font-size: 0.75rem;
    padding: 0.5rem;
    border-radius: 0.25rem;
    border: 1px solid var(--border-color);
    background-color: transparent;
    color: var(--text-primary);
    cursor: pointer;
    transition: background-color 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.preset-btn:hover {
    background-color: var(--bg-secondary);
    border-color: #3b82f6;
}

/* Visualization Toggle */
.toggle-container {
    display: flex;
    background-color: var(--bg-secondary);
    padding: 0.25rem;
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.toggle-btn {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-btn.active {
    background-color: var(--bg-primary);
    color: #2563eb;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.toggle-btn:hover:not(.active) {
    color: var(--text-primary);
}

/* Sidebar Footer */
.sidebar-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
    background-color: var(--bg-primary);
}

.run-btn {
    width: 100%;
    background-color: #2563eb; /* bg-primary */
    color: white;
    font-weight: 500;
    padding-top: 0.75rem;
    padding-bottom: 0.75rem;
    padding-left: 1rem;
    padding-right: 1rem;
    border-radius: 0.5rem;
    border: none;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
}

.run-btn:hover {
    background-color: #1d4ed8; /* hover:bg-blue-700 */
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.run-btn:active {
    transform: scale(0.95);
}

.run-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.btn-icon {
    width: 1rem;
    height: 1rem;
    fill: currentColor;
}

/* Main Content */
.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    background-color: rgba(249, 250, 251, 0.5);
    overflow: hidden;
}

.main-header {
    background-color: var(--bg-primary);
    backdrop-filter: blur(12px); /* Glassmorphism */
    -webkit-backdrop-filter: blur(12px);
    height: 6rem; /* Increased from 5.5rem to fit stacked actions */
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 100;
    flex-shrink: 0;
    gap: 2rem;
}

.query-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 20px;
    max-width: 1000px; /* Increased from 750px */
}

.query-bar-container {
    flex: 1;
    display: flex;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    height: 40px; /* Increased from 3rem */
    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
    width: 500px;
}

.query-bar-container:focus-within {
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15), inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

}

.query-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    padding-left: 0.75rem;
}

.query-icon {
    width: 1rem;
    height: 1rem;
    color: var(--text-secondary);
    margin-right: 1px;
}

.header-query-input {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: 12px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    outline: none;
}

.header-run-btn {
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%);
    color: white;
    border: none;
    padding: 0 1rem; /* Slightly more horizontal padding */
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 600;
    font-size: 14px; /* Slightly larger button text */
    cursor: pointer;
    transition: all 0.2s;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-run-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.header-run-btn:active:not(:disabled) {
    transform: scale(0.97);
}

.presets-dropdown-container {
    position: relative;
}

.presets-action-btn {
    background-color: var(--bg-secondary);
    color: var(--text-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    padding: 0.625rem 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.625rem;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.presets-action-btn:hover {
    background-color: var(--bg-primary);
    border-color: #3b82f6;
    color: #3b82f6;
}

.header-actions-query {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.layout-toggle-btn {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.layout-toggle-btn:hover {
    background-color: var(--bg-primary);
    border-color: #3b82f6;
    color: #3b82f6;
}

.presets-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    width: 320px;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    z-index: 1000;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.preset-item {
    padding: 0.75rem;
    border-radius: 0.5rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    transition: background-color 0.2s;
}

.preset-item:hover {
    background-color: var(--bg-secondary);
}

.preset-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: #2563eb;
}

.preset-query-preview {
    font-size: 0.75rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: monospace;
}

.breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem; /* text-sm */
    color: var(--text-secondary);
}

.crumb-active {
    font-weight: 500;
    color: var(--text-primary);
}

.icon-tiny {
    width: 1rem;
    height: 1rem;
}

.badge {
    display: inline-flex;
    align-items: center;
    padding: 0.125rem 0.625rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 500;
    background-color: #dcfce7; /* bg-green-100 */
    color: #166534; /* text-green-800 */
}

/* Content Area */
.content-area {
    flex: 1;
    position: relative;
    display: flex;
    overflow: hidden;
    background-color: var(--bg-primary);
}

.content-area.pos-bottom {
    flex-direction: column;
}

.panel-header-actions {
    display: flex;
    align-items: center;
    height: 50px;
    width: 50px;
}


.tree-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
    background-color: var(--bg-secondary);
    position: relative;
    overflow: hidden;
}

.empty-state {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem;
    z-index: 0;
    background-color: var(--bg-primary); 
}

.empty-icon-wrapper {
    background-color: var(--bg-primary);
    padding: 1.5rem;
    border-radius: 9999px;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    margin-bottom: 1.5rem;
    border: 1px solid var(--border-color);
}

.empty-icon {
    width: 3rem;
    height: 3rem;
    color: #d1d5db; /* text-gray-300 */
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.empty-desc {
    color: var(--text-secondary);
    max-width: 28rem;
}

.details-panel {
    background-color: var(--bg-primary);
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
    z-index: 20;
    transition: transform 0.3s, width 0.3s, height 0.3s;
    position: relative;
}

.panel-right {
    min-width: 200px;
    max-width: 800px;
    border-left: 1px solid var(--border-color);
}

.panel-bottom {
    width: 100% !important;
    max-width: none;
    border-top: 1px solid var(--border-color);
}

.resize-handle {
    position: absolute;
    background: transparent;
    z-index: 25;
    transition: background 0.2s;
}

.handle-right {
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: col-resize;
}

.handle-bottom {
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    cursor: row-resize;
}

.resize-handle:hover {
    background: rgba(59, 130, 246, 0.3);
}

.details-closed.panel-right {
    transform: translateX(100%);
    position: absolute;
    right: 0;
    height: 100%;
}

.details-closed.panel-bottom {
    transform: translateY(100%);
    position: absolute;
    bottom: 0;
    width: 100%;
}

.details-open {
    transform: translate(0, 0);
}

.details-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--bg-secondary);
}

.details-title {
    font-size: 0.85rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-primary);
}

.close-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
}

.close-btn:hover {
    color: #4b5563;
}

.details-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.object-header {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background-color: var(--bg-secondary);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
}

.object-label {
    font-size: 30px;
    color: #3b82f6;
    font-weight: 600;
    margin-bottom: 0.25rem;
    line-height: 1.2;
    word-break: break-word;
    /* Removed text-transform: uppercase to preserve specific mathematical symbols */
}

.object-value {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--text-primary);
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.object-sub {
    font-size: 0.75rem;
    color: var(--text-secondary);
    margin-top: 0.25rem;
    font-family: monospace;
}

.data-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.data-count {
    color: #9ca3af;
    font-weight: 400;
}

.data-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.data-item {
    padding: 0.75rem;
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    cursor: default;
    transition: all 0.2s;
}

.data-item:hover {
    border-color: #3b82f6;
    background-color: var(--bg-secondary);
}

.item-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.status-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 9999px;
    background-color: #10b981; /* bg-emerald-500 */
}

.item-id {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
}

.item-details {
    font-size: 0.625rem;
    color: var(--text-secondary);
    font-family: monospace;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

/* Table Styles */
.data-table {
    background-color: var(--bg-primary);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
    overflow: hidden;
}

.table-header {
    background-color: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    padding: 0.5rem 0.75rem;
}

.table-row {
    display: flex;
    gap: 0.5rem;
}

.table-cell {
    flex: 1;
    min-width: 0;
    font-size: 0.625rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.header-cell {
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    font-size: 14px;
}


.data-row {
    padding: 0.5rem 0.75rem;
    transition: background-color 0.2s;
    cursor: default;
    display: block;
}

.data-row:hover {
    background-color: var(--bg-secondary);
}

.row-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.path-label {
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--text-secondary);
}

.row-content {
    display: flex;
    gap: 0.5rem;
}

.row-content .table-cell {
    color: var(--text-primary);
    font-family: monospace;
    font-size: 14px;
}

.status-message {
    margin-top: 0.75rem;
    font-size: 0.625rem;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.status-icon {
    width: 0.75rem;
    height: 0.75rem;
    color: #10b981;
}

.empty-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    padding: 2rem;
    text-align: center;
}

.empty-details-icon {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.5rem;
    opacity: 0.5;
}

.empty-details-text {
    font-size: 0.875rem;
}



.header-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    flex-shrink: 0;
}

.header-actions-top {
    display:flex;
    align-items: center;
    gap: 0.5rem;
}

.user-session-compact {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.125rem 0.5rem;
    background-color: var(--bg-secondary);
    border-radius: 1rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}

.icon-xtiny {
    width: 0.75rem;
    height: 0.75rem;
}

/* Visual Path Viewer Mockup Styles */
.visual-path-container {
    padding: 1rem;
    background-color: var(--bg-primary);
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    margin-top: 1rem;
    overflow-x: auto;
}

.visual-path-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-primary);
    text-transform: uppercase;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.path-canvas {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 0;
    min-width: max-content;
}

.path-node {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: #3b82f6;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid transparent;
}

.path-node:hover {
    transform: scale(1.1);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.path-node.selected {
    border-color: var(--text-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}

.path-edge-wrapper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.path-edge {
    padding: 0.25rem 0.75rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    color: var(--text-secondary);
    cursor: pointer;
    transition: transform 0.2s, background-color 0.2s;
}

.path-edge:hover {
    background-color: var(--border-color);
    transform: translateY(-2px);
}

.path-edge.selected {
    border-color: #3b82f6;
    color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
}

.edge-line {
    height: 2px;
    width: 1rem;
    background-color: var(--border-color);
}

.edge-arrow {
    font-size: 0.75rem;
    color: var(--border-color);
}

.element-inspector {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px dashed var(--border-color);
}

.inspector-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    margin-bottom: 0.75rem;
}

.inspector-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.5rem 1rem;
    font-size: 0.75rem;
}

.inspector-key {
    font-weight: 600;
    color: var(--text-secondary);
}

.inspector-val {
    color: var(--text-primary);
    font-family: monospace;
}

/* Join Tabs Styles */
.join-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 0.25rem;
    background-color: var(--bg-secondary);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.join-tab-btn {
    flex: 1;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s;
}

.join-tab-btn:hover {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.join-tab-btn.active {
    background-color: #3b82f6;
    color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Path Tabs Styles */
.path-tabs-container {
    margin-bottom: 1.5rem;
}

.path-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem;
    background-color: var(--bg-secondary);
    border-radius: 0.5rem;
    border: 1px solid var(--border-color);
}

.tab-btn {
    padding: 0.375rem 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.tab-btn:hover {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.tab-btn.active {
    background-color: #3b82f6;
    color: white;
    border-color: #2563eb;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* Header Refinements */
.details-header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.view-switcher {
    display: flex;
    gap: 0.25rem;
    background-color: var(--bg-secondary);
    padding: 0.2rem;
    border-radius: 0.4rem;
    border: 1px solid var(--border-color);
}

.view-btn {
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    border-radius: 0.3rem;
    cursor: pointer;
    transition: all 0.2s;
}

.view-btn:hover {
    background-color: var(--bg-primary);
    color: var(--text-primary);
}

.view-btn.active {
    background-color: var(--bg-primary);
    color: #3b82f6;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Internal Sidebar Flow Layout */
.path-sidebar-flow-internal {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.unified-boxed-explorer {
    display: flex;
    background-color: #0f172a;
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    overflow: hidden;
    min-height: 350px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.internal-path-sidebar {
    width: 3.5rem;
    background-color: rgba(255, 255, 255, 0.02);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    flex-direction: column;
    padding: 0.75rem;
    gap: 0.5rem;
    flex-shrink: 0;
}

.internal-unified-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.internal-viz-canvas {
    padding: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow-x: auto;
    position: relative;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.internal-element-inspector {
    padding: 2rem 2.5rem;
    background-color: rgba(255, 255, 255, 0.01);
}

/* Custom Scrollbar for Viz Area */
.internal-viz-canvas::-webkit-scrollbar {
    height: 8px;
}

.internal-viz-canvas::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.internal-viz-canvas::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.internal-viz-canvas::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
}

.sidebar-tab-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #64748b;
    font-size: 0.7rem;
    font-weight: 700;
    cursor: pointer;
    border-radius: 0.4rem;
    transition: all 0.2s;
}

.sidebar-tab-btn:hover {
    background-color: rgba(255,255,255,0.05);
    color: #f8fafc;
}

.sidebar-tab-btn.active {
    background-color: #3b82f6;
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.path-node.selected {
    box-shadow: 0 0 0 3px #3b82f6, 0 0 15px rgba(59, 130, 246, 0.5);
    transform: scale(1.1);
    z-index: 10;
}

.path-edge.selected {
    background-color: #3b82f6;
    color: white;
    border-color: #3b82f6;
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
    transform: scale(1.05);
}

.inspector-header-simple {
    font-size: 0.9rem;
    font-weight: 700;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}

.clean-style {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
}

.clean-style .inspector-grid {
    gap: 0.5rem 1.5rem;
}

.clean-style .inspector-key {
    color: #64748b;
    font-size: 0.8rem;
}

.clean-style .inspector-val {
    color: #f8fafc;
    font-size: 0.8rem;
}

/* Remove old modes */
.summary-mode, .vertical-mode {
    display: none;
}
/* Sequential Path View Styles */
.path-list-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 0.5rem;
}

.path-list-item {
    background-color: var(--bg-secondary);
    padding: 1rem;
    border-radius: 0.75rem;
    border: 1px solid var(--border-color);
    transition: transform 0.2s, box-shadow 0.2s;
}

.path-list-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.sequential-path {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.sequential-path.mini {
    padding: 1rem;
    background-color: var(--bg-secondary);
    border-radius: 0.75rem;
    border: 1px dashed var(--border-color);
}

.node-circle {
    min-width: 2.5rem;
    height: 2.5rem;
    padding: 0 0.75rem;
    border-radius: 9999px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.1);
}

.edge-rect {
    min-width: 3.5rem;
    height: 1.75rem;
    padding: 0 0.5rem;
    border-radius: 0.375rem;
    background-color: var(--bg-primary);
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 600;
    border: 1px solid var(--border-color);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Path Table View Styles */
.path-table-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.table-container-scroll {
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    overflow: hidden;
    background-color: var(--bg-primary);
}

.premium-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
    table-layout: fixed;
}

.premium-table th {
    background-color: var(--bg-secondary);
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 700;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--border-color);
}

.premium-table th:hover {
    background-color: rgba(59, 130, 246, 0.05);
}

.premium-table th .icon-xtiny {
    margin-left: 0.25rem;
    color: #3b82f6;
}

.premium-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
}

.premium-table tr:last-child td {
    border-bottom: none;
}

.premium-table tr {
    transition: background-color 0.2s;
    cursor: pointer;
}

.premium-table tr:hover:not(.selected-row) {
    background-color: rgba(0, 0, 0, 0.02);
}

.selected-row {
    background-color: rgba(59, 130, 246, 0.08) !important;
}

.selected-row td {
    color: #2563eb;
    font-weight: 600;
}

.table-selected-path {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.selection-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    margin-bottom: 0.75rem;
    padding-left: 0.25rem;
}

.main-results-title {
    font-size: 0.9375rem; /* Increased size */
    justify-content: space-between;
    width: 100%;
}

.toggle-chevron-btn.compact {
    padding: 0.25rem 0.625rem;
    font-size: 0.6875rem;
    border-radius: 0.5rem;
    background-color: var(--bg-primary);
}

.data-count {
    color: var(--text-secondary);
    font-weight: 500;
    text-transform: none;
    font-size: 0.8125rem;
    margin-left: -0.25rem;
}

.node-circle.selected {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.3);
    transform: scale(1.05);
}

.edge-rect.selected {
    border-color: #3b82f6;
    background-color: rgba(59, 130, 246, 0.05);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    transform: scale(1.05);
}

.node-circle, .edge-rect {
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.node-circle:hover:not(.selected), .edge-rect:hover:not(.selected) {
    transform: translateY(-2px);
    border-color: #3b82f6;
}

/* Sequence Toggle Bar */
.sequence-toggle-bar {
    margin: 1rem 0 0.5rem 0;
    display: flex;
    justify-content: center;
}

.toggle-chevron-btn {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 2rem;
    padding: 0.375rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
}

.empty-selection-placeholder {
    padding: 3rem 1rem;
    text-align: center;
    background-color: var(--bg-secondary);
    border: 2px dashed var(--border-color);
    border-radius: 1rem;
    margin-bottom: 1.5rem;
    color: var(--text-secondary);
    font-size: 1rem;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
    animation: fadeIn 0.4s ease;
}

.empty-selection-placeholder p {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* Unified Path Table Filtering Styles */
.results-header-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    gap: 1rem;
}

.unified-search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    flex-grow: 1;
    max-width: 300px;
}

.unified-search-wrapper i {
    position: absolute;
    left: 0.75rem;
    color: var(--text-secondary);
    opacity: 0.6;
}

.unified-search-input {
    width: 100%;
    padding: 0.5rem 0.75rem 0.5rem 2rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.6rem;
    font-size: 0.875rem;
    color: var(--text-primary);
    transition: all 0.2s ease;
}

.unified-search-input:focus {
    outline: none;
    border-color: #3b82f6;
    background-color: var(--bg-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-filters-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.813rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
}

.clear-filters-btn:hover {
    background-color: #fee2e2;
    color: #dc2626;
    border-color: #fca5a5;
}

/* Active Column Highlighting */
.premium-table th {
    position: relative;
    transition: all 0.2s ease;
}

.premium-table th.active-filter {
    background-color: rgba(59, 130, 246, 0.05) !important;
    color: #3b82f6 !important;
    border-bottom: 2px solid #3b82f6 !important;
}

.sort-btn {
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: 1px solid transparent;
    border-radius: 0.25rem;
    cursor: pointer;
    opacity: 0.3;
    transition: all 0.2s ease;
    padding: 0;
    color: var(--text-secondary);
}

.premium-table th:hover .sort-btn {
    opacity: 0.7;
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
}

.sort-btn:hover {
    opacity: 1 !important;
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
}

.sort-btn.active {
    opacity: 1;
    background-color: var(--bg-secondary);
    border-color: var(--border-color);
    color: var(--text-primary);
}

.sort-btn.active i {
    color: var(--text-primary) !important;
}

/* Sort Icon Animation */
.sort-btn i, .sort-btn svg {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sort-btn.sort-asc i, .sort-btn.sort-asc svg {
    transform: rotate(180deg);
}

.null-value {
    color: var(--text-secondary);
    font-style: italic;
    opacity: 0.7;
}

.filter-emoji {
    margin-right: 0.3rem;
    font-size: 0.9rem;
    display: inline-block;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
        transform: scale(1);
    }
    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

.sort-icon {
    margin-left: 0.4rem;
    opacity: 0.7;
}

.path-count-badge {
    background-color: var(--bg-secondary);
    color: var(--text-secondary);
    padding: 0.2rem 0.6rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-left: 0.5rem;
    border: 1px solid var(--border-color);
    white-space: nowrap;
}
.inspector-card {
    margin-top: 1.5rem;
    padding: 1.25rem;
    border-radius: 1rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    transition: all 0.3s ease;
}

/* Card Type Accents (Subtle left border or symbolic color) */
.inspector-card.node {
    border-left: 4px solid #3b82f6;; /* Green accent for nodes */
}

.inspector-card.edge {
    border-left: 4px solid #3b82f6; /* Blue accent for edges */
}

.inspector-card-header {
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.inspector-card-title {
    font-size: 1.125rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-primary);
}

.symbolic-prefix {
    font-size: 1.25rem;
}

.node .symbolic-prefix {
    color: #3b82f6;
}

.edge .symbolic-prefix {
    color: #3b82f6;
}

.branded-label {
    font-weight: 800;
    color: var(--text-primary);
}

.symbolic-sep {
    font-size: 1.25rem;
    opacity: 0.5;
    color: var(--text-secondary);
    margin: 0 0.125rem;
}

.branded-id {
    color: var(--text-secondary);
    font-weight: 600;
}

/* Inspector Badges - Dark & Rounded (Theme Independent) */
.inspector-badges {
    display: flex;
    gap: 0.75rem;
}

.mini-badge.dark {
    padding: 0.375rem 0.875rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 600;
    background-color: #1e1b4b; /* Keep dark for contrast */
    color: #e0e7ff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.inspector-card-body {
    display: flex;
    flex-direction: column;
}

.inspector-vertical-list {
    display: flex;
    flex-direction: column;
}

.inspector-kv {
    display: flex;
    justify-content: flex-start;
    align-items: baseline;
    gap: 1.5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
}

.inspector-kv:last-child {
    border-bottom: none;
}

.prop-key {
    min-width: 100px;
    font-size: 0.9375rem;
    font-weight: 700;
    color: var(--text-primary);
    opacity: 0.8;
}

.prop-val {
    font-size: 0.9375rem;
    font-weight: 400;
    color: var(--text-secondary);
}

/* Highlighted Child Row (for Join Inspection) */
.highlighted-child-row {
    background-color: rgba(59, 130, 246, 0.15) !important; /* Light blue tint */
    border-left: 3px solid #60a5fa !important;
}

.dark .highlighted-child-row {
    background-color: rgba(96, 165, 250, 0.2) !important;
    border-left: 3px solid #93c5fd !important;
}

/* Sequence Modal Styles */
.sequence-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease-out;
}

.sequence-modal-content {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    width: 95%;
    max-width: 800px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.sequence-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
}

.sequence-modal-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.sequence-modal-close-btn {
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.sequence-modal-close-btn:hover {
    background-color: var(--bg-tertiary);
    color: var(--text-primary);
}

.sequence-modal-body {
    padding: 1.5rem;
    overflow-y: hidden;
    overflow-x: auto;
    flex-grow: 1;
    display: flex;
}

.sequential-path.horizontal {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 0;
    padding-bottom: 1rem;
    min-width: max-content;
}

.sequence-row {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    position: relative;
    padding-right: 1.5rem;
    width: 200px; /* Fixed width for horizontal cards */
}

.sequence-row:last-child {
    padding-right: 0;
}

.sequence-symbol {
    height: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    color: #3b82f6;
    z-index: 2;
}

.sequence-row.edge .sequence-symbol {
    color: #8b5cf6;
    font-size: 1.25rem;
}

.sequence-connector {
    position: absolute;
    top: 1rem;
    left: 100px; /* Half of 200px to start from center of node */
    right: -100px; /* Extend to center of next node */
    height: 2px;
    background-color: var(--border-color);
    z-index: 1;
    transform: translateY(-50%);
}

.sequence-details-card {
    flex-grow: 1;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
}

.sequence-row.node .sequence-details-card {
    border-top: 3px solid #3b82f6;
    border-left: 1px solid var(--border-color);
}

.sequence-row.edge .sequence-details-card {
    border-top: 3px solid #8b5cf6;
    border-left: 1px solid var(--border-color);
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    background-color: var(--bg-tertiary);
}

.sequence-card-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
}

.mini-badge-outline {
    font-size: 0.7rem;
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--bg-primary);
    color: var(--text-secondary);
}

.sequence-badges {
    display: flex;
    gap: 0.5rem;
}

.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }

.sequence-properties {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: 0.8rem;
}

.sequence-kv {
    display: flex;
    gap: 0.5rem;
}

.action-btn-small {
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    transition: all 0.2s;
}

.action-btn-small:hover {
    background-color: var(--bg-tertiary);
    border-color: #3b82f6;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.node-parameters-container {
    padding-top: 1rem;
    margin-top: 1rem;
    border-top: 1px dashed var(--border-color);
}

.large-sigma {
    font-size: 1.4em;
    vertical-align: middle;
}

.params-title {
    font-size: 0.8125rem;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
    margin-top: 0;
}

.params-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.param-item {
    display: flex;
    align-items: center;
    flex-wrap: wrap; /* allow wrapping if too long */
    gap: 0.5rem;
    font-size: 0.8rem;
}

.param-key {
    font-weight: 600;
    font-size: 0.8rem;
    color: var(--text-primary);
}

.param-value-plain {
    color: var(--text-primary);
    font-weight: 500;
}

.generic-title {
    font-size: 0.9rem;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
    font-weight: 700;
    letter-spacing: 0.01em;
}

.header-divider {
    border: 0;
    height: 1px;
    background: var(--border-color);
    background-image: linear-gradient(to right, var(--border-color), transparent);
    margin: 1rem 0;
    opacity: 0.6;
}

.operator-info-line {
    font-size: 0.8rem;
    margin-bottom: 0.5rem;
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
}

.info-label {
    font-weight: 600;
    color: var(--text-primary);
}

.info-value {
    color: var(--text-secondary);
}

.param-node-btn {
    background-color: #2563eb;
    border: 1px solid #2563eb;
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    color: #ffffff;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.param-node-btn:hover {
    background-color: #2563eb;
    border-color: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.param-node-btn:active {
    transform: scale(0.97);
    box-shadow: 0 1px 2px rgba(59, 130, 246, 0.3);
}
</style>
