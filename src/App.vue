<script setup lang="ts">
import UserList from './components/UserList.vue';
import PGLiteProvider from './components/prividers/PGLiteProvider.vue';
</script>

<template>
  <Suspense>
    <PGLiteProvider>
      <UserList />
    </PGLiteProvider>
  </Suspense>
</template>

<style>
@import "tailwindcss";
</style>