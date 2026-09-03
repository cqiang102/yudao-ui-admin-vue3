<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="门店" prop="storeId">
        <el-select v-model="queryParams.storeId" class="!w-280px" clearable placeholder="全部">
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:table:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新增桌台</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:table:create']" type="success" @click="openGenerate"><Icon icon="ep:magic-stick" /> 批量生成</el-button>
      </el-col>
    </el-row>

    <TableForm ref="formRef" @success="getList" />

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="桌台号" prop="tableNo" min-width="100" />
      <el-table-column align="center" label="座位数" prop="seats" min-width="80" />
      <el-table-column align="center" label="状态" min-width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'warning'">
            {{ scope.row.status === 0 ? '空闲' : scope.row.status === 1 ? '占用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" min-width="160" fixed="right">
        <template #default="scope">
          <el-button link type="success" @click="openQrcode(scope.row)">桌码</el-button>
          <el-button v-hasPermi="['restaurant:table:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:table:delete']" link type="danger" @click="del(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 落座桌码弹窗 -->
    <Dialog title="落座桌码" v-model="qrVisible" width="420px">
      <div v-loading="qrLoading" class="qr-wrap">
        <div v-if="qrContent" class="qr-box">
          <Qrcode :text="qrContent" :width="220" tag="canvas" />
          <p class="qr-tip">顾客扫码即可进入点餐页（堂食自动落座本桌）</p>
          <el-input v-model="qrContent" type="textarea" :rows="2" readonly />
          <el-button class="mt-2" @click="copyQr">复制桌码内容</el-button>
        </div>
        <div v-else class="qr-empty">加载中或桌码未生成</div>
        <el-divider />
        <el-form label-width="92px">
          <el-form-item label="H5 前缀">
            <el-input v-model="qrBaseUrl" placeholder="可选，如 https://m.xxx.com/" />
          </el-form-item>
          <el-button v-hasPermi="['restaurant:table:update']" type="primary" :disabled="!currentTableId" @click="doRegenerate">
            重新生成桌码
          </el-button>
        </el-form>
      </div>
    </Dialog>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTablePage, deleteTable, getStoreSimpleList, getTable, regenerateTableQrcode } from '@/api/restaurant'
import { Qrcode } from '@/components/Qrcode'
import TableForm from './TableForm.vue'
const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const storeOptions = ref<any[]>([])
const queryParams = ref({ pageNo: 1, pageSize: 10, storeId: undefined })
const formRef = ref()

// 桌码弹窗
const qrVisible = ref(false)
const qrLoading = ref(false)
const qrContent = ref('')
const qrBaseUrl = ref('')
const currentTableId = ref<number | undefined>(undefined)

async function getList() {
  loading.value = true
  try {
    const res = await getTablePage(queryParams.value)
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
  queryParams.value.storeId = undefined
  handleQuery()
}
function openCreate() {
  formRef.value.open('create')
}
function openGenerate() {
  // 批量生成：可后续扩展为按门店+起始号+数量批量创建
  message.info('批量生成功能待扩展')
}
function openEdit(row: any) {
  formRef.value.open('update', row.id)
}
async function openQrcode(row: any) {
  currentTableId.value = row.id
  qrBaseUrl.value = ''
  qrContent.value = ''
  qrVisible.value = true
  qrLoading.value = true
  try {
    const res = await getTable(row.id)
    qrContent.value = res.qrcodeContent || ''
  } finally {
    qrLoading.value = false
  }
}
async function doRegenerate() {
  if (!currentTableId.value) return
  const res = await regenerateTableQrcode(currentTableId.value, qrBaseUrl.value || undefined)
  qrContent.value = res
  message.success('桌码已重新生成')
}
function copyQr() {
  navigator.clipboard?.writeText(qrContent.value).then(
    () => message.success('已复制到剪贴板'),
    () => message.error('复制失败，请手动复制')
  )
}
async function del(id: number) {
  await deleteTable(id)
  getList()
}
onMounted(async () => {
  getList()
  const res = await getStoreSimpleList()
  storeOptions.value = res.data || []
})
</script>

<style lang="scss" scoped>
.qr-wrap { text-align: center; }
.qr-box { display: inline-flex; flex-direction: column; align-items: center; gap: 12px; }
.qr-tip { font-size: 12px; color: #999; margin: 4px 0; }
.qr-empty { color: #999; padding: 40px 0; }
.mt-2 { margin-top: 12px; }
</style>
