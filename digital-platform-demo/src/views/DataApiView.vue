<template>
  <div class="page-container data-api-view">
    <h1 class="page-title">数据API服务管理</h1>

    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>可发布为API的数据集 (模拟)</span>
           <el-input v-model="searchTerm" placeholder="搜索数据集名称..." clearable style="width: 300px;"/>
        </div>
      </template>

      <el-table :data="filteredDatasets" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="数据集名称" sortable width="250"></el-table-column>
        <el-table-column prop="description" label="描述" :show-overflow-tooltip="true" min-width="300"></el-table-column>
        <el-table-column label="API状态" width="150" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.apiStatus === 'published' ? 'success' : 'info'">
              {{ scope.row.apiStatus === 'published' ? 'API已发布' : '未发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="scope">
            <el-button
              size="small"
              :type="scope.row.apiStatus === 'published' ? 'primary' : 'success'"
              :icon="scope.row.apiStatus === 'published' ? View : Upload"
              @click="handleApiAction(scope.row)">
              {{ scope.row.apiStatus === 'published' ? '查看API详情' : '发布为API' }}
            </el-button>
            <el-button
              v-if="scope.row.apiStatus === 'published'"
              size="small"
              type="danger"
              plain
              :icon="Delete"
              @click="unpublishApi(scope.row)"
              style="margin-left: 5px;">
              下线
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- API Details Dialog -->
    <el-dialog v-model="apiDetailsDialogVisible" :title="selectedApiDataset ? 'API详情: ' + selectedApiDataset.name : 'API详情'" width="70%" top="5vh">
      <div v-if="selectedApiDataset && selectedApiDataset.apiDetails" class="dialog-content">
        <el-descriptions :column="1" border :title="'API: ' + selectedApiDataset.apiDetails.endpoint">
          <el-descriptions-item label="HTTP方法">{{ selectedApiDataset.apiDetails.method }}</el-descriptions-item>
          <el-descriptions-item label="认证方式 (模拟)">{{ selectedApiDataset.apiDetails.authentication }}</el-descriptions-item>
          <el-descriptions-item label="请求格式">{{ selectedApiDataset.apiDetails.requestFormat }}</el-descriptions-item>
          <el-descriptions-item label="响应格式">{{ selectedApiDataset.apiDetails.responseFormat }}</el-descriptions-item>
        </el-descriptions>

        <h3 style="margin-top: 20px;">请求参数 (模拟)</h3>
        <el-table :data="selectedApiDataset.apiDetails.parameters" stripe border size="small">
          <el-table-column prop="name" label="参数名"></el-table-column>
          <el-table-column prop="in" label="位置"></el-table-column>
          <el-table-column prop="type" label="类型"></el-table-column>
          <el-table-column prop="required" label="是否必须">
            <template #default="scope">{{ scope.row.required ? '是' : '否' }}</template>
          </el-table-column>
          <el-table-column prop="description" label="描述"></el-table-column>
        </el-table>

        <h3 style="margin-top: 20px;">响应示例 (模拟JSON)</h3>
        <pre class="code-block">{{ JSON.stringify(selectedApiDataset.apiDetails.sampleResponse, null, 2) }}</pre>

        <h3 style="margin-top: 20px;">简易API测试 (模拟)</h3>
        <el-form label-position="top" class="api-explorer-form">
            <el-row :gutter="10">
                <el-col :span="12" v-for="param in selectedApiDataset.apiDetails.parameters.filter(p => p.in === 'query')" :key="param.name">
                     <el-form-item :label="param.name + (param.required ? '*' : '')">
                        <el-input v-model="mockApiParams[param.name]" :placeholder="param.description"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-button type="primary" @click="runMockApiCall" :loading="isMockCalling">执行模拟调用</el-button>
        </el-form>
        <div v-if="mockApiResponse" style="margin-top:15px;">
            <h4>模拟响应:</h4>
            <pre class="code-block">{{ JSON.stringify(mockApiResponse, null, 2) }}</pre>
        </div>

      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="apiDetailsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Upload, Delete, Search } from '@element-plus/icons-vue';

// --- Interfaces & Mock Data ---
interface ApiParameter {
  name: string;
  in: 'path' | 'query' | 'header';
  type: 'string' | 'integer' | 'boolean';
  required: boolean;
  description: string;
}

interface ApiDetails {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  authentication: string;
  requestFormat: string;
  responseFormat: string;
  parameters: ApiParameter[];
  sampleResponse: any;
}

interface DatasetForApi {
  id: string;
  name: string;
  description: string;
  apiStatus: 'unpublished' | 'published';
  apiDetails?: ApiDetails; // Available when published
  // Sample data for mocking API calls
  sampleData?: Record<string, any>[];
}

const mockApiDatasets = ref<DatasetForApi[]>([
  {
    id: 'sales-summary', name: '销售额汇总数据',
    description: '按区域和产品类别汇总的月度销售数据。',
    apiStatus: 'unpublished',
    sampleData: [
        { region: '华东', category: '电子产品', month: '2023-09', totalSales: 120000 },
        { region: '华北', category: '家居用品', month: '2023-09', totalSales: 75000 },
        { region: '华东', category: '电子产品', month: '2023-10', totalSales: 150000 },
    ],
    apiDetails: {
      endpoint: '/api/data/sales-summary',
      method: 'GET',
      authentication: 'API Key in Header (X-API-KEY)',
      requestFormat: 'N/A (GET)',
      responseFormat: 'application/json',
      parameters: [
        { name: 'region', in: 'query', type: 'string', required: false, description: '按区域筛选 (例如: 华东)' },
        { name: 'category', in: 'query', type: 'string', required: false, description: '按产品类别筛选' },
        { name: 'month', in: 'query', type: 'string', required: false, description: '按月份筛选 (YYYY-MM)' },
        { name: 'limit', in: 'query', type: 'integer', required: false, description: '返回记录数上限 (默认100)' },
      ],
      sampleResponse: {
        data: [
          { region: '华东', category: '电子产品', month: '2023-10', totalSales: 150000 },
        ],
        count: 1,
        total: 1, // Assuming filtering applied
      }
    }
  },
  {
    id: 'customer-segments', name: '客户分群信息',
    description: '客户的基本画像和分群标签。',
    apiStatus: 'published',
    sampleData: [
        { customerId: 'C001', name: '张三', segment: '高价值', city: '上海' },
        { customerId: 'C002', name: '李四', segment: '潜力客户', city: '北京' },
        { customerId: 'C003', name: '王五', segment: '普通客户', city: '上海' },
    ],
    apiDetails: {
      endpoint: '/api/data/customer-segments',
      method: 'GET',
      authentication: 'OAuth 2.0 Bearer Token',
      requestFormat: 'N/A (GET)',
      responseFormat: 'application/json',
      parameters: [
        { name: 'segment', in: 'query', type: 'string', required: false, description: '按分群筛选' },
        { name: 'city', in: 'query', type: 'string', required: false, description: '按城市筛选' },
      ],
      sampleResponse: [
        { customerId: 'C001', name: '张三', segment: '高价值', city: '上海', lastPurchaseDate: '2023-10-15' },
      ]
    }
  },
  {
    id: 'product-inventory', name: '产品实时库存',
    description: '各仓库产品的实时库存数量。',
    apiStatus: 'unpublished',
    sampleData: [
        { productId: 'P001', productName: '智能手机X1', warehouse: '上海仓', quantity: 150 },
        { productId: 'P002', productName: '笔记本电脑Y2', warehouse: '北京仓', quantity: 80 },
        { productId: 'P001', productName: '智能手机X1', warehouse: '深圳仓', quantity: 120 },
    ],
    apiDetails: {
        endpoint: '/api/data/product-inventory',
        method: 'GET',
        authentication: 'API Key in Header (X-API-KEY)',
        requestFormat: 'N/A (GET)',
        responseFormat: 'application/json',
        parameters: [
            { name: 'productId', in: 'query', type: 'string', required: false, description: '按产品ID查询' },
            { name: 'warehouse', in: 'query', type: 'string', required: false, description: '按仓库筛选' },
        ],
        sampleResponse: {
            data: [ { productId: 'P001', productName: '智能手机X1', warehouse: '上海仓', quantity: 150, lastUpdated: '2023-10-27T10:30:00Z' } ],
            count: 1,
        }
    }
  }
]);

// --- Component State ---
const loading = ref(false);
const searchTerm = ref('');
const apiDetailsDialogVisible = ref(false);
const selectedApiDataset = ref<DatasetForApi | null>(null);
const mockApiParams = ref<Record<string, any>>({});
const mockApiResponse = ref<any>(null);
const isMockCalling = ref(false);

// --- Computed Properties ---
const filteredDatasets = computed(() => {
  if (!searchTerm.value) {
    return mockApiDatasets.value;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  return mockApiDatasets.value.filter(dataset =>
    dataset.name.toLowerCase().includes(lowerSearchTerm) ||
    dataset.description.toLowerCase().includes(lowerSearchTerm)
  );
});

// --- Methods ---
const handleApiAction = (dataset: DatasetForApi) => {
  selectedApiDataset.value = dataset;
  mockApiParams.value = {}; // Reset params
  mockApiResponse.value = null; // Clear previous response

  if (dataset.apiStatus === 'published') {
    apiDetailsDialogVisible.value = true;
  } else {
    // Simulate publishing
    ElMessageBox.confirm(`确定要将数据集 "${dataset.name}" 发布为API吗? (这将是模拟操作)`, '确认发布', {
      confirmButtonText: '确定发布',
      cancelButtonText: '取消',
      type: 'info',
    }).then(async () => {
      loading.value = true;
      await new Promise(resolve => setTimeout(resolve, 700)); // Simulate async
      const dsIndex = mockApiDatasets.value.findIndex(d => d.id === dataset.id);
      if (dsIndex !== -1) {
        mockApiDatasets.value[dsIndex].apiStatus = 'published';
        ElMessage.success(`数据集 "${dataset.name}" 已成功发布为API (模拟)`);
        // Automatically open details after publishing
        selectedApiDataset.value = mockApiDatasets.value[dsIndex];
        apiDetailsDialogVisible.value = true;
      }
      loading.value = false;
    }).catch(() => {
      ElMessage.info('取消发布操作');
    });
  }
};

const unpublishApi = (dataset: DatasetForApi) => {
   ElMessageBox.confirm(`确定要下线API "${dataset.name}" 吗? (这将是模拟操作)`, '确认下线', {
      confirmButtonText: '确定下线',
      cancelButtonText: '取消',
      type: 'warning',
    }).then(async () => {
      loading.value = true;
      await new Promise(resolve => setTimeout(resolve, 500));
      const dsIndex = mockApiDatasets.value.findIndex(d => d.id === dataset.id);
      if (dsIndex !== -1) {
        mockApiDatasets.value[dsIndex].apiStatus = 'unpublished';
        ElMessage.success(`API "${dataset.name}" 已成功下线 (模拟)`);
      }
      loading.value = false;
    }).catch(() => {
      ElMessage.info('取消下线操作');
    });
};

const runMockApiCall = async () => {
    if (!selectedApiDataset.value || !selectedApiDataset.value.sampleData) {
        ElMessage.error('无可用数据进行模拟调用。');
        return;
    }
    isMockCalling.value = true;
    mockApiResponse.value = null;
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call latency

    let results = [...selectedApiDataset.value.sampleData]; // Start with all sample data

    // Simulate filtering based on mockApiParams
    for (const key in mockApiParams.value) {
        const filterValue = String(mockApiParams.value[key]).toLowerCase();
        if (filterValue) { // Only filter if param has a value
            results = results.filter(item =>
                item[key] !== undefined && String(item[key]).toLowerCase().includes(filterValue)
            );
        }
    }

    // Simulate limit if present in params (e.g. from apiDetails)
    const limitParam = selectedApiDataset.value.apiDetails?.parameters.find(p => p.name === 'limit');
    const limit = limitParam && mockApiParams.value['limit'] ? parseInt(mockApiParams.value['limit']) : (results.length > 5 ? 5 : results.length) ; // Default limit for display


    mockApiResponse.value = {
        message: "模拟调用成功",
        paramsSent: { ...mockApiParams.value },
        data: results.slice(0, limit), // Apply limit
        count: results.length,
    };
    isMockCalling.value = false;
};

</script>

<style scoped>
.data-api-view {
  /* Component specific styles */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.dialog-content {
  max-height: 75vh;
  overflow-y: auto;
}
.code-block {
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap; /* Allows wrapping long lines */
  word-break: break-all; /* Breaks long words/strings */
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.9em;
}
.api-explorer-form .el-form-item {
    margin-bottom: 10px;
}
h3 {
    font-size: 1.15em;
    color: #303133;
    margin-bottom: 10px;
}
h4 {
    font-size: 1.05em;
    color: #409EFF;
    margin-bottom: 8px;
}
</style>
