<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="菜品名称" prop="name">
        <el-input v-model="queryParams.name" class="!w-280px" clearable placeholder="菜品名称" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:dish:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新增菜品</el-button>
      </el-col>
    </el-row>

    <DishForm ref="formRef" @success="getList" />

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="菜品" prop="name" min-width="140" />
      <el-table-column align="center" label="分类" prop="categoryId" min-width="90" />
      <el-table-column align="center" label="价格(元)" min-width="100">
        <template #default="scope">{{ (scope.row.price / 100).toFixed(2) }}</template>
      </el-table-column>
      <el-table-column align="center" label="状态" min-width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'info'">
            {{ scope.row.status === 0 ? '在售' : '下架' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" min-width="160" fixed="right">
        <template #default="scope">
          <el-button v-hasPermi="['restaurant:dish:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:dish:delete']" link type="danger" @click="del(scope.row.id)">删除</el-button>
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
import { getDishPage, deleteDish } from '@/api/restaurant'
import DishForm from './DishForm.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, name: undefined })
const formRef = ref()

async function getList() {
  loading.value = true
  try {
    const res = await getDishPage(queryParams.value)
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
async function del(id: number) {
  await deleteDish(id)
  getList()
}
getList()
</script>
