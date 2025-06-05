import Mock from 'mockjs';

const API_PREFIX = '/api';

console.log('Mock service initialized.');

// 1. Platform Statistics for Dashboard Summary Cards
Mock.mock(API_PREFIX + '/platform-stats', 'get', () => {
  return Mock.mock({
    status: 'success',
    data: {
      connectedSources: '@integer(50, 100)',
      aggregatedTables: '@integer(100, 200)',
      qualityChecksRun: '@integer(1000, 2000)',
      publishedApis: '@integer(20, 50)',
    }
  });
});

// 2. Data Source Types for Dashboard Pie Chart
Mock.mock(API_PREFIX + '/data-sources-summary', 'get', () => {
  return Mock.mock({
    status: 'success',
    data: {
      api: '@integer(30, 60)',
      database: '@integer(15, 30)',
      file: '@integer(5, 15)',
    }
  });
});

// 3. Adding a new API Data Source (from DataAccessView)
Mock.mock(API_PREFIX + '/data-sources/api', 'post', (options: any) => {
  console.log('Mock POST /api/data-sources/api received:', options.body);
  const body = JSON.parse(options.body);
  if (!body.name || !body.url) {
    return Mock.mock({
      status: 'error',
      message: 'API Name and URL are required.'
    });
  }
  return Mock.mock({
    status: 'success',
    message: `API source '${body.name}' added successfully (mocked).`,
    data: {
      id: '@guid',
      name: body.name,
      url: body.url,
      authType: body.authType,
      status: 'connected' // Simulate immediate connection
    }
  });
});

// 4. Fetching list of Data Sources (example, could be used by DataAccessView)
Mock.mock(RegExp(API_PREFIX + '/data-sources/api' + '.*'), 'get', () => {
    return Mock.mock({
        status: 'success',
        'data|2-5': [{ // Generate 2 to 5 mock API sources
            id: '@guid',
            name: '@ctitle(3, 7) API',
            url: 'https://api.example.com/@word(5,10)',
            authType: Mock.Random.pick(['apiKey', 'oauth2', 'none']),
            status: Mock.Random.pick(['connected', 'error'])
        }]
    });
});


// Example: Mocking a list for Metadata Management
Mock.mock(RegExp(API_PREFIX + '/metadata/tables' + '.*'), 'get', (options: any) => {
  console.log('Mock GET /metadata/tables received:', options.url);
  const params = new URLSearchParams(options.url.split('?')[1]);
  const searchTerm = params.get('search') || '';

  const allTables = [
    { id: 'fact_sales', name: '事实_销售订单', description: '核心销售数据', recordCount: 1500000, source: '订单系统' },
    { id: 'dim_customer', name: '维度_客户信息', description: '客户详细资料', recordCount: 80000, source: 'CRM' },
    { id: 'log_user_activity', name: '日志_用户行为', description: '用户站内行为记录', recordCount: 10000000, source: '埋点系统' }
  ];

  const filteredTables = allTables.filter(t =>
    t.name.includes(searchTerm) || t.description.includes(searchTerm)
  );

  return Mock.mock({
    status: 'success',
    'data|1-3': filteredTables.length > 0 ? filteredTables : [ // Ensure some data is returned if filter is too strict
        { id: '@guid', name: '示例表 - @ctitle(3,5)', description: '这是一个通过Mock.js生成的示例表描述，用于演示当搜索无结果时的情况。', recordCount: '@integer(1000,5000)', source: 'Mock系统' }
    ],
    total: filteredTables.length
  });
});

export default Mock;
