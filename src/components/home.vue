<template>
  <div class="app-container">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      
      <!-- Sidebar header -->
      <div class="sidebar-header">
          <div class="header-content">
              <div class="logo-container">
                
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
                <!-- User Info -->
                <div v-if="session" class="user-session">
                    <i data-lucide="user" class="icon-tiny"></i>
                    <span>{{ session.user }}</span>
                </div>
                
                <!-- Theme Toggle -->
                <button class="action-btn" @click="$emit('toggle-theme')" :title="theme === 'light' ? 'Dark Mode' : 'Light Mode'">
                    <i :data-lucide="theme === 'light' ? 'moon' : 'sun'" class="icon-small"></i>
                </button>

                <!-- Logout -->
                <button class="action-btn logout-btn" @click="$emit('logout')" title="Logout">
                    <i data-lucide="log-out" class="icon-small"></i>
                </button>

                <span class="badge">
                    PathDB
                </span>
            </div>
        </header>

                    <!-- Export Tree Button
                <div v-if="treeData" class="panel-header-actions">
                    <button @click="triggerExport" class="export-btn" title="Export as PNG">
                        <i data-lucide="download" class="icon-tiny"></i>
                        Export Tree
                    </button>
                </div> -->

            
        <div class="content-area">
            


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
                    <QueryTree ref="treeRef" :treeData="treeData" @node-select="handleNodeSelect" />
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
                         <div class="object-value">{{ selectedNode.label.split('\n')[1] || '' }}</div>
                     </div>

                     <!-- Data Content -->
                     <div v-if="currentNodeData.rows && currentNodeData.rows.length > 0">
                        <h3 class="data-title">
                            <i data-lucide="database" class="icon-tiny"></i>
                            Query Results <span class="data-count">({{ currentNodeData.rows.length }} results)</span>
                        </h3>
                        
                        <!-- Table Display -->
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
                            
                            <!-- Rows (Paths) -->
                            <div class="table-body">
                                <div v-for="(row, rowIdx) in currentNodeData.rows" :key="rowIdx" 
                                     class="table-row data-row">

                                    <div class="row-content">
                                        <div v-for="(cell, cellIdx) in row" :key="cellIdx" 
                                             class="table-cell" 
                                             :title="cell">
                                            {{ cell }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Status Message -->
                        <div v-if="currentNodeData.message" class="status-message">
                            <i data-lucide="check-circle" class="status-icon"></i>
                            {{ currentNodeData.message }}
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

const props = defineProps(['session', 'theme']);
const emit = defineEmits(['node-select', 'logout', 'toggle-theme']);

const queryInput = ref('MATCH TRAIL p = (x)-[((likes.hasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3');
const isLoading = ref(false);
const treeData = ref(null);
const selectedNode = ref(null);
const treeRef = ref(null);

const triggerExport = () => {
    if (treeRef.value) {
        treeRef.value.downloadImage();
    }
}

const presets = [
    { label: "Example 1", query: 'MATCH TRAIL p = (x)-[((likes.hasCreator)+)]->(y) WHERE x.name = "Moe" RETURN y.name LIMIT 3' },
    { label: "Example 2", query: 'MATCH SIMPLE p = (a)-[coauthor*]->(b) WHERE a.name = "Alice" RETURN p' },
    { label: "Example 4", query: 'MATCH TRAIL p = (x)-[(knows|likes)]->(y) RETURN y' }
];

const loadPreset = (preset) => {
    queryInput.value = preset.query;
}

const handleNodeSelect = (node) => {
    selectedNode.value = node;
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
            ["Path_1", "likes,hasCreator", "Person_1", "Person_3"],
            ["Path_2", "likes,hasCreator", "Person_2", "Person_4"],
            ["Path_3", "likes,hasCreator", "Person_5", "Person_1"]
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
            rows: responseData.data.slice(1), // Index 1..n = solutions
            message: responseData.message,
            success: responseData.success
        };
    }
    
    return { headers: [], rows: [], message: responseData.message, success: responseData.success };
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
    // More flexible regex to handle spaces: - [ expr ] ->
    const pathMatch = query.match(/-\s*\[([\s\S]+?)\]\s*->/);
    
    // Check for Kleene operators (+ or *) in the expression
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


    // Handle Optional: ?
    if (expr.endsWith('?')) {
        const inner = expr.slice(0, -1);
        const unionId = addNode("∪\nUnion", "op", { Operation: "Union" });
        addEdge(parentId, unionId);
        
        // Left: Paths0(G)
        const paths0Id = addNode("Paths₀(G)", "scan", { Source: "Database", Type: "Empty Path Scan" });
        addEdge(unionId, paths0Id);
        
        // Right: Inner expression
        parseExpression(inner, unionId, addNode, addEdge, mode);
        return;
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
    width: 20rem; /* w-80 */
    flex-shrink: 0;
    background-color: var(--bg-primary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
    z-index: 10;
}

.sidebar-header {
    padding: 1.5rem; /* p-6 */
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-secondary);
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
    background-color: var(--bg-secondary);
    height: 4rem; /* h-16 */
    border-bottom: 1px solid var(--border-color);
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

.panel-header-actions {
    display: flex;
    align-items: center;
    height: 50px;
    width: 50px;
}
.visualization-panel {
    flex: 1;
    position: relative;
    background-color: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
}

.tree-wrapper {
    width: 100%;
    height: 100%;
    background-color: var(--bg-secondary);
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

/* Details Panel */
.details-panel {
    width: 20rem; /* w-80 */
    background-color: var(--bg-primary);
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border-color);
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
    font-size: 12px;
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
    align-items: center;
    gap: 0.5rem;
}   
</style>

