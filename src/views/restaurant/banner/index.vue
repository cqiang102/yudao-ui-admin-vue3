<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="标题">
        <el-input v-model="query.title" placeholder="请输入标题" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="启用" :value="1" />
          <el-option label="禁用" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button
          v-hasPermi="['restaurant:banner:create']"
          type="success"
          @click="openCreate"
        >
          新增轮播图
        </el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="80" />
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <el-image
            v-if="row.image"
            :src="row.image"
            :preview-src-list="[row.image]"
            fit="cover"
            style="width: 80px; height: 45px; border-radius: 4px"
          />
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="标题" prop="title" min-width="160" />
      <el-table-column label="跳转" min-width="150">
        <template #default="{ row }">
          <span>
            {{ linkTypeText(row.linkType) }}
            <span v-if="row.linkValue"> · {{ row.linkValue }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['restaurant:banner:update']"
            link
            type="primary"
            @click="openEdit(row.id)"
          >
            编辑
          </el-button>
          <el-button
            v-hasPermi="['restaurant:banner:delete']"
            link
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
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

    <BannerForm ref="formRef" @success="getList" />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { getBannerPage, deleteBanner } from '@/api/restaurant'
import BannerForm from './BannerForm.vue'

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const formRef = ref<InstanceType<typeof BannerForm>>()

const query = reactive({
  title: '',
  status: undefined as number | undefined
})

function linkTypeText(type: number) {
  const map: Record<number, string> = { 0: '不跳转', 1: '菜品', 2: '门店', 3: '外链' }
  return map[type] ?? '不跳转'
}

async function getList() {
  loading.value = true
  try {
    const res = await getBannerPage({ ...query, pageNo: pageNo.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.title = ''
  query.status = undefined
  getList()
}

function openCreate() {
  formRef.value?.open('create')
}
function openEdit(id: number) {
  formRef.value?.open('update', id)
}

async function handleDelete(id: number) {
  try {
    await message.delConfirm('确认删除该轮播图？')
  } catch {
    return
  }
  await deleteBanner(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
