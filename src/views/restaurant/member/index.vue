<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="会员ID" prop="id">
        <el-input v-model="queryParams.id" class="!w-200px" clearable placeholder="会员ID" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="会员ID" prop="id" min-width="90" />
      <el-table-column align="center" label="用户ID" prop="userId" min-width="90" />
      <el-table-column align="center" label="等级" prop="level" min-width="70" />
      <el-table-column align="center" label="积分" prop="pointsBalance" min-width="90" />
      <el-table-column align="center" label="成长值" prop="growthValue" min-width="90" />
      <el-table-column align="center" label="创建时间" prop="createTime" min-width="160" />
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
import { getMemberPage } from '@/api/restaurant'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, id: undefined })

async function getList() {
  loading.value = true
  try {
    const res = await getMemberPage(queryParams.value)
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
  queryParams.value.id = undefined
  handleQuery()
}
getList()
</script>
