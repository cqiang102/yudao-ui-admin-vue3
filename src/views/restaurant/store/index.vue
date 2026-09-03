<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="门店名称" prop="name">
        <el-input v-model="queryParams.name" class="!w-280px" clearable placeholder="门店名称" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:store:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新建门店</el-button>
      </el-col>
    </el-row>

    <StoreForm ref="formRef" @success="getList" />

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="编号" prop="id" min-width="80" />
      <el-table-column align="center" label="门店名称" prop="name" min-width="140" />
      <el-table-column align="center" label="联系电话" prop="phone" min-width="120" />
      <el-table-column align="center" label="地址" prop="address" min-width="200" />
      <el-table-column align="center" label="创建时间" prop="createTime" min-width="160" />
      <el-table-column align="center" label="操作" min-width="160" fixed="right">
        <template #default="scope">
          <el-button v-hasPermi="['restaurant:store:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:store:delete']" link type="danger" @click="del(scope.row.id)">删除</el-button>
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
import { getStorePage, deleteStore } from '@/api/restaurant'
import StoreForm from './StoreForm.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, name: undefined })
const formRef = ref()

async function getList() {
  loading.value = true
  try {
    const res = await getStorePage(queryParams.value)
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
  await deleteStore(id)
  getList()
}
getList()
</script>
