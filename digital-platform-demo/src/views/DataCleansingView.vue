<template>
  <div class="page-container data-cleansing-view">
    <h1 class="page-title">数据清洗规则定义与执行</h1>

    <el-row :gutter="20">
      <!-- Configuration Panel -->
      <el-col :span="10">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>清洗配置</span>
            </div>
          </template>

          <section class="config-section">
            <h3>1. 选择待清洗数据集 (模拟)</h3>
            <el-select v-model="selectedDatasetId" filterable placeholder="选择数据集" style="width: 100%;" @change="onDatasetChange">
              <el-option
                v-for="dataset in availableDatasets"
                :key="dataset.id"
                :label="dataset.name"
                :value="dataset.id">
              </el-option>
            </el-select>
          </section>

          <section class="config-section" v-if="selectedDataset">
            <h3>2. 定义清洗规则</h3>
            <div v-for="(rule, index) in cleansingRules" :key="rule.id" class="cleansing-rule-item">
              <el-form :model="rule" label-position="top">
                <el-row :gutter="10" align="middle">
                  <el-col :span="20">
                    <el-form-item label="规则类型" style="margin-bottom: 10px;">
                      <el-select v-model="rule.type" placeholder="选择规则类型" @change="onRuleTypeChange(rule)">
                        <el-option label="缺失值处理" value="missingValue"></el-option>
                        <el-option label="异常值处理" value="outlier"></el-option>
                        <el-option label="数据类型转换" value="typeConversion"></el-option>
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4" style="text-align: right;">
                     <el-button type="danger" :icon="Delete" circle @click="removeCleansingRule(index)" size="small"></el-button>
                  </el-col>
                </el-row>

                <el-form-item label="选择列" v-if="rule.type">
                  <el-select v-model="rule.column" placeholder="选择列" style="width:100%;">
                    <el-option v-for="col in selectedDataset.columns" :key="col.key" :label="col.name" :value="col.key"></el-option>
                  </el-select>
                </el-form-item>

                <!-- Missing Value Config -->
                <div v-if="rule.type === 'missingValue'">
                  <el-form-item label="处理方法">
                    <el-select v-model="rule.params.missingMethod" placeholder="选择处理方法">
                      <el-option label="填充为指定值" value="fill"></el-option>
                      <el-option label="填充为均值 (模拟)" value="mean"></el-option>
                      <el-option label="填充为中位数 (模拟)" value="median"></el-option>
                      <el-option label="删除含缺失值的行" value="deleteRow"></el-option>
                    </el-select>
                  </el-form-item>
                  <el-form-item label="指定值" v-if="rule.params.missingMethod === 'fill'">
                    <el-input v-model="rule.params.fillValue" placeholder="输入填充值"></el-input>
                  </el-form-item>
                </div>

                <!-- Outlier Config -->
                <div v-if="rule.type === 'outlier'">
                  <el-form-item label="处理方法">
                    <el-select v-model="rule.params.outlierMethod" placeholder="选择处理方法">
                      <el-option label="替换为阈值 (上下限)" value="cap"></el-option>
                      <el-option label="删除含异常值的行" value="deleteRow"></el-option>
                      <el-option label="标记为异常 (概念)" value="mark"></el-option>
                    </el-select>
                  </el-form-item>
                  <div v-if="rule.params.outlierMethod === 'cap'">
                    <el-form-item label="最小值阈值">
                      <el-input-number v-model="rule.params.lowerBound" placeholder="下限"></el-input-number>
                    </el-form-item>
                    <el-form-item label="最大值阈值">
                      <el-input-number v-model="rule.params.upperBound" placeholder="上限"></el-input-number>
                    </el-form-item>
                  </div>
                </div>

                <!-- Type Conversion Config -->
                <div v-if="rule.type === 'typeConversion'">
                  <el-form-item label="转换为目标类型">
                    <el-select v-model="rule.params.targetType" placeholder="选择目标类型">
                      <el-option label="字符串 (String)" value="string"></el-option>
                      <el-option label="数字 (Number)" value="number"></el-option>
                      <el-option label="日期 (Date) (模拟)" value="date"></el-option>
                      <el-option label="布尔值 (Boolean)" value="boolean"></el-option>
                    </el-select>
                  </el-form-item>
                </div>
              </el-form>
            </div>
            <el-button type="primary" plain @click="addCleansingRule" :icon="Plus" style="width: 100%; margin-top:10px;">添加清洗规则</el-button>
          </section>

          <el-button
            type="success"
            @click="applyCleansingRules"
            :loading="isCleansing"
            :disabled="!selectedDatasetId || cleansingRules.length === 0"
            style="width: 100%; margin-top: 20px;"
            :icon="MagicStick"
          >
            {{ isCleansing ? '清洗中...' : '应用清洗规则 (模拟)' }}
          </el-button>
        </el-card>
      </el-col>

      <!-- Results Panel -->
      <el-col :span="14">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>清洗结果预览 (模拟)</span>
            </div>
          </template>
          <div v-if="isCleansing" v-loading="isCleansing" element-loading-text="正在应用清洗规则并生成预览..." style="min-height: 200px;"></div>
          <div v-if="cleansingResult && !isCleansing">
            <el-alert type="success" :title="cleansingResult.message" show-icon :closable="false" style="margin-bottom: 15px;"></el-alert>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="已选数据集">{{ cleansingResult.datasetName }}</el-descriptions-item>
              <el-descriptions-item label="应用规则数">{{ cleansingResult.rulesAppliedCount }}</el-descriptions-item>
              <el-descriptions-item label="处理记录数 (模拟)">{{ cleansingResult.recordsProcessed }}</el-descriptions-item>
              <el-descriptions-item label="发现问题数 (模拟)">{{ cleansingResult.issuesFound }}</el-descriptions-item>
              <el-descriptions-item label="修正问题数 (模拟)">{{ cleansingResult.issuesCorrected }}</el-descriptions-item>
              <el-descriptions-item label="清洗耗时">{{ cleansingResult.duration }} ms</el-descriptions-item>
            </el-descriptions>

            <h4 style="margin-top: 20px; margin-bottom: 10px;">模拟数据抽样对比:</h4>
            <el-table :data="cleansingResult.sampleData" stripe border max-height="400">
                <el-table-column v-for="col in selectedDataset?.columns" :key="'sample-'+col.key" :prop="col.key" :label="col.name + (cleansingResult.highlightColumns?.includes(col.key) ? ' (有变化)' : '')">
                    <template #default="scope">
                        <span :class="{'original-value': scope.row[col.key + '_original'] !== undefined, 'changed-value': scope.row[col.key + '_original'] !== undefined && scope.row[col.key] !== scope.row[col.key + '_original'] }">
                            {{ scope.row[col.key] }}
                        </span>
                        <el-tooltip v-if="scope.row[col.key + '_original'] !== undefined && scope.row[col.key] !== scope.row[col.key + '_original']"
                            :content="'原始值: ' + scope.row[col.key + '_original']" placement="top">
                            <el-icon style="margin-left: 5px; color: #E6A23C;"><Warning /></el-icon>
                        </el-tooltip>
                    </template>
                </el-table-column>
            </el-table>
            <small>注：以上为模拟数据，实际变化取决于规则定义。高亮列表示该列有规则被应用。</small>
          </div>
          <el-empty v-else-if="!isCleansing && !cleansingResult" description="请先配置并应用清洗规则"></el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete, MagicStick, Warning } from '@element-plus/icons-vue';
import { v4 as uuidv4 } from 'uuid'; // For unique rule IDs

// --- Mock Data & Interfaces ---
interface DatasetColumn { key: string; name: string; type: 'string' | 'number' | 'date' | 'mixed'; }
interface Dataset {
  id: string;
  name: string;
  columns: DatasetColumn[];
  sampleRawData: Record<string, any>[]; // For simulating before/after
}

const availableDatasets = ref<Dataset[]>([
  {
    id: 'customer-data', name: '客户信息表 (含错误)',
    columns: [
      { key: 'id', name: '客户ID', type: 'string' },
      { key: 'name', name: '姓名', type: 'string' },
      { key: 'age', name: '年龄', type: 'mixed' }, // Mixed to show type conversion
      { key: 'email', name: '邮箱', type: 'string' },
      { key: 'revenue', name: '消费额', type: 'number' },
    ],
    sampleRawData: [
      { id: 'c001', name: '张三', age: '30', email: 'zhangsan@example.com', revenue: 1500 },
      { id: 'c002', name: '李四', age: null, email: 'lisi@example', revenue: -500 }, // Missing age, invalid email (no .com), outlier revenue
      { id: 'c003', name: '王五', age: '45', email: 'wangwu@example.com', revenue: 20000 }, // Outlier revenue
      { id: 'c004', name: '赵六', age: '28', email: null, revenue: 800 }, // Missing email
      { id: 'c005', name: '钱七', age: 'sixty', email: 'qian@qi.com', revenue: 1200 }, // Invalid age
    ]
  },
  {
    id: 'product-logs', name: '产品访问日志 (不规范)',
    columns: [
      { key: 'logId', name: '日志ID', type: 'string' },
      { key: 'productId', name: '产品ID', type: 'string' },
      { key: 'timestamp', name: '访问时间', type: 'mixed' },
      { key: 'userAction', name: '用户行为', type: 'string' },
      { key: 'quantity', name: '数量', type: 'number' },
    ],
    sampleRawData: [
      { logId: 'l001', productId: 'P123', timestamp: '2023-10-26 10:00:00', userAction: 'view', quantity: null },
      { logId: 'l002', productId: 'P456', timestamp: 1698200000000, userAction: 'purchase', quantity: 1 },
      { logId: 'l003', productId: 'P123', timestamp: 'Invalid Date', userAction: 'add_to_cart', quantity: 2 },
      { logId: 'l004', productId: null, timestamp: '2023-10-26 11:00:00', userAction: 'view', quantity: 1 },
      { logId: 'l005', productId: 'P789', timestamp: '2023-10-26 12:00:00', userAction: 'view', quantity: 99999 }, // Outlier
    ]
  },
]);

interface CleansingRule {
  id: string; // Unique ID for v-for key and manipulation
  type: 'missingValue' | 'outlier' | 'typeConversion' | '';
  column: string; // Column key
  params: any; // Rule-specific parameters
}

// --- Component State ---
const selectedDatasetId = ref<string | null>(null);
const cleansingRules = reactive<CleansingRule[]>([]);
const isCleansing = ref(false);

interface CleansingResult {
  datasetName: string;
  rulesAppliedCount: number;
  recordsProcessed: number;
  issuesFound: number;
  issuesCorrected: number;
  duration: number;
  message: string;
  sampleData: Record<string, any>[];
  highlightColumns: string[];
}
const cleansingResult = ref<CleansingResult | null>(null);

// --- Computed Properties ---
const selectedDataset = computed(() => {
  return availableDatasets.value.find(ds => ds.id === selectedDatasetId.value) || null;
});

// --- Methods ---
const onDatasetChange = () => {
  cleansingRules.splice(0, cleansingRules.length); // Clear existing rules
  cleansingResult.value = null; // Clear previous results
  addCleansingRule(); // Add one default rule
};

const createDefaultParams = (type: CleansingRule['type']) => {
  switch (type) {
    case 'missingValue': return { missingMethod: 'fill', fillValue: '' };
    case 'outlier': return { outlierMethod: 'cap', lowerBound: undefined, upperBound: undefined };
    case 'typeConversion': return { targetType: 'string' };
    default: return {};
  }
};

const addCleansingRule = () => {
  cleansingRules.push({
    id: uuidv4(),
    type: '',
    column: '',
    params: {},
  });
};

const removeCleansingRule = (index: number) => {
  cleansingRules.splice(index, 1);
};

const onRuleTypeChange = (rule: CleansingRule) => {
  rule.params = createDefaultParams(rule.type);
  // rule.column = ''; // Optionally reset column
};

const applyCleansingRules = async () => {
  if (!selectedDataset.value) {
    ElMessage.error('请先选择一个数据集。');
    return;
  }
  if (cleansingRules.length === 0) {
    ElMessage.error('请至少定义一个清洗规则。');
    return;
  }
  if (cleansingRules.some(rule => !rule.type || !rule.column)) {
    ElMessage.error('请确保所有规则都已选择类型和列。');
    return;
  }

  isCleansing.value = true;
  cleansingResult.value = null;
  const startTime = Date.now();

  // Simulate cleansing process
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  let issuesFound = 0;
  let issuesCorrected = 0;
  const processedSampleData: Record<string, any>[] = JSON.parse(JSON.stringify(selectedDataset.value.sampleRawData)); // Deep copy
  const highlightColumns: string[] = [];


  // Simulate applying rules to sample data
  processedSampleData.forEach(row => {
    cleansingRules.forEach(rule => {
      if (!rule.type || !rule.column) return;
      if (!highlightColumns.includes(rule.column)) highlightColumns.push(rule.column);

      const originalValue = row[rule.column];
      let changed = false;

      switch (rule.type) {
        case 'missingValue':
          if (originalValue === null || originalValue === undefined || originalValue === '') {
            issuesFound++;
            if (rule.params.missingMethod === 'fill') {
              row[rule.column] = rule.params.fillValue;
              changed = true;
            } else if (rule.params.missingMethod === 'deleteRow') {
              // In a real scenario, mark row for deletion. Here, just simulate.
              row[rule.column] = '<行标记为删除>';
              changed = true;
            } else if (rule.params.missingMethod === 'mean' || rule.params.missingMethod === 'median') {
              row[rule.column] = `<用${rule.params.missingMethod === 'mean' ? '均值':'中位数'}填充>`;
              changed = true;
            }
            if(changed) issuesCorrected++;
          }
          break;
        case 'outlier':
          // Simplified outlier detection & handling
          const val = parseFloat(originalValue);
          if (!isNaN(val)) {
             let isOutlier = false;
             if (rule.params.outlierMethod === 'cap') {
                if (rule.params.lowerBound !== undefined && val < rule.params.lowerBound) { isOutlier = true; row[rule.column] = rule.params.lowerBound; }
                if (rule.params.upperBound !== undefined && val > rule.params.upperBound) { isOutlier = true; row[rule.column] = rule.params.upperBound; }
             }
             if(isOutlier) {
                issuesFound++;
                issuesCorrected++;
                changed = true;
             }
          }
          break;
        case 'typeConversion':
          let convertedValue = originalValue;
          let conversionOk = false;
          try {
            switch (rule.params.targetType) {
              case 'string': convertedValue = String(originalValue); conversionOk = true; break;
              case 'number': convertedValue = Number(originalValue); if(isNaN(convertedValue)) convertedValue = '<转换数字失败>'; else conversionOk = true; break;
              case 'boolean': convertedValue = Boolean(originalValue); conversionOk = true; break;
              case 'date': convertedValue = originalValue ? `<模拟转日期: ${new Date(originalValue).toLocaleDateString()}>` : '<日期转换空>'; conversionOk = true; break;
            }
            if (String(originalValue) !== String(convertedValue) || typeof originalValue !== typeof convertedValue) {
                 // Only count as issue if original type was problematic or value changed significantly
                if(typeof originalValue !== rule.params.targetType && rule.params.targetType !== 'string') issuesFound++;
                changed = true;
            }
            if(changed && conversionOk) issuesCorrected++;
            row[rule.column] = convertedValue;

          } catch (e) {
            issuesFound++;
            row[rule.column] = '<转换失败>';
            changed = true;
          }
          break;
      }
      if (changed && row[rule.column + '_original'] === undefined) { // Store original only once
        row[rule.column + '_original'] = originalValue;
      }
    });
  });


  cleansingResult.value = {
    datasetName: selectedDataset.value.name,
    rulesAppliedCount: cleansingRules.length,
    recordsProcessed: selectedDataset.value.sampleRawData.length, // Simulating on sample size
    issuesFound, // Simulated
    issuesCorrected, // Simulated
    duration: Date.now() - startTime,
    message: '数据清洗规则已成功模拟应用！',
    sampleData: processedSampleData,
    highlightColumns,
  };

  isCleansing.value = false;
  ElMessage.success('数据清洗规则模拟应用完成！');
};

// Initialize with one rule if a dataset is pre-selected or becomes selected
if (selectedDataset.value && cleansingRules.length === 0) {
  addCleansingRule();
}

</script>

<style scoped>
.data-cleansing-view {
  /* Component specific styles */
}
.config-section {
  margin-bottom: 20px;
}
.config-section h3 {
  font-size: 1.1em;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}
.cleansing-rule-item {
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
  background-color: #fdfdfd;
}
.cleansing-rule-item .el-form-item {
  margin-bottom: 10px; /* Reduce margin for inner form items */
}
.card-header {
  font-weight: bold;
}
.original-value {
  /* Optionally style original values if you show them */
}
.changed-value {
  color: #E6A23C; /* Element Plus warning color */
  font-weight: bold;
}
.el-table .el-icon {
    vertical-align: middle;
}
</style>
