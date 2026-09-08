<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="范围">
        <el-select v-model="queryStoreId" placeholder="全部" clearable style="width: 200px" @change="getList">
          <el-option label="全平台" :value="0" />
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">刷新</el-button>
        <el-button v-hasPermi="['restaurant:news:create']" type="success" @click="openForm()">
          发布资讯
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="范围" width="130">
        <template #default="{ row }">
          <el-tag :type="row.storeId === 0 ? 'warning' : 'primary'">
            {{ row.storeId === 0 ? '全平台' : '门店 #' + row.storeId }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="160" show-overflow-tooltip />
      <el-table-column label="摘要" prop="summary" min-width="160" show-overflow-tooltip />
      <el-table-column label="正文" prop="content" min-width="240" show-overflow-tooltip />
      <el-table-column label="排序" prop="sort" width="80" align="center" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'info'">
            {{ row.status === 0 ? '已发布' : '已下线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button v-hasPermi="['restaurant:news:update']" link type="primary" @click="openForm(row)">
            编辑
          </el-button>
          <el-button v-hasPermi="['restaurant:news:delete']" link type="danger" @click="onDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form label-width="90px">
        <el-form-item label="范围" required>
          <el-select v-model="form.storeId" style="width: 100%">
            <el-option label="全平台" :value="0" />
            <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如 新菜品上市（≤100 字）" />
        </el-form-item>
        <el-form-item label="摘要">
          <el-input v-model="form.summary" placeholder="列表页展示的一句话（可空）" />
        </el-form-item>
        <el-form-item label="正文" required>
          <el-input v-model="form.content" type="textarea" :rows="7" placeholder="纯文本，换行保留" />
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
        <el-button type="primary" :loading="saving" @click="onSubmit">保 存</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as RestaurantApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantNews' })

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const storeOptions = ref<any[]>([])
const queryStoreId = ref<number | undefined>(undefined)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const form = reactive<any>({
  id: undefined,
  storeId: 0,
  title: '',
  summary: '',
  content: '',
  sort: 0,
  status: 0
})

const getList = async () => {
  loading.value = true
  try {
    const data = await RestaurantApi.getNewsList(queryStoreId.value)
    list.value = data || []
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  const data = await RestaurantApi.getStorePage({ pageNo: 1, pageSize: 100 })
  storeOptions.value = data?.list || []
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑资讯' : '发布资讯'
  Object.assign(form, {
    id: row?.id,
    storeId: row?.storeId ?? 0,
    title: row?.title || '',
    summary: row?.summary || '',
    content: row?.content || '',
    sort: row?.sort ?? 0,
    status: row?.status ?? 0
  })
  dialogVisible.value = true
}

const onSubmit = async () => {
  if (!form.title || !form.content) {
    message.warning('请填写标题与正文')
    return
  }
  saving.value = true
  try {
    if (form.id) {
      await RestaurantApi.updateNews({ ...form })
    } else {
      await RestaurantApi.createNews({ ...form })
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
    await message.delConfirm(`确认删除资讯「${row.title}」？`)
  } catch {
    return
  }
  await RestaurantApi.deleteNews(row.id)
  message.success('删除成功')
  getList()
}

onMounted(() => {
  loadStores()
  getList()
})
</script>
