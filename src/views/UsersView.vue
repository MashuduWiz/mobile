<template>
    <ion-page>
      <ion-header class="ion-no-border">
        <ion-toolbar class="main-toolbar">
          <ion-buttons slot="start">
            <ion-button @click="goBack" class="back-button">
              <ion-icon :icon="arrowBackOutline" slot="icon-only"></ion-icon>
              <span>Dashboard</span>
            </ion-button>
          </ion-buttons>
          <ion-title>User Management</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <ion-grid>
          <ion-row>
            <ion-col size="12">
              <ion-card>
                <ion-card-header>
                  <div class="header-with-actions">
                    <div>
                      <ion-card-title>System Users</ion-card-title>
                      <ion-card-subtitle>Manage users and permissions</ion-card-subtitle>
                    </div>
                    <ion-button @click="showAddUserModal = true">
                      <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
                      Add User
                    </ion-button>
                  </div>
                </ion-card-header>
                <ion-card-content>
                  <ion-searchbar
                    v-model="searchQuery"
                    placeholder="Search users..."
                    @ionChange="filterUsers"
                  ></ion-searchbar>
  
                  <div class="role-filter">
                    <ion-segment v-model="roleFilter" @ionChange="filterUsers">
                      <ion-segment-button value="all">
                        <ion-label>All</ion-label>
                      </ion-segment-button>
                      <ion-segment-button value="admin">
                        <ion-label>Admin</ion-label>
                      </ion-segment-button>
                      <ion-segment-button value="manager">
                        <ion-label>Manager</ion-label>
                      </ion-segment-button>
                      <ion-segment-button value="user">
                        <ion-label>User</ion-label>
                      </ion-segment-button>
                    </ion-segment>
                  </div>
  
                  <ion-list>
                    <ion-item v-for="user in filteredUsers" :key="user.id">
                      <ion-avatar slot="start">
                        <img :src="user.avatar || '/assets/default-avatar.png'" alt="User avatar" />
                      </ion-avatar>
                      <ion-label>
                        <h2>{{ user.firstName }} {{ user.lastName }}</h2>
                        <p>{{ user.email }}</p>
                      </ion-label>
                      <ion-badge :color="getRoleColor(user.role)">{{ user.role }}</ion-badge>
                      <ion-buttons slot="end">
                        <ion-button @click="editUser(user)">
                          <ion-icon :icon="createOutline" slot="icon-only"></ion-icon>
                        </ion-button>
                        <ion-button @click="confirmDeleteUser(user.id)" :disabled="user.id === '1'">
                          <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                        </ion-button>
                      </ion-buttons>
                    </ion-item>
                    <ion-item v-if="filteredUsers.length === 0">
                      <ion-label>No users found</ion-label>
                    </ion-item>
                  </ion-list>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
  
        <!-- Add/Edit User Modal -->
        <ion-modal :is-open="showAddUserModal" @didDismiss="showAddUserModal = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>{{ isEditing ? 'Edit User' : 'Add New User' }}</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="showAddUserModal = false">
                  <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <form @submit.prevent="saveUser">
              <ion-grid>
                <ion-row>
                  <ion-col size="12" size-md="6">
                    <ion-item>
                      <ion-label position="floating">First Name</ion-label>
                      <ion-input v-model="newUser.firstName" required></ion-input>
                    </ion-item>
                  </ion-col>
                  <ion-col size="12" size-md="6">
                    <ion-item>
                      <ion-label position="floating">Last Name</ion-label>
                      <ion-input v-model="newUser.lastName" required></ion-input>
                    </ion-item>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="12">
                    <ion-item>
                      <ion-label position="floating">Email</ion-label>
                      <ion-input v-model="newUser.email" type="email" required></ion-input>
                    </ion-item>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="12" size-md="6">
                    <ion-item>
                      <ion-label position="floating">Password</ion-label>
                      <ion-input 
                        v-model="newUser.password" 
                        type="password" 
                        :required="!isEditing"
                        :placeholder="isEditing ? 'Leave blank to keep current' : 'Enter new password'"
                      ></ion-input>
                    </ion-item>
                  </ion-col>
                  <ion-col size="12" size-md="6">
                    <ion-item>
                      <ion-label position="floating">Company</ion-label>
                      <ion-input v-model="newUser.company" required></ion-input>
                    </ion-item>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="12">
                    <ion-item>
                      <ion-label>Role</ion-label>
                      <ion-select v-model="newUser.role" interface="popover">
                        <ion-select-option value="admin">Admin</ion-select-option>
                        <ion-select-option value="manager">Manager</ion-select-option>
                        <ion-select-option value="user">User</ion-select-option>
                      </ion-select>
                    </ion-item>
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col size="12">
                    <ion-button type="submit" expand="block">
                      {{ isEditing ? 'Update User' : 'Add User' }}
                    </ion-button>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </form>
          </ion-content>
        </ion-modal>
  
        <!-- Delete Confirmation Alert -->
        <ion-alert
          :is-open="showDeleteAlert"
          header="Confirm Delete"
          message="Are you sure you want to delete this user?"
          :buttons="[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                showDeleteAlert = false;
              },
            },
            {
              text: 'Delete',
              handler: () => {
                deleteUser();
              },
            },
          ]"
        ></ion-alert>
  
        <!-- Toast for notifications -->
        <ion-toast
          :is-open="showToast"
          :message="toastMessage"
          :duration="3000"
          @didDismiss="showToast = false"
        ></ion-toast>
      </ion-content>
    </ion-page>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    // IonBackButton,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonSearchbar,
    IonBadge,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonAlert,
    IonToast,
    IonGrid,
    IonRow,
    IonCol,
    IonSegment,
    IonSegmentButton,
    IonAvatar,
  } from '@ionic/vue';
  import {
    personAddOutline,
    closeOutline,
    createOutline,
    trashOutline,
    arrowBackOutline,
  } from 'ionicons/icons';
  import { useRouter } from 'vue-router';
  
  interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    company: string;
    avatar?: string;
  }
  
  const searchQuery = ref('');
  const roleFilter = ref('all');
  const showAddUserModal = ref(false);
  const showDeleteAlert = ref(false);
  const showToast = ref(false);
  const toastMessage = ref('');
  const isEditing = ref(false);
  const selectedUserId = ref('');
  
  const router = useRouter();
  
  // Sample users data - would come from database in real app
  const users = ref<User[]>([
    {
      id: '1',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      role: 'admin',
      company: 'Example Inc.',
      avatar: '/assets/avatars/admin.png',
    },
    {
      id: '2',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'manager',
      company: 'Example Inc.',
      avatar: '/assets/avatars/user1.png',
    },
    {
      id: '3',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'user',
      company: 'Example Inc.',
      avatar: '/assets/avatars/user2.png',
    },
    {
      id: '4',
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert@example.com',
      role: 'manager',
      company: 'Example Inc.',
      avatar: '/assets/avatars/user3.png',
    },
    {
      id: '5',
      firstName: 'Emily',
      lastName: 'Williams',
      email: 'emily@example.com',
      role: 'user',
      company: 'Example Inc.',
      avatar: '/assets/avatars/user4.png',
    },
  ]);
  
  const newUser = ref<Omit<User, 'id'> & { password: string }>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'user',
    company: 'Example Inc.',
    password: '',
  });
  
  const filteredUsers = computed(() => {
    let filtered = [...users.value];
    
    // Filter by role if not "all"
    if (roleFilter.value !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter.value);
    }
    
    // Filter by search query
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.role.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  });
  
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'manager':
        return 'warning';
      case 'user':
        return 'success';
      default:
        return 'medium';
    }
  };
  
  const filterUsers = () => {
    // Already handled by computed property
    console.log('Filtering users with:', searchQuery.value, roleFilter.value);
  };
  
  const editUser = (user: User) => {
    isEditing.value = true;
    selectedUserId.value = user.id;
    newUser.value = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      company: user.company,
      password: '', // Empty password field for editing
    };
    showAddUserModal.value = true;
  };
  
  const saveUser = () => {
    if (isEditing.value) {
      // Update existing user
      const index = users.value.findIndex(user => user.id === selectedUserId.value);
      if (index !== -1) {
        // Don't update password if it's blank (editing mode)
        const updatedUser = {
          ...users.value[index],
          firstName: newUser.value.firstName,
          lastName: newUser.value.lastName,
          email: newUser.value.email,
          role: newUser.value.role,
          company: newUser.value.company,
        };
        users.value[index] = updatedUser;
        toastMessage.value = 'User updated successfully';
      }
    } else {
      // Add new user
      const newId = (parseInt(users.value[users.value.length - 1]?.id || '0') + 1).toString();
      users.value.push({
        id: newId,
        firstName: newUser.value.firstName,
        lastName: newUser.value.lastName,
        email: newUser.value.email,
        role: newUser.value.role,
        company: newUser.value.company,
      });
      toastMessage.value = 'User added successfully';
    }
  
    // Reset form and show toast
    resetForm();
    showToast.value = true;
  };
  
  const confirmDeleteUser = (id: string) => {
    selectedUserId.value = id;
    showDeleteAlert.value = true;
  };
  
  const deleteUser = () => {
    users.value = users.value.filter(user => user.id !== selectedUserId.value);
    showDeleteAlert.value = false;
    toastMessage.value = 'User deleted successfully';
    showToast.value = true;
  };
  
  const resetForm = () => {
    newUser.value = {
      firstName: '',
      lastName: '',
      email: '',
      role: 'user',
      company: 'Example Inc.',
      password: '',
    };
    isEditing.value = false;
    selectedUserId.value = '';
    showAddUserModal.value = false;
  };
  
  const goBack = () => {
    router.push('/dashboard');
  };
  
  onMounted(() => {
    // In a real app, you would fetch users data from your database here
    console.log('Users component mounted');
  });
  </script>
  
  <style scoped>
  .header-with-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .role-filter {
    margin: 1rem 0;
  }
  
  .main-toolbar {
    --background: white;
    --color: #333;
    --border-color: transparent;
    --border-width: 0;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  ion-content {
    --background: #f8f9fa;
  }
  
  ion-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    margin: 1rem;
  }
  
  ion-button {
    --border-radius: 8px;
  }
  
  .back-button {
    display: flex;
    align-items: center;
  }
  
  .back-button span {
    margin-left: 4px;
  }
  </style>