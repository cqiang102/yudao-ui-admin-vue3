<template>
  <ContentWrap>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="收支口径：累计收入 = 已支付订单实付金额（真实流水）；可提现 = 累计收入 −（已打款 + 待审核）提现。审核通过表示平台已完成线下打款。"
      class="mb-15px"
    />

    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="门店">
        <el-select v-model="storeId" filterable placeholder="请选择门店" style="width: 220px" @change="onStoreChange">
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          v-hasPermi="['restaurant:withdraw:apply']"
          type="primary"
          :disabled="!storeId"
          @click="openApply"
        >
          申请提现
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 收支概览 -->
    <el-row :gutter="16" class="mt-10px" v-if="summary">
      <el-col :span="8">
        <el-card shadow="never"><div class="stat-label">累计收入</div><div class="stat-value">¥{{ fen2yuan(summary.totalIncome) }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="stat-label">已提现/在途</div><div class="stat-value">¥{{ fen2yuan(summary.withdrawn) }}</div></el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never"><div class="stat-label">可提现余额</div><div class="stat-value" style="color: #fa5151">¥{{ fen2yuan(summary.available) }}</div></el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="mt-15px" @tab-change="getList">
      <!-- Tab 1：提现记录 -->
      <el-tab-pane label="提现记录" name="record">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="状态">
            <el-select v-model="status" placeholder="全部" clearable style="width: 120px" @change="getList">
              <el-option label="待审核" :value="0" />
              <el-option label="已打款" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-table v-loading="loading" :data="withdrawList" stripe>
          <el-table-column label="编号" prop="id" width="70" />
          <el-table-column label="金额" width="120" align="right">
            <template #default="{ row }">¥{{ fen2yuan(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="['warning', 'success', 'danger'][row.status]">
                {{ ['待审核', '已打款', '已驳回'][row.status] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="账户快照" prop="accountSnapshot" min-width="240" show-overflow-tooltip />
          <el-table-column label="申请备注" prop="applyRemark" min-width="120" show-overflow-tooltip />
          <el-table-column label="驳回原因" prop="rejectReason" min-width="120" show-overflow-tooltip />
          <el-table-column label="审核人" prop="auditUser" width="90" />
          <el-table-column label="申请时间" prop="createTime" width="170" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status === 0"
                v-hasPermi="['restaurant:withdraw:audit']"
                link
                type="primary"
                @click="openAudit(row)"
              >
                审核
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination v-model:limit="pageQuery.pageSize" v-model:page="pageQuery.pageNo" :total="total" @pagination="getList" />
      </el-tab-pane>

      <!-- Tab 2：提现账户 -->
      <el-tab-pane label="提现账户" name="account">
        <el-button
          v-hasPermi="['restaurant:withdraw:create']"
          type="success"
          class="mb-10px"
          :disabled="!storeId"
          @click="openAccountForm()"
        >
          新增账户
        </el-button>
        <el-table v-loading="accountLoading" :data="accountList" stripe>
          <el-table-column label="编号" prop="id" width="70" />
          <el-table-column label="类型" width="110">
            <template #default="{ row }">{{ ['对公银行', '微信', '支付宝'][row.accountType - 1] || row.accountType }}</template>
          </el-table-column>
          <el-table-column label="账户名称" prop="accountName" min-width="160" />
          <el-table-column label="账号" prop="accountNo" min-width="200" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'info'">{{ row.status === 0 ? '启用' : '停用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button v-hasPermi="['restaurant:withdraw:update']" link type="primary" @click="openAccountForm(row)">编辑</el-button>
              <el-button v-hasPermi="['restaurant:withdraw:delete']" link type="danger" @click="onDeleteAccount(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 申请提现 -->
    <Dialog v-model="applyVisible" title="申请提现" width="480px">
      <el-form label-width="90px">
        <el-form-item label="可提现余额">
          <span style="color: #fa5151; font-weight: 600">¥{{ fen2yuan(summary?.available) }}</span>
        </el-form-item>
        <el-form-item label="提现账户" required>
          <el-select v-model="applyForm.accountId" style="width: 100%">
            <el-option
              v-for="a in accountList.filter((x) => x.status === 0)"
              :key="a.id"
              :label="`${['对公银行', '微信', '支付宝'][a.accountType - 1] || a.accountType} | ${a.accountName} | ${a.accountNo}`"
              :value="a.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="提现金额" required>
          <el-input-number v-model="applyForm.amount" :min="1" :max="summary?.available || 0" :step="10000" controls-position="right" style="width: 100%" />
          <div class="text-gray-400 text-12px">单位：分；不可超过可提现余额</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="applyForm.applyRemark" placeholder="如 9 月上旬提现" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applyVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitApply">提 交</el-button>
      </template>
    </Dialog>

    <!-- 审核 -->
    <Dialog v-model="auditVisible" title="提现审核" width="480px">
      <el-form label-width="90px">
        <el-form-item label="提现单">
          <span>#{{ auditForm.id }} · ¥{{ fen2yuan(auditForm.amount) }}</span>
        </el-form-item>
        <el-form-item label="账户快照">
          <div style="white-space: pre-wrap; font-size: 12px; color: #666">{{ auditForm.accountSnapshot }}</div>
        </el-form-item>
        <el-form-item label="审核结果" required>
          <el-radio-group v-model="auditForm.approved">
            <el-radio :value="true">通过（已线下打款）</el-radio>
            <el-radio :value="false">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="驳回原因" v-if="auditForm.approved === false">
          <el-input v-model="auditForm.rejectReason" placeholder="驳回时必填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitAudit">确 定</el-button>
      </template>
    </Dialog>

    <!-- 账户表单 -->
    <Dialog v-model="accountVisible" :title="accountForm.id ? '编辑账户' : '新增账户'" width="480px">
      <el-form label-width="90px">
        <el-form-item label="账户类型" required>
          <el-select v-model="accountForm.accountType" style="width: 100%">
            <el-option label="对公银行" :value="1" />
            <el-option label="微信" :value="2" />
            <el-option label="支付宝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户名称" required>
          <el-input v-model="accountForm.accountName" placeholder="收款人/企业名" />
        </el-form-item>
        <el-form-item label="账号" required>
          <el-input v-model="accountForm.accountNo" placeholder="卡号/微信号/支付宝账号" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="accountForm.status" :active-value="0" :inactive-value="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="accountVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="submitAccount">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as RestaurantApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantWithdraw' })

const message = useMessage()

const loading = ref(false)
const accountLoading = ref(false)
const saving = ref(false)
const storeOptions = ref<any[]>([])
const storeId = ref<number | undefined>(undefined)
const activeTab = ref('record')
const summary = ref<any>(null)

const withdrawList = ref<any[]>([])
const total = ref(0)
const status = ref<number | undefined>(undefined)
const pageQuery = reactive({ pageNo: 1, pageSize: 10 })

const accountList = ref<any[]>([])
const applyVisible = ref(false)
const auditVisible = ref(false)
const accountVisible = ref(false)
const applyForm = reactive<any>({ accountId: undefined, amount: undefined, applyRemark: '' })
const auditForm = reactive<any>({ id: undefined, amount: undefined, accountSnapshot: '', approved: undefined, rejectReason: '' })
const accountForm = reactive<any>({ id: undefined, accountType: 1, accountName: '', accountNo: '', status: 0 })

const fen2yuan = (fen?: number | null) => (fen == null ? '0.00' : (Number(fen) / 100).toFixed(2))

const loadStores = async () => {
  const data = await RestaurantApi.getStorePage({ pageNo: 1, pageSize: 100 })
  storeOptions.value = data?.list || []
  if (!storeId.value && storeOptions.value.length) {
    storeId.value = storeOptions.value[0].id
    onStoreChange()
  }
}

const onStoreChange = () => {
  getSummary()
  getAccountList()
  getList()
}

const getSummary = async () => {
  if (!storeId.value) return
  summary.value = await RestaurantApi.getIncomeSummary(storeId.value)
}

const getAccountList = async () => {
  if (!storeId.value) return
  accountLoading.value = true
  try {
    accountList.value = (await RestaurantApi.getWithdrawAccountList(storeId.value)) || []
  } finally {
    accountLoading.value = false
  }
}

const getList = async () => {
  if (!storeId.value) return
  loading.value = true
  try {
    const data = await RestaurantApi.getWithdrawPage({ ...pageQuery, storeId: storeId.value, status: status.value })
    withdrawList.value = data.list
    total.value = data.total
    getSummary()
  } finally {
    loading.value = false
  }
}

const openApply = () => {
  Object.assign(applyForm, { accountId: undefined, amount: undefined, applyRemark: '' })
  applyVisible.value = true
}

const submitApply = async () => {
  if (!applyForm.accountId || !applyForm.amount) {
    message.warning('请选择账户并填写金额')
    return
  }
  saving.value = true
  try {
    await RestaurantApi.applyWithdraw({ storeId: storeId.value, ...applyForm })
    message.success('提现申请已提交')
    applyVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

const openAudit = (row: any) => {
  Object.assign(auditForm, { ...row, approved: undefined, rejectReason: '' })
  auditVisible.value = true
}

const submitAudit = async () => {
  if (auditForm.approved === undefined || auditForm.approved === null) {
    message.warning('请选择审核结果')
    return
  }
  saving.value = true
  try {
    await RestaurantApi.auditWithdraw({
      id: auditForm.id,
      approved: auditForm.approved,
      rejectReason: auditForm.rejectReason
    })
    message.success('审核完成')
    auditVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

const openAccountForm = (row?: any) => {
  Object.assign(accountForm, {
    id: row?.id,
    accountType: row?.accountType ?? 1,
    accountName: row?.accountName || '',
    accountNo: row?.accountNo || '',
    status: row?.status ?? 0
  })
  accountVisible.value = true
}

const submitAccount = async () => {
  if (!accountForm.accountName || !accountForm.accountNo) {
    message.warning('请填写账户名称与账号')
    return
  }
  saving.value = true
  try {
    const payload = { storeId: storeId.value, ...accountForm }
    if (accountForm.id) {
      await RestaurantApi.updateWithdrawAccount(payload)
    } else {
      await RestaurantApi.createWithdrawAccount(payload)
    }
    message.success('保存成功')
    accountVisible.value = false
    getAccountList()
  } finally {
    saving.value = false
  }
}

const onDeleteAccount = async (row: any) => {
  try {
    await message.delConfirm(`确认删除账户「${row.accountName}」？已有提现单的快照不受影响。`)
  } catch {
    return
  }
  await RestaurantApi.deleteWithdrawAccount(row.id)
  message.success('删除成功')
  getAccountList()
}

onMounted(() => {
  loadStores()
})
</script>

<style lang="scss" scoped>
.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.stat-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 600;
}
</style>
