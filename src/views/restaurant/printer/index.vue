<template>
  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- Tab 1：打印机管理 -->
      <el-tab-pane label="打印机" name="printer">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="状态">
            <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="启用" :value="1" />
              <el-option label="停用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getList">查询</el-button>
            <el-button
              v-hasPermi="['restaurant:printer:create']"
              type="success"
              @click="openForm()"
            >
              添加打印机
            </el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="list" stripe>
          <el-table-column label="编号" prop="id" width="80" />
          <el-table-column label="名称" prop="name" min-width="120" />
          <el-table-column label="终端号" prop="machineCode" width="160" />
          <el-table-column label="打印联" width="100">
            <template #default="{ row }">
              <el-tag :type="row.printType === 2 ? 'warning' : 'primary'">
                {{ row.printType === 2 ? '后厨单' : '客用单' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="排序" prop="sort" width="80" />
          <el-table-column label="添加时间" prop="createTime" width="170" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['restaurant:printer:update']"
                link
                type="primary"
                @click="openForm(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['restaurant:printer:delete']"
                link
                type="danger"
                @click="onDelete(row)"
              >
                删除
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

      <!-- Tab 2：打印任务 -->
      <el-tab-pane label="打印任务" name="task" lazy>
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="订单编号">
            <el-input v-model="taskQuery.orderId" placeholder="订单编号" clearable style="width: 160px" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="taskQuery.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="待打印" :value="0" />
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getTaskList">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="taskLoading" :data="taskList" stripe>
          <el-table-column label="任务编号" prop="id" width="90" />
          <el-table-column label="订单编号" prop="orderId" width="110" />
          <el-table-column label="打印机" prop="printerName" min-width="120" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'">
                {{ taskStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="失败原因" prop="errorMsg" min-width="160">
            <template #default="{ row }">{{ row.errorMsg || '-' }}</template>
          </el-table-column>
          <el-table-column label="重试次数" prop="retryCount" width="90" />
          <el-table-column label="发送时间" prop="sendTime" width="170" />
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.status !== 1"
                v-hasPermi="['restaurant:printer:retry']"
                link
                type="primary"
                @click="onRetry(row)"
              >
                重试
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <Pagination
          v-model:page="taskQuery.pageNo"
          v-model:limit="taskQuery.pageSize"
          :total="taskTotal"
          @pagination="getTaskList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 打印机表单 -->
    <el-dialog v-model="formVisible" :title="formData.id ? '编辑打印机' : '添加打印机'" width="480px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：后厨单 / 收银台" maxlength="30" />
        </el-form-item>
        <el-form-item label="终端号" prop="machineCode">
          <el-input v-model="formData.machineCode" placeholder="易联云打印机机身 15 位数字" maxlength="20" />
        </el-form-item>
        <el-form-item label="打印联" prop="printType">
          <el-radio-group v-model="formData.printType">
            <el-radio :label="1">客用单</el-radio>
            <el-radio :label="2">后厨单</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="onSave">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
defineOptions({ name: 'RestaurantPrinter' })

import { onMounted, reactive, ref } from 'vue'
import {
  getPrinterPage,
  createPrinter,
  updatePrinter,
  deletePrinter,
  getPrintTaskPage,
  retryPrintTask
} from '@/api/restaurant'

const message = useMessage()

// ---------- 打印机列表 ----------
const activeTab = ref('printer')
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const query = reactive({ pageNo: 1, pageSize: 10, status: undefined as number | undefined })

const getList = async () => {
  loading.value = true
  try {
    const { code, data } = await getPrinterPage({ ...query })
    if (code === 0) {
      list.value = data.list || []
      total.value = data.total || 0
    }
  } finally {
    loading.value = false
  }
}

// ---------- 表单 ----------
const formVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  machineCode: '',
  printType: 1,
  status: 1,
  sort: 0
})
const rules = {
  name: [{ required: true, message: '名称不能为空', trigger: 'blur' }],
  machineCode: [
    { required: true, message: '终端号不能为空', trigger: 'blur' },
    { pattern: /^\d{6,20}$/, message: '终端号须为 6-20 位数字', trigger: 'blur' }
  ]
}

const openForm = (row?: any) => {
  formData.id = row?.id
  formData.name = row?.name || ''
  formData.machineCode = row?.machineCode || ''
  formData.printType = row?.printType ?? 1
  formData.status = row?.status ?? 1
  formData.sort = row?.sort ?? 0
  formVisible.value = true
}

const onSave = async () => {
  await formRef.value?.validate()
  saving.value = true
  try {
    const payload = { ...formData }
    if (formData.id) {
      await updatePrinter(payload)
    } else {
      await createPrinter(payload)
    }
    message.success('保存成功')
    formVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

const onDelete = async (row: any) => {
  await message.delConfirm('确认删除该打印机？')
  await deletePrinter(row.id)
  message.success('删除成功')
  getList()
}

// ---------- 打印任务 ----------
const taskLoading = ref(false)
const taskList = ref<any[]>([])
const taskTotal = ref(0)
const taskQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  orderId: undefined as number | undefined,
  status: undefined as number | undefined
})

const taskStatusText = (s: number) => (s === 1 ? '成功' : s === 2 ? '失败' : '待打印')

const getTaskList = async () => {
  taskLoading.value = true
  try {
    const { code, data } = await getPrintTaskPage({ ...taskQuery })
    if (code === 0) {
      taskList.value = data.list || []
      taskTotal.value = data.total || 0
    }
  } finally {
    taskLoading.value = false
  }
}

const onRetry = async (row: any) => {
  await retryPrintTask(row.id)
  message.success('已重试')
  getTaskList()
}

const onTabChange = (name: string | number) => {
  if (name === 'task' && taskList.value.length === 0) getTaskList()
}

onMounted(() => {
  getList()
})
</script>
