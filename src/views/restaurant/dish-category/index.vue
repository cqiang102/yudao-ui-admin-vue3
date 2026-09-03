<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="分类名称">
        <el-input v-model="query.name" placeholder="请输入分类名称" clearable />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="上架" :value="1" />
          <el-option label="下架" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button v-hasPermi="['restaurant:dish-category:create']" type="success" @click="openCreate">新增分类</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="编号" prop="id" width="80" />
      <el-table-column label="分类名称" prop="name" min-width="140" />
      <el-table-column label="排序" prop="sort" width="80" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'">
            {{ row.status === 1 ? '上架' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
      <el-table-column label="创建时间" prop="createTime" width="170" />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button v-hasPermi="['restaurant:dish-category:update']" link type="primary" @click="openEdit(row.id)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:dish-category:delete']" link type="danger" @click="handleDelete(row.id)">删除</el-button>
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

    <DishCategoryForm ref="formRef" @success="getList" />
  </ContentWrap>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { getDishCategoryPage, deleteDishCategory } from '@/api/restaurant'
import DishCategoryForm from './DishCategoryForm.vue'

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const formRef = ref<InstanceType<typeof DishCategoryForm>>()

const query = reactive({
  name: '',
  status: undefined as number | undefined
})

async function getList() {
  loading.value = true
  try {
    const res = await getDishCategoryPage({ ...query, pageNo: pageNo.value, pageSize: pageSize.value })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.name = ''
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
    await message.delConfirm('确认删除该分类？')
  } catch {
    return
  }
  await deleteDishCategory(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
