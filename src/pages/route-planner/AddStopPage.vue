<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/route-planner"></ion-back-button>
        </ion-buttons>
        <ion-title>Add New Stop</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="add-stop-container">
        <ion-list>
          <ion-item>
            <ion-label position="stacked">Stop Name</ion-label>
            <ion-input v-model="stopName" placeholder="Enter stop name"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Address</ion-label>
            <ion-input v-model="address" placeholder="Enter address"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Contact Person</ion-label>
            <ion-input v-model="contactPerson" placeholder="Enter contact person"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Phone Number</ion-label>
            <ion-input v-model="phoneNumber" type="tel" placeholder="Enter phone number"></ion-input>
          </ion-item>

          <ion-item>
            <ion-label position="stacked">Notes</ion-label>
            <ion-textarea v-model="notes" placeholder="Enter any additional notes"></ion-textarea>
          </ion-item>
        </ion-list>

        <div class="button-container">
          <ion-button expand="block" @click="saveStop">Save Stop</ion-button>
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
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonButton
} from '@ionic/vue';

export default defineComponent({
  name: 'AddStopPage',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonButton
  },
  setup() {
    const router = useRouter();
    const stopName = ref('');
    const address = ref('');
    const contactPerson = ref('');
    const phoneNumber = ref('');
    const notes = ref('');

    const saveStop = () => {
      // TODO: Implement save logic
      router.back();
    };

    return {
      stopName,
      address,
      contactPerson,
      phoneNumber,
      notes,
      saveStop
    };
  }
});
</script>

<style scoped>
.add-stop-container {
  padding: 1rem;
}

.button-container {
  margin-top: 2rem;
  padding: 0 1rem;
}
</style> 