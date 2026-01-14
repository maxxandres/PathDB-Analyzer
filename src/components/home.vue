<template>
  <div class="app-container">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      
      <!-- Sidebar header -->
      <div class="sidebar-header">
          <div class="header-content">
              <div class="logo-container">
                  <i data-lucide="network" class="icon-primary"></i>
              </div>
              <div>
                  <h1 class="app-title">PathDB Demo</h1>
                  <p class="app-subtitle">Query Tree Visualizer</p>
              </div>
          </div>
      </div>

      <!-- Form -->
      <div class="sidebar-form">
          <div class="form-group">
              <label class="form-label">
                  <i data-lucide="terminal" class="icon-small"></i>
                  PathDB Query
              </label>
              <div class="input-wrapper">
                  <QueryInput 
                      v-model="queryInput" 
                      class="query-input-component"
                      :schemaData="{}"
                  />
              </div>
          </div>
          
          <div class="form-group">
              <label class="form-label">Presets</label>
              <div class="presets-grid">
                <button v-for="(q, i) in presets" :key="i" @click="loadPreset(q)" class="preset-btn">
                    {{ q.label }}
                </button>
              </div>
          </div>
      </div>

      <div class="sidebar-footer">
          <button @click="runQuery" :disabled="isLoading" class="run-btn">
              <i data-lucide="play" class="btn-icon"></i>
              {{ isLoading ? 'Processing...' : 'Run Query' }}
          </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main-content">
        <header class="main-header">
            <div class="breadcrumbs">
                <span>Visualization</span>
                <i data-lucide="chevron-right" class="icon-tiny"></i>
                <span class="crumb-active">Query Tree</span>
            </div>
            <div class="header-actions">
                <span class="badge">
                    PathDB Core
                </span>
            </div>
        </header>

        <div class="content-area">
            
            <!-- Visualization Area -->
            <div class="visualization-panel">
                <div v-if="!treeData" class="empty-state">
                    <div class="empty-icon-wrapper">
                        <i data-lucide="tree-deciduous" class="empty-icon"></i>
                    </div>
                    <h2 class="empty-title">No Query Executed</h2>
                    <p class="empty-desc">
                        Enter a PathDB query and run it to visualize the Query Tree Plan.
                    </p>
                </div>

                <div v-else class="tree-wrapper">
                    <QueryTree :treeData="treeData" @node-select="handleNodeSelect" />
                </div>
            </div>

            <!-- Object Viewer -->
            <div class="details-panel" :class="{ 'details-open': selectedNode, 'details-closed': !selectedNode }">
                 
                 <div class="details-header">
                     <span class="details-title">Object Viewer</span>
                     <button @click="selectedNode = null" class="close-btn">
                         <i data-lucide="x" class="icon-small"></i>
                     </button>
                 </div>

                 <div v-if="selectedNode" class="details-content">
                     <!-- Selected Object Header -->
                     <div class="object-header">
                         <div class="object-label">Selected Object</div>
                         <div class="object-value">{{ selectedNode.label.split('\n')[0] }}</div>
                         <div class="object-sub">{{ selectedNode.label.split('\n')[1] || '' }}</div>
                     </div>

                     <!-- Data Content -->
                     <div v-if="currentNodeData.length > 0">
                        <h3 class="data-title">
                            <i data-lucide="database" class="icon-tiny"></i>
                            Data Content <span class="data-count">({{ currentNodeData.length }} items)</span>
                        </h3>
                        
                        <div class="data-list">
                            <div v-for="(item, idx) in currentNodeData" :key="idx" class="data-item">
                                <div class="item-header">
                                    <div class="status-dot"></div>
                                    <span class="item-id">{{ item.id }}</span>
                                </div>
                                <div class="item-details">
                                    <div v-if="item.label">Label: {{ item.label }}</div>
                                    <div v-if="item.from">From: {{ item.from }}</div>
                                    <div v-if="item.to">To: {{ item.to }}</div>
                                </div>
                            </div>
                        </div>
                     </div>
                 </div>

                 <div v-else class="empty-details">
                     <i data-lucide="mouse-pointer-click" class="empty-details-icon"></i>
                     <p class="empty-details-text">Select a node in the query tree to inspect its details and data.</p>
                 </div>
            </div>

        </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import QueryTree from './QueryTree.vue';
import QueryInput from './QueryInput.vue';

const queryInput = ref('MATCH TRAIL p = (x)-[((likes.hasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3');
const isLoading = ref(false);
const treeData = ref(null);
const selectedNode = ref(null);

const presets = [
    { label: "Example 1: Basic Trail (Moe)", query: 'MATCH TRAIL p = (x)-[((likes.hasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3' },
    { label: "Example 2: Simple Path (Co-author)", query: 'MATCH SIMPLE p = (a)-[coauthor*]->(b) WHERE a.name = "Alice" RETURN p' },
    { label: "Example 4: Union", query: 'MATCH TRAIL p = (x)-[(knows|likes)]->(y) RETURN y' }
];

const loadPreset = (preset) => {
    queryInput.value = preset.query;
}

const handleNodeSelect = (node) => {
    selectedNode.value = node;
}

// Hardcoded data structure - modify this JSON as needed
// This represents the data that would be shown for different algebra operations
const hardcodedData = {
    // Paths₁(G) - All edges from database
    "Paths₁(G)": [
        { id: "Edge_1", label: "knows", from: "Person_1", to: "Person_2" },
        { id: "Edge_2", label: "likes", from: "Person_1", to: "Post_5" },
        { id: "Edge_3", label: "hasCreator", from: "Post_5", to: "Person_3" },
        { id: "Edge_4", label: "knows", from: "Person_2", to: "Person_4" },
        { id: "Edge_5", label: "likes", from: "Person_3", to: "Post_1" }
    ],
    // Selection nodes (σ)
    "σ": [
        { id: "Edge_1", label: "likes", from: "Person_1", to: "Post_5" },
        { id: "Edge_3", label: "hasCreator", from: "Post_5", to: "Person_3" }
    ],
    // Join nodes (⋈)
    "⋈": [
        { id: "Path_1", label: "likes→hasCreator", from: "Person_1", to: "Person_3" },
        { id: "Path_2", label: "likes→hasCreator", from: "Person_2", to: "Person_4" },
        { id: "Path_3", label: "likes→hasCreator", from: "Person_5", to: "Person_1" }
    ],
    // Union nodes (∪)
    "∪": [
        { id: "Edge_1", label: "knows", from: "Person_1", to: "Person_2" },
        { id: "Edge_2", label: "likes", from: "Person_1", to: "Post_5" },
        { id: "Edge_4", label: "knows", from: "Person_2", to: "Person_4" },
        { id: "Edge_5", label: "likes", from: "Person_3", to: "Post_1" }
    ],
    // Projection nodes (π)
    "π": [
        { id: "Result_1", label: "y.name = 'Alice'" },
        { id: "Result_2", label: "y.name = 'Bob'" },
        { id: "Result_3", label: "y.name = 'Charlie'" }
    ],
    // Path Semantics (Φ)
    "Φ": [
        { id: "Trail_1", label: "trail_path", from: "Person_1", to: "Person_3" },
        { id: "Trail_2", label: "trail_path", from: "Person_2", to: "Person_5" }
    ],
    // Default fallback
    "default": []
};

// Computed property to get data for current selected node
const currentNodeData = computed(() => {
    if (!selectedNode.value) return [];
    
    const label = selectedNode.value.label.split('\n')[0];
    
    // Check for exact matches first
    if (hardcodedData[label]) {
        return hardcodedData[label];
    }
    
    // Check for partial matches (e.g., "σ\nlabel=likes" matches "σ")
    for (const key in hardcodedData) {
        if (label.includes(key) && key !== 'default') {
            return hardcodedData[key];
        }
    }
    
    return hardcodedData.default;
});


const runQuery = () => {
    isLoading.value = true;
    selectedNode.value = null; // Deselect on new run
    
    setTimeout(() => {
        try {
            treeData.value = parseQueryToTree(queryInput.value);
        } catch (e) {
            console.error("Parsing error", e);
            // Fallback
            treeData.value = generateMockTreeFallback(); 
        }
        
        isLoading.value = false;
        nextTick(() => {
            if (window.lucide) window.lucide.createIcons();
        });
    }, 600);
}

// Improved Regex-based Parser
const parseQueryToTree = (query) => {
    const nodes = [];
    const edges = [];
    let idCounter = 1;
    const addNode = (label, colorType, props = {}) => {
        const id = idCounter++;
        let bg = '#ffffff';
        if (colorType === 'root') bg = '#f0f9ff';
        if (colorType === 'op') bg = '#f8fafc';
        if (colorType === 'scan') bg = '#f0fdf4';
        
        nodes.push({ id, label, color: { background: bg }, properties: props });
        return id;
    };
    const addEdge = (from, to) => { edges.push({ from, to }); };

    // 1. Detect Mode
    let mode = "WALK"; // Default
    if (query.match(/MATCH\s+TRAIL/i)) mode = "TRAIL";
    if (query.match(/MATCH\s+SIMPLE/i)) mode = "SIMPLE";
    if (query.match(/MATCH\s+SHORTEST/i)) mode = "SHORTEST";
    if (query.match(/MATCH\s+ACYCLIC/i)) mode = "ACYCLIC";

    // 2. Parse RETURN (Root / Projection)
    const returnMatch = query.match(/RETURN\s+(.+?)($|LIMIT)/i);
    const returnClause = returnMatch ? returnMatch[1].trim() : " ";
    const rootId = addNode(`π ${returnClause}`, "root", { Operation: "Projection", Expression: returnClause });

    // 3. Parse WHERE (Selection)
    let currentParentId = rootId;
    const whereMatch = query.match(/WHERE\s+(.+?)(\s+RETURN|$)/i);
    if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        const selectId = addNode(`σ ${whereClause}`, "op", { Operation: "Selection", Condition: whereClause });
        addEdge(currentParentId, selectId);
        currentParentId = selectId;
    }

    // 4. Check if Kleene operators exist in the path expression
    const pathMatch = query.match(/-\s*\[(.+?)\]\s*->/);
    const hasKleeneOperator = pathMatch && (pathMatch[1].includes('+') || pathMatch[1].includes('*'));

    // 5. Only add Φ (Phi) node if Kleene operators are present
    if (hasKleeneOperator) {
        const modeId = addNode(`Φ ${mode}`, "op", { Operation: "Path Semantics", Mode: mode });
        addEdge(currentParentId, modeId);
        currentParentId = modeId;
    }

    // 6. Parse Path Expression: (a)-[expr]->(b)
    if (pathMatch) {
        let expr = pathMatch[1].trim();
        parseExpression(expr, currentParentId, addNode, addEdge, mode);
    } else {
        const scanId = addNode(`Paths(G)`, "scan", { Source: "Database", Type: "Full Scan" });
        addEdge(currentParentId, scanId);
    }

    return { nodes, edges };
}

// Recursive expression parser
const parseExpression = (expr, parentId, addNode, addEdge, mode) => {
    expr = expr.trim();
    
    // Remove outer parens if they wrap the whole expression: (A) -> A
    // Simple check: starts with ( and ends with )
    while (expr.startsWith('(') && expr.endsWith(')')) {
        // Need to check if balanced? For simple cases assuming yes.
        // A naive check: (A).(B) starts with ( and ends with ) but shouldn't strip.
        // We only strip if it is a single group. 
        // Heuristic: Check if stripping leaves balanced content? 
        // For this demo, we'll just check if there's a split at top level first.
        // Or simpler: handle operations (|, ., +) first. If none match, assume parens are wrapper.
        // Let's defer stripping to after checking ops, or be smarter.
        
        // Actually, for query ((likes.hasCreator)+), we need to strip outer to see +, then parens inside + to see .
        // Let's count parens balance to decide if safe to strip.
        let balance = 0;
        let safeToStrip = true;
        for (let i = 0; i < expr.length - 1; i++) {
             if (expr[i] === '(') balance++;
             if (expr[i] === ')') balance--;
             if (balance === 0) { safeToStrip = false; break; } // Closed before end
        }
        if (safeToStrip) {
            expr = expr.slice(1, -1).trim();
        } else {
            break; 
        }
    }

    // Handle Union: | (Lowest precedence)
    // Must find | at zero paren level
    let balance = 0;
    let splitIndex = -1;
    for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '(') balance++;
        else if (expr[i] === ')') balance--;
        else if (expr[i] === '|' && balance === 0) {
            splitIndex = i;
            break;
        }
    }

    if (splitIndex !== -1) {
        const left = expr.substring(0, splitIndex);
        const right = expr.substring(splitIndex + 1);
        const unionId = addNode("∪\nUnion", "op", { Operation: "Union" });
        addEdge(parentId, unionId);
        parseExpression(left, unionId, addNode, addEdge, mode);
        parseExpression(right, unionId, addNode, addEdge, mode);
        return;
    }

    // Handle Join: . (Higher precedence than |)
    splitIndex = -1;
    balance = 0;
    // Right-associative? A.B.C -> A . (B.C) or (A.B) . C
    for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '(') balance++;
        else if (expr[i] === ')') balance--;
        else if (expr[i] === '.' && balance === 0) {
            splitIndex = i;
            break;
        }
    }

    if (splitIndex !== -1) {
        const left = expr.substring(0, splitIndex);
        const right = expr.substring(splitIndex + 1);
        // Use Bowtie for join
        const joinId = addNode(`⋈\n${mode}`, "op", { Operation: "Join", Type: mode });
        addEdge(parentId, joinId);
        parseExpression(left, joinId, addNode, addEdge, mode);
        parseExpression(right, joinId, addNode, addEdge, mode);
        return;
    }

    // Handle Kleene: + or * (Highest precedence, postfix)
    // "Plus" node should not exist visually, we recursively parse inner content
    if ((expr.endsWith('+') || expr.endsWith('*')) && !expr.endsWith(')+')) {
         const inner = expr.slice(0, -1);
         parseExpression(inner, parentId, addNode, addEdge, mode);
         return;
    }
    // Handle (A)+ case where ) is before +
    if (expr.endsWith(')+') || expr.endsWith(')*')) {
         // Check if parens cover the whole things minus op
         let pBalance = 0;
         let allCovered = true;
         const content = expr.slice(0, -1); // remove op
         // check content is ( ... )
         if (content.startsWith('(') && content.endsWith(')')) {
             // Re-verify balance
              for (let i = 0; i < content.length - 1; i++) {
                 if (content[i] === '(') pBalance++;
                 if (content[i] === ')') pBalance--;
                 if (pBalance === 0) { allCovered = false; break; }
             }
         } else {
             allCovered = false;
         }

         if (allCovered) {
             const inner = content; 
             // Bypass node creation, just parse inner content attached to same parent
             parseExpression(inner, parentId, addNode, addEdge, mode);
             return; 
         }
    }


    // Base Case: Leaf (Label)
    const cleanLabel = expr.replace(/[()]/g, '');
    if (cleanLabel) {
        const sigmaId = addNode(`σ\nlabel=${cleanLabel}`, "op", { Predicate: `label=${cleanLabel}` });
        addEdge(parentId, sigmaId);
        
        const pathsId = addNode(`Paths₁(G)`, "scan", { Source: "Graph DB", Type: "Atomic Path Scan" });
        addEdge(sigmaId, pathsId);
    }
}
    
const generateMockTreeFallback = () => {
   // Legacy fallback if needed
   return { nodes: [{id:1, label: "Error Parsing"}], edges: [] };
}

onMounted(() => {
    if (window.lucide) window.lucide.createIcons();
});

</script>

<style scoped>
.app-container {
    height: 100vh;
    width: 100vw;
    display: flex;
    overflow: hidden;
    background-color: #f9fafb; /* gray-50 */
}

/* Sidebar */
.sidebar {
    width: 20rem; /* w-80 */
    flex-shrink: 0;
    background-color: white;
    border-right: 1px solid #e5e7eb; /* gray-200 */
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
    z-index: 10;
}

.sidebar-header {
    padding: 1.5rem; /* p-6 */
    border-bottom: 1px solid #f3f4f6; /* gray-100 */
    background-color: rgba(249, 250, 251, 0.5); /* bg-gray-50/50 */
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
    color: #2563eb; /* text-primary */
    width: 1.5rem;
    height: 1.5rem;
}

.app-title {
    font-weight: 700;
    color: #1f2937; /* text-gray-800 */
    font-size: 1.125rem; /* text-lg */
    margin: 0;
}

.app-subtitle {
    font-size: 0.75rem; /* text-xs */
    color: #6b7280; /* text-gray-500 */
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
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem; /* space-y-2 */
}

.form-label {
    font-size: 0.875rem; /* text-sm */
    font-weight: 600;
    color: #374151; /* text-gray-700 */
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.icon-small {
    width: 1rem;
    height: 1rem;
    color: #9ca3af; /* text-gray-400 */
}

.input-wrapper {
    position: relative;
}

.query-input {
    width: 100%;
    height: 8rem; /* h-32 */
    padding: 0.75rem;
    box-sizing: border-box;
    /* Updated styles (User Request): White bg, Blue text */
    background-color: #ffffff;
    color: #2563eb; 
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 0.75rem; /* text-xs */
    border-radius: 0.5rem;
    border: 1px solid #334155; /* border-slate-700 */
    outline: none;
    resize: none;
}

.query-input:focus {
    box-shadow: 0 0 0 2px #2563eb; /* focus:ring-2 ring-primary */
    border-color: transparent;
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
    border: 1px solid #e5e7eb;
    background-color: transparent;
    cursor: pointer;
    transition: background-color 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.preset-btn:hover {
    background-color: #f9fafb;
    border-color: rgba(37, 99, 235, 0.3);
}

/* Sidebar Footer */
.sidebar-footer {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    background-color: white;
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
    background-color: white;
    height: 4rem; /* h-16 */
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 2rem;
    padding-right: 2rem;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    z-index: 10;
    flex-shrink: 0;
}

.breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem; /* text-sm */
    color: #6b7280;
}

.crumb-active {
    font-weight: 500;
    color: #111827;
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
}

.visualization-panel {
    flex: 1;
    position: relative;
    background-color: #f3f4f6; /* bg-gray-100 */
    border-right: 1px solid #e5e7eb;
}

.tree-wrapper {
    width: 100%;
    height: 100%;
    background-color: #f8fafc; /* bg-slate-50 */
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
}

.empty-icon-wrapper {
    background-color: white;
    padding: 1.5rem;
    border-radius: 9999px;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    margin-bottom: 1.5rem;
    border: 1px solid #f3f4f6;
}

.empty-icon {
    width: 3rem;
    height: 3rem;
    color: #d1d5db; /* text-gray-300 */
}

.empty-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
}

.empty-desc {
    color: #6b7280;
    max-width: 28rem;
}

/* Details Panel */
.details-panel {
    width: 20rem; /* w-80 */
    background-color: white;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #e5e7eb;
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04);
    z-index: 20;
    transition: all 0.3s;
    transform: translateX(0);
}

.details-closed {
    transform: translateX(100%);
    position: absolute;
    right: 0;
    height: 100%;
}

.details-open {
    transform: translateX(0);
}

.details-header {
    padding: 1rem;
    border-bottom: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(249, 250, 251, 0.5);
}

.details-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
}

.close-btn {
    background: none;
    border: none;
    color: #9ca3af;
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
    background-color: #eff6ff; /* bg-blue-50 */
    border-radius: 0.75rem;
    border: 1px solid #dbeafe; /* border-blue-100 */
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
    color: #1f2937;
    white-space: pre-wrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.object-sub {
    font-size: 0.75rem;
    color: #4b5563;
    margin-top: 0.25rem;
    font-family: monospace;
}

.data-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #111827;
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
    background-color: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    cursor: default;
    transition: all 0.2s;
}

.data-item:hover {
    border-color: rgba(37, 99, 235, 0.5);
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
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
    color: #374151;
}

.item-details {
    font-size: 0.625rem;
    color: #6b7280;
    font-family: monospace;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
}

.empty-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
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
</style>