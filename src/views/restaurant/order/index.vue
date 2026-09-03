<template>
  <ContentWrap>
    <!-- 搜索 -->
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="订单状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-280px" clearable placeholder="全部">
          <el-option v-for="(v, k) in statusMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="订单类型" prop="type">
        <el-select v-model="queryParams.type" class="!w-280px" clearable placeholder="全部">
          <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">
          <Icon icon="ep:search" /> 搜索
        </el-button>
        <el-button @click="resetQuery">
          <Icon icon="ep:refresh" /> 重置
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 操作工具栏 -->
    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:order:create']" type="primary" @click="openCreate">
          <Icon icon="ep:plus" /> 新建订单
        </el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:order:verify']" type="warning" @click="verifyVisible = true">
          <Icon icon="ep:scan" /> 扫码核销
        </el-button>
      </el-col>
    </el-row>

    <!-- 列表 -->
    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="订单号" prop="orderNo" min-width="180" />
      <el-table-column align="center" label="门店" prop="storeId" min-width="80" />
      <el-table-column align="center" label="类型" min-width="80">
        <template #default="scope">{{ typeMap[scope.row.type] || '堂食' }}</template>
      </el-table-column>
      <el-table-column align="center" label="取餐号" min-width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.pickupNo" type="info">{{ scope.row.pickupNo }}</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="状态" min-width="90">
        <template #default="scope">
          <el-tag :type="statusTag(scope.row.status)">
            {{ statusMap[scope.row.status] || scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="实付(元)" min-width="100">
        <template #default="scope">{{ (scope.row.payPrice / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column align="center" label="创建时间" prop="createTime" min-width="160" />
      <el-table-column align="center" label="操作" min-width="240" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">详情</el-button>
          <el-button
            v-hasPermi="['restaurant:order:cancel']"
            v-if="scope.row.status === 1"
            link type="warning"
            @click="handleCancel(scope.row.id)"
          >取消</el-button>
          <el-button
            v-hasPermi="['restaurant:order:accept']"
            v-if="scope.row.status === 2"
            link type="success"
            @click="handleAccept(scope.row.id)"
          >接单</el-button>
          <el-button
            v-hasPermi="['restaurant:order:call']"
            v-if="scope.row.status === 2 || scope.row.status === 3"
            link type="primary"
            @click="handleCall(scope.row.id)"
          >叫号</el-button>
          <el-button
            v-hasPermi="['restaurant:order:verify']"
            v-if="scope.row.status === 2 || scope.row.status === 3"
            link type="success"
            @click="handleVerify(scope.row)"
          >核销</el-button>
          <el-button
            v-hasPermi="['restaurant:order:complete']"
            v-if="scope.row.status === 3"
            link type="success"
            @click="handleComplete(scope.row.id)"
          >完成</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />

    <!-- 扫码核销弹窗 -->
    <el-dialog v-model="verifyVisible" title="扫码核销" width="420px">
      <el-alert type="info" :closable="false" class="mb-3" title="输入顾客出示的 6 位核销码（扫码枪扫码即自动填入），核销成功即视为订单完成并释放堂食桌台。" />
      <el-input v-model="verifyCode" placeholder="请输入核销码" maxlength="8" clearable @keyup.enter="submitVerify" />
      <template #footer>
        <el-button @click="verifyVisible = false">取消</el-button>
        <el-button v-hasPermi="['restaurant:order:verify']" type="primary" @click="submitVerify">确认核销</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getOrderPage, cancelOrder, acceptOrder, completeOrder, callOrder, verifyOrder } from '@/api/restaurant'

const statusMap = {
  1: '待支付', 2: '已支付', 3: '制作中', 4: '已完成', 5: '已取消', 6: '退款中', 7: '已退款'
}
const typeMap = { 1: '堂食', 2: '自取', 3: '外卖' }

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const router = useRouter()
const queryParams = ref({ pageNo: 1, pageSize: 10, status: undefined, type: undefined })

const verifyVisible = ref(false)
const verifyCode = ref('')

async function getList() {
  loading.value = true
  try {
    const res = await getOrderPage(queryParams.value)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}
function statusTag(status: number) {
  if (status === 2) return 'success'
  if (status === 3) return 'warning'
  if (status === 4) return 'success'
  if (status === 5) return 'info'
  if (status === 6 || status === 7) return 'danger'
  return 'warning'
}
function handleQuery() {
  queryParams.value.pageNo = 1
  getList()
}
function resetQuery() {
  queryParams.value.status = undefined
  queryParams.value.type = undefined
  handleQuery()
}
function openDetail(row: any) {
  router.push(`/restaurant/order/detail/${row.id}`)
}
function openCreate() {
  // 新建订单页面可后续补充 form/index.vue
}
async function handleCancel(id: number) {
  await cancelOrder(id)
  getList()
}
async function handleAccept(id: number) {
  await acceptOrder(id)
  getList()
}
async function handleComplete(id: number) {
  await completeOrder(id)
  getList()
}
async function handleCall(id: number) {
  await callOrder(id)
  getList()
}
async function handleVerify(row: any) {
  const code = (row.verifyCode || '').trim().toUpperCase()
  if (!code) return
  await verifyOrder(code, row.storeId)
  getList()
}
async function submitVerify() {
  const code = (verifyCode.value || '').trim().toUpperCase()
  if (!code) return
  await verifyOrder(code)
  verifyVisible.value = false
  verifyCode.value = ''
  getList()
}

getList()
</script>
