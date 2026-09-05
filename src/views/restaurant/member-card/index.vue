<template>
  <ContentWrap>
    <el-tabs v-model="activeTab">
      <!-- ========== 卡商品 ========== -->
      <el-tab-pane label="卡商品" name="card">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="卡名称">
            <el-input v-model="cardQuery.name" placeholder="请输入卡名称" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="cardQuery.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="在售" :value="1" />
              <el-option label="下架" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getCardList">查询</el-button>
            <el-button @click="resetCardQuery">重置</el-button>
            <el-button
              v-hasPermi="['restaurant:member-card:create']"
              type="success"
              @click="openCreate"
            >
              新增会员卡
            </el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="cardLoading" :data="cardList" stripe>
          <el-table-column label="编号" prop="id" width="80" />
          <el-table-column label="卡名称" prop="name" min-width="140" />
          <el-table-column label="售价（元）" width="110">
            <template #default="{ row }">¥{{ (row.price / 100).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="描述" prop="description" min-width="150" show-overflow-tooltip />
          <el-table-column label="已售" prop="soldCount" width="80" />
          <el-table-column label="排序" prop="sort" width="70" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '在售' : '下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" prop="createTime" width="170" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['restaurant:member-card:update']"
                link
                type="primary"
                @click="openEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['restaurant:member-card:delete']"
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
          v-model:current-page="cardPageNo"
          v-model:page-size="cardPageSize"
          :total="cardTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="getCardList"
          @current-change="getCardList"
          style="margin-top: 12px; justify-content: flex-end"
        />
      </el-tab-pane>

      <!-- ========== 购买记录 ========== -->
      <el-tab-pane label="购买记录" name="order">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="会员编号">
            <el-input
              v-model="orderQuery.userId"
              placeholder="请输入用户编号"
              clearable
              style="width: 160px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getOrderList">查询</el-button>
            <el-button @click="resetOrderQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="orderLoading" :data="orderList" stripe>
          <el-table-column label="记录编号" prop="id" width="90" />
          <el-table-column label="购卡单号" prop="orderNo" min-width="180" show-overflow-tooltip />
          <el-table-column label="会员编号" prop="userId" width="90" />
          <el-table-column label="卡名称" prop="cardName" min-width="130" />
          <el-table-column label="实付（元）" width="100">
            <template #default="{ row }">¥{{ (row.price / 100).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="支付方式" width="90">
            <template #default="{ row }">{{ payTypeText(row.payType) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'warning'">
                {{ row.status === 1 ? '已支付' : '待支付' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="支付时间" prop="paidTime" width="170" />
          <el-table-column label="创建时间" prop="createTime" width="170" />
        </el-table>
        <el-pagination
          v-model:current-page="orderPageNo"
          v-model:page-size="orderPageSize"
          :total="orderTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="getOrderList"
          @current-change="getOrderList"
          style="margin-top: 12px; justify-content: flex-end"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 卡商品表单 -->
    <Dialog v-model="formVisible" :title="formTitle" width="520px">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <el-form-item label="卡名称" prop="name">
          <el-input v-model="formData.name" placeholder="如：金卡年卡" />
        </el-form-item>
        <el-form-item label="售价（分）" prop="price">
          <el-input-number v-model="formData.price" :min="1" :max="100000000" />
        </el-form-item>
        <el-form-item label="卡描述" prop="description">
          <el-input v-model="formData.description" placeholder="一句话卖点" />
        </el-form-item>
        <el-form-item label="权益说明" prop="rights">
          <el-input
            v-model="formData.rights"
            type="textarea"
            :rows="4"
            placeholder="逐行一条权益，如：&#10;全场 9 折&#10;生日赠券"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :label="1">在售</el-radio>
            <el-radio :label="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="formData.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :disabled="submitting" @click="submit">确定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted, watch } from 'vue'
import {
  getMemberCardPage,
  createMemberCard,
  updateMemberCard,
  deleteMemberCard,
  getCardOrderPage
} from '@/api/restaurant'
import type { FormInstance, FormRules } from 'element-plus'

const message = useMessage()

const activeTab = ref('card')

// ========== 卡商品 ==========
const cardLoading = ref(false)
const cardList = ref<any[]>([])
const cardPageNo = ref(1)
const cardPageSize = ref(10)
const cardTotal = ref(0)
const cardQuery = reactive({
  name: '',
  status: undefined as number | undefined
})

async function getCardList() {
  cardLoading.value = true
  try {
    const res = await getMemberCardPage({
      ...cardQuery,
      pageNo: cardPageNo.value,
      pageSize: cardPageSize.value
    })
    cardList.value = res.list
    cardTotal.value = res.total
  } finally {
    cardLoading.value = false
  }
}

function resetCardQuery() {
  cardQuery.name = ''
  cardQuery.status = undefined
  cardPageNo.value = 1
  getCardList()
}

// ========== 卡商品表单 ==========
const formVisible = ref(false)
const formTitle = ref('')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  price: 9900,
  description: '',
  rights: '',
  status: 1,
  sort: 1
})
const rules: FormRules = {
  name: [{ required: true, message: '卡名称不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '售价不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
}

function openCreate() {
  formTitle.value = '新增会员卡'
  formVisible.value = true
  formData.id = undefined
  formData.name = ''
  formData.price = 9900
  formData.description = ''
  formData.rights = ''
  formData.status = 1
  formData.sort = 1
}

function openEdit(row: any) {
  formTitle.value = '编辑会员卡'
  formVisible.value = true
  formData.id = row.id
  formData.name = row.name
  formData.price = row.price
  formData.description = row.description
  formData.rights = row.rights
  formData.status = row.status
  formData.sort = row.sort
}

async function submit() {
  if (!formRef.value || submitting.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = { ...formData }
    if (formData.id === undefined) {
      await createMemberCard(payload)
      message.success('创建成功')
    } else {
      await updateMemberCard(payload)
      message.success('更新成功')
    }
    formVisible.value = false
    await getCardList()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await message.delConfirm('确认删除该会员卡？删除后小程序端不再展示')
  } catch {
    return
  }
  await deleteMemberCard(id)
  message.success('删除成功')
  await getCardList()
}

// ========== 购买记录 ==========
const orderLoading = ref(false)
const orderList = ref<any[]>([])
const orderPageNo = ref(1)
const orderPageSize = ref(10)
const orderTotal = ref(0)
const orderQuery = reactive({
  userId: '' as string | number
})

async function getOrderList() {
  orderLoading.value = true
  try {
    const res = await getCardOrderPage({
      userId: orderQuery.userId || undefined,
      pageNo: orderPageNo.value,
      pageSize: orderPageSize.value
    })
    orderList.value = res.list
    orderTotal.value = res.total
  } finally {
    orderLoading.value = false
  }
}

function resetOrderQuery() {
  orderQuery.userId = ''
  orderPageNo.value = 1
  getOrderList()
}

function payTypeText(type: number) {
  const map: Record<number, string> = { 1: '微信', 2: '余额' }
  return map[type] ?? '未知'
}

// 切到记录 Tab 时懒加载一次
watch(activeTab, (v) => {
  if (v === 'order' && orderTotal.value === 0 && orderList.value.length === 0) {
    getOrderList()
  }
})

onMounted(getCardList)
</script>
