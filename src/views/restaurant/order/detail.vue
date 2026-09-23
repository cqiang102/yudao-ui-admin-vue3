<template>
  <ContentWrap v-loading="loading">
    <div v-if="detail" class="p-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTag(detail.status)">{{ statusMap[detail.status] || detail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单类型">
          {{ typeMap[detail.type] || detail.type }}
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ payTypeMap[detail.payType] || detail.payType }}
        </el-descriptions-item>
        <el-descriptions-item label="总金额(分)">{{ detail.totalPrice }}</el-descriptions-item>
        <el-descriptions-item label="实付(分)">{{ detail.payPrice }}</el-descriptions-item>
        <el-descriptions-item label="优惠(分)">{{ detail.discountPrice }}</el-descriptions-item>
        <el-descriptions-item label="用餐人数">{{ detail.peopleCount }}</el-descriptions-item>
        <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDate(detail.paidTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDate(detail.finishTime) }}</el-descriptions-item>
        <el-descriptions-item label="取餐号">
          <el-tag v-if="detail.pickupNo" type="info">{{ detail.pickupNo }}</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="核销码">
          <el-tag v-if="detail.verifyCode" type="warning">{{ detail.verifyCode }}</el-tag>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="叫号时间">{{ formatDate(detail.calledTime) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">菜品明细</el-divider>
      <el-table :data="detail.items || []" border>
        <el-table-column label="菜品" prop="dishName" />
        <el-table-column label="图片" width="80">
          <template #default="scope">
            <img v-if="scope.row.image" :src="scope.row.image" style="width: 48px; height: 48px" />
          </template>
        </el-table-column>
        <el-table-column label="规格" prop="specDesc" />
        <el-table-column label="加料" prop="addonDesc" />
        <el-table-column label="单价(分)" prop="unitPrice" />
        <el-table-column label="数量" prop="quantity" />
        <el-table-column label="小计(分)" prop="totalPrice" />
      </el-table>

      <div class="mt-4 flex gap-2">
        <el-button
          v-hasPermi="['restaurant:order:accept']"
          v-if="detail.status === 2"
          type="primary"
          @click="handleAction('accept', '接单')"
        >接单</el-button>
        <el-button
          v-hasPermi="['restaurant:order:complete']"
          v-if="detail.status === 3"
          type="success"
          @click="handleAction('complete', '完成')"
        >完成</el-button>
        <el-button
          v-hasPermi="['restaurant:order:cancel']"
          v-if="detail.status === 1"
          type="warning"
          @click="handleAction('cancel', '取消')"
        >取消</el-button>
        <el-button
          v-hasPermi="['restaurant:order:call']"
          v-if="detail.status === 2 || detail.status === 3"
          type="primary"
          @click="handleCall"
        >叫号</el-button>
        <el-button
          v-hasPermi="['restaurant:order:verify']"
          v-if="detail.status === 2 || detail.status === 3"
          type="success"
          @click="handleVerify"
        >核销</el-button>
        <el-button
          v-hasPermi="['restaurant:order:refund']"
          v-if="[2, 3, 4].includes(detail.status)"
          type="danger"
          @click="handleRefund"
        >退款</el-button>
        <!-- 加菜：仅待支付订单可加菜（与后端 ORDER_ADD_ITEMS_STATUS_INVALID 口径一致） -->
        <el-button
          v-hasPermi="['restaurant:order:add-items']"
          v-if="detail.status === 1"
          type="warning"
          @click="openAddItems"
        >加菜</el-button>
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>

    <!-- 加菜弹窗 -->
    <el-dialog v-model="addItemsVisible" title="加菜（仅待支付订单）" width="760px" destroy-on-close>
      <el-form :inline="true" class="-mb-15px">
        <el-form-item label="菜品名称">
          <el-input v-model="dishQuery.name" class="!w-240px" clearable placeholder="搜索菜品" @keyup.enter="loadDishes" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadDishes">搜索</el-button>
          <el-button @click="resetDishQuery">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table v-loading="dishLoading" :data="dishList" border max-height="380">
        <el-table-column label="菜品" prop="name" min-width="160" />
        <el-table-column label="分类" prop="categoryId" width="90" />
        <el-table-column label="价格(元)" width="100">
          <template #default="scope">{{ (scope.row.price / 100).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="规格/加料" width="220">
          <template #default="scope">
            <template v-if="scope.row.specs?.length || scope.row.addons?.length">
              <el-button link type="primary" @click="openSpec(scope.row)">
                {{
                  scope.row._specDesc ||
                  (scope.row.specs?.length ? '请选择规格（必选）' : '选择加料')
                }}
              </el-button>
              <el-tag v-if="scope.row.addonIds?.length" size="small" class="ml-6px">
                加料 {{ scope.row.addonIds.length }} 项
              </el-tag>
            </template>
            <span v-else class="opt-none">-</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="160">
          <template #default="scope">
            <el-input-number v-model="scope.row._qty" :min="0" :max="999" :step="1" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="addItemsVisible = false">取消</el-button>
        <el-button type="primary" :disabled="selectedItems.length === 0" @click="submitAddItems">
          确认加菜（{{ selectedItems.length }} 项）
        </el-button>
      </template>
    </el-dialog>

    <!-- 加菜的规格/加料选择（有规格的必须选：后端 2026-09-20 起校验 2000006030） -->
    <el-dialog
      v-model="specVisible"
      :title="`选择规格/加料：${specDish?.name || ''}`"
      width="560px"
      append-to-body
    >
      <div v-for="(grp, gi) in specGroups" :key="gi" class="spec-block">
        <div class="spec-group-name">{{ grp.groupName }}（单选）</div>
        <el-radio-group v-model="pickedSpecId">
          <el-radio v-for="s in grp.options" :key="s.id" :value="s.id">
            {{ s.optionName }}
            <span class="spec-delta">
              {{ (s.priceDelta ?? 0) === 0 ? '' : `（+¥${((s.priceDelta ?? 0) / 100).toFixed(2)}）` }}
            </span>
          </el-radio>
        </el-radio-group>
      </div>
      <div v-if="specDish?.addons?.length" class="spec-block">
        <div class="spec-group-name">加料（可多选，按份计费）</div>
        <el-checkbox-group v-model="pickedAddonIds">
          <el-checkbox v-for="a in specDish.addons" :key="a.id" :value="a.id">
            {{ a.optionName }}
            <span class="spec-delta">（+¥{{ ((a.priceDelta ?? 0) / 100).toFixed(2) }}）</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <template #footer>
        <el-button @click="specVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSpec">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { formatDate } from '@/utils/formatTime'
import { ElMessageBox } from 'element-plus'
import { useMessage } from '@/hooks/web/useMessage'
import * as RestaurantApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantOrderDetail' })

const message = useMessage() // 消息弹窗

// 状态/类型/支付方式口径与 order/index.vue 保持一致（后端：OrderStatusEnum / OrderTypeEnum / setPayType）
const statusMap = {
  1: '待支付', 2: '已支付', 3: '制作中', 4: '已完成', 5: '已取消', 6: '退款中', 7: '已退款'
}
const typeMap = { 1: '堂食', 2: '自取', 3: '外卖', 4: '预约' }
const payTypeMap = { 0: '未支付', 1: '微信支付', 2: '余额支付', 4: '现金支付' }

function statusTag(status: number) {
  if (status === 2) return 'success'
  if (status === 3) return 'warning'
  if (status === 4) return 'success'
  if (status === 5) return 'info'
  if (status === 6 || status === 7) return 'danger'
  return 'warning'
}

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const detail = ref<any>(null)

/** 加载详情 */
const loadDetail = async () => {
  loading.value = true
  try {
    detail.value = await RestaurantApi.getOrder(Number(route.params.id))
  } finally {
    loading.value = false
  }
}

/** 接单/完成/取消 */
const handleAction = async (action: 'accept' | 'complete' | 'cancel', label: string) => {
  const id = Number(route.params.id)
  if (action === 'accept') await RestaurantApi.acceptOrder(id)
  else if (action === 'complete') await RestaurantApi.completeOrder(id)
  else await RestaurantApi.cancelOrder(id)
  message.success(label + '成功')
  loadDetail()
}

/** 叫号 */
const handleCall = async () => {
  await RestaurantApi.callOrder(Number(route.params.id))
  message.success('已叫号')
  loadDetail()
}

/** 核销（凭订单核销码完成订单，自动释放堂食桌台） */
const handleVerify = async () => {
  if (!detail.value?.verifyCode) {
    message.warning('该订单无核销码')
    return
  }
  await RestaurantApi.verifyOrder(detail.value.verifyCode, detail.value.storeId)
  message.success('核销成功，订单已完成')
  loadDetail()
}

/** 退款（原路退回，需填原因） */
const handleRefund = async () => {
  const id = Number(route.params.id)
  const { value } = await ElMessageBox.prompt('请输入退款原因', '订单退款', {
    confirmButtonText: '确认退款',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '退款原因不能为空',
  })
  await RestaurantApi.refundOrder(id, value)
  message.success('退款已发起')
  loadDetail()
}

const goBack = () => router.back()

// ========== 加菜 ==========
const addItemsVisible = ref(false)
const dishLoading = ref(false)
const dishList = ref<any[]>([])
const dishQuery = ref({ name: undefined as string | undefined, pageNo: 1, pageSize: 100 })

// 规格/加料选择：有规格的菜品必须选（与后端 2026-09-20 起的口径一致）
const specVisible = ref(false)
const specDish = ref<any>(null)
const pickedSpecId = ref<number | null>(null)
const pickedAddonIds = ref<number[]>([])

const specGroups = computed(() => {
  const d = specDish.value
  if (!d?.specs?.length) return []
  const map: Record<string, any> = {}
  d.specs.forEach((s: any) => {
    if (!map[s.groupName]) map[s.groupName] = { groupName: s.groupName, options: [] }
    map[s.groupName].options.push(s)
  })
  return Object.values(map)
})

const openSpec = (row: any) => {
  specDish.value = row
  pickedSpecId.value = row._specId ?? (row.specs?.length ? row.specs[0].id : null)
  pickedAddonIds.value = [...(row.addonIds || [])]
  specVisible.value = true
}

const confirmSpec = () => {
  const row = specDish.value
  if (!row) return
  if (row.specs?.length && pickedSpecId.value == null) {
    message.warning('该菜品有规格选项，请先选择规格')
    return
  }
  row._specId = pickedSpecId.value
  row.addonIds = [...pickedAddonIds.value]
  const spec = row.specs?.find((s: any) => s.id === row._specId)
  row._specDesc = spec ? `${spec.groupName}:${spec.optionName}` : ''
  specVisible.value = false
}

const selectedItems = computed(() =>
  dishList.value
    .filter((d) => (d._qty || 0) > 0)
    .map((d) => ({
      dishId: d.id,
      quantity: d._qty,
      specId: d._specId ?? null,
      addonIds: d.addonIds || []
    }))
)

const resetDishQuery = () => {
  dishQuery.value = { name: undefined, pageNo: 1, pageSize: 100 }
  loadDishes()
}

const loadDishes = async () => {
  dishLoading.value = true
  try {
    const res = await RestaurantApi.getDishPage({ ...dishQuery.value, status: 0 })
    dishList.value = (res.list || []).map((d: any) => ({ ...d, _qty: 0 }))
  } finally {
    dishLoading.value = false
  }
}

const openAddItems = () => {
  addItemsVisible.value = true
  resetDishQuery()
}

const submitAddItems = async () => {
  const rows = dishList.value.filter((d) => (d._qty || 0) > 0)
  // 有规格的菜品必须选规格，否则后端会报 2000006030；这里先拦好并直接把选择面板打开
  const missing = rows.find((d) => d.specs?.length && d._specId == null)
  if (missing) {
    message.warning(`「${missing.name}」有规格选项，请先选择规格`)
    openSpec(missing)
    return
  }
  const items = selectedItems.value
  if (!items.length) {
    message.warning('请至少选择一份菜品')
    return
  }
  await RestaurantApi.addOrderItems(Number(route.params.id), items)
  message.success('加菜成功')
  addItemsVisible.value = false
  loadDetail()
}

onMounted(loadDetail)
</script>

<style scoped>
.opt-none {
  color: var(--el-text-color-placeholder);
}
.spec-block {
  margin-bottom: 14px;
}
.spec-group-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}
.spec-delta {
  color: var(--el-color-danger);
  font-size: 12px;
}
</style>
