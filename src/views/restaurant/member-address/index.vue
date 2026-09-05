<template>
  <ContentWrap>
    <el-form :inline="true" class="-mb-15px" @submit.prevent>
      <el-form-item label="会员编号">
        <el-input
          v-model="query.userId"
          placeholder="请输入用户编号"
          clearable
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" stripe>
      <el-table-column label="地址编号" prop="id" width="90" />
      <el-table-column label="会员编号" prop="userId" width="90" />
      <el-table-column label="收货人" prop="name" min-width="100" />
      <el-table-column label="联系电话" prop="phone" width="130" />
      <el-table-column label="省市区" prop="region" min-width="150" />
      <el-table-column label="详细地址" prop="detail" min-width="200" show-overflow-tooltip />
      <el-table-column label="默认" width="80">
        <template #default="{ row }">
          <el-tag :type="row.defaultStatus === 1 ? 'success' : 'info'">
            {{ row.defaultStatus === 1 ? '默认' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createTime" width="170" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['restaurant:member-address:delete']"
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
  </ContentWrap>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { getMemberAddressPage, deleteMemberAddress } from '@/api/restaurant'

const message = useMessage()

const loading = ref(false)
const list = ref<any[]>([])
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

const query = reactive({
  userId: '' as string | number
})

async function getList() {
  loading.value = true
  try {
    const res = await getMemberAddressPage({
      userId: query.userId || undefined,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    })
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  pageNo.value = 1
  getList()
}

function resetQuery() {
  query.userId = ''
  handleQuery()
}

async function handleDelete(id: number) {
  try {
    await message.delConfirm('确认删除该收货地址？')
  } catch {
    return
  }
  await deleteMemberAddress(id)
  message.success('删除成功')
  await getList()
}

onMounted(getList)
</script>
