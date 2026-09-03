<template>
  <ContentWrap v-loading="loading">
    <div v-if="detail" class="p-4">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="订单号">{{ detail.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <dict-tag :type="DICT_TYPE.RESTAURANT_ORDER_STATUS" :value="detail.status" />
        </el-descriptions-item>
        <el-descriptions-item label="订单类型">
          <dict-tag :type="DICT_TYPE.RESTAURANT_ORDER_TYPE" :value="detail.type" />
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <dict-tag :type="DICT_TYPE.RESTAURANT_PAY_TYPE" :value="detail.payType" />
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
        <el-button @click="goBack">返回</el-button>
      </div>
    </div>
  </ContentWrap>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DICT_TYPE } from '@/utils/dict'
import { formatDate } from '@/utils/formatTime'
import { ElMessageBox } from 'element-plus'
import RestaurantApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantOrderDetail' })

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

onMounted(loadDetail)
</script>
