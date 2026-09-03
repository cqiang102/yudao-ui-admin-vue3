<template>
  <ContentWrap title="订阅管理">
    <div class="toolbar">
      <el-button v-hasPermi="['restaurant:subscription:open']" type="primary" @click="openDialog">开通 / 续费</el-button>
    </div>
    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="套餐" prop="packageName" min-width="140" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '生效中' : '已过期' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="开始时间" prop="startTime" width="170" />
      <el-table-column label="过期时间" prop="expireTime" width="170" />
      <el-table-column label="实付金额" width="120">
        <template #default="{ row }">{{ (row.amount || 0) / 100 }} 元</template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="170" />
    </el-table>
    <el-pagination
      v-model:current-page="pageNo"
      v-model:page-size="pageSize"
      :total="total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next"
      @size-change="getList"
      @current-change="getList"
      style="margin-top: 12px; justify-content: flex-end"
    />

    <el-dialog v-model="dialogVisible" title="开通 / 续费订阅" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="租户编号" prop="tenantId">
          <el-input-number v-model="form.tenantId" :min="1" :step="1" style="width: 100%" />
          <span class="tip">要开通订阅的租户 ID（平台运营操作）</span>
        </el-form-item>
        <el-form-item label="套餐" prop="packageId">
          <el-select v-model="form.packageId" placeholder="请选择套餐" style="width: 100%">
            <el-option v-for="p in packageOptions" :key="p.id" :label="p.name" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="实付金额(分)" prop="amount">
          <el-input-number v-model="form.amount" :min="0" :max="99999999" :step="100" />
          <span class="tip">单位：分。例：19900 表示 199 元</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-hasPermi="['restaurant:subscription:open']" type="primary" :loading="submitting" @click="submit">确认开通</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { getSubscriptionPage, openSubscription, getPackagePage } from '@/api/restaurant'
import type { FormInstance, FormRules } from 'element-plus'

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()
const packageOptions = ref<any[]>([])
const form = reactive({
  tenantId: undefined as number | undefined,
  packageId: undefined as number | undefined,
  amount: 0
})
const rules: FormRules = {
  tenantId: [{ required: true, message: '请输入租户编号', trigger: 'blur' }],
  packageId: [{ required: true, message: '请选择套餐', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

async function getList() {
  loading.value = true
  try {
    const res = await getSubscriptionPage({ pageNo: pageNo.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

async function loadPackageOptions() {
  const res = await getPackagePage({ pageNo: 1, pageSize: 100 })
  packageOptions.value = res.list || []
}

function openDialog() {
  form.packageId = undefined
  form.amount = 0
  dialogVisible.value = true
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await openSubscription({ tenantId: form.tenantId, packageId: form.packageId, amount: form.amount })
    message.success('开通成功')
    dialogVisible.value = false
    await getList()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  getList()
  loadPackageOptions()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}
.tip {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
