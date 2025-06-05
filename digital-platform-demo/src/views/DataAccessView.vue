<template>
  <div class="page-container data-access-view">
    <h1 class="page-title">多源数据接入</h1>
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="API接口" name="api">
        <el-form :model="apiForm" label-width="120px" ref="apiFormRef">
          <el-form-item label="API名称" prop="name">
            <el-input v-model="apiForm.name" placeholder="例如：客户数据API"></el-input>
          </el-form-item>
          <el-form-item label="Endpoint URL" prop="url">
            <el-input v-model="apiForm.url" placeholder="例如：https://api.example.com/data"></el-input>
          </el-form-item>
          <el-form-item label="认证方式" prop="authType">
            <el-select v-model="apiForm.authType" placeholder="选择认证方式">
              <el-option label="API Key" value="apiKey"></el-option>
              <el-option label="OAuth 2.0" value="oauth2"></el-option>
              <el-option label="无认证" value="none"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="apiForm.authType === 'apiKey'" label="API Key" prop="apiKey">
            <el-input v-model="apiForm.apiKey" placeholder="输入您的API Key"></el-input>
          </el-form-item>
          <el-form-item v-if="apiForm.authType === 'oauth2'" label="Token URL" prop="tokenUrl">
            <el-input v-model="apiForm.tokenUrl" placeholder="输入OAuth Token URL"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addApiSource">添加API源</el-button>
            <el-button @click="resetApiForm">重置</el-button>
          </el-form-item>
        </el-form>
        <el-divider />
        <h3>已配置API源</h3>
        <el-table :data="apiSources" stripe style="width: 100%">
          <el-table-column prop="name" label="API名称" />
          <el-table-column prop="url" label="Endpoint URL" />
          <el-table-column prop="authType" label="认证方式" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="scope.row.status === 'connected' ? 'success' : 'danger'">
                {{ scope.row.status === 'connected' ? '已连接' : '未连接' }}
              </el-tag>
            </template>
          </el-table-column>
           <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeApiSource(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="数据库直连" name="db">
        <el-form :model="dbForm" label-width="120px" ref="dbFormRef">
          <el-form-item label="连接名称" prop="name">
            <el-input v-model="dbForm.name" placeholder="例如：生产环境MySQL"></el-input>
          </el-form-item>
          <el-form-item label="数据库类型" prop="type">
            <el-select v-model="dbForm.type" placeholder="选择数据库类型">
              <el-option label="MySQL" value="mysql"></el-option>
              <el-option label="PostgreSQL" value="postgresql"></el-option>
              <el-option label="SQL Server" value="sqlserver"></el-option>
              <el-option label="Oracle" value="oracle"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="主机" prop="host">
            <el-input v-model="dbForm.host" placeholder="例如：localhost"></el-input>
          </el-form-item>
          <el-form-item label="端口" prop="port">
            <el-input v-model.number="dbForm.port" placeholder="例如：3306"></el-input>
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input v-model="dbForm.username" placeholder="输入数据库用户名"></el-input>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="dbForm.password" type="password" placeholder="输入数据库密码"></el-input>
          </el-form-item>
          <el-form-item label="数据库名称" prop="dbName">
            <el-input v-model="dbForm.dbName" placeholder="输入数据库名称"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addDbConnection">添加数据库连接</el-button>
            <el-button @click="resetDbForm">重置</el-button>
          </el-form-item>
        </el-form>
        <el-divider />
        <h3>已配置数据库连接</h3>
        <el-table :data="dbConnections" stripe style="width: 100%">
          <el-table-column prop="name" label="连接名称" />
          <el-table-column prop="type" label="数据库类型" />
          <el-table-column prop="host" label="主机" />
          <el-table-column prop="port" label="端口" />
          <el-table-column prop="status" label="状态">
             <template #default="scope">
              <el-tag :type="scope.row.status === 'connected' ? 'success' : 'danger'">
                {{ scope.row.status === 'connected' ? '已连接' : '配置错误' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeDbConnection(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="文件上传" name="file">
        <el-upload
          class="upload-demo"
          drag
          action="#"
          :http-request="handleFileUpload"
          multiple
          :show-file-list="false"
          accept=".csv,.json,.xls,.xlsx"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 .csv, .json, .xls, .xlsx 文件
            </div>
          </template>
        </el-upload>
        <el-divider />
        <h3>已上传文件</h3>
        <el-table :data="uploadedFiles" stripe style="width: 100%">
          <el-table-column prop="name" label="文件名" />
          <el-table-column prop="size" label="大小">
            <template #default="scope">{{ (scope.row.size / 1024).toFixed(2) }} KB</template>
          </el-table-column>
          <el-table-column prop="type" label="类型" />
          <el-table-column prop="uploadDate" label="上传日期" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button size="small" type="danger" @click="removeUploadedFile(scope.$index)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import type { FormInstance, UploadRequestHandler, UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';

// --- State ---
const activeTab = ref('api');

// API Form
const apiFormRef = ref<FormInstance>();
const apiForm = reactive({
  name: '',
  url: '',
  authType: 'none',
  apiKey: '',
  tokenUrl: '',
});
const apiSources = ref([
  { id: '1', name: '旧订单API', url: 'https://api.example.com/old-orders', authType: 'apiKey', status: 'connected' },
  { id: '2', name: '产品目录服务', url: 'https://api.example.com/products', authType: 'none', status: 'connected' },
]);

// DB Form
const dbFormRef = ref<FormInstance>();
const dbForm = reactive({
  name: '',
  type: 'mysql',
  host: '',
  port: null,
  username: '',
  password: '',
  dbName: '',
});
const dbConnections = ref([
  { id: '1', name: '客户主数据库', type: 'mysql', host: '192.168.1.100', port: 3306, status: 'connected' },
  { id: '2', name: '报表数据仓库', type: 'postgresql', host: '10.0.0.5', port: 5432, status: '配置错误' },
]);

// File Upload
interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: string;
  rawFile?: File; // Store raw file if needed later
}
const uploadedFiles = ref<UploadedFileItem[]>([
    { id: '1', name: '区域销售额.csv', size: 102400, type: 'text/csv', uploadDate: '2023-10-26' },
    { id: '2', name: '用户行为日志.json', size: 2048000, type: 'application/json', uploadDate: '2023-10-25' },
]);

// --- Methods ---

// API Methods
const addApiSource = async () => {
  if (!apiFormRef.value) return;
  // Basic validation (can be expanded with ElForm rules)
  if (!apiForm.name || !apiForm.url) {
    ElMessage.error('API名称和URL不能为空');
    return;
  }
  // Simulate adding API source
  apiSources.value.push({
    id: String(Date.now()),
    ...apiForm,
    status: Math.random() > 0.2 ? 'connected' : 'error', // Simulate connection status
  });
  ElMessage.success(`API源 "${apiForm.name}" 添加成功 (模拟)`);
  apiFormRef.value.resetFields();
  // Reset specific fields not covered by resetFields if authType changes visibility
  apiForm.apiKey = '';
  apiForm.tokenUrl = '';
};
const resetApiForm = () => {
  if (!apiFormRef.value) return;
  apiFormRef.value.resetFields();
  apiForm.apiKey = '';
  apiForm.tokenUrl = '';
};
const removeApiSource = (index: number) => {
  apiSources.value.splice(index, 1);
  ElMessage.info('API源已删除 (模拟)');
};


// DB Methods
const addDbConnection = async () => {
  if (!dbFormRef.value) return;
   if (!dbForm.name || !dbForm.host || !dbForm.port || !dbForm.username || !dbForm.dbName) {
    ElMessage.error('请填写所有必填项');
    return;
  }
  dbConnections.value.push({
    id: String(Date.now()),
    ...dbForm,
    status: Math.random() > 0.2 ? 'connected' : 'error', // Simulate connection status
  });
  ElMessage.success(`数据库连接 "${dbForm.name}" 添加成功 (模拟)`);
  dbFormRef.value.resetFields();
  dbForm.password = ''; // Ensure password field is cleared
};
const resetDbForm = () => {
  if (!dbFormRef.value) return;
  dbFormRef.value.resetFields();
  dbForm.password = '';
};
const removeDbConnection = (index: number) => {
  dbConnections.value.splice(index, 1);
  ElMessage.info('数据库连接已删除 (模拟)');
};

// File Upload Methods
const handleFileUpload: UploadRequestHandler = (options) => {
  const file = options.file as File;
  // Simulate upload process
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const newFile: UploadedFileItem = {
        id: String(Date.now()),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toLocaleDateString(),
        rawFile: file
      };
      uploadedFiles.value.push(newFile);
      ElMessage.success(`文件 "${file.name}" 上传成功 (模拟)`);
      resolve({ data: { message: 'Upload success (simulated)' } }); // Must match ElUpload success structure
    }, 500);
  });
};

const removeUploadedFile = (index: number) => {
  uploadedFiles.value.splice(index, 1);
  ElMessage.info('文件已删除 (模拟)');
};

</script>

<style scoped>
.data-access-view {
  /* Styles specific to DataAccessView can go here */
}
.upload-demo {
  width: 100%;
}
.el-upload__tip {
  margin-top: 5px;
  font-size: 0.9em;
  color: #909399;
}
.el-divider {
    margin: 30px 0;
}
h3 {
    margin-bottom: 15px;
    font-size: 1.2em;
    color: #303133;
}
</style>
