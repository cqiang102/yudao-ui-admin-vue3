<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="80px">
      <el-form-item label="后台账号" prop="adminUserId">
        <el-input v-model="queryParams.adminUserId" class="!w-240px" clearable placeholder="后台账号编号" />
      </el-form-item>
      <el-form-item label="门店编号" prop="storeId">
        <el-input v-model="queryParams.storeId" class="!w-240px" clearable placeholder="门店编号" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:store-staff:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新建店员绑定</el-button>
      </el-col>
    </el-row>

    <StoreStaffForm ref="formRef" @success="getList" />

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="编号" prop="id" min-width="80" />
      <el-table-column align="center" label="后台账号编号" prop="adminUserId" min-width="140" />
      <el-table-column align="center" label="门店编号" prop="storeId" min-width="110" />
      <el-table-column align="center" label="创建时间" prop="createTime" min-width="160" />
      <el-table-column align="center" label="操作" min-width="160" fixed="right">
        <template #default="scope">
          <el-button v-hasPermi="['restaurant:store-staff:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:store-staff:delete']" link type="danger" @click="del(scope.row.id)">删除</el-button>
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
import { getStoreStaffPage, deleteStoreStaff } from '@/api/restaurant'
import StoreStaffForm from './StoreStaffForm.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, adminUserId: undefined, storeId: undefined })
const formRef = ref()

async function getList() {
  loading.value = true
  try {
    const res = await getStoreStaffPage(queryParams.value)
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
  queryParams.value.adminUserId = undefined
  queryParams.value.storeId = undefined
  handleQuery()
}
function openCreate() {
  formRef.value.open('create')
}
function openEdit(row: any) {
  formRef.value.open('update', row.id)
}
async function del(id: number) {
  await deleteStoreStaff(id)
  getList()
}
getList()
</script>
