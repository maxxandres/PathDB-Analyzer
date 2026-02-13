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

                    <button class="layout-toggle-btn" 
                            @click="panelPosition = panelPosition === 'right' ? 'bottom' : 'right'"
                            :title="panelPosition === 'right' ? 'Move to Bottom' : 'Move to Right'">
                        <i :data-lucide="panelPosition === 'right' ? 'layout-horizontal' : 'layout-vertical'" class="icon-tiny"></i>
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
                </div> -->

            
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

                <div v-else class="tree-wrapper">
                    <QueryTree ref="treeRef" :treeData="treeData" @node-select="handleNodeSelect" />
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
                          <!-- View Switcher -->
                          <div v-if="selectedNode && currentNodeData.data && currentNodeData.data[0]?.segments" class="view-switcher">
                              <button class="view-btn" :class="{ 'active': pathViewMode === 'horizontal' }" @click="pathViewMode = 'horizontal'" title="Horizontal View">
                                  <i data-lucide="columns" class="icon-xtiny"></i>
                              </button>
                              <button class="view-btn" :class="{ 'active': pathViewMode === 'sidebar-flow' }" @click="pathViewMode = 'sidebar-flow'" title="Sidebar Flow">
                                  <i data-lucide="panel-left-dashed" class="icon-xtiny"></i>
                              </button>
                              <button class="view-btn" :class="{ 'active': pathViewMode === 'list' }" @click="pathViewMode = 'list'" title="Sequential List">
                                  <i data-lucide="list" class="icon-xtiny"></i>
                              </button>
                              <button class="view-btn" :class="{ 'active': pathViewMode === 'table' }" @click="pathViewMode = 'table'" title="Path Table">
                                  <i data-lucide="table-2" class="icon-xtiny"></i>
                              </button>
                          </div>
                      </div>
                      <button @click="selectedNode = null" class="close-btn">
                          <i data-lucide="x" class="icon-small"></i>
                      </button>
                  </div>

                 <div v-if="selectedNode" class="details-content">
                     <!-- Selected Object Header -->
                     <div class="object-header">
                         <div class="object-label">Selected Object</div>
                         <div class="object-value">{{ selectedNode.label.split('\n')[0] }}</div>
                         <div class="object-value">{{ selectedNode.label.split('\n')[1] || '' }}</div>
                     </div>

                     <!-- Data Content -->
                     <div v-if="currentNodeData.rows && currentNodeData.rows.length > 0">
                        <h3 class="data-title main-results-title">
                            <i data-lucide="database" class="icon-tiny"></i>
                            Results 
                            <span class="data-count" v-if="pathTableData.length > 0">({{ pathTableData.length }} paths)</span>
                            
                            <!-- Toggle Path Table Chevron (Moved here for Path Table mode) -->
                            <button v-if="pathViewMode === 'table'" class="toggle-chevron-btn compact" @click="showPathTable = !showPathTable" :title="showPathTable ? 'Hide List of Paths' : 'Show List of Paths'">
                                <i :data-lucide="showPathTable ? 'chevron-down' : 'chevron-right'" class="icon-xtiny"></i>
                                <span>{{ showPathTable ? 'Hide List' : 'Show List' }}</span>
                            </button>
                        </h3>
                        
                        <!-- Results Content -->
                        <template v-if="currentNodeData.data && currentNodeData.data[0]?.segments">
                            <!-- mode: horizontal -->
                            <div v-if="pathViewMode === 'horizontal'" class="path-horizontal-layout">
                                <div class="path-tabs-container">
                                    <h3 class="data-title">
                                        <i data-lucide="layers" class="icon-tiny"></i>
                                        Select Path
                                    </h3>
                                    <div class="path-tabs">
                                        <button v-for="(row, idx) in currentNodeData.data" :key="idx"
                                                class="tab-btn" :class="{ 'active': expandedRow === idx }"
                                                @click="toggleRow(idx)">
                                            P{{ idx + 1 }}
                                        </button>
                                    </div>
                                </div>

                                <div v-if="expandedRow !== null" class="selected-path-details">
                                    <div class="visual-path-container">
                                        <div class="path-canvas">
                                            <template v-for="(segment, segIdx) in currentNodeData.data[expandedRow].segments" :key="segIdx">
                                                <div v-if="segment.type === 'node'" 
                                                     class="path-node" 
                                                     :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                     @click="selectedPathElement = segment">
                                                    {{ segment.label.substring(0, 1) }}{{ segIdx / 2 + 1 }}
                                                </div>
                                                <div v-if="segment.type === 'edge'" class="path-edge-wrapper">
                                                    <div class="edge-line"></div>
                                                    <div class="path-edge" 
                                                         :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                         @click="selectedPathElement = segment">
                                                        {{ segment.label }}
                                                    </div>
                                                    <div class="edge-arrow">
                                                        <i :data-lucide="segment.direction === '->' ? 'chevron-right' : 'chevron-left'" class="icon-xtiny"></i>
                                                    </div>
                                                    <div class="edge-line"></div>
                                                </div>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- mode: sidebar-flow -->
                            <div v-if="pathViewMode === 'sidebar-flow'" class="path-sidebar-flow-internal">
                                <div class="unified-boxed-explorer">
                                    <!-- Sidebar Inside the Box (Left) -->
                                    <div class="internal-path-sidebar">
                                        <button v-for="(row, idx) in currentNodeData.data" :key="idx"
                                                class="sidebar-tab-btn" :class="{ 'active': expandedRow === idx }"
                                                @click="toggleRow(idx)">
                                            P{{ idx + 1 }}
                                        </button>
                                    </div>
                                    
                                    <!-- Unified Content Area (Right) -->
                                    <div class="internal-unified-content">
                                        <!-- Visualization Canvas (Top) -->
                                        <div class="internal-viz-canvas">
                                            <div v-if="expandedRow !== null" class="path-canvas">
                                                <template v-for="(segment, segIdx) in currentNodeData.data[expandedRow].segments" :key="segIdx">
                                                    <div v-if="segment.type === 'node'" 
                                                         class="path-node" 
                                                         :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                         @click="selectedPathElement = segment">
                                                        {{ segment.label.substring(0, 1) }}{{ segIdx / 2 + 1 }}
                                                    </div>
                                                    <div v-if="segment.type === 'edge'" class="path-edge-wrapper">
                                                        <div class="edge-line"></div>
                                                        <div class="path-edge" 
                                                             :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                             @click="selectedPathElement = segment">
                                                            {{ segment.label }}
                                                        </div>
                                                        <div class="edge-arrow">
                                                            <i :data-lucide="segment.direction === '->' ? 'chevron-right' : 'chevron-left'" class="icon-xtiny"></i>
                                                        </div>
                                                        <div class="edge-line"></div>
                                                    </div>
                                                </template>
                                            </div>
                                        </div>

                                        <!-- Inspector (Bottom) - Now inside the box -->
                                        <div v-if="selectedPathElement" class="internal-element-inspector">
                                            <div class="inspector-header-simple">
                                                {{ selectedPathElement.label }} &gt; {{ selectedPathElement.id }}
                                            </div>
                                            <div class="inspector-grid">
                                                <div class="inspector-key">Type:</div>
                                                <div class="inspector-val">{{ selectedPathElement.type }}</div>
                                                <template v-if="selectedPathElement.properties">
                                                    <template v-for="(val, key) in selectedPathElement.properties" :key="key">
                                                        <div v-if="key !== 'id' && key !== 'label' && key !== 'type'" class="inspector-key">{{ key }}:</div>
                                                        <div v-if="key !== 'id' && key !== 'label' && key !== 'type'" class="inspector-val">{{ val }}</div>
                                                    </template>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- mode: list (Sequential Path View) -->
                            <div v-if="pathViewMode === 'list'" class="path-list-view">
                                <div v-for="(item, idx) in currentNodeData.data" :key="idx" class="path-list-item">
                                    <div class="sequential-path">
                                        <template v-for="(segment, segIdx) in item.segments" :key="segIdx">
                                            <div v-if="segment.type === 'node'" 
                                                 class="node-circle" 
                                                 :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                 @click="handlePathElementClick(segment)"
                                                 :title="segment.label">
                                                {{ segment.id }}
                                            </div>
                                            <div v-if="segment.type === 'edge'" 
                                                 class="edge-rect" 
                                                 :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                 @click="handlePathElementClick(segment)"
                                                 :title="segment.label">
                                                {{ segment.id }}
                                            </div>
                                        </template>
                                    </div>
                                </div>

                                <!-- Inspector Card for List Mode -->
                                <div v-if="selectedPathElement" class="inspector-card" :class="selectedPathElement.type">
                                    <div class="inspector-card-header">
                                        <h4 class="inspector-card-title">
                                            <span class="symbolic-prefix">{{ selectedPathElement.type === 'node' ? '●' : '→' }}</span>
                                            <span class="branded-label">{{ selectedPathElement.label }}</span>
                                            <span class="symbolic-sep">›</span>
                                            <span class="branded-id">{{ selectedPathElement.id }}</span>
                                        </h4>
                                        <!-- Edge Badges -->
                                        <div v-if="selectedPathElement.type === 'edge'" class="inspector-badges">
                                            <div v-if="selectedPathElement.source" class="mini-badge dark">
                                                Source: {{ selectedPathElement.source }}
                                            </div>
                                            <div v-if="selectedPathElement.target" class="mini-badge dark">
                                                Target: {{ selectedPathElement.target }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="inspector-card-body">
                                        <div class="inspector-properties-section no-title">
                                            <div class="inspector-vertical-list">
                                                <template v-if="selectedPathElement.properties">
                                                    <template v-for="(val, key) in selectedPathElement.properties" :key="key">
                                                        <div v-if="key !== 'id' && key !== 'label' && key !== 'type' && key !== 'source' && key !== 'target'" class="inspector-kv">
                                                            <span class="prop-key">{{ key }}:</span>
                                                            <span class="prop-val">{{ val }}</span>
                                                        </div>
                                                    </template>
                                                </template>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- mode: table (Path Table View) -->
                            <div v-if="pathViewMode === 'table'" class="path-table-view">
                                <div v-if="showPathTable" class="table-container-scroll">
                                    <table class="premium-table">
                                        <thead>
                                            <tr>
                                                <th @click="setTableSort('source')">
                                                    Source
                                                    <i v-if="tableSortKey === 'source'" :data-lucide="tableSortOrder === 1 ? 'chevron-up' : 'chevron-down'" class="icon-xtiny"></i>
                                                </th>
                                                <th @click="setTableSort('target')">
                                                    Target
                                                    <i v-if="tableSortKey === 'target'" :data-lucide="tableSortOrder === 1 ? 'chevron-up' : 'chevron-down'" class="icon-xtiny"></i>
                                                </th>
                                                <th @click="setTableSort('length')">
                                                    Length
                                                    <i v-if="tableSortKey === 'length'" :data-lucide="tableSortOrder === 1 ? 'chevron-up' : 'chevron-down'" class="icon-xtiny"></i>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="row in sortedPathTableData" :key="row.id" 
                                                :class="{ 'selected-row': selectedTablePath?.id === row.id }"
                                                @click="selectRowFromTable(row)">
                                                <td>{{ row.source }}</td>
                                                <td>{{ row.target }}</td>
                                                <td>{{ row.length }}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Selected Path Detail (Sequential) -->
                                <div v-if="selectedTablePath" class="table-selected-path">
                                    <h4 class="selection-title">Selected Path Sequence</h4>
                                    <div class="sequential-path mini">
                                        <template v-for="(segment, segIdx) in selectedTablePath.segments" :key="segIdx">
                                            <div v-if="segment.type === 'node'" 
                                                 class="node-circle" 
                                                 :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                 @click="handlePathElementClick(segment)"
                                                 :title="segment.label">
                                                {{ segment.id }}
                                            </div>
                                            <div v-if="segment.type === 'edge'" 
                                                 class="edge-rect" 
                                                 :class="{ 'selected': selectedPathElement?.id === segment.id }"
                                                 @click="handlePathElementClick(segment)"
                                                 :title="segment.label">
                                                {{ segment.id }}
                                            </div>
                                        </template>
                                    </div>

                                    <!-- Inspector Card for Table Mode -->
                                    <div v-if="selectedPathElement" class="inspector-card" :class="selectedPathElement.type">
                                        <div class="inspector-card-header">
                                            <h4 class="inspector-card-title">
                                                <span class="symbolic-prefix">{{ selectedPathElement.type === 'node' ? '●' : '→' }}</span>
                                                <span class="branded-label">{{ selectedPathElement.label }}</span>
                                                <span class="symbolic-sep">›</span>
                                                <span class="branded-id">{{ selectedPathElement.id }}</span>
                                            </h4>
                                            <!-- Edge Badges -->
                                            <div v-if="selectedPathElement.type === 'edge'" class="inspector-badges">
                                                <div v-if="selectedPathElement.source" class="mini-badge dark">
                                                    Source: {{ selectedPathElement.source }}
                                                </div>
                                                <div v-if="selectedPathElement.target" class="mini-badge dark">
                                                    Target: {{ selectedPathElement.target }}
                                                </div>
                                            </div>
                                        </div>
                                        <div class="inspector-card-body">
                                            <div class="inspector-properties-section no-title">
                                                <div class="inspector-vertical-list">
                                                    <template v-if="selectedPathElement.properties">
                                                        <template v-for="(val, key) in selectedPathElement.properties" :key="key">
                                                            <div v-if="key !== 'id' && key !== 'label' && key !== 'type' && key !== 'source' && key !== 'target'" class="inspector-kv">
                                                                <span class="prop-key">{{ key }}:</span>
                                                                <span class="prop-val">{{ val }}</span>
                                                            </div>
                                                        </template>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Shared Inspector for Horizontal Mode -->
                            <div v-if="pathViewMode === 'horizontal' && selectedPathElement" class="element-inspector clean-style">
                                <div class="inspector-header-simple">
                                    {{ selectedPathElement.label }} &gt; {{ selectedPathElement.id }}
                                </div>
                                <div class="inspector-grid">
                                    <div class="inspector-key">Type:</div>
                                    <div class="inspector-val">{{ selectedPathElement.type }}</div>
                                    <template v-if="selectedPathElement.properties">
                                        <template v-for="(val, key) in selectedPathElement.properties" :key="key">
                                            <div v-if="key !== 'id' && key !== 'label' && key !== 'type'" class="inspector-key">{{ key }}:</div>
                                            <div v-if="key !== 'id' && key !== 'label' && key !== 'type'" class="inspector-val">{{ val }}</div>
                                        </template>
                                    </template>
                                </div>
                            </div>
                        </template>

                        <!-- Table Display (Only for non-path results) -->
                        <div v-else class="results-table-container">
                            <div class="data-table">
                                <!-- Headers -->
                                <div class="table-header">
                                    <div class="table-row">
                                        <div v-for="(header, idx) in currentNodeData.headers" :key="idx" 
                                             class="table-cell header-cell">
                                            {{ header }}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Rows -->
                                <div class="table-body">
                                    <template v-for="(row, rowIdx) in currentNodeData.rows" :key="rowIdx">
                                        <div class="table-row data-row" 
                                             :class="{ 'expanded': expandedRow === rowIdx }"
                                             @click="toggleRow(rowIdx)">
                                            <div class="row-content">
                                                <div v-for="(cell, cellIdx) in row" :key="cellIdx" 
                                                     class="table-cell" 
                                                     :title="cell">
                                                    {{ cell }}
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Status Message -->
                        <div v-if="currentNodeData.message" class="status-message">
                            <i data-lucide="check-circle" class="status-icon"></i>
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

const queryInput = ref('MATCH TRAIL p = (x)-[((Likes.HasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3');
const isLoading = ref(false);
const treeData = ref(null);
const selectedNode = ref(null);
const treeRef = ref(null);
const treeMode = ref('raw'); // 'logical' or 'raw'
const expandedRow = ref(null); // Track which row is expanded for details
const expandedSegments = ref({}); // Track which segments within a path are expanded
const selectedPathElement = ref(null); // Track clicked element in visual path
const pathViewMode = ref('sidebar-flow'); // Modes: horizontal, sidebar-flow, list, table
const tableSortKey = ref('length');
const tableSortOrder = ref(-1); // -1 for descending, 1 for ascending
const selectedTablePath = ref(null);
const showPathTable = ref(true);
const panelPosition = ref('right'); // 'right' or 'bottom'

// Sidebar state
const sidebarExpanded = ref(false);
const showPresets = ref(false);

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
const detailsPanelWidth = ref(320);
const detailsPanelHeight = ref(350);
const isResizing = ref(false);

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
    { label: "Example 1", query: 'MATCH TRAIL p = (x)-[((Likes.HasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3' },
    { label: "Example 4", query: 'MATCH TRAIL p = (x)-[(Knows|Likes)]->(y) RETURN y' },
    { label: "Debug Example", query: 'MATCH TRAIL p = (x)-[(Likes.HasCreator)*|c]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3'},
    { label: "Paper Example", query: 'MATCH TRAIL p = (x)-[(Knows|Likes.HasCreator)+]->(y) WHERE x.name= "Moe" RETURN y.name LIMIT 3'}
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
    
    // Safety check: node can be null if clicking background
    if (!node) return;

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
    
    // Check for specialized operator nodes
    if (label.includes("⋈")) { // JOIN
        performOperatorEnrichment(node, 'join');
    } else if (label.includes("∪")) { // UNION
        performOperatorEnrichment(node, 'union');
    } else if (label.includes("Φ")) { // RECURSIVE / KLEENE
        performOperatorEnrichment(node, 'recursive');
    } else if (label.includes("Paths₁") || label.includes("Paths₀") || label.startsWith("σ")) {
        // Collect all filters in this sub-tree to allow nested/chained filters
        const filters = collectSubtreeFilters(node.id);
        performSearch(node, filters);
    }
}

/**
 * Performs specialized enrichment for complex operators
 */
const performOperatorEnrichment = async (node, operatorType) => {
    if (node.apiResults || isLoading.value) return;

    isLoading.value = true;
    try {
        const { loginToken, sessionToken } = props.session;
        let searchParams = null;
        let insight = "";

        if (searchParams) {
             // ... existing code ...
        }

        // Logic for Dynamic Query execution (Join/Union/Recursive)
        if (operatorType === 'join' || operatorType === 'union' || operatorType === 'recursive') {
            const query = generateSubtreeQuery(node, operatorType);
            console.log("Executed Sub-Query:", query);
            if (!query) {
                console.warn("Could not generate query for node", node);
                return;
            }

            const result = await api.executeQuery(query, loginToken, sessionToken);
            console.log("Endpoint Response:", result);

            
            if (result.success && result.data) {
                // Assuming result.data contains strings of paths or objects representing paths
                // We need to parse them into our table format
                // API usually returns [ {content: headers}, {content: row1}, ... ] or similar for raw queries
                // But executeQuery returns what the backend provides.
                // Let's assume result.data is an array of strings like "PathString" or objects { p: "PathString" }
                
                // Inspect first item to determine format
                // If it follows standard executeQuery format (data[0] is headers)
                let paths = [];


                
                if (Array.isArray(result.data)) {
                    let rawData = result.data;

                    // 1. Detect and remove Header if present
                    // Common headers: "p", "path", "ID Camino", or {content: ["p"]}
                    const first = rawData[0];
                    let isHeader = false;

                    const getFirstContent = (item) => {
                        if (item && item.content && Array.isArray(item.content)) return item.content[0];
                        if (Array.isArray(item)) return item[0];
                        return item;
                    }

                    const firstVal = getFirstContent(first);
                    if (typeof firstVal === 'string' && 
                       (firstVal === 'p' || firstVal.toLowerCase() === 'path' || firstVal.includes('ID Camino'))) {
                        isHeader = true;
                    }

                    if (isHeader) {
                        rawData = rawData.slice(1);
                    }

                    // 2. Extract path content
                    paths = rawData.map(item => getFirstContent(item));


                }

                const joinedPaths = paths.map((pathItem, index) => {
                    let segments = [];
                    let rawStr = "";
                    let parsedObj = null;

                    // Helper to map raw backend items to our segment format
                    const mapBackendItemToSegment = (item) => {
                        // Determine if node or edge
                        // Edge usually has source/target or distinct keys
                        if (item.source || item.target || item.dir) {
                             return {
                                 type: 'edge',
                                 label: item.label,
                                 id: item.id,
                                 direction: item.dir === 'T' || item.dir === true ? '->' : '<-',
                                 properties: item, // Keep raw props
                             };
                        } else {
                             return {
                                 type: 'node',
                                 label: item.label,
                                 id: item.id,
                                 properties: item
                             };
                        }
                    };

                    try {
                        // Case 1: pathItem is already an object
                        if (typeof pathItem === 'object' && pathItem !== null) {
                            parsedObj = pathItem;
                        } else {
                            // Case 2: String
                            rawStr = String(pathItem);
                             if (rawStr.trim().startsWith('{') || rawStr.trim().startsWith('[')) {
                                 parsedObj = JSON.parse(rawStr);
                             }
                        }

                        if (parsedObj) {
                             // Check for "content" (User format) or "segments"
                             const rawSegments = parsedObj.content || parsedObj.segments;
                             if (Array.isArray(rawSegments)) {
                                 segments = rawSegments.map(mapBackendItemToSegment);
                             }
                        }
                        
                        // Fallback if no segments found yet
                        if (segments.length === 0 && rawStr) {
                             segments = parsePathString(rawStr);
                        }

                    } catch (e) {
                         console.error("Error parsing path item:", e);
                         // Fallback
                         if (rawStr) segments = parsePathString(rawStr);
                    }

                    return {
                        "Path ID": `P${index + 1}`,
                        segments: segments
                    };
                });
                
                // Identify restrictor for insight
                const restrictorMatch = node.label.match(/(⋈|Φ)\s+(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
                const restrictor = restrictorMatch ? restrictorMatch[2].toUpperCase() : "WALK";

                insight = `Executed Sub-Query: \`${query}\`. Showing resultant paths ensuring ${restrictor} semantics.`;

                const formatted = formatDataForTable(joinedPaths);
                node.apiResults = {
                    success: true,
                    insight: insight,
                    data: formatted
                };
            }
            return;
        }

    } catch (e) {
        console.error(`${operatorType} enrichment failed:`, e);
    } finally {
        isLoading.value = false;
    }
}

const generateSubtreeQuery = (node, type) => {
    // 1. Get Restrictor
    const restrictorMatch = node.label.match(/(⋈|Φ)\s+(TRAIL|SIMPLE|ACYCLIC|WALK)/i);
    const restrictor = restrictorMatch ? restrictorMatch[2].toUpperCase() : ""; // Default might be empty or WALK
    
    // 2. Identify Path Pattern
    // Simple Heuristic: Look at children to find labels
    let pathPattern = "";
    
    if (type === 'join' || type === 'recursive') {
        const children = treeData.value.edges
            .filter(e => e.from === node.id)
            .map(e => treeData.value.nodes.find(n => n.id === e.to));
            
        const labels = [];
        const traverseForLabel = (n) => {
            if (!n) return;
            const labelMatch = n.label.match(/label\((?:node|edge)\(\d+\)\)\s*=\s*(\w+)/);
            if (labelMatch) labels.push(labelMatch[1]);
             const childEdges = treeData.value.edges.filter(e => e.from === n.id);
             childEdges.forEach(ce => traverseForLabel(treeData.value.nodes.find(cn => cn.id === ce.to)));
        };
        
        children.forEach(c => traverseForLabel(c));
        
        if (type === 'join') {
            if (labels.length >= 2) {
                 pathPattern = `(x)-[${labels.join('.')}]->(y)`;
            } else {
                 pathPattern = `(x)-[${labels[0] || ""}...]->(y)`; 
            }
        } else {
            // Recursive (Φ)
            // Detect Kleene operator (* or +) from original query
            let kleene = "+"; // Default
            if (queryInput.value) {
                const kMatch = queryInput.value.match(/[\*\+]/);
                if (kMatch) kleene = kMatch[0];
            }
            
            const joinLabels = labels.length >= 2 ? labels.join('.') : (labels[0] || "");
            pathPattern = `(x)-[(${joinLabels})${kleene}]->(y)`;
        }
        
    } else if (type === 'union') {
         pathPattern = `(x)-[...]->(y)`; // Placeholder
    }

    if (!pathPattern) return null;

    // Use LIMIT to prevent huge results
    return `MATCH ${restrictor} p = ${pathPattern} RETURN p LIMIT 50`;
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
        
        // Match σ label(edge(1)) = hasCreator
        const labelSearch = labelText.match(/σ\s+label\((node|edge)\(\d+\)\)\s*=\s*([^\s]+)/);
        if (labelSearch) {
            filters.type = labelSearch[1];
            filters.label = labelSearch[2];
        } else {
            // Match σ node(1).name="Moe"
            const propSearch = labelText.match(/σ\s+(node|edge)\(\d+\)\.([^\s=]+)\s*=\s*["']?([^"']+)["']?/);
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
            const parsedItems = result.data.map(item => parseBackendString(item));

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
        console.error("Search failed:", e);
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
const hardcodedData = {
    // Paths₁(G) - All edges from database
    "Paths₁(G)": {
        success: true,
        message: "",
        data: [
            ["id", "label"], // Headers
            ["Edge_1", "knows"], // Path 1
            ["Edge_2", "likes"], // Path 2
            ["Edge_3", "hasCreator"], // Path 3
            ["Edge_4", "knows"], // Path 4
            ["Edge_5", "likes"], // Path 5
            ["Edge_334", "knows"], // Path 4
            ["Edge_224", "knows"], // Path 4
            ["Edge_1114", "knows"], // Path 4
            ["Edge_5554", "knows"], // Path 4
            ["Edge_444", "knows"], // Path 4
            ["Edge_334", "knows"], // Path 4
            ["Edge_11114", "knows"], // Path 4
            ["Edge_0034", "knows"], // Path 4
            ["Edge_064", "knows"], // Path 4
            ["Edge_884", "knows"], // Path 4
            ["Edge_334", "knows"], // Path 4
            ["Edge_1224", "knows"], // Path 4
            ["Edge_164", "knows"], // Path 4
            ["Edge_134", "knows"], // Path 4
            ["Edge_124", "knows"], // Path 4
            ["Edge_204", "knows"], // Path 4
            ["Edge_94", "knows"], // Path 4
            ["Edge_84", "knows"], // Path 4
            ["Edge_74", "knows"], // Path 4
            ["Edge_54", "knows"], // Path 4
            ["Edge_44", "knows"], // Path 4
            ["Edge_33", "knows"], // Path 4
            ["Edge_121", "knows"], // Path 4
            ["Edge_21", "knows"], // Path 4
            ["Edge_22", "knows"], // Path 4
        ]
    },
    // Paths₀(G) - Empty paths / Nodes only
    "Paths₀(G)": {
        success: true,
        message: "",
        data: [
            ["id", "type", "node_id"],
            ["Empty_1", "zero_length", "Person_1"],
            ["Empty_2", "zero_length", "Person_2"],
            ["Empty_3", "zero_length", "Person_3"]
        ]
    },
    // Selection nodes (σ)
    "σ": {
        success: true,
        message: "",
        data: [
            ["id", "label", "from", "to"],
            ["Edge_1", "likes", "Person_1", "Post_5"],
            ["Edge_3", "likes", "Post_5", "Person_3"]
        ]
    },
    // Join nodes (⋈)
    "⋈": {
        success: true,
        message: "",
        data: [
            ["path_id", "combined_label", "source", "target"],
            { 
                content: ["Path_1", "likes,hasCreator", "Person_1", "Person_3"],
                segments: [
                    { type: 'node', label: 'Person', id: 'Person_1', properties: { name: 'Moe', age: 40 } },
                    { type: 'edge', label: 'likes', id: 'Edge_1', direction: '->', properties: { since: '2020-01-01' } },
                    { type: 'node', label: 'Post', id: 'Post_5', properties: { title: 'Hello World' } },
                    { type: 'edge', label: 'hasCreator', id: 'Edge_3', direction: '->', properties: { weight: 0.9 } },
                    { type: 'node', label: 'Person', id: 'Person_3', properties: { name: 'Bart', age: 10 } }
                ]
            },
            {
                content: ["Path_2", "knows,likes", "Person_2", "Post_2"],
                segments: [
                    { type: 'node', label: 'Person', id: 'Person_2', properties: { name: 'Homer', job: 'Safety Inspector' } },
                    { type: 'edge', label: 'knows', id: 'Edge_2', direction: '->', properties: { since: '1989' } },
                    { type: 'node', label: 'Person', id: 'Person_4', properties: { name: 'Lisa', hobby: 'Saxophone' } },
                    { type: 'edge', label: 'likes', id: 'Edge_4', direction: '->', properties: { timestamp: '2023-01-01' } },
                    { type: 'node', label: 'Post', id: 'Post_2', properties: { text: 'Testing...' } }
                ]
            },
            { content: ["Path_3", "likes", "P5", "P1"], segments: [{type:'node', label:'Person', id:'P5'}, {type:'edge', label:'likes', id:'E5', direction:'->'}, {type:'node', label:'Person', id:'P1'}] },
            { content: ["Path_4", "knows", "P1", "P2"], segments: [{type:'node', label:'Person', id:'P1'}, {type:'edge', label:'knows', id:'E1', direction:'->'}, {type:'node', label:'Person', id:'P2'}] },
            { content: ["Path_5", "likes", "P3", "P4"], segments: [{type:'node', label:'Person', id:'P3'}, {type:'edge', label:'likes', id:'E3', direction:'->'}, {type:'node', label:'Person', id:'P4'}] },
            { content: ["Path_6", "knows", "P2", "P5"], segments: [{type:'node', label:'Person', id:'P2'}, {type:'edge', label:'knows', id:'E2', direction:'->'}, {type:'node', label:'Person', id:'P5'}] },
            { content: ["Path_7", "likes", "P4", "P1"], segments: [{type:'node', label:'Person', id:'P4'}, {type:'edge', label:'likes', id:'E4', direction:'->'}, {type:'node', label:'Person', id:'P1'}] },
            { content: ["Path_8", "knows", "P5", "P3"], segments: [{type:'node', label:'Person', id:'P5'}, {type:'edge', label:'knows', id:'E6', direction:'->'}, {type:'node', label:'Person', id:'P3'}] },
            { content: ["Path_9", "likes", "P1", "P3"], segments: [{type:'node', label:'Person', id:'P1'}, {type:'edge', label:'likes', id:'E7', direction:'->'}, {type:'node', label:'Person', id:'P3'}] },
            { content: ["Path_10", "knows", "P2", "P4"], segments: [{type:'node', label:'Person', id:'P2'}, {type:'edge', label:'knows', id:'E8', direction:'->'}, {type:'node', label:'Person', id:'P4'}] },
            { content: ["Path_11", "likes", "P4", "P2"], segments: [{type:'node', label:'Person', id:'P4'}, {type:'edge', label:'likes', id:'E9', direction:'->'}, {type:'node', label:'Person', id:'P2'}] },
            { content: ["Path_12", "knows", "P3", "P1"], segments: [{type:'node', label:'Person', id:'P3'}, {type:'edge', label:'knows', id:'E10', direction:'->'}, {type:'node', label:'Person', id:'P1'}] },
            { content: ["Path_13", "likes", "P5", "P4"], segments: [{type:'node', label:'Person', id:'P5'}, {type:'edge', label:'likes', id:'E11', direction:'->'}, {type:'node', label:'Person', id:'P4'}] },
            { content: ["Path_14", "knows", "P1", "P5"], segments: [{type:'node', label:'Person', id:'P1'}, {type:'edge', label:'knows', id:'E12', direction:'->'}, {type:'node', label:'Person', id:'P5'}] },
            { content: ["Path_15", "likes", "P2", "P3"], segments: [{type:'node', label:'Person', id:'P2'}, {type:'edge', label:'likes', id:'E13', direction:'->'}, {type:'node', label:'Person', id:'P3'}] }
        ]
    },
    // Union nodes (∪)
    "∪": {
        success: true,
        message: "",
        data: [
            ["id", "label", "from", "to"],
            ["Edge_1", "knows", "Person_1", "Person_2"],
            ["Edge_2", "likes", "Person_1", "Post_5"],
            ["Edge_4", "knows", "Person_2", "Person_4"],
            ["Edge_5", "likes", "Person_3", "Post_1"]
        ]
    },
    // Projection nodes (π)
    "π": {
        success: true,
        message: "",
        data: [
            ["result"], // Header
            ["y.name = 'Alice'"], // Path 1
            ["y.name = 'Bob'"], // Path 2
            ["y.name = 'Charlie'"] // Path 3
        ]
    },
    // Path Semantics (Φ)
    "Φ": {
        success: true,
        message: "",
        data: [
            ["id", "label", "from", "to"],
            ["Trail_1", "coauthor,coauthor", "Person_1", "Person_3"],
            ["Trail_2", "coauthor,coauthor,coauthor,coauthor", "Person_2", "Person_5"]
        ]
    },
    // Default fallback
    "default": {
        success: false,
        message: "No data available",
        data: []
    }
};

// Computed property to get data for current selected node
const currentNodeData = computed(() => {
    if (!selectedNode.value) return { headers: [], rows: [] };
    
    // If the node has its own result data (populated during runQuery for the root or intermediate nodes)
    if (selectedNode.value.apiResults) {
        const res = selectedNode.value.apiResults;
        if (res.data && res.data.length > 0) {
            return {
                headers: res.data[0].content, // In executeQuery response, it's an array of objects with content
                rows: res.data.slice(1).map(item => item.content),
                data: res.data.slice(1), // Raw data objects containing segments
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

    const label = selectedNode.value.label.split('\n')[0];
    
    let responseData = null;
    
    // Check for exact matches first
    if (hardcodedData[label]) {
        responseData = hardcodedData[label];
    } else {
        // Check for partial matches (e.g., "σ\nlabel=likes" matches "σ")
        for (const key in hardcodedData) {
            if (label.includes(key) && key !== 'default') {
                responseData = hardcodedData[key];
                break;
            }
        }
    }
    
    // Fallback to default
    if (!responseData) {
        responseData = hardcodedData.default;
    }
    
    // Extract headers and rows from backend format
    if (responseData.data && responseData.data.length > 0) {
        return {
            headers: responseData.data[0], // Index 0 = headers
            rows: responseData.data.slice(1).map(item => Array.isArray(item) ? item : item.content), // Index 1..n = solutions
            data: responseData.data.slice(1).map(item => Array.isArray(item) ? { content: item } : item),
            message: responseData.message,
            success: responseData.success
        };
    }
    
    return { headers: [], rows: [], message: responseData.message, success: responseData.success };
});

// Computed property for path table data
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

// Computed property for sorted path table data
const sortedPathTableData = computed(() => {
    const data = [...pathTableData.value];
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

const setTableSort = (key) => {
    if (tableSortKey.value === key) {
        tableSortOrder.value *= -1;
    } else {
        tableSortKey.value = key;
        tableSortOrder.value = 1;
    }
};

const selectRowFromTable = (row) => {
    selectedTablePath.value = row;
    selectedPathElement.value = null; // Reset element selection when switching paths
    showPathTable.value = false; // Auto-collapse table on selection
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

const runQuery = async () => {
    if (!queryInput.value.trim()) return;

    isLoading.value = true;
    selectedNode.value = null; 
    
    try {
        const { loginToken, sessionToken } = props.session;

        // 1. Fetch live results
     
        const queryResults = await api.executeQuery(queryInput.value, loginToken, sessionToken);

        // 2. Fetch logical or raw plan tree based on mode
        let plan;
        if (treeMode.value === 'logical') {
            plan = await api.getQueryTree(queryInput.value, loginToken, sessionToken);
         
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
            rootNode.apiResults = queryResults;
        }

        treeData.value = transformedTree;

        nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
        });
    } catch (e) {
        console.error("Query execution error:", e);
        // Fallback or show error
        treeData.value = { 
            nodes: [{ id: 1, label: "Error", color: { background: '#fee2e2' }, properties: { Error: e.message } }], 
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
        queryRestrictor = restrictorMatch[1].toUpperCase();
    }

    // Helper to convert number to superscript
    const toSuperscript = (num) => {
        const sups = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
        return String(num).split('').map(d => sups[d] || d).join('');
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
        let color = "#f8fafc";
        const props = {
            Name: node.name,
            Details: node.details
        };

        // Handle expansion of SelectionByLabel[Label(X) (Leaf)]
        if (node.name === 'SelectionByLabel' && details.includes('(Leaf)')) {
            // Extract the label name, e.g., "Label(likes)" -> "likes"
            const labelMatch = details.match(/Label\(([^)]+)\)/);
            const extractedLabel = labelMatch ? labelMatch[1] : "unknown";
            
            // 1. Create the Selection node (σ)
            const selectionLabel = `σ label(edge(1)) = ${extractedLabel}`;
            nodes.push({ 
                id, 
                label: selectionLabel, 
                color: { background: "#f0fdf4" }, // Light Green
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
                color: { background: "#f8fafc" },
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
                color = "#b8cade"; // Light Blue
                label = `Φ ${queryRestrictor}`;
            } else if (lowName.includes('join')) {
                color = "#fefce8"; // Light Yellow
                label = `⋈ ${queryRestrictor}`;
            } else if (lowName.includes('selection')) {
                color = "#f0fdf4"; // Light Green
                let condition = details || "";

                // Parse pattern [property = value] into property="value"
                const bracketMatch = condition.match(/\[(\w+)\s*=\s*(.*?)\]/);
                if (bracketMatch) {
                    const prop = bracketMatch[1];
                    let val = bracketMatch[2].trim();
                    // Ensure quotes around the value if they're not there
                    if (!val.startsWith('"') && !val.startsWith("'")) {
                        val = `"${val}"`;
                    }
                    condition = condition.replace(bracketMatch[0], `${prop}=${val}`);
                }
                
                // Format condition: prepend node(1). if missing
                if (condition && !condition.startsWith('node(') && !condition.startsWith('edge(') && !condition.startsWith('label(')) {
                    condition = `node(1).${condition}`;
                }
                label = `σ ${condition}`;
            } else if (lowName.includes('union')) {
                color = "#ffffff";
                label = `∪ ${queryRestrictor}`;
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

        const formattedExprs = returnExprs.map(expr => `node(len()+1).${expr}`).join(' AND ');
        const projectionLabel = `π${limitSuperscript} ${formattedExprs}`;

        const rootId = idCounter++;
        nodes.push({
            id: rootId,
            label: projectionLabel,
            color: { background: "#eff6ff" }, // Blue
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
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-secondary);
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
    font-size: 0.75rem;
    color: #3b82f6;
    font-weight: 600;
    margin-bottom: 0.25rem;
    text-transform: uppercase;
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

.toggle-chevron-btn:hover {
    background-color: var(--bg-primary);
    color: #3b82f6;
    border-color: #3b82f6;
}

/* Inspector Card Redesign - Theme Aware */
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
</style>
