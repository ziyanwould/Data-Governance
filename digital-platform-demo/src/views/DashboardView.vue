<template>
  <div class="page-container dashboard-view">
    <h1 class="page-title">综合数据驾驶舱</h1>

    <!-- Summary Cards -->
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6" v-for="card in summaryData" :key="card.title">
        <el-card shadow="hover">
          <div class="summary-card-content">
            <el-icon :size="40" class="card-icon" :color="card.color"><component :is="card.icon" /></el-icon>
            <div class="card-details">
              <div class="card-value">{{ card.value }}</div>
              <div class="card-title">{{ card.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="box-card chart-card">
          <template #header><div>数据源类型分布 (模拟)</div></template>
          <div ref="dataSourcePieChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="box-card chart-card">
          <template #header><div>数据量增长趋势 (模拟 TB)</div></template>
          <div ref="dataVolumeLineChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card class="box-card chart-card">
          <template #header><div>数据质量概览 (模拟平均分)</div></template>
          <div ref="dataQualityBarChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="box-card chart-card">
          <template #header><div>API发布状态 (模拟)</div></template>
          <div ref="apiStatusPieChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
            <el-card class="box-card">
                <template #header><div>近期平台操作日志 (模拟)</div></template>
                <el-table :data="mockActivityLog" stripe max-height="300">
                    <el-table-column prop="timestamp" label="时间" width="180"></el-table-column>
                    <el-table-column prop="user" label="操作人" width="120"></el-table-column>
                    <el-table-column prop="action" label="操作类型" width="150"></el-table-column>
                    <el-table-column prop="details" label="详情" :show-overflow-tooltip="true"></el-table-column>
                    <el-table-column prop="status" label="状态" width="100">
                        <template #default="scope">
                            <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">{{ scope.row.status }}</el-tag>
                        </template>
                    </el-table-column>
                </el-table>
            </el-card>
        </el-col>
    </el-row>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { PieChart, LineChart, BarChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, ToolboxComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { ElIcon } from 'element-plus';
import { Coin, Tickets, CircleCheck, Share, TrendCharts, DataLine, Cpu, Collection } from '@element-plus/icons-vue';


// Register ECharts components
echarts.use([
  TitleComponent, TooltipComponent, GridComponent, LegendComponent, ToolboxComponent,
  PieChart, LineChart, BarChart,
  CanvasRenderer
]);

// --- Refs for Chart Elements ---
const dataSourcePieChart = ref<HTMLElement | null>(null);
const dataVolumeLineChart = ref<HTMLElement | null>(null);
const dataQualityBarChart = ref<HTMLElement | null>(null);
const apiStatusPieChart = ref<HTMLElement | null>(null);

let pieChartInstance: echarts.ECharts | null = null;
let lineChartInstance: echarts.ECharts | null = null;
let barChartInstance: echarts.ECharts | null = null;
let apiPieInstance: echarts.ECharts | null = null;


// --- Mock Data ---
const summaryData = ref([
  { title: '已接入数据源', value: '78', icon: DataLine, color: '#409EFF' },
  { title: '已聚合数据表', value: '125', icon: Collection, color: '#67C23A' },
  { title: '数据质量检测总数', value: '1,280 次', icon: CircleCheck, color: '#E6A23C' },
  { title: '已发布API服务', value: '32', icon: Share, color: '#F56C6C' },
]);

const mockActivityLog = ref([
    { timestamp: '2023-10-27 10:05:00', user: '王五', action: '数据聚合', details: '聚合了客户订单API与产品主数据库', status: '成功' },
    { timestamp: '2023-10-27 09:30:00', user: '李四', action: '元数据更新', details: '更新了维度表_客户信息的字段描述', status: '成功' },
    { timestamp: '2023-10-27 09:15:00', user: '赵六', action: 'API发布', details: '发布了"产品实时库存"为API', status: '成功' },
    { timestamp: '2023-10-26 18:00:00', user: '张三', action: '数据清洗', details: '对客户信息表执行了缺失值填充规则', status: '成功' },
    { timestamp: '2023-10-26 17:30:00', user: '系统', action: '数据质量检测', details: '自动检测"聚合后订单数据"表，发现3个低风险问题', status: '成功' },
    { timestamp: '2023-10-26 15:00:00', user: '王五', action: '数据聚合', details: '聚合用户行为日志失败 - 源文件格式错误', status: '失败' },
]);


// --- ECharts Options ---
const dataSourcePieOptions: echarts.EChartsOption = {
  title: { text: '数据源构成', left: 'center', textStyle: { fontSize: 16 } },
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left', top: 'middle' },
  series: [{
    name: '数据源类型', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false, itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: true, formatter: '{b}: {c} ({d}%)' },
    emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' } },
    data: [
      { value: 45, name: 'API接口' }, { value: 23, name: '数据库直连' }, { value: 10, name: '文件上传' }
    ]
  }]
};

const dataVolumeLineOptions: echarts.EChartsOption = {
  title: { text: '平台总数据量趋势', left: 'center', textStyle: { fontSize: 16 } },
  tooltip: { trigger: 'axis' },
  legend: { data: ['数据量 (TB)'], top: 'bottom' },
  grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['2023-05', '2023-06', '2023-07', '2023-08', '2023-09', '2023-10'] },
  yAxis: { type: 'value', name: 'TB' },
  series: [{
    name: '数据量 (TB)', type: 'line', stack: 'Total', smooth: true, areaStyle: {},
    data: [12, 15, 22, 28, 35, 42]
  }]
};

const dataQualityBarOptions: echarts.EChartsOption = {
  title: { text: '关键维度平均质量分', left: 'center', textStyle: { fontSize: 16 } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['完整性', '准确性', '一致性', '唯一性', '时效性'], axisLabel: { interval: 0, rotate: 30 } },
  yAxis: { type: 'value', name: '平均分', min: 0, max: 100 },
  series: [{
    name: '质量评分', type: 'bar', barWidth: '60%', itemStyle: { color: '#67C23A' },
    data: [
        { value: 92, itemStyle: { color: '#5470C6'} },
        { value: 88, itemStyle: { color: '#91CC75'} },
        { value: 85, itemStyle: { color: '#FAC858'} },
        { value: 95, itemStyle: { color: '#EE6666'} },
        { value: 82, itemStyle: { color: '#73C0DE'} }
    ]
  }]
};

const apiStatusPieOptions: echarts.EChartsOption = {
  title: { text: 'API服务状态', left: 'center', textStyle: { fontSize: 16 } },
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left', top: 'middle' },
  series: [{
    name: 'API状态', type: 'pie', radius: '65%',
    data: [
      { value: 32, name: '已发布' }, { value: 8, name: '开发中' }, { value: 5, name: '待审批' }
    ],
    emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
  }]
};


// --- Chart Initialization ---
const initCharts = () => {
  if (dataSourcePieChart.value) {
    pieChartInstance = echarts.init(dataSourcePieChart.value);
    pieChartInstance.setOption(dataSourcePieOptions);
  }
  if (dataVolumeLineChart.value) {
    lineChartInstance = echarts.init(dataVolumeLineChart.value);
    lineChartInstance.setOption(dataVolumeLineOptions);
  }
  if (dataQualityBarChart.value) {
    barChartInstance = echarts.init(dataQualityBarChart.value);
    barChartInstance.setOption(dataQualityBarOptions);
  }
   if (apiStatusPieChart.value) {
    apiPieInstance = echarts.init(apiStatusPieChart.value);
    apiPieInstance.setOption(apiStatusPieOptions);
  }
};

const resizeCharts = () => {
  pieChartInstance?.resize();
  lineChartInstance?.resize();
  barChartInstance?.resize();
  apiPieInstance?.resize();
};

onMounted(() => {
  nextTick(() => { // Ensure DOM is ready
    initCharts();
  });
  window.addEventListener('resize', resizeCharts);
});

onBeforeUnmount(() => {
  pieChartInstance?.dispose();
  lineChartInstance?.dispose();
  barChartInstance?.dispose();
  apiPieInstance?.dispose();
  window.removeEventListener('resize', resizeCharts);
});

</script>

<style scoped>
.dashboard-view {
  /* Component specific styles */
}
.summary-cards .el-col {
  margin-bottom: 20px; /* Add space for smaller screens if cards wrap */
}
.summary-card-content {
  display: flex;
  align-items: center;
  padding: 10px; /* Adjust padding as needed */
}
.card-icon {
  margin-right: 15px;
}
.card-details {
  display: flex;
  flex-direction: column;
}
.card-value {
  font-size: 2em; /* Make value larger */
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}
.card-title {
  font-size: 0.9em;
  color: #606266;
}
.chart-card .el-card__body {
    padding: 0; /* ECharts will manage its own padding typically */
}
.chart-card .el-card__header div {
    font-weight: bold;
    font-size: 1.05em;
}

/* Ensure chart containers take up space before ECharts initializes */
.chart-card div[ref] {
  min-height: 350px;
}
</style>
