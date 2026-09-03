<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="等级名称" prop="name">
        <el-input v-model="queryParams.name" class="!w-240px" clearable placeholder="等级名称" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" class="!w-160px" clearable placeholder="状态">
          <el-option :value="1" label="启用" />
          <el-option :value="0" label="停用" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:member-level:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新建等级</el-button>
      </el-col>
    </el-row>

    <MemberLevelForm ref="formRef" @success="getList" />

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="编号" prop="id" min-width="80" />
      <el-table-column align="center" label="等级序号" prop="level" min-width="90" />
      <el-table-column align="center" label="等级名称" prop="name" min-width="140" />
      <el-table-column align="center" label="成长值门槛" prop="growthThreshold" min-width="100" />
      <el-table-column align="center" label="折扣率" min-width="100">
        <template #default="scope">
          <span>{{ scope.row.discountRate === 100 ? '无折扣' : scope.row.discountRate + ' 折' }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="权益描述" prop="benefits" min-width="200" show-overflow-tooltip />
      <el-table-column align="center" label="状态" prop="status" min-width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="创建时间" prop="createTime" min-width="160" />
      <el-table-column align="center" label="操作" min-width="150" fixed="right">
        <template #default="scope">
          <el-button v-hasPermi="['restaurant:member-level:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:member-level:delete']" link type="danger" @click="del(scope.row.id)">删除</el-button>
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
import { getMemberLevelPage, deleteMemberLevel } from '@/api/restaurant'
import MemberLevelForm from './MemberLevelForm.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, name: undefined, status: undefined })
const formRef = ref()

async function getList() {
  loading.value = true
  try {
    const res = await getMemberLevelPage(queryParams.value)
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
  queryParams.value.status = undefined
  handleQuery()
}
function openCreate() {
  formRef.value.open('create')
}
function openEdit(row: any) {
  formRef.value.open('update', row.id)
}
async function del(id: number) {
  await deleteMemberLevel(id)
  getList()
}
getList()
</script>
