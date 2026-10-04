<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="状态">
        <el-select v-model="queryStatus" placeholder="全部" clearable style="width: 140px" @change="getList">
          <el-option label="待处理" :value="0" />
          <el-option label="已回复" :value="1" />
          <el-option label="已关闭" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="queryType" placeholder="全部" clearable style="width: 150px" @change="getList">
          <el-option label="功能建议" :value="1" />
          <el-option label="故障报修" :value="2" />
          <el-option label="结算咨询" :value="3" />
          <el-option label="其他" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="门店">
        <el-select v-model="queryStoreId" placeholder="全部" clearable style="width: 180px" @change="getList">
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">刷新</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="门店" width="120">
        <template #default="{ row }">门店 #{{ row.storeId }}</template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag size="small" type="info">{{ TYPE_TEXTS[row.type] || '其他' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="STATUS_TAGS[row.status]">{{ STATUS_TEXTS[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平台回复" prop="reply" min-width="200" show-overflow-tooltip />
      <el-table-column label="提交时间" prop="createTime" width="170" />
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="onView(row)">查看</el-button>
          <el-button
            v-hasPermi="['restaurant:ticket:reply']"
            link
            type="success"
            :disabled="row.status === 2"
            @click="onReply(row)"
          >
            回复
          </el-button>
          <el-button
            v-hasPermi="['restaurant:ticket:close']"
            link
            type="danger"
            :disabled="row.status === 2"
            @click="onClose(row)"
          >
            关闭
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>

  <!-- 详情 -->
  <Dialog v-model="viewVisible" title="工单详情" width="620px">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="编号">#{{ current.id }}</el-descriptions-item>
      <el-descriptions-item label="门店">门店 #{{ current.storeId }}</el-descriptions-item>
      <el-descriptions-item label="标题">{{ current.title }}</el-descriptions-item>
      <el-descriptions-item label="类型">{{ TYPE_TEXTS[current.type] || '其他' }}</el-descriptions-item>
      <el-descriptions-item label="描述">
        <div style="white-space: pre-wrap">{{ current.content }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="平台回复">
        <div v-if="current.reply" style="white-space: pre-wrap">{{ current.reply }}</div>
        <span v-else class="text-gray-400">（暂无）</span>
      </el-descriptions-item>
      <el-descriptions-item label="回复时间">{{ current.replyTime || '—' }}</el-descriptions-item>
    </el-descriptions>
  </Dialog>

  <!-- 回复 -->
  <Dialog v-model="replyVisible" title="回复工单" width="520px">
    <el-form label-width="70px">
      <el-form-item label="工单">
        <span>#{{ current.id }} {{ current.title }}</span>
      </el-form-item>
      <el-form-item label="回复" required>
        <el-input v-model="replyText" type="textarea" :rows="4" placeholder="请输入回复内容" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="replyVisible = false">取 消</el-button>
      <el-button type="primary" :loading="saving" @click="doReply">确 定</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import * as RestaurantApi from '@/api/restaurant'

// 平台端 - 工单管理（P-07）
defineOptions({ name: 'RestaurantTicket' })

const message = useMessage()

const STATUS_TAGS = ['warning', 'success', 'info'] as const
const STATUS_TEXTS = ['待处理', '已回复', '已关闭']
const TYPE_TEXTS: Record<number, string> = { 1: '功能建议', 2: '故障报修', 3: '结算咨询', 4: '其他' }

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const storeOptions = ref<any[]>([])

const queryStatus = ref<number | undefined>(undefined)
const queryType = ref<number | undefined>(undefined)
const queryStoreId = ref<number | undefined>(undefined)
const queryParams = reactive({ pageNo: 1, pageSize: 10 })

const viewVisible = ref(false)
const replyVisible = ref(false)
const replyText = ref('')
const current = ref<any>({})

const getList = async () => {
  loading.value = true
  try {
    const data = await RestaurantApi.getTicketPage({
      ...queryParams,
      status: queryStatus.value,
      type: queryType.value,
      storeId: queryStoreId.value
    })
    list.value = data?.list || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  const data = await RestaurantApi.getStorePage({ pageNo: 1, pageSize: 100 })
  storeOptions.value = data?.list || []
}

const onView = (row: any) => {
  current.value = row
  viewVisible.value = true
}

const onReply = (row: any) => {
  current.value = row
  replyText.value = row.reply || ''
  replyVisible.value = true
}

const doReply = async () => {
  if (!replyText.value) {
    message.warning('请输入回复内容')
    return
  }
  saving.value = true
  try {
    await RestaurantApi.replyTicket({ id: current.value.id, reply: replyText.value })
    message.success('已回复')
    replyVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

const onClose = async (row: any) => {
  try {
    await message.confirm(`确认关闭工单 #${row.id}「${row.title}」？关闭后不可再回复。`)
  } catch {
    return
  }
  await RestaurantApi.closeTicket(row.id)
  message.success('已关闭')
  getList()
}

onMounted(() => {
  loadStores()
  getList()
})
</script>
