<template>
  <div class="internet-indicator">
    <span class="light" :class="{ 'online': isOnline, 'offline': !isOnline }"
      :title="isOnline ? 'Online' : 'Offline'"></span>
  </div>
</template>

<script lang="ts">
export default {
  name: 'internet-indicator',
  data() {
    return {
      isOnline: navigator.onLine,
    };
  },
  created() {
    window.addEventListener('online', this.updateOnlineStatus);
    window.addEventListener('offline', this.updateOnlineStatus);
  },
  beforeDestroy() {
    window.removeEventListener('online', this.updateOnlineStatus);
    window.removeEventListener('offline', this.updateOnlineStatus);
  },
  methods: {
    updateOnlineStatus() {
      this.isOnline = navigator.onLine;
    },
  },
};
</script>

<style scoped>
.internet-indicator {
  display: inline-block;
}

.light {
  margin-top: 8px;
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: #ccc;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s ease;
}

.light.online {
  background-color: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.8);
}

.light.offline {
  background-color: #f44336;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.8);
}
</style>