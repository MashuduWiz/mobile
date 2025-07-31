<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/route-planner"></ion-back-button>
        </ion-buttons>
        <ion-title>Stop Details</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleEdit">
            <ion-icon :icon="editMode ? checkmarkOutline : createOutline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="stop-details-container">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Stop Name</ion-label>
            <ion-input v-model="stopName" :disabled="!editMode"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Address</ion-label>
            <ion-input v-model="address" :disabled="!editMode"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Contact Person</ion-label>
            <ion-input v-model="contactPerson" :disabled="!editMode"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Phone Number</ion-label>
            <ion-input v-model="phoneNumber" type="tel" :disabled="!editMode"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-textarea v-model="notes" :disabled="!editMode"></ion-textarea>
          </ion-item>
        </ion-list>

        <div class="button-container" v-if="editMode">
          <ion-button expand="block" color="danger" @click="deleteStop">Delete Stop</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea
} from '@ionic/vue';
import { createOutline, checkmarkOutline } from 'ionicons/icons';

export default defineComponent({
  name: 'StopDetailsPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea
  },
  setup() {
    const router = useRouter();
    // const route = useRoute();
    const editMode = ref(false);
    
    const stopName = ref('');
    const address = ref('');
    const contactPerson = ref('');
    const phoneNumber = ref('');
    const notes = ref('');

    const toggleEdit = () => {
      if (editMode.value) {
        // TODO: Implement save logic
      }
      editMode.value = !editMode.value;
    };

    const deleteStop = () => {
      // TODO: Implement delete logic
      router.back();
    };

    return {
      editMode,
      stopName,
      address,
      contactPerson,
      phoneNumber,
      notes,
      toggleEdit,
      deleteStop,
      createOutline,
      checkmarkOutline
    };
  }
});
</script>

<style scoped>
.stop-details-container {
  padding: 1rem;
}

.button-container {
  margin-top: 2rem;
  padding: 0 1rem;
}
</style> 