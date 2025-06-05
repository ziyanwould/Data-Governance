<template>
  <div class="page-container data-quality-view">
    <h1 class="page-title">自动化数据质量检测</h1>

    <el-row :gutter="20">
      <!-- Configuration Panel -->
      <el-col :span="8">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>检测配置</span>
            </div>
          </template>

          <section class="config-section">
            <h3>1. 选择数据集 (模拟数据仓库表)</h3>
            <el-select v-model="selectedDatasetId" filterable placeholder="请选择要检测的数据集" style="width: 100%;" @change="resetChecks">
              <el-option
                v-for="dataset in availableDatasets"
                :key="dataset.id"
                :label="dataset.name"
                :value="dataset.id">
              </el-option>
            </el-select>
          </section>

          <section class="config-section" v-if="selectedDatasetId">
            <h3>2. 选择质量检测规则</h3>
            <el-checkbox-group v-model="selectedChecks">
              <el-checkbox label="completeness" class="quality-check-checkbox">完整性检查 (空值检测)</el-checkbox>
              <el-checkbox label="accuracy" class="quality-check-checkbox">准确性检查 (数据类型、范围)</el-checkbox>
              <el-checkbox label="uniqueness" class="quality-check-checkbox">唯一性检查 (主键/唯一标识)</el-checkbox>
              <el-checkbox label="consistency" class="quality-check-checkbox">一致性检查 (关联数据模拟)</el-checkbox>
              <el-checkbox label="timeliness" class="quality-check-checkbox">时效性检查 (数据更新频率模拟)</el-checkbox>
            </el-checkbox-group>
          </section>

          <el-button
            type="primary"
            @click="runQualityChecks"
            :loading="isChecking"
            :disabled="!selectedDatasetId || selectedChecks.length === 0"
            style="width: 100%; margin-top: 20px;"
            :icon="Search"
          >
            {{ isChecking ? '检测中...' : '运行数据质量检测' }}
          </el-button>
        </el-card>
      </el-col>

      <!-- Results Panel -->
      <el-col :span="16">
        <el-card class="box-card">
          <template #header>
            <div class="card-header">
              <span>数据质量报告</span>
              <span v-if="qualityReport?.datasetName" style="font-size: 0.9em; color: #606266;"> - {{ qualityReport.datasetName }}</span>
            </div>
          </template>

          <div v-if="isChecking" v-loading="isChecking" element-loading-text="正在生成质量报告..." style="min-height: 200px;"></div>

          <div v-if="qualityReport && !isChecking" class="results-section">
            <el-descriptions :column="2" border title="总体评估 (模拟)">
              <el-descriptions-item label="总体质量得分">
                <el-progress :percentage="qualityReport.overallScore" :status="getScoreStatus(qualityReport.overallScore)" />
              </el-descriptions-item>
              <el-descriptions-item label="评估等级">
                <el-tag :type="getScoreTagType(qualityReport.overallScore)">{{ getScoreGrade(qualityReport.overallScore) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="检测时间">{{ qualityReport.checkDate }}</el-descriptions-item>
              <el-descriptions-item label="检测规则数">{{ qualityReport.rulesApplied }}</el-descriptions-item>
            </el-descriptions>

            <el-divider />
            <h3>详细检测结果 (模拟)</h3>
            <div v-for="result in qualityReport.detailedResults" :key="result.checkType" class="check-result-item">
              <h4>{{ result.name }}</h4>
              <p>{{ result.description }}</p>
              <el-progress :percentage="result.score" :status="getScoreStatus(result.score)" style="margin-top: 5px;"/>
              <small v-if="result.issuesFound > 0" style="color: #F56C6C;">发现 {{ result.issuesFound }} 个问题项。</small>
              <small v-else style="color: #67C23A;">未发现明显问题。</small>
            </div>
          </div>
          <el-empty v-else-if="!isChecking && !qualityReport" description="请先配置并运行数据质量检测"></el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

// --- Mock Data ---
interface Dataset {
  id: string;
  name: string;
  // Mock characteristics that influence quality scores
  baseCompleteness: number; // 0-100
  baseAccuracy: number;     // 0-100
  baseUniqueness: number;   // 0-100
  baseConsistency: number;  // 0-100
  baseTimeliness: number;   // 0-100
}
const availableDatasets = ref<Dataset[]>([
  { id: 'ds-001', name: '客户主数据表', baseCompleteness: 90, baseAccuracy: 85, baseUniqueness: 99, baseConsistency: 80, baseTimeliness: 95 },
  { id: 'ds-002', name: '产品销售流水', baseCompleteness: 98, baseAccuracy: 92, baseUniqueness: 90, baseConsistency: 88, baseTimeliness: 80 },
  { id: 'ds-003', name: '网站用户行为日志', baseCompleteness: 75, baseAccuracy: 80, baseUniqueness: 100, baseConsistency: 70, baseTimeliness: 90 },
  { id: 'ds-004', name: '聚合后订单数据', baseCompleteness: 99, baseAccuracy: 97, baseUniqueness: 100, baseConsistency: 95, baseTimeliness: 98 },
]);

const checkTypeNames: Record<string, string> = {
  completeness: '完整性检查',
  accuracy: '准确性检查',
  uniqueness: '唯一性检查',
  consistency: '一致性检查',
  timeliness: '时效性检查',
};

// --- Component State ---
const selectedDatasetId = ref<string | null>(null);
const selectedChecks = ref<string[]>([]);
const isChecking = ref(false);

interface DetailedResult {
  checkType: string;
  name: string;
  score: number;
  issuesFound: number;
  description: string;
}
interface QualityReport {
  datasetId: string;
  datasetName: string;
  overallScore: number;
  rulesApplied: number;
  checkDate: string;
  detailedResults: DetailedResult[];
}
const qualityReport = ref<QualityReport | null>(null);

// --- Methods ---
const resetChecks = () => {
  // selectedChecks.value = []; // Optionally reset selected checks when dataset changes
  qualityReport.value = null; // Clear previous report
};

const runQualityChecks = async () => {
  if (!selectedDatasetId.value) {
    ElMessage.error('请选择一个数据集。');
    return;
  }
  if (selectedChecks.value.length === 0) {
    ElMessage.error('请至少选择一个质量检测规则。');
    return;
  }

  isChecking.value = true;
  qualityReport.value = null; // Clear previous report

  const dataset = availableDatasets.value.find(ds => ds.id === selectedDatasetId.value);
  if (!dataset) {
    ElMessage.error('选择的数据集无效。');
    isChecking.value = false;
    return;
  }

  // Simulate API call and processing delay
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

  const detailedResults: DetailedResult[] = [];
  let totalScore = 0;

  selectedChecks.value.forEach(checkType => {
    let score = 0;
    let issuesFound = 0;
    let description = '';

    // Simulate scores based on dataset's base quality and some randomness
    switch (checkType) {
      case 'completeness':
        score = Math.max(50, dataset.baseCompleteness - Math.floor(Math.random() * 20));
        issuesFound = Math.floor((100 - score) / 5 * Math.random());
        description = `检测关键字段的空值情况。当前模拟发现 ${issuesFound} 处数据缺失。`;
        break;
      case 'accuracy':
        score = Math.max(50, dataset.baseAccuracy - Math.floor(Math.random() * 20));
        issuesFound = Math.floor((100 - score) / 4 * Math.random());
        description = `检查数据类型、格式及是否在预定范围内。模拟发现 ${issuesFound} 条记录存在准确性问题。`;
        break;
      case 'uniqueness':
        score = Math.max(60, dataset.baseUniqueness - Math.floor(Math.random() * 10));
        issuesFound = Math.floor((100 - score) / 10 * Math.random());
        description = `验证指定字段（如ID）的唯一性。模拟发现 ${issuesFound} 个重复值。`;
        break;
      case 'consistency':
        score = Math.max(40, dataset.baseConsistency - Math.floor(Math.random() * 25));
        issuesFound = Math.floor((100 - score) / 3 * Math.random());
        description = `检查相关数据间的逻辑一致性。模拟发现 ${issuesFound} 处不一致。`;
        break;
      case 'timeliness':
        score = Math.max(50, dataset.baseTimeliness - Math.floor(Math.random() * 15));
        issuesFound = Math.floor((100 - score) / 6 * Math.random());
        description = `评估数据的更新频率和时效性。模拟发现 ${issuesFound} 条数据可能已过时。`;
        break;
      default:
        score = 70 + Math.floor(Math.random() * 30);
    }
    score = Math.min(100, Math.max(0, score)); // Clamp score between 0 and 100
    totalScore += score;
    detailedResults.push({
      checkType,
      name: checkTypeNames[checkType] || '未知检测',
      score,
      issuesFound,
      description,
    });
  });

  qualityReport.value = {
    datasetId: dataset.id,
    datasetName: dataset.name,
    overallScore: selectedChecks.value.length > 0 ? Math.round(totalScore / selectedChecks.value.length) : 0,
    rulesApplied: selectedChecks.value.length,
    checkDate: new Date().toLocaleString(),
    detailedResults,
  };

  isChecking.value = false;
  ElMessage.success('数据质量检测模拟完成！');
};

// --- Computed & Helpers ---
const getScoreStatus = (score: number): ('success' | 'warning' | 'exception' | undefined) => {
  if (score >= 90) return 'success';
  if (score >= 70) return undefined; // Default color for Element Plus progress
  if (score >= 50) return 'warning';
  return 'exception';
};

const getScoreTagType = (score: number): ('success' | 'warning' | 'danger' | 'info') => {
  if (score >= 90) return 'success';
  if (score >= 70) return 'info';
  if (score >= 50) return 'warning';
  return 'danger';
};

const getScoreGrade = (score: number): string => {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 70) return '中等';
  if (score >= 50) return '及格';
  return '较差';
};

</script>

<style scoped>
.data-quality-view {
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
.quality-check-checkbox {
  display: block;
  margin-bottom: 8px;
}
.results-section {
  margin-top: 10px;
}
.results-section h3 {
   font-size: 1.2em;
   color: #303133;
   margin-bottom: 15px;
   margin-top: 20px;
}
.check-result-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9fafc;
}
.check-result-item h4 {
  font-size: 1.05em;
  margin-bottom: 5px;
  color: #409EFF;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.el-progress--line {
    margin-bottom: 5px;
}
</style>
