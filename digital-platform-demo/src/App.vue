<template>
  <router-view />
</template>

<script setup lang="ts">
// No specific script needed here for now if App.vue only renders router-view
</script>

<style>
/* Ensure html and body take full height */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}
</style>
