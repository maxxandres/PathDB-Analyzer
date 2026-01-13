<template>
  <div class="h-screen w-screen flex overflow-hidden bg-gray-50">
    <!-- SIDEBAR -->
    <aside class="w-80 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10">
      
      <!-- Sidebar header -->
      <div class="p-6 border-b border-gray-100 bg-gray-50/50">
          <div class="flex items-center gap-3">
              <div class="bg-primary/10 p-2 rounded-lg">
                  <i data-lucide="network" class="text-primary w-6 h-6"></i>
              </div>
              <div>
                  <h1 class="font-bold text-gray-800 text-lg">PathDB Demo</h1>
                  <p class="text-xs text-gray-500">Query Tree Visualizer</p>
              </div>
          </div>
      </div>

      <!-- Form -->
      <div class="p-6 flex-1 overflow-y-auto space-y-6">
          <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i data-lucide="terminal" class="w-4 h-4 text-gray-400"></i>
                  PathDB Query
              </label>
              <div class="relative">
                  <textarea 
                      v-model="queryInput" 
                      class="w-full h-32 p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-700 focus:ring-2 focus:ring-primary outline-none resize-none"
                      placeholder="Enter your PathDB query here..."
                  ></textarea>
              </div>
          </div>
          
          <div class="space-y-2">
              <label class="text-sm font-semibold text-gray-700">Presets</label>
              <div class="grid grid-cols-1 gap-2">
                <button v-for="(q, i) in presets" :key="i" @click="loadPreset(q)" class="text-left text-xs p-2 rounded border border-gray-200 hover:bg-gray-50 hover:border-primary/30 transition-colors truncate">
                    {{ q.label }}
                </button>
              </div>
          </div>
      </div>

      <div class="p-6 border-t border-gray-200 bg-white">
          <button @click="runQuery" :disabled="isLoading"
              class="w-full bg-primary hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
              <i data-lucide="play" class="w-4 h-4 fill-current"></i>
              {{ isLoading ? 'Processing...' : 'Run Query' }}
          </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 flex flex-col relative bg-gray-50/50 overflow-hidden">
        <header class="bg-white h-16 border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10 flex-shrink-0">
            <div class="flex items-center gap-2 text-sm text-gray-500">
                <span>Visualization</span>
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
                <span class="font-medium text-gray-900">Query Tree</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    PathDB Core
                </span>
            </div>
        </header>

        <div class="flex-1 relative flex overflow-hidden">
            
            <!-- Visualization Area -->
            <div class="flex-1 relative bg-gray-100 border-r border-gray-200">
                <div v-if="!treeData" class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-0">
                    <div class="bg-white p-6 rounded-full shadow-sm mb-6 border border-gray-100">
                        <i data-lucide="tree-deciduous" class="w-12 h-12 text-gray-300"></i>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-800 mb-2">No Query Executed</h2>
                    <p class="text-gray-500 max-w-md">
                        Enter a PathDB query and run it to visualize the Query Tree Plan.
                    </p>
                </div>

                <div v-else class="w-full h-full bg-slate-50">
                    <QueryTree :treeData="treeData" @node-select="handleNodeSelect" />
                </div>
            </div>

            <!-- Right Details Panel -->
            <div class="w-80 bg-white flex flex-col border-l border-gray-200 shadow-xl z-20 transition-all duration-300 transform" 
                 :class="selectedNode ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full'">
                 
                 <div class="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                     <span class="text-xs font-bold uppercase tracking-wider text-gray-500">Object Viewer</span>
                     <button @click="selectedNode = null" class="text-gray-400 hover:text-gray-600">
                         <i data-lucide="x" class="w-4 h-4"></i>
                     </button>
                 </div>

                 <div v-if="selectedNode" class="flex-1 overflow-y-auto p-4">
                     <!-- Selected Object Header -->
                     <div class="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                         <div class="text-xs text-blue-500 font-semibold mb-1 uppercase">Selected Object</div>
                         <div class="text-lg font-bold text-gray-800 whitespace-pre-wrap font-mono">{{ selectedNode.label.split('\n')[0] }}</div>
                         <div class="text-xs text-gray-600 mt-1 font-mono">{{ selectedNode.label.split('\n')[1] || '' }}</div>
                     </div>

                     <!-- Data Content -->
                     <div v-if="currentNodeData.length > 0">
                        <h3 class="text-xs font-bold text-gray-900 uppercase mb-3 flex items-center gap-2">
                            <i data-lucide="database" class="w-3 h-3 text-gray-400"></i>
                            Data Content <span class="text-gray-400 font-normal">({{ currentNodeData.length }} items)</span>
                        </h3>
                        
                        <div class="space-y-2">
                            <div v-for="(item, idx) in currentNodeData" :key="idx" 
                                class="p-3 bg-white border border-gray-200 rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-default">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                    <span class="text-xs font-bold text-gray-700">{{ item.id }}</span>
                                </div>
                                <div class="text-[10px] text-gray-500 font-mono space-y-0.5">
                                    <div v-if="item.label">Label: {{ item.label }}</div>
                                    <div v-if="item.from">From: {{ item.from }}</div>
                                    <div v-if="item.to">To: {{ item.to }}</div>
                                </div>
                            </div>
                        </div>
                     </div>
                 </div>

                 <div v-else class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                     <i data-lucide="mouse-pointer-click" class="w-8 h-8 mb-2 opacity-50"></i>
                     <p class="text-sm">Select a node in the query tree to inspect its details and data.</p>
                 </div>
            </div>

        </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import QueryTree from './QueryTree.vue';

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
    const rootId = addNode(`π\n${returnClause}`, "root", { Operation: "Projection", Expression: returnClause });

    // 3. Parse WHERE (Selection)
    let currentParentId = rootId;
    const whereMatch = query.match(/WHERE\s+(.+?)(\s+RETURN|$)/i);
    if (whereMatch) {
        const whereClause = whereMatch[1].trim();
        const selectId = addNode(`σ\n${whereClause}`, "op", { Operation: "Selection", Condition: whereClause });
        addEdge(currentParentId, selectId);
        currentParentId = selectId;
    }

    // 4. Check if Kleene operators exist in the path expression
    const pathMatch = query.match(/-\s*\[(.+?)\]\s*->/);
    const hasKleeneOperator = pathMatch && (pathMatch[1].includes('+') || pathMatch[1].includes('*'));

    // 5. Only add Φ (Phi) node if Kleene operators are present
    if (hasKleeneOperator) {
        const modeId = addNode(`Φ\n${mode}`, "op", { Operation: "Path Semantics", Mode: mode });
        addEdge(currentParentId, modeId);
        currentParentId = modeId;
    }

    // 6. Parse Path Expression: (a)-[expr]->(b)
    if (pathMatch) {
        let expr = pathMatch[1].trim();
        parseExpression(expr, currentParentId, addNode, addEdge, mode);
    } else {
        const scanId = addNode("Paths(G)", "scan", { Source: "Database", Type: "Full Scan" });
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