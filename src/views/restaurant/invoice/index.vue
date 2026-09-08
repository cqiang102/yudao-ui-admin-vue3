<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="门店">
        <el-select v-model="queryStoreId" placeholder="全部" clearable style="width: 200px" @change="getList">
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="queryStatus" placeholder="全部" clearable style="width: 140px" @change="getList">
          <el-option label="申请中" :value="0" />
          <el-option label="已开票" :value="1" />
          <el-option label="已驳回" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">刷新</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="门店" width="130">
        <template #default="{ row }">门店 #{{ row.storeId }}</template>
      </el-table-column>
      <el-table-column label="订单号" prop="orderNo" min-width="150" show-overflow-tooltip />
      <el-table-column label="金额（元）" width="110" align="right">
        <template #default="{ row }">¥{{ ((row.amount || 0) / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column label="抬头" min-width="160" show-overflow-tooltip>
        <template #default="{ row }">
          {{ row.title }}<el-tag v-if="row.type === 1" size="small" class="ml-5px">企业</el-tag>
          <el-tag v-else size="small" type="info" class="ml-5px">个人</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="税号" prop="taxNo" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="['warning', 'success', 'danger'][row.status]">
            {{ ['申请中', '已开票', '已驳回'][row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" prop="rejectReason" min-width="120" show-overflow-tooltip />
      <el-table-column label="申请时间" prop="createTime" width="170" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button v-hasPermi="['restaurant:invoice:audit']" link type="success" @click="onAudit(row, true)">
              标记已开票
            </el-button>
            <el-button v-hasPermi="['restaurant:invoice:audit']" link type="danger" @click="onAudit(row, false)">
              驳回
            </el-button>
          </template>
          <el-button v-hasPermi="['restaurant:invoice:delete']" link type="danger" @click="onDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Dialog v-model="rejectVisible" title="驳回开票申请" width="460px">
      <el-form label-width="90px">
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="如 税号有误请重新提交" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="doReject">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as RestaurantApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantInvoice' })

const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const storeOptions = ref<any[]>([])
const queryStoreId = ref<number | undefined>(undefined)
const queryStatus = ref<number | undefined>(undefined)

// 驳回弹层
const rejectVisible = ref(false)
const rejectReason = ref('')
const rejectId = ref<number>()

const getList = async () => {
  loading.value = true
  try {
    const data = await RestaurantApi.getInvoiceList({
      storeId: queryStoreId.value,
      status: queryStatus.value
    })
    list.value = data || []
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  const data = await RestaurantApi.getStorePage({ pageNo: 1, pageSize: 100 })
  storeOptions.value = data?.list || []
}

const onAudit = async (row: any, approved: boolean) => {
  if (approved) {
    try {
      await message.confirm(`确认订单 ${row.orderNo} 已线下开具发票并标记？`)
    } catch {
      return
    }
    await RestaurantApi.auditInvoice({ id: row.id, approved: true })
    message.success('已标记开票')
    getList()
  } else {
    rejectId.value = row.id
    rejectReason.value = ''
    rejectVisible.value = true
  }
}

const doReject = async () => {
  if (!rejectReason.value) {
    message.warning('请填写驳回原因')
    return
  }
  saving.value = true
  try {
    await RestaurantApi.auditInvoice({
      id: rejectId.value,
      approved: false,
      rejectReason: rejectReason.value
    })
    message.success('已驳回')
    rejectVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

const onDelete = async (row: any) => {
  try {
    await message.delConfirm(`确认删除订单 ${row.orderNo} 的开票申请？`)
  } catch {
    return
  }
  await RestaurantApi.deleteInvoice(row.id)
  message.success('删除成功')
  getList()
}

onMounted(() => {
  loadStores()
  getList()
})
</script>
