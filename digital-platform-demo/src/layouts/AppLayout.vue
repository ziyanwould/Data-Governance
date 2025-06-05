<template>
  <el-container class="app-layout">
    <el-header class="app-header">
      数转数据平台演示
    </el-header>
    <el-container>
      <el-aside width="200px" class="app-sidebar">
        <el-menu :router="true" default-active="/dashboard">
          <el-menu-item index="/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>综合数据驾驶舱</span>
          </el-menu-item>
          <el-menu-item index="/data-access">
            <el-icon><Upload /></el-icon>
            <span>多源数据接入</span>
          </el-menu-item>
          <el-menu-item index="/data-aggregation">
            <el-icon><Operation /></el-icon>
            <span>数据聚合引擎</span>
          </el-menu-item>
          <el-menu-item index="/data-quality">
            <el-icon><CircleCheck /></el-icon>
            <span>自动化检测</span>
          </el-menu-item>
          <el-menu-item index="/data-cleansing">
            <el-icon><Filter /></el-icon>
            <span>数据清洗规则</span>
          </el-menu-item>
          <el-menu-item index="/metadata-management">
            <el-icon><Document /></el-icon>
            <span>元数据管理</span>
          </el-menu-item>
          <el-menu-item index="/data-api">
            <el-icon><Share /></el-icon>
            <span>数据API服务</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="app-main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { HomeFilled, Upload, Operation, CircleCheck, Filter, Document, Share } from '@element-plus/icons-vue';
</script>

<style scoped>
.app-layout {
  height: 100vh;
}
.app-header {
  background-color: #409EFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  line-height: 60px;
}
.app-sidebar {
  background-color: #f4f6f8; // Lighter gray for sidebar
  border-right: 1px solid #e0e0e0;
}
.app-sidebar .el-menu {
  border-right: none; /* Remove default border from el-menu */
}
.app-sidebar .el-menu-item.is-active {
  background-color: #d9ecff; /* Element Plus primary light color */
  color: #409EFF;
}
.app-sidebar .el-menu-item:hover {
  background-color: #ecf5ff;
}
.app-main {
  padding: 20px;
  background-color: #ffffff; // White background for main content
}
</style>
