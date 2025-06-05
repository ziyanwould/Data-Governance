<template>
  <div class="page-container data-aggregation-view">
    <h1 class="page-title">数据聚合引擎</h1>

    <el-row :gutter="20">
      <!-- Column 1: Configuration -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>聚合配置</span>
            </div>
          </template>

          <!-- Data Source Selection -->
          <section class="config-section">
            <h3>1. 选择数据源 (模拟)</h3>
            <el-select v-model="selectedSources" multiple filterable placeholder="请选择要聚合的数据源" style="width: 100%;">
              <el-option
                v-for="item in availableSources"
                :key="item.id"
                :label="item.name"
                :value="item.id">
              </el-option>
            </el-select>
          </section>

          <!-- Field Mapping Rules -->
          <section class="config-section">
            <h3>2. 定义字段映射规则</h3>
            <div v-for="(rule, index) in mappingRules" :key="index" class="mapping-rule-item">
              <el-row :gutter="10" align="middle">
                <el-col :span="8">
                  <el-input v-model="rule.sourceField" placeholder="源字段 (例如：user_id)"></el-input>
                </el-col>
                <el-col :span="2" style="text-align: center;">→</el-col>
                <el-col :span="8">
                  <el-input v-model="rule.targetField" placeholder="目标字段 (例如：UserID)"></el-input>
                </el-col>
                <el-col :span="6">
                  <el-select v-model="rule.transformation" placeholder="转换规则(可选)" clearable>
                    <el-option label="无转换" value="none"></el-option>
                    <el-option label="转大写" value="uppercase"></el-option>
                    <el-option label="转小写" value="lowercase"></el-option>
                  </el-select>
                </el-col>
              </el-row>
              <el-button type="danger" :icon="Delete" circle @click="removeMappingRule(index)" class="remove-rule-btn"></el-button>
            </div>
            <el-button type="primary" plain @click="addMappingRule" :icon="Plus">添加映射规则</el-button>
          </section>

          <!-- Deduplication Strategy -->
          <section class="config-section">
            <h3>3. 选择去重机制</h3>
            <el-radio-group v-model="deduplicationStrategy">
              <el-radio label="none">不去重</el-radio>
              <el-radio label="keyField">基于关键字段</el-radio>
              <el-radio label="smart">智能去重 (概念)</el-radio>
            </el-radio-group>
            <el-input
              v-if="deduplicationStrategy === 'keyField'"
              v-model="deduplicationKeyField"
              placeholder="请输入去重关键字段 (例如：UserID)"
              style="margin-top: 10px;"
            ></el-input>
          </section>

        </el-card>
      </el-col>

      <!-- Column 2: Actions and Results -->
      <el-col :span="12">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>执行与结果</span>
            </div>
          </template>

          <el-button
            type="success"
            @click="runAggregation"
            :loading="isAggregating"
            size="large"
            style="width: 100%; margin-bottom: 20px;"
            :icon="VideoPlay"
          >
            {{ isAggregating ? '聚合中...' : '运行聚合引擎' }}
          </el-button>

          <div v-if="aggregationResult" class="results-section">
            <h3>聚合结果概要</h3>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="处理状态">
                <el-tag :type="aggregationResult.status === 'success' ? 'success' : 'danger'">
                  {{ aggregationResult.message }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="已选数据源数量">{{ aggregationResult.sourcesSelected }}</el-descriptions-item>
              <el-descriptions-item label="处理记录总数 (模拟)">{{ aggregationResult.recordsProcessed }}</el-descriptions-item>
              <el-descriptions-item label="去重数量 (模拟)">{{ aggregationResult.duplicatesRemoved }}</el-descriptions-item>
              <el-descriptions-item label="存入数据仓库数量 (模拟)">{{ aggregationResult.recordsSaved }}</el-descriptions-item>
              <el-descriptions-item label="开始时间">{{ aggregationResult.startTime }}</el-descriptions-item>
              <el-descriptions-item label="结束时间">{{ aggregationResult.endTime }}</el-descriptions-item>
              <el-descriptions-item label="耗时">{{ aggregationResult.duration }} ms</el-descriptions-item>
            </el-descriptions>
          </div>
           <div v-else-if="!isAggregating" class="el-alert el-alert--info is-light" style="margin-top: 20px;">
            <div class="el-alert__content">
              <p class="el-alert__description">请配置聚合任务并点击上方按钮开始执行。</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, VideoPlay } from '@element-plus/icons-vue';

// --- Mock Data ---
interface DataSource {
  id: string;
  name: string;
  type: 'api' | 'db' | 'file';
}
const availableSources = ref<DataSource[]>([
  { id: 'api-001', name: '客户订单API', type: 'api' },
  { id: 'db-main', name: '产品主数据库 (MySQL)', type: 'db' },
  { id: 'file-sales-csv', name: '区域销售数据 (CSV)', type: 'file' },
  { id: 'api-legacy', name: '旧版库存API', type: 'api' },
]);

// --- Component State ---
const selectedSources = ref<string[]>([]);

interface MappingRule {
  sourceField: string;
  targetField: string;
  transformation: 'none' | 'uppercase' | 'lowercase' | '';
}
const mappingRules = reactive<MappingRule[]>([
  { sourceField: 'customer_id', targetField: 'CustomerID', transformation: 'none' },
  { sourceField: 'order_date', targetField: 'OrderDate', transformation: 'none' },
]);

const deduplicationStrategy = ref<'none' | 'keyField' | 'smart'>('none');
const deduplicationKeyField = ref('');

const isAggregating = ref(false);

interface AggregationResult {
  status: 'success' | 'error';
  message: string;
  sourcesSelected: number;
  recordsProcessed: number;
  duplicatesRemoved: number;
  recordsSaved: number;
  startTime?: string;
  endTime?: string;
  duration?: number;
}
const aggregationResult = ref<AggregationResult | null>(null);

// --- Methods ---
const addMappingRule = () => {
  mappingRules.push({ sourceField: '', targetField: '', transformation: 'none' });
};

const removeMappingRule = (index: number) => {
  if (mappingRules.length > 1) {
    mappingRules.splice(index, 1);
  } else {
    ElMessage.warning('至少需要一个映射规则。');
  }
};

const runAggregation = async () => {
  if (selectedSources.value.length === 0) {
    ElMessage.error('请至少选择一个数据源。');
    return;
  }
  if (mappingRules.some(rule => !rule.sourceField || !rule.targetField)) {
    ElMessage.error('请确保所有映射规则都已填写源字段和目标字段。');
    return;
  }
  if (deduplicationStrategy.value === 'keyField' && !deduplicationKeyField.value) {
    ElMessage.error('选择基于关键字段去重时，请指定关键字段。');
    return;
  }

  isAggregating.value = true;
  aggregationResult.value = null; // Clear previous results
  const startTime = new Date();

  // Simulate aggregation process
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));

  const endTime = new Date();
  const success = Math.random() > 0.15; // 85% chance of success

  if (success) {
    const recordsProcessed = Math.floor(Math.random() * 5000) + 1000;
    let duplicatesRemoved = 0;
    if (deduplicationStrategy.value !== 'none') {
      duplicatesRemoved = Math.floor(Math.random() * (recordsProcessed / 4));
    }
    aggregationResult.value = {
      status: 'success',
      message: '数据聚合成功完成！',
      sourcesSelected: selectedSources.value.length,
      recordsProcessed,
      duplicatesRemoved,
      recordsSaved: recordsProcessed - duplicatesRemoved,
      startTime: startTime.toLocaleString(),
      endTime: endTime.toLocaleString(),
      duration: endTime.getTime() - startTime.getTime(),
    };
    ElMessage.success('数据聚合过程模拟完成！');
  } else {
    aggregationResult.value = {
      status: 'error',
      message: '数据聚合过程中发生错误 (模拟)。',
      sourcesSelected: selectedSources.value.length,
      recordsProcessed: 0,
      duplicatesRemoved: 0,
      recordsSaved: 0,
      startTime: startTime.toLocaleString(),
      endTime: endTime.toLocaleString(),
      duration: endTime.getTime() - startTime.getTime(),
    };
    ElMessage.error('聚合过程中发生错误 (模拟)。');
  }

  isAggregating.value = false;
};

</script>

<style scoped>
.data-aggregation-view {
  /* Component specific styles */
}
.config-section {
  margin-bottom: 25px;
}
.config-section h3 {
  font-size: 1.1em;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
.mapping-rule-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9fafc;
}
.mapping-rule-item .el-row {
  flex-grow: 1;
}
.remove-rule-btn {
  margin-left: 10px;
}
.results-section {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f8f9fa;
}
.results-section h3 {
   font-size: 1.2em;
   color: #303133;
   margin-bottom: 15px;
}
.card-header {
  font-weight: bold;
}
</style>
