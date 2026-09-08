<template>
  <ContentWrap>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="按「门店 + 星期」配置可预约时段。小程序端据此生成可选时段，并实时扣减已预约人数（取消/退款的预约单不计入占用）。"
      class="mb-15px"
    />

    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="门店">
        <el-select
          v-model="storeId"
          placeholder="请选择门店"
          filterable
          style="width: 220px"
          @change="onStoreChange"
        >
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :disabled="!storeId" @click="getList">查询</el-button>
        <el-button
          v-hasPermi="['restaurant:reserve-rule:create']"
          type="success"
          :disabled="!storeId"
          @click="openForm()"
        >
          新增规则
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="适用星期" width="110">
        <template #default="{ row }">
          <el-tag :type="row.weekday === -1 ? 'success' : 'info'">
            {{ weekdayText(row.weekday) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时段" width="160" align="center">
        <template #default="{ row }">{{ row.startTime }} ~ {{ row.endTime }}</template>
      </el-table-column>
      <el-table-column label="间隔(分钟)" prop="slotInterval" width="100" align="center" />
      <el-table-column label="单时段人数" prop="maxPeople" width="100" align="center" />
      <el-table-column label="提前天数" prop="advanceDays" width="90" align="center" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['restaurant:reserve-rule:update']"
            link
            type="primary"
            @click="openForm(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['restaurant:reserve-rule:delete']"
            link
            type="danger"
            @click="onDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 时段预览 -->
    <el-card v-if="storeId" shadow="never" class="mt-15px">
      <template #header>
        <div class="flex items-center">
          <span class="mr-10px">时段预览（含剩余可约人数）</span>
          <el-date-picker
            v-model="previewDate"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择日期"
            style="width: 160px"
            @change="getSlots"
          />
        </div>
      </template>
      <div v-loading="slotLoading">
        <el-tag
          v-for="s in slots"
          :key="s.time"
          :type="s.available ? 'success' : 'info'"
          effect="plain"
          class="mr-8px mb-8px"
        >
          {{ s.time }}（余 {{ s.remain }}）
        </el-tag>
        <div v-if="!slots.length" class="text-gray-400">该日无可预约时段（未配置规则或全部约满）</div>
      </div>
    </el-card>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="110px">
        <el-form-item label="适用星期" required>
          <el-select v-model="form.weekday" style="width: 100%">
            <el-option label="每天" :value="-1" />
            <el-option label="周日" :value="0" />
            <el-option label="周一" :value="1" />
            <el-option label="周二" :value="2" />
            <el-option label="周三" :value="3" />
            <el-option label="周四" :value="4" />
            <el-option label="周五" :value="5" />
            <el-option label="周六" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="时段" required>
          <el-time-picker
            v-model="timeRange"
            is-range
            format="HH:mm"
            value-format="HH:mm"
            range-separator="~"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="间隔(分钟)" required>
          <el-input-number v-model="form.slotInterval" :min="10" :max="240" :step="10" />
        </el-form-item>
        <el-form-item label="单时段人数" required>
          <el-input-number v-model="form.maxPeople" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="提前天数">
          <el-input-number v-model="form.advanceDays" :min="0" :max="60" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="0" :inactive-value="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as RestaurantApi from '@/api/restaurant'
import dayjs from 'dayjs'

defineOptions({ name: 'RestaurantReserveRule' })

const message = useMessage()

const loading = ref(false)
const slotLoading = ref(false)
const list = ref<any[]>([])
const storeOptions = ref<any[]>([])
const storeId = ref<number | undefined>(undefined)
const slots = ref<any[]>([])
const previewDate = ref(dayjs().format('YYYY-MM-DD'))

const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const timeRange = ref<string[]>(['10:00', '21:00'])
const form = reactive<any>({
  id: undefined,
  storeId: undefined,
  weekday: -1,
  startTime: '10:00',
  endTime: '21:00',
  slotInterval: 30,
  maxPeople: 10,
  advanceDays: 7,
  status: 0
})

const weekdayText = (w: number) =>
  ({ '-1': '每天', 0: '周日', 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五', 6: '周六' }[w] ?? w)

const loadStores = async () => {
  const data = await RestaurantApi.getStorePage({ pageNo: 1, pageSize: 100 })
  storeOptions.value = data?.list || []
  if (!storeId.value && storeOptions.value.length) {
    storeId.value = storeOptions.value[0].id
    getList()
    getSlots()
  }
}

const getList = async () => {
  if (!storeId.value) return
  loading.value = true
  try {
    const data = await RestaurantApi.getReserveRuleList(storeId.value)
    list.value = data || []
  } finally {
    loading.value = false
  }
}

const getSlots = async () => {
  if (!storeId.value || !previewDate.value) return
  slotLoading.value = true
  try {
    const data = await RestaurantApi.getReserveSlots(storeId.value, previewDate.value)
    slots.value = data || []
  } finally {
    slotLoading.value = false
  }
}

const onStoreChange = () => {
  getList()
  getSlots()
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑规则' : '新增规则'
  Object.assign(form, {
    id: row?.id,
    storeId: storeId.value,
    weekday: row?.weekday ?? -1,
    startTime: row?.startTime || '10:00',
    endTime: row?.endTime || '21:00',
    slotInterval: row?.slotInterval ?? 30,
    maxPeople: row?.maxPeople ?? 10,
    advanceDays: row?.advanceDays ?? 7,
    status: row?.status ?? 0
  })
  timeRange.value = [form.startTime, form.endTime]
  dialogVisible.value = true
}

const onSubmit = async () => {
  if (!Array.isArray(timeRange.value) || timeRange.value.length !== 2) {
    message.warning('请选择时段')
    return
  }
  form.startTime = timeRange.value[0]
  form.endTime = timeRange.value[1]
  if (form.startTime >= form.endTime) {
    message.warning('结束时间须晚于开始时间')
    return
  }
  saving.value = true
  try {
    if (form.id) {
      await RestaurantApi.updateReserveRule({ ...form })
    } else {
      await RestaurantApi.createReserveRule({ ...form })
    }
    message.success('保存成功')
    dialogVisible.value = false
    getList()
    getSlots()
  } finally {
    saving.value = false
  }
}

const onDelete = async (row: any) => {
  try {
    await message.delConfirm(`确认删除该预约规则？删除后会员端不再生成对应时段。`)
  } catch {
    return
  }
  await RestaurantApi.deleteReserveRule(row.id)
  message.success('删除成功')
  getList()
  getSlots()
}

onMounted(() => {
  loadStores()
})
</script>
