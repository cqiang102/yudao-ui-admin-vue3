<template>
  <ContentWrap>
    <el-alert
      type="warning"
      :closable="false"
      title="套餐与订阅为平台级功能，仅平台管理员可见；商户在【系统管理-租户】下开通对应套餐。"
      class="mb-4"
    />
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="套餐名" prop="name">
        <el-input v-model="queryParams.name" class="!w-280px" clearable placeholder="套餐名" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:package:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新建套餐</el-button>
      </el-col>
    </el-row>

    <PackageForm ref="formRef" @success="getList" />

    <!-- 开通订阅弹窗 -->
    <Dialog title="开通订阅" v-model="subVisible">
      <el-form ref="subFormRef" :model="subForm" :rules="subRules" label-width="110px" v-loading="subLoading">
        <el-form-item label="套餐" prop="packageId">
          <el-input :model-value="subPackageName" disabled />
        </el-form-item>
        <el-form-item label="租户ID" prop="tenantId">
          <el-input-number v-model="subForm.tenantId" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button v-hasPermi="['restaurant:subscription:open']" @click="submitSub" type="primary" :disabled="subLoading">确 定</el-button>
        <el-button @click="subVisible = false">取 消</el-button>
      </template>
    </Dialog>

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="套餐名" prop="name" min-width="140" />
      <el-table-column align="center" label="价格(元)" min-width="100">
        <template #default="scope">{{ (scope.row.price / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column align="center" label="时长(月)" prop="durationMonths" min-width="90" />
      <el-table-column align="center" label="门店上限" prop="maxStores" min-width="90" />
      <el-table-column align="center" label="操作" min-width="160" fixed="right">
        <template #default="scope">
          <el-button v-hasPermi="['restaurant:package:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:subscription:open']" link type="success" @click="openSub(scope.row)">开通</el-button>
          <el-button v-hasPermi="['restaurant:package:delete']" link type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getPackagePage, openSubscription, deletePackage } from '@/api/restaurant'
import PackageForm from './PackageForm.vue'
const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, name: undefined })
const formRef = ref()

// 开通订阅弹窗状态
const subVisible = ref(false)
const subLoading = ref(false)
const subFormRef = ref()
const subPackageName = ref('')
const subForm = ref({ packageId: undefined, tenantId: undefined })
const subRules = reactive({
  tenantId: [{ required: true, message: '租户ID不能为空', trigger: 'blur' }]
})

async function getList() {
  loading.value = true
  try {
    const res = await getPackagePage(queryParams.value)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}
function handleQuery() {
  queryParams.value.pageNo = 1
  getList()
}
function resetQuery() {
  queryParams.value.name = undefined
  handleQuery()
}
function openCreate() {
  formRef.value.open('create')
}
function openEdit(row: any) {
  formRef.value.open('update', row.id)
}
function openSub(row: any) {
  subForm.value = { packageId: row.id, tenantId: undefined }
  subPackageName.value = row.name
  subVisible.value = true
}
async function submitSub() {
  await subFormRef.value.validate()
  subLoading.value = true
  try {
    await openSubscription(subForm.value)
    message.success('开通成功')
    subVisible.value = false
  } finally {
    subLoading.value = false
  }
}
async function handleDelete(row: any) {
  await message.delConfirm(`确认删除套餐「${row.name}」？删除后该套餐不可恢复。`)
  await deletePackage(row.id)
  message.success('删除成功')
  await getList()
}
getList()
</script>
