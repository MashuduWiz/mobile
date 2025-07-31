<template>
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modelValue" class="modal-overlay" @click="closeOnOverlayClick && $emit('update:modelValue', false)">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>{{ title }}</h3>
              <button class="close-button" @click="$emit('update:modelValue', false)">&times;</button>
            </div>
            <div class="modal-body">
              <slot></slot>
            </div>
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </template>
  
  <script setup lang="ts">
  defineOptions({
    name: 'BaseModal'
  });

  defineProps<{
    modelValue: boolean;
    title: string;
    closeOnOverlayClick?: boolean;
  }>();
  
  defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
  }>();
  </script>
  
  <style scoped>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .modal-header h3 {
    margin: 0;
    color: #2c3e50;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }
  
  .modal-body {
    margin-bottom: 20px;
  }
  
  .modal-footer {
    border-top: 1px solid #eee;
    padding-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  
  /* Transition animations */
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  </style> 