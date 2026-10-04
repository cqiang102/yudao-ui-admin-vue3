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
      <el-form-item>
        <el-button type="primary" @click="getList">刷新</el-button>
        <el-button v-hasPermi="['restaurant:ticket:create']" type="success" @click="openCreate">
          提交工单
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
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
      <el-table-column label="平台回复" prop="reply" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.reply">{{ row.reply }}</span>
          <span v-else class="text-gray-400">（暂无）</span>
        </template>
      </el-table-column>
      <el-table-column label="提交时间" prop="createTime" width="170" />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="onView(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination :total="total" v-model:page="queryParams.pageNo" v-model:limit="queryParams.pageSize" @pagination="getList" />
  </ContentWrap>

  <!-- 提交工单 -->
  <Dialog v-model="createVisible" title="提交工单" width="560px">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="70px">
      <el-form-item label="类型" prop="type">
        <el-select v-model="form.type" style="width: 100%">
          <el-option label="功能建议" :value="1" />
          <el-option label="故障报修" :value="2" />
          <el-option label="结算咨询" :value="3" />
          <el-option label="其他" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" maxlength="100" show-word-limit placeholder="一句话描述问题" />
      </el-form-item>
      <el-form-item label="描述" prop="content">
        <el-input v-model="form.content" type="textarea" :rows="5" placeholder="请描述具体情况、发生时间、期望结果" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createVisible = false">取 消</el-button>
      <el-button type="primary" :loading="saving" @click="doCreate">提 交</el-button>
    </template>
  </Dialog>

  <!-- 详情 -->
  <Dialog v-model="viewVisible" title="工单详情" width="620px">
    <el-descriptions :column="1" border>
      <el-descriptions-item label="编号">#{{ current.id }}</el-descriptions-item>
      <el-descriptions-item label="标题">{{ current.title }}</el-descriptions-item>
      <el-descriptions-item label="类型">{{ TYPE_TEXTS[current.type] || '其他' }}</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="STATUS_TAGS[current.status]">{{ STATUS_TEXTS[current.status] }}</el-tag>
      </el-descriptions-item>
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
</template>

<script lang="ts" setup>
import * as RestaurantApi from '@/api/restaurant'
import type { FormInstance } from 'element-plus'

// 商户端 - 我的工单（P-07）
// 门店归属由后端按登录店员绑定的门店注入（StoreAuthService），前端不传 storeId
defineOptions({ name: 'RestaurantTicketMy' })

const message = useMessage()

const STATUS_TAGS = ['warning', 'success', 'info'] as const
const STATUS_TEXTS = ['待处理', '已回复', '已关闭']
const TYPE_TEXTS: Record<number, string> = { 1: '功能建议', 2: '故障报修', 3: '结算咨询', 4: '其他' }

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryStatus = ref<number | undefined>(undefined)
const queryParams = reactive({ pageNo: 1, pageSize: 10 })

const createVisible = ref(false)
const viewVisible = ref(false)
const current = ref<any>({})
const formRef = ref<FormInstance>()
const form = reactive({ type: 2, title: '', content: '' })
const rules = {
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '描述不能为空', trigger: 'blur' }]
}

const getList = async () => {
  loading.value = true
  try {
    const data = await RestaurantApi.getMyTicketPage({ ...queryParams, status: queryStatus.value })
    list.value = data?.list || []
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  form.type = 2
  form.title = ''
  form.content = ''
  createVisible.value = true
}

const doCreate = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  saving.value = true
  try {
    await RestaurantApi.createTicket({ ...form })
    message.success('提交成功，平台会尽快处理')
    createVisible.value = false
    queryParams.pageNo = 1
    getList()
  } finally {
    saving.value = false
  }
}

const onView = (row: any) => {
  current.value = row
  viewVisible.value = true
}

onMounted(() => {
  getList()
})
</script>
