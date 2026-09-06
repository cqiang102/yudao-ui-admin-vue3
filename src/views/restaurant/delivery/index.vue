<template>
  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- Tab 1：运单列表 -->
      <el-tab-pane label="运单列表" name="delivery">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
              <el-option label="待发单" :value="0" />
              <el-option label="待接单" :value="1" />
              <el-option label="待取货" :value="2" />
              <el-option label="配送中" :value="3" />
              <el-option label="已送达" :value="4" />
              <el-option label="已取消" :value="5" />
              <el-option label="妥投异常" :value="9" />
              <el-option label="发单失败" :value="10" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getList">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column label="运单号" prop="id" width="80" />
          <el-table-column label="订单号" prop="orderId" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="达达单号" prop="dadaOrderId" width="150" />
          <el-table-column label="骑手" width="140">
            <template #default="{ row }">
              <span v-if="row.dmName">{{ row.dmName }} {{ row.dmMobile }}</span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>
          <el-table-column label="运费(元)" prop="fee" width="90" />
          <el-table-column label="异常/取消原因" prop="errorMsg" min-width="140" show-overflow-tooltip />
          <el-table-column label="最后回调" prop="callbackTime" width="170" />
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="[1, 2, 3].includes(row.status)"
                v-hasPermi="['restaurant:delivery:cancel']"
                link
                type="danger"
                @click="onCancel(row)"
              >
                取消运单
              </el-button>
              <el-button
                v-if="[5, 9, 10].includes(row.status)"
                v-hasPermi="['restaurant:delivery:send']"
                link
                type="primary"
                @click="onSend(row.orderId)"
              >
                重新发单
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          v-model:page="query.pageNo"
          v-model:limit="query.pageSize"
          :total="total"
          @pagination="getList"
        />
      </el-tab-pane>

      <!-- Tab 2：配送配置 -->
      <el-tab-pane label="配送配置" name="config">
        <el-form
          v-loading="configLoading"
          :model="config"
          label-width="140px"
          style="max-width: 560px"
          @submit.prevent
        >
          <el-form-item label="达达门店编号" required>
            <el-input v-model="config.dadaShopNo" placeholder="达达商户后台创建门店后获得" />
          </el-form-item>
          <el-form-item label="城市编码" required>
            <el-input v-model="config.cityCode" placeholder="达达城市 code，如 028" />
          </el-form-item>
          <el-form-item label="门店纬度" required>
            <el-input-number v-model="config.storeLat" :precision="6" :step="0.000001" :controls="false" style="width: 100%" />
          </el-form-item>
          <el-form-item label="门店经度" required>
            <el-input-number v-model="config.storeLng" :precision="6" :step="0.000001" :controls="false" style="width: 100%" />
          </el-form-item>
          <el-form-item label="启用达达配送">
            <el-switch v-model="config.enabled" :active-value="1" :inactive-value="0" />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['restaurant:delivery:config']"
              type="primary"
              :loading="saving"
              @click="onSaveConfig"
            >
              保存配置
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as DeliveryApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantDelivery' })

const message = useMessage()

const activeTab = ref('delivery')
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const query = reactive({ pageNo: 1, pageSize: 10, status: undefined as number | undefined })

const configLoading = ref(false)
const saving = ref(false)
const config = reactive<any>({
  dadaShopNo: '',
  cityCode: '',
  storeLat: undefined,
  storeLng: undefined,
  enabled: 1
})

/** 状态文案 */
const statusText = (status: number) =>
  ({ 0: '待发单', 1: '待接单', 2: '待取货', 3: '配送中', 4: '已送达', 5: '已取消', 9: '妥投异常', 10: '发单失败' }[status] || '未知')
const statusTagType = (status: number) => {
  if (status === 4) return 'success'
  if (status === 3) return 'primary'
  if (status === 1 || status === 2) return 'warning'
  if (status === 5 || status === 9 || status === 10) return 'danger'
  return 'info'
}

/** 运单列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await DeliveryApi.getDeliveryPage({ ...query })
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 配置加载 */
const getConfig = async () => {
  configLoading.value = true
  try {
    const data = await DeliveryApi.getDeliveryConfig()
    if (data) {
      Object.assign(config, data)
    }
  } finally {
    configLoading.value = false
  }
}

/** 保存配置 */
const onSaveConfig = async () => {
  if (!config.dadaShopNo || !config.cityCode) {
    message.warning('请填写达达门店编号与城市编码')
    return
  }
  saving.value = true
  try {
    await DeliveryApi.saveDeliveryConfig({ ...config })
    message.success('保存成功')
  } finally {
    saving.value = false
  }
}

/** 发单 / 重发 */
const onSend = async (orderId: number) => {
  await message.confirm(`确认对订单 ${orderId} 发起达达配送吗？`)
  await DeliveryApi.sendDelivery(orderId)
  message.success('发单成功，等待骑手接单')
  getList()
}

/** 取消运单 */
const onCancel = async (row: any) => {
  await message.confirm(`确认取消订单 ${row.orderId} 的运单吗？`)
  await DeliveryApi.cancelDelivery(row.orderId)
  message.success('已取消')
  getList()
}

const onTabChange = (tab: string) => {
  if (tab === 'delivery') getList()
  else getConfig()
}

onMounted(() => {
  getList()
})
</script>
