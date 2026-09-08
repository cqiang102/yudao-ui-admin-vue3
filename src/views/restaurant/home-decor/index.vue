<template>
  <ContentWrap>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="配置式装修：条目按「排序」从小到大渲染到小程序门店页顶部。类型：轮播 banner（全宽图）、金刚区入口（小图+名称）、推荐菜品位（标题，自动取本店菜品）。"
      class="mb-15px"
    />

    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="门店">
        <el-select v-model="storeId" filterable placeholder="请选择门店" style="width: 220px" @change="getList">
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button
          v-hasPermi="['restaurant:home-decor:create']"
          type="success"
          :disabled="!storeId"
          @click="openForm()"
        >
          新增条目
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="['success', 'primary', 'warning'][row.type - 1]">
            {{ ['轮播 banner', '金刚区入口', '推荐菜品位'][row.type - 1] || row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="140" />
      <el-table-column label="图片" min-width="160">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            preview-teleported
            fit="cover"
            style="width: 60px; height: 34px"
          />
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>
      <el-table-column label="跳转路径" prop="link" min-width="180" show-overflow-tooltip />
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
          <el-button v-hasPermi="['restaurant:home-decor:update']" link type="primary" @click="openForm(row)">
            编辑
          </el-button>
          <el-button v-hasPermi="['restaurant:home-decor:delete']" link type="danger" @click="onDelete(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="100px">
        <el-form-item label="类型" required>
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="轮播 banner" :value="1" />
            <el-option label="金刚区入口" :value="2" />
            <el-option label="推荐菜品位" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="金刚区名称/推荐位标题（≤50 字）" />
        </el-form-item>
        <el-form-item label="图片 URL" v-if="form.type !== 3">
          <el-input v-model="form.image" placeholder="https://..." />
        </el-form-item>
        <el-form-item label="跳转路径" v-if="form.type !== 3">
          <el-input v-model="form.link" placeholder="/pages/restaurant/... 或 https://..." />
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

defineOptions({ name: 'RestaurantHomeDecor' })

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const storeOptions = ref<any[]>([])
const storeId = ref<number | undefined>(undefined)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const form = reactive<any>({
  id: undefined,
  type: 1,
  title: '',
  image: '',
  link: '',
  sort: 0,
  status: 0
})

const getList = async () => {
  if (!storeId.value) return
  loading.value = true
  try {
    const data = await RestaurantApi.getHomeDecorList(storeId.value)
    list.value = data || []
  } finally {
    loading.value = false
  }
}

const loadStores = async () => {
  const data = await RestaurantApi.getStorePage({ pageNo: 1, pageSize: 100 })
  storeOptions.value = data?.list || []
  if (!storeId.value && storeOptions.value.length) {
    storeId.value = storeOptions.value[0].id
    getList()
  }
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑条目' : '新增条目'
  Object.assign(form, {
    id: row?.id,
    type: row?.type ?? 1,
    title: row?.title || '',
    image: row?.image || '',
    link: row?.link || '',
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
  saving.value = true
  try {
    const payload = { storeId: storeId.value, ...form }
    if (form.id) {
      await RestaurantApi.updateHomeDecor(payload)
    } else {
      await RestaurantApi.createHomeDecor(payload)
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
    await message.delConfirm(`确认删除条目「${row.title}」？`)
  } catch {
    return
  }
  await RestaurantApi.deleteHomeDecor(row.id)
  message.success('删除成功')
  getList()
}

onMounted(() => {
  loadStores()
})
</script>
