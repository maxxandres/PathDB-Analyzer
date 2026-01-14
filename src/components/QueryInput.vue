<template>
  <div class="query-input-wrapper">
    <!-- Capa visible con el highlight -->
    <div
      class="query-input-display"
      ref="displayRef"
      @click="focusInput"
    >
      <!-- Syntax highlighted tokens -->
      <span
        v-for="(token, idx) in tokens"
        :key="idx"
        :class="['token', `token-${token.type}`]"
      >
        {{ token.text }}
      </span>
      <!-- Ghost text suggestion (separate from tokens) -->
      <span v-if="currentSuggestion" class="token token-ghost">
        {{ currentSuggestion.suggestion }}
      </span>
    </div>

    <!-- Textarea real, transparente encima -->
    <textarea
      ref="inputRef"
      v-model="localQuery"
      class="query-input-hidden"
      spellcheck="false"
      @input="handleInput"
      @scroll="syncScroll"
      @keydown="handleKeydown"
      @click="updateCursorPosition"
    ></textarea>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { highlightRPQ } from '../utils/rpq-highlighter'
import { getAutocompleteSuggestion } from '../utils/rpq-autocomplete'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  schemaData: {
    type: Object,
    default: null
  }
})

//  un solo defineEmits
const emit = defineEmits(['update:modelValue', 'submit'])

const localQuery = ref(props.modelValue)
const inputRef = ref(null)
const displayRef = ref(null)
const cursorPosition = ref(0)
const currentSuggestion = ref(null)

const tokens = computed(() => highlightRPQ(localQuery.value))

// sincronizar si el padre cambia el v-model desde fuera
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== localQuery.value) {
      localQuery.value = newVal
      updateSuggestion()
    }
  }
)

function handleInput(e) {
  emit('update:modelValue', e.target.value)
  updateCursorPosition()
  updateSuggestion()
}

function updateCursorPosition() {
  if (inputRef.value) {
    cursorPosition.value = inputRef.value.selectionStart
  }
}

function updateSuggestion() {
  if (!inputRef.value) return
  
  const cursor = inputRef.value.selectionStart
  const suggestion = getAutocompleteSuggestion(
    localQuery.value,
    cursor,
    props.schemaData
  )
  
  currentSuggestion.value = suggestion
}

function acceptSuggestion() {
  if (!currentSuggestion.value || !inputRef.value) return
  
  const cursor = inputRef.value.selectionStart
  const suggestion = currentSuggestion.value.suggestion
  
  // Insert suggestion at cursor position
  const newQuery = localQuery.value.substring(0, cursor) + 
                   suggestion + 
                   localQuery.value.substring(cursor)
  
  localQuery.value = newQuery
  emit('update:modelValue', newQuery)
  
  // Clear current suggestion immediately
  currentSuggestion.value = null
  
  // Move cursor to end of inserted text and update suggestion
  nextTick(() => {
    if (!inputRef.value) return
    
    const newCursorPos = cursor + suggestion.length
    inputRef.value.setSelectionRange(newCursorPos, newCursorPos)
    inputRef.value.focus()
    
    // Update cursor position
    cursorPosition.value = newCursorPos
    
    // Generate next suggestion
    nextTick(() => {
      updateSuggestion()
    })
  })
}

function handleKeydown(e) {
  // Update cursor position on any key
  nextTick(() => {
    updateCursorPosition()
  })
  
  // Handle Enter for submit
  if (e.key === 'Enter') {
    e.preventDefault()
    submitQuery()
    return
  }
  
  // Handle Tab for autocomplete
  if (e.key === 'Tab' && currentSuggestion.value) {
    e.preventDefault()
    acceptSuggestion()
    return
  }
  
  // Handle Right Arrow at end of text
  if (e.key === 'ArrowRight' && currentSuggestion.value) {
    const cursor = inputRef.value.selectionStart
    if (cursor === localQuery.value.length) {
      e.preventDefault()
      acceptSuggestion()
      return
    }
  }
  
  // Update suggestion after key is processed
  nextTick(() => {
    updateSuggestion()
  })
}

function submitQuery() {
  emit('submit')
}

function syncScroll() {
  if (displayRef.value && inputRef.value) {
    displayRef.value.scrollLeft = inputRef.value.scrollLeft
    displayRef.value.scrollTop = inputRef.value.scrollTop
  }
}

function focusInput() {
  inputRef.value?.focus()
}

// Initialize suggestion on mount
watch(() => props.schemaData, () => {
  updateSuggestion()
}, { immediate: true })
</script>

<style scoped>
.query-input-wrapper {
  position: relative;
  width: 100%;
  height: 8rem; /* Matches h-32 */
}

/* Capa con highlight */
.query-input-display {
  position: absolute;
  inset: 0;
  padding: 10px 16px;
  border: 1px solid #334155; /* border-slate-700 */
  border-radius: 8px;
  font-size: 12px; /* text-xs */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: white;
  white-space: pre-wrap; /* Allow wrapping */
  overflow-y: auto;
  pointer-events: none;
  line-height: 1.5;
}

/* Textarea real, transparente encima */
.query-input-hidden {
  position: absolute;
  inset: 0;
  padding: 10px 16px;
  border: 1px solid transparent; /* Border match handled by display */
  border-radius: 8px;
  font-size: 12px; /* text-xs */
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  background: transparent;
  color: transparent;
  caret-color: #2563eb; /* Blue caret */
  white-space: pre-wrap; /* Allow wrapping */
  overflow-y: auto;
  resize: none;
  line-height: 1.5;
  outline: none;
}

.query-input-hidden::selection {
  background: rgba(94, 234, 212, 0.3);
}

/* Tokens */
.token-keyword { color: #D73A49; font-weight: 700; }
.token-variable { color: #6F42C1; font-weight: 600; }
.token-label { color: #005CC5; font-weight: 600; }
.token-property { color: #22863A; }
.token-string { color: #032F62; }
.token-number { color: #E36209; }
.token-operator { color: #D73A49; }
.token-arrow { color: #D73A49; font-weight: 700; }
.token-delimiter { color: #24292E; }
.token-comment { color: #6A737D; font-style: italic; }
.token-whitespace { color: transparent; }
.token-default { color: #24292E; }
.token-ghost { color: #9CA3AF; opacity: 0.6; }

</style>
