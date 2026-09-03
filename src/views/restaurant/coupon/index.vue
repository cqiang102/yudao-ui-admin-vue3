<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="模板名称" prop="name">
        <el-input v-model="queryParams.name" class="!w-280px" clearable placeholder="模板名称" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb-4">
      <el-col :span="1.5">
        <el-button v-hasPermi="['restaurant:coupon-template:create']" type="primary" @click="openCreate"><Icon icon="ep:plus" /> 新建券模板</el-button>
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="模板名" prop="name" min-width="140" />
      <el-table-column align="center" label="类型" min-width="80">
        <template #default="scope">
          {{ scope.row.type === 1 ? '满减' : scope.row.type === 2 ? '折扣' : '—' }}
        </template>
      </el-table-column>
      <el-table-column align="center" label="优惠" min-width="150">
        <template #default="scope">
          <template v-if="scope.row.type === 1">
            <span v-if="scope.row.thresholdAmount > 0">满{{ (scope.row.thresholdAmount / 100).toFixed(2) }}元 </span>
            减{{ (scope.row.discountValue / 100).toFixed(2) }}元
          </template>
          <template v-else-if="scope.row.type === 2">
            {{ (scope.row.discountValue / 10).toFixed(1) }}折
          </template>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="发放量" prop="total" min-width="90" />
      <el-table-column align="center" label="已领" prop="takenCount" min-width="90" />
      <el-table-column align="center" label="每人限领" prop="perLimit" min-width="90" />
      <el-table-column align="center" label="有效天数" prop="validDays" min-width="90" />
      <el-table-column align="center" label="状态" min-width="80">
        <template #default="scope">
          <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
            {{ scope.row.status === 1 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column align="center" label="操作" min-width="160" fixed="right">
        <template #default="scope">
          <el-button v-hasPermi="['restaurant:coupon-template:update']" link type="primary" @click="openEdit(scope.row)">编辑</el-button>
          <el-button v-hasPermi="['restaurant:coupon-template:delete']" link type="danger" @click="del(scope.row.id)">删除</el-button>
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

  <CouponForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  getCouponTemplatePage,
  deleteCouponTemplate
} from '@/api/restaurant'
import CouponForm from './CouponForm.vue'

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, name: undefined })

const formRef = ref()
function openCreate() {
  formRef.value.open('create')
}
function openEdit(row: any) {
  formRef.value.open('update', row.id)
}

async function getList() {
  loading.value = true
  try {
    const res = await getCouponTemplatePage(queryParams.value)
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
async function del(id: number) {
  await deleteCouponTemplate(id)
  getList()
}
getList()
</script>
