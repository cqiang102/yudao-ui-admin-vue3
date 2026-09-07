<template>
  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- Tab 1：模板配置 -->
      <el-tab-pane label="消息模板" name="template">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item>
            <el-button type="primary" @click="getTemplateList">刷新</el-button>
            <el-button
              v-hasPermi="['restaurant:notify:create']"
              type="success"
              @click="openForm()"
            >
              新增模板
            </el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="templateList" stripe>
          <el-table-column label="编号" prop="id" width="70" />
          <el-table-column label="场景" width="130">
            <template #default="{ row }">
              <el-tag :type="sceneTagType(row.scene)">{{ sceneText(row.scene) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="模板标题（须与微信公众平台一致）" prop="templateTitle" min-width="200" />
          <el-table-column label="关键词映射" prop="keywordConfig" min-width="180" show-overflow-tooltip />
          <el-table-column label="跳转页面" prop="page" min-width="140" show-overflow-tooltip />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['restaurant:notify:update']"
                link
                type="primary"
                @click="openForm(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['restaurant:notify:delete']"
                link
                type="danger"
                @click="onDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2：发送记录 -->
      <el-tab-pane label="发送记录" name="record">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="场景">
            <el-select v-model="recordQuery.scene" placeholder="全部" clearable style="width: 130px">
              <el-option label="支付成功" value="pay_success" />
              <el-option label="出餐完成" value="meal_ready" />
              <el-option label="退款成功" value="refund_success" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="recordQuery.status" placeholder="全部" clearable style="width: 100px">
              <el-option label="成功" :value="1" />
              <el-option label="失败" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getRecordList">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="recordLoading" :data="recordList" stripe>
          <el-table-column label="编号" prop="id" width="70" />
          <el-table-column label="场景" width="110">
            <template #default="{ row }">
              <el-tag :type="sceneTagType(row.scene)">{{ sceneText(row.scene) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="订单号" prop="orderId" width="90" />
          <el-table-column label="会员" prop="userId" width="90" />
          <el-table-column label="openid" prop="openid" width="150" show-overflow-tooltip />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="内容" prop="content" min-width="160" show-overflow-tooltip />
          <el-table-column label="失败原因" prop="errorMsg" min-width="140" show-overflow-tooltip />
          <el-table-column label="发送时间" prop="sendTime" width="170" />
        </el-table>
        <Pagination
          v-model:page="recordQuery.pageNo"
          v-model:limit="recordQuery.pageSize"
          :total="recordTotal"
          @pagination="getRecordList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 模板表单 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="620px">
      <el-form :model="form" label-width="120px" @submit.prevent>
        <el-form-item label="场景" required>
          <el-select v-model="form.scene" placeholder="请选择场景" style="width: 100%">
            <el-option label="支付成功" value="pay_success" />
            <el-option label="出餐完成" value="meal_ready" />
            <el-option label="退款成功" value="refund_success" />
          </el-select>
        </el-form-item>
        <el-form-item label="模板标题" required>
          <el-input
            v-model="form.templateTitle"
            placeholder="须与微信公众平台「订阅消息-我的模板」中的标题完全一致"
          />
        </el-form-item>
        <el-form-item label="关键词映射">
          <el-input
            v-model="form.keywordConfig"
            type="textarea"
            :rows="2"
            placeholder='如 {"character_string1":"订单号","amount3":"金额","time4":"时间"}'
          />
        </el-form-item>
        <el-form-item label="跳转页面">
          <el-input v-model="form.page" placeholder="如 pages/order/detail?id=1（留空不跳转）" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
import * as NotifyApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantNotify' })

const message = useMessage()

const activeTab = ref('template')
const loading = ref(false)
const templateList = ref<any[]>([])

const recordLoading = ref(false)
const recordList = ref<any[]>([])
const recordTotal = ref(0)
const recordQuery = reactive({
  pageNo: 1,
  pageSize: 10,
  scene: undefined as string | undefined,
  status: undefined as number | undefined
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const form = reactive<any>({
  id: undefined,
  scene: 'pay_success',
  templateTitle: '',
  keywordConfig: '',
  page: '',
  status: 1
})

const sceneText = (scene: string) =>
  ({ pay_success: '支付成功', meal_ready: '出餐完成', refund_success: '退款成功' }[scene] || scene)
const sceneTagType = (scene: string) =>
  ({ pay_success: 'success', meal_ready: 'warning', refund_success: 'danger' }[scene] || 'info')

const getTemplateList = async () => {
  loading.value = true
  try {
    const data = await NotifyApi.getNotifyTemplatePage({ pageNo: 1, pageSize: 100 })
    templateList.value = data.list
  } finally {
    loading.value = false
  }
}

const getRecordList = async () => {
  recordLoading.value = true
  try {
    const data = await NotifyApi.getNotifyRecordPage({ ...recordQuery })
    recordList.value = data.list
    recordTotal.value = data.total
  } finally {
    recordLoading.value = false
  }
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑模板' : '新增模板'
  Object.assign(form, {
    id: row?.id,
    scene: row?.scene || 'pay_success',
    templateTitle: row?.templateTitle || '',
    keywordConfig: row?.keywordConfig || '',
    page: row?.page || '',
    status: row?.status ?? 1
  })
  dialogVisible.value = true
}

const onSubmit = async () => {
  if (!form.scene || !form.templateTitle) {
    message.warning('请填写场景与模板标题')
    return
  }
  saving.value = true
  try {
    if (form.id) {
      await NotifyApi.updateNotifyTemplate({ ...form })
    } else {
      await NotifyApi.createNotifyTemplate({ ...form })
    }
    message.success('保存成功')
    dialogVisible.value = false
    getTemplateList()
  } finally {
    saving.value = false
  }
}

const onDelete = async (row: any) => {
  await message.confirm(`确认删除「${row.templateTitle}」模板吗？`)
  await NotifyApi.deleteNotifyTemplate(row.id)
  message.success('删除成功')
  getTemplateList()
}

const onTabChange = (tab: string) => {
  if (tab === 'template') getTemplateList()
  else getRecordList()
}

onMounted(() => {
  getTemplateList()
})
</script>
