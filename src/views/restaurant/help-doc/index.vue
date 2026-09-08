<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="类型">
        <el-select v-model="queryType" placeholder="全部" clearable style="width: 140px" @change="getList">
          <el-option label="帮助中心" :value="1" />
          <el-option label="关于我们" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">刷新</el-button>
        <el-button
          v-hasPermi="['restaurant:help-doc:create']"
          type="success"
          @click="openForm()"
        >
          新增文档
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="类型" width="110">
        <template #default="{ row }">
          <el-tag :type="row.type === 1 ? 'primary' : 'warning'">
            {{ row.type === 1 ? '帮助中心' : '关于我们' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="180" show-overflow-tooltip />
      <el-table-column label="正文" prop="content" min-width="260" show-overflow-tooltip />
      <el-table-column label="排序" prop="sort" width="80" align="center" />
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
            v-hasPermi="['restaurant:help-doc:update']"
            link
            type="primary"
            @click="openForm(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['restaurant:help-doc:delete']"
            link
            type="danger"
            @click="onDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form label-width="80px">
        <el-form-item label="类型" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="帮助中心" :value="1" />
            <el-option label="关于我们" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如 如何开发票（≤100 字）" />
        </el-form-item>
        <el-form-item label="正文" required>
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="8"
            placeholder="纯文本，换行保留；小程序端直接展示"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" controls-position="right" />
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

defineOptions({ name: 'RestaurantHelpDoc' })

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const queryType = ref<number | undefined>(undefined)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const form = reactive<any>({
  id: undefined,
  type: 1,
  title: '',
  content: '',
  sort: 0,
  status: 0
})

const getList = async () => {
  loading.value = true
  try {
    const data = await RestaurantApi.getHelpDocList(queryType.value)
    list.value = data || []
  } finally {
    loading.value = false
  }
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑文档' : '新增文档'
  Object.assign(form, {
    id: row?.id,
    type: row?.type ?? 1,
    title: row?.title || '',
    content: row?.content || '',
    sort: row?.sort ?? 0,
    status: row?.status ?? 0
  })
  dialogVisible.value = true
}

const onSubmit = async () => {
  if (!form.title) {
    message.warning('请填写标题')
    return
  }
  if (!form.content) {
    message.warning('请填写正文')
    return
  }
  saving.value = true
  try {
    if (form.id) {
      await RestaurantApi.updateHelpDoc({ ...form })
    } else {
      await RestaurantApi.createHelpDoc({ ...form })
    }
    message.success('保存成功')
    dialogVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

const onDelete = async (row: any) => {
  try {
    await message.delConfirm(`确认删除「${row.title}」？`)
  } catch {
    return
  }
  await RestaurantApi.deleteHelpDoc(row.id)
  message.success('删除成功')
  getList()
}

onMounted(() => {
  getList()
})
</script>
