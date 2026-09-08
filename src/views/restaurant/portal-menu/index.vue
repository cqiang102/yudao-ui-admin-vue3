<template>
  <ContentWrap>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="配置小程序「我的」页的服务入口。门店无配置时，会员端自动回退平台默认（storeId = 0）菜单。"
      class="mb-15px"
    />

    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item>
        <el-button type="primary" @click="getList">刷新</el-button>
        <el-button
          v-hasPermi="['restaurant:portal-menu:create']"
          type="success"
          @click="openForm()"
        >
          新增菜单项
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="70" />
      <el-table-column label="图标" width="80" align="center">
        <template #default="{ row }">{{ row.icon || '—' }}</template>
      </el-table-column>
      <el-table-column label="菜单名称" prop="name" min-width="120" />
      <el-table-column label="跳转路径" prop="path" min-width="220" show-overflow-tooltip />
      <el-table-column label="门店" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="row.storeId === 0 ? 'info' : 'success'">
            {{ row.storeId === 0 ? '平台默认' : '#' + row.storeId }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="70" />
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
            v-hasPermi="['restaurant:portal-menu:update']"
            link
            type="primary"
            @click="openForm(row)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['restaurant:portal-menu:delete']"
            link
            type="danger"
            @click="onDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <Dialog v-model="dialogVisible" :title="dialogTitle" width="520px">
      <el-form label-width="90px">
        <el-form-item label="菜单名称" required>
          <el-input v-model="form.name" placeholder="如 会员储值（≤20 字）" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="emoji，如 💳（可留空）" />
        </el-form-item>
        <el-form-item label="跳转路径" required>
          <el-input
            v-model="form.path"
            placeholder="/pages/restaurant/recharge 或 https://..."
          />
        </el-form-item>
        <el-form-item label="门店编号">
          <el-input-number v-model="form.storeId" :min="0" controls-position="right" />
          <span class="ml-10px text-gray-400">0 = 平台默认（会员端兜底）</span>
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
import * as PortalMenuApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantPortalMenu' })

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const form = reactive<any>({
  id: undefined,
  storeId: 0,
  name: '',
  icon: '',
  path: '',
  sort: 0,
  status: 0
})

const getList = async () => {
  loading.value = true
  try {
    const data = await PortalMenuApi.getPortalMenuList()
    list.value = data || []
  } finally {
    loading.value = false
  }
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑菜单项' : '新增菜单项'
  Object.assign(form, {
    id: row?.id,
    storeId: row?.storeId ?? 0,
    name: row?.name || '',
    icon: row?.icon || '',
    path: row?.path || '',
    sort: row?.sort ?? 0,
    status: row?.status ?? 0
  })
  dialogVisible.value = true
}

const onSubmit = async () => {
  if (!form.name) {
    message.warning('请填写菜单名称')
    return
  }
  if (!form.path) {
    message.warning('请填写跳转路径')
    return
  }
  saving.value = true
  try {
    if (form.id) {
      await PortalMenuApi.updatePortalMenu({ ...form })
    } else {
      await PortalMenuApi.createPortalMenu({ ...form })
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
    await message.delConfirm(`确认删除「${row.name}」？删除后会员端不再展示该入口。`)
  } catch {
    return
  }
  await PortalMenuApi.deletePortalMenu(row.id)
  message.success('删除成功')
  getList()
}

onMounted(() => {
  getList()
})
</script>
