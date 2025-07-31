<template>
    <div v-if="error" class="error-boundary">
      <h3>Something went wrong</h3>
      <p class="error-message">{{ error.message }}</p>
      <button @click="resetError" class="retry-button">Try Again</button>
    </div>
    <slot v-else></slot>
  </template>
  
  <script setup lang="ts">
  import { ref, onErrorCaptured } from 'vue';
  
  const error = ref<Error | null>(null);
  
  onErrorCaptured((err) => {
    error.value = err;
    return false; // Prevent error from propagating
  });
  
  const resetError = () => {
    error.value = null;
  };
  </script>
  
  <style scoped>
  .error-boundary {
    padding: 20px;
    margin: 20px;
    border: 1px solid #ffcdd2;
    border-radius: 4px;
    background-color: #ffebee;
    text-align: center;
  }
  
  .error-message {
    color: #c62828;
    margin: 10px 0;
  }
  
  .retry-button {
    padding: 8px 16px;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .retry-button:hover {
    background-color: #3aa876;
  }
  </style> 