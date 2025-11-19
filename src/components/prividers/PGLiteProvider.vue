<script setup lang="ts">
import { localDB } from '@/db/localDB';
import { providePGlite } from '@electric-sql/pglite-vue';

const providedDB = await localDB.init()

providePGlite(providedDB)
</script>

<template>
  <slot></slot>
</template>
