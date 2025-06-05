<template>
  <div class="page-container metadata-management-view">
    <h1 class="page-title">元数据管理中心</h1>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>数据资产列表 (模拟数据仓库表)</span>
          <el-input v-model="searchTerm" placeholder="搜索表名或描述..." clearable style="width: 300px;"/>
        </div>
      </template>

      <el-table :data="filteredTables" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="表名/数据集名" sortable fixed width="200"></el-table-column>
        <el-table-column prop="description" label="核心描述" :show-overflow-tooltip="true" min-width="250">
          <template #default="scope">
            {{ scope.row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源 (模拟)" width="180" :show-overflow-tooltip="true"></el-table-column>
        <el-table-column prop="recordCount" label="记录数 (模拟)" width="120" align="right">
          <template #default="scope">{{ scope.row.recordCount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="creationDate" label="创建日期 (模拟)" width="120" sortable></el-table-column>
        <el-table-column prop="updatedBy" label="最后维护人 (模拟)" width="130"></el-table-column>
        <el-table-column label="操作" width="130" fixed="right" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" :icon="View" @click="openDetailsDialog(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Details Dialog -->
    <el-dialog v-model="detailsDialogVisible" :title="selectedTable ? '元数据详情: ' + selectedTable.name : '元数据详情'" width="75%" top="5vh">
      <div v-if="selectedTable" class="dialog-content">
        <el-tabs v-model="activeTabInDialog">
          <el-tab-pane label="基本信息与描述" name="basic">
            <el-descriptions :column="2" border style="margin-bottom: 20px;">
              <el-descriptions-item label="表名">{{ selectedTable.name }}</el-descriptions-item>
              <el-descriptions-item label="数据源 (模拟)">{{ selectedTable.source }}</el-descriptions-item>
              <el-descriptions-item label="记录数 (模拟)">{{ selectedTable.recordCount.toLocaleString() }}</el-descriptions-item>
              <el-descriptions-item label="创建日期 (模拟)">{{ selectedTable.creationDate }}</el-descriptions-item>
              <el-descriptions-item label="最后更新 (模拟)">{{ selectedTable.lastUpdated }}</el-descriptions-item>
              <el-descriptions-item label="维护责任人 (模拟)">{{ selectedTable.owner }}</el-descriptions-item>
            </el-descriptions>

            <el-form label-position="top">
              <el-form-item label="业务描述与用途">
                <el-input type="textarea" v-model="editableMetadata.description" :autosize="{ minRows: 3, maxRows: 6 }" placeholder="详细描述表的业务含义、用途、更新频率等"></el-input>
              </el-form-item>
              <el-form-item label="标签/关键词 (逗号分隔)">
                <el-input v-model="editableMetadata.tags" placeholder="例如: 客户, 销售额, 月度"></el-input>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="字段级元数据" name="columns">
            <el-table :data="editableMetadata.columns" stripe border max-height="450px">
              <el-table-column prop="name" label="字段名" width="180" fixed></el-table-column>
              <el-table-column prop="type" label="数据类型" width="120"></el-table-column>
              <el-table-column label="业务含义/注释" min-width="250">
                <template #default="scope">
                  <el-input type="textarea" v-model="scope.row.businessMeaning" placeholder="字段的业务解释" :autosize="{ minRows: 1, maxRows: 3 }"></el-input>
                </template>
              </el-table-column>
              <el-table-column label="是否敏感" width="100" align="center">
                <template #default="scope">
                  <el-switch v-model="scope.row.isSensitive" />
                </template>
              </el-table-column>
              <el-table-column label="数据质量 (模拟)" width="150" align="center">
                <template #default="scope">
                   <el-progress :percentage="scope.row.qualityScore" :status="getScoreStatus(scope.row.qualityScore)" :text-inside="true" :stroke-width="20"/>
                </template>
              </el-table-column>
               <el-table-column prop="sampleValue" label="示例值 (模拟)" width="150" :show-overflow-tooltip="true"></el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="血缘关系 (模拟)" name="lineage">
             <div style="text-align: center; padding: 20px;">
                <el-empty description="血缘关系图谱功能正在快马加鞭建设中..."></el-empty>
                <p>(概念演示: 表 {{selectedTable.name}} 可能来源于 {{selectedTable.source}}，并可能流向 综合数据驾驶舱)</p>
             </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMetadataChanges" :loading="isSaving">保存更改 (模拟)</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Search } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';

// --- Interfaces & Mock Data ---
interface ColumnMetadata {
  id: string;
  name: string;
  type: string; // e.g., VARCHAR(255), INTEGER, TIMESTAMP, DECIMAL(10,2)
  businessMeaning: string;
  isSensitive: boolean;
  qualityScore: number; // 0-100
  sampleValue: string | number | null;
}

interface TableMetadata {
  id: string;
  name: string;
  description: string;
  source: string; // Simulated source string
  recordCount: number;
  creationDate: string; // YYYY-MM-DD
  lastUpdated: string; // YYYY-MM-DD HH:mm:ss
  owner: string; // Simulated owner
  updatedBy: string; // Last person who updated metadata
  tags: string; // Comma-separated
  columns: ColumnMetadata[];
}

const mockTables = ref<TableMetadata[]>([
  {
    id: 'fact_sales_orders', name: '事实表_销售订单',
    description: '记录所有已完成的销售订单核心信息，用于销售分析和业绩跟踪。每日增量更新。',
    source: '订单系统API, CRM客户主数据', recordCount: 1520300, creationDate: '2022-01-15',
    lastUpdated: '2023-10-27 09:30:00', owner: '销售数据组', updatedBy: '张三', tags: '销售,订单,核心事实',
    columns: [
      { id: 'col1-1', name: 'order_id', type: 'VARCHAR(64)', businessMeaning: '订单唯一标识符', isSensitive: false, qualityScore: 99, sampleValue: 'ORD-2023-12345' },
      { id: 'col1-2', name: 'customer_id', type: 'VARCHAR(64)', businessMeaning: '客户唯一标识符', isSensitive: true, qualityScore: 95, sampleValue: 'CUST-007' },
      { id: 'col1-3', name: 'order_date', type: 'TIMESTAMP', businessMeaning: '订单创建日期和时间', isSensitive: false, qualityScore: 100, sampleValue: '2023-10-26 14:30:00' },
      { id: 'col1-4', name: 'total_amount', type: 'DECIMAL(10,2)', businessMeaning: '订单总金额 (含税)', isSensitive: false, qualityScore: 92, sampleValue: 199.99 },
      { id: 'col1-5', name: 'payment_method', type: 'VARCHAR(32)', businessMeaning: '支付方式', isSensitive: false, qualityScore: 90, sampleValue: '支付宝' },
    ]
  },
  {
    id: 'dim_customer_info', name: '维度表_客户信息',
    description: '存储客户的基本信息、联系方式和分类。T+1 全量更新。',
    source: 'CRM系统数据库直连', recordCount: 85600, creationDate: '2021-11-01',
    lastUpdated: '2023-10-26 08:00:00', owner: '客户关系组', updatedBy: '李四', tags: '客户,维度,联系信息,PII',
    columns: [
      { id: 'col2-1', name: 'customer_id', type: 'VARCHAR(64)', businessMeaning: '客户唯一标识符 (主键)', isSensitive: true, qualityScore: 100, sampleValue: 'CUST-001' },
      { id: 'col2-2', name: 'customer_name', type: 'VARCHAR(128)', businessMeaning: '客户姓名/企业名称', isSensitive: true, qualityScore: 90, sampleValue: '某某科技有限公司' },
      { id: 'col2-3', name: 'email', type: 'VARCHAR(128)', businessMeaning: '客户邮箱地址', isSensitive: true, qualityScore: 85, sampleValue: 'contact@example.com' },
      { id: 'col2-4', name: 'phone_number', type: 'VARCHAR(32)', businessMeaning: '客户联系电话', isSensitive: true, qualityScore: 88, sampleValue: '138********' },
      { id: 'col2-5', name: 'registration_date', type: 'DATE', businessMeaning: '客户注册日期', isSensitive: false, qualityScore: 95, sampleValue: '2022-05-10' },
      { id: 'col2-6', name: 'customer_segment', type: 'VARCHAR(50)', businessMeaning: '客户细分等级 (如: VIP, 普通)', isSensitive: false, qualityScore: 75, sampleValue: 'VIP' },
    ]
  },
  {
    id: 'agg_user_behavior_daily', name: '聚合表_用户日行为',
    description: '每日聚合的用户行为统计，如页面浏览、点击、停留时长等。',
    source: '前端埋点日志, 后端应用日志', recordCount: 5670000, creationDate: '2023-03-01',
    lastUpdated: '2023-10-27 02:00:00', owner: '数据分析组', updatedBy: '王五', tags: '用户行为,聚合,日活,分析',
    columns: [
      { id: 'col3-1', name: 'activity_date', type: 'DATE', businessMeaning: '行为发生日期', isSensitive: false, qualityScore: 100, sampleValue: '2023-10-26' },
      { id: 'col3-2', name: 'user_pseudo_id', type: 'VARCHAR(128)', businessMeaning: '用户匿名标识', isSensitive: false, qualityScore: 98, sampleValue: 'anon-xyz-123' },
      { id: 'col3-3', name: 'total_page_views', type: 'INTEGER', businessMeaning: '总页面浏览量', isSensitive: false, qualityScore: 90, sampleValue: 25 },
      { id: 'col3-4', name: 'avg_session_duration_seconds', type: 'INTEGER', businessMeaning: '平均会话时长 (秒)', isSensitive: false, qualityScore: 85, sampleValue: 180 },
    ]
  },
]);

// --- Component State ---
const loading = ref(false);
const searchTerm = ref('');
const detailsDialogVisible = ref(false);
const selectedTable = ref<TableMetadata | null>(null);
const activeTabInDialog = ref('basic');
const isSaving = ref(false);

// For editing, create a deep copy of the selected table's metadata
const editableMetadata = reactive<{description: string; tags: string; columns: ColumnMetadata[]}>({
  description: '',
  tags: '',
  columns: []
});

// --- Computed Properties ---
const filteredTables = computed(() => {
  if (!searchTerm.value) {
    return mockTables.value;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  return mockTables.value.filter(table =>
    table.name.toLowerCase().includes(lowerSearchTerm) ||
    table.description.toLowerCase().includes(lowerSearchTerm) ||
    table.tags.toLowerCase().includes(lowerSearchTerm)
  );
});

// --- Methods ---
const openDetailsDialog = (table: TableMetadata) => {
  selectedTable.value = table;
  // Deep copy for editing to avoid direct mutation of mockTables
  editableMetadata.description = table.description;
  editableMetadata.tags = table.tags;
  editableMetadata.columns = JSON.parse(JSON.stringify(table.columns));
  activeTabInDialog.value = 'basic';
  detailsDialogVisible.value = true;
};

const saveMetadataChanges = async () => {
  if (!selectedTable.value) return;
  isSaving.value = true;

  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Find the table in the main list and update it
  const tableIndex = mockTables.value.findIndex(t => t.id === selectedTable.value!.id);
  if (tableIndex !== -1) {
    mockTables.value[tableIndex].description = editableMetadata.description;
    mockTables.value[tableIndex].tags = editableMetadata.tags;
    mockTables.value[tableIndex].columns = JSON.parse(JSON.stringify(editableMetadata.columns)); // Save deep copy
    mockTables.value[tableIndex].lastUpdated = new Date().toLocaleString();
    mockTables.value[tableIndex].updatedBy = '当前用户 (模拟)'; // Simulate current user
  }

  isSaving.value = false;
  detailsDialogVisible.value = false;
  ElMessage.success(`元数据表 "${selectedTable.value.name}" 更新成功 (模拟)`);
};

const getScoreStatus = (score: number): ('success' | 'warning' | 'exception' | undefined) => {
  if (score >= 90) return 'success';
  if (score >= 70) return undefined;
  if (score >= 50) return 'warning';
  return 'exception';
};

</script>

<style scoped>
.metadata-management-view {
  /* Component specific styles */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.dialog-content {
  max-height: 70vh; /* Limit dialog height */
  overflow-y: auto;
}
.el-table .el-progress {
    width: 100px; /* Adjust as needed */
}
.el-dialog__body {
    padding-bottom: 0px; /* Adjust padding for dialog */
}
</style>
