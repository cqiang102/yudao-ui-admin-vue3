<template>
  <ContentWrap>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- Tab 1：积分商品 -->
      <el-tab-pane label="积分商品" name="product">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="状态">
            <el-select v-model="productQuery.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="上架" :value="1" />
              <el-option label="下架" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getProductList">查询</el-button>
            <el-button
              v-hasPermi="['restaurant:point-shop:create']"
              type="success"
              @click="openForm()"
            >
              新增商品
            </el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="loading" :data="productList" stripe>
          <el-table-column label="编号" prop="id" width="70" />
          <el-table-column label="商品" min-width="180">
            <template #default="{ row }">
              <span>{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="所需积分" prop="points" width="100" />
          <el-table-column label="库存" width="90">
            <template #default="{ row }">
              {{ row.stock === -1 ? '不限' : row.stock }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '上架' : '下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                v-hasPermi="['restaurant:point-shop:update']"
                link
                type="primary"
                @click="openForm(row)"
              >
                编辑
              </el-button>
              <el-button
                v-hasPermi="['restaurant:point-shop:delete']"
                link
                type="danger"
                @click="onDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 2：兑换记录 + 核销 -->
      <el-tab-pane label="兑换记录" name="order">
        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="核销码">
            <el-input
              v-model="verifyCode"
              placeholder="输入会员出示的 8 位核销码"
              style="width: 200px"
              maxlength="8"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              v-hasPermi="['restaurant:point-shop:verify']"
              type="success"
              :loading="verifying"
              @click="onVerify"
            >
              核销
            </el-button>
          </el-form-item>
        </el-form>

        <el-form :inline="true" class="-mb-15px" @submit.prevent>
          <el-form-item label="状态">
            <el-select v-model="orderQuery.status" placeholder="全部" clearable style="width: 120px">
              <el-option label="待核销" :value="0" />
              <el-option label="已核销" :value="1" />
              <el-option label="已取消" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getOrderList">查询</el-button>
          </el-form-item>
        </el-form>

        <el-table v-loading="orderLoading" :data="orderList" stripe>
          <el-table-column label="编号" prop="id" width="70" />
          <el-table-column label="商品" prop="productName" min-width="140" />
          <el-table-column label="数量" prop="quantity" width="70" />
          <el-table-column label="消耗积分" prop="totalPoints" width="100" />
          <el-table-column label="核销码" prop="verifyCode" width="110" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="orderTagType(row.status)">{{ orderText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="下单时间" prop="createTime" width="170" />
        </el-table>
        <Pagination
          v-model:page="orderQuery.pageNo"
          v-model:limit="orderQuery.pageSize"
          :total="orderTotal"
          @pagination="getOrderList"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 商品表单 -->
    <Dialog v-model="dialogVisible" :title="dialogTitle" width="560px">
      <el-form :model="form" label-width="100px" @submit.prevent>
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" placeholder="如 招牌奶茶一杯" />
        </el-form-item>
        <el-form-item label="所需积分" required>
          <el-input-number v-model="form.points" :min="1" :step="100" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存" required>
          <el-radio-group v-model="stockUnlimited">
            <el-radio :label="true">不限</el-radio>
            <el-radio :label="false">限量</el-radio>
          </el-radio-group>
          <el-input-number
            v-if="!stockUnlimited"
            v-model="form.stock"
            :min="0"
            :step="10"
            style="width: 100%; margin-top: 8px"
          />
        </el-form-item>
        <el-form-item label="商品图片">
          <el-input v-model="form.image" placeholder="图片 URL（可空）" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="onSubmit">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script lang="ts" setup>
import * as PointShopApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantPointShop' })

const message = useMessage()

const activeTab = ref('product')
const loading = ref(false)
const productList = ref<any[]>([])
const productQuery = reactive({ pageNo: 1, pageSize: 20, status: undefined as number | undefined })

const orderLoading = ref(false)
const orderList = ref<any[]>([])
const orderTotal = ref(0)
const orderQuery = reactive({ pageNo: 1, pageSize: 10, status: undefined as number | undefined })
const verifyCode = ref('')
const verifying = ref(false)

const dialogVisible = ref(false)
const dialogTitle = ref('')
const saving = ref(false)
const stockUnlimited = ref(true)
const form = reactive<any>({
  id: undefined,
  name: '',
  image: '',
  points: 100,
  stock: -1,
  description: '',
  status: 1
})

const orderText = (s: number) => ({ 0: '待核销', 1: '已核销', 2: '已取消' }[s] || '未知')
const orderTagType = (s: number) => ({ 0: 'warning', 1: 'success', 2: 'info' }[s] || 'info')

const getProductList = async () => {
  loading.value = true
  try {
    const data = await PointShopApi.getPointProductPage({ ...productQuery })
    productList.value = data.list
  } finally {
    loading.value = false
  }
}

const getOrderList = async () => {
  orderLoading.value = true
  try {
    const data = await PointShopApi.getPointOrderPage({ ...orderQuery })
    orderList.value = data.list
    orderTotal.value = data.total
  } finally {
    orderLoading.value = false
  }
}

const openForm = (row?: any) => {
  dialogTitle.value = row ? '编辑商品' : '新增商品'
  stockUnlimited.value = row ? row.stock === -1 : true
  Object.assign(form, {
    id: row?.id,
    name: row?.name || '',
    image: row?.image || '',
    points: row?.points || 100,
    stock: row?.stock ?? -1,
    description: row?.description || '',
    status: row?.status ?? 1
  })
  dialogVisible.value = true
}

const onSubmit = async () => {
  if (!form.name || !form.points) {
    message.warning('请填写商品名称与所需积分')
    return
  }
  saving.value = true
  try {
    const payload = { ...form, stock: stockUnlimited.value ? -1 : form.stock }
    if (form.id) {
      await PointShopApi.updatePointProduct(payload)
    } else {
      await PointShopApi.createPointProduct(payload)
    }
    message.success('保存成功')
    dialogVisible.value = false
    getProductList()
  } finally {
    saving.value = false
  }
}

const onDelete = async (row: any) => {
  await message.confirm(`确认删除「${row.name}」吗？（仅下架状态可删）`)
  await PointShopApi.deletePointProduct(row.id)
  message.success('删除成功')
  getProductList()
}

const onVerify = async () => {
  if (!verifyCode.value || verifyCode.value.length !== 8) {
    message.warning('请输入 8 位核销码')
    return
  }
  verifying.value = true
  try {
    const res = await PointShopApi.verifyPointOrder(verifyCode.value)
    message.success(`核销成功：${res.productName} x${res.quantity}`)
    verifyCode.value = ''
    getOrderList()
  } finally {
    verifying.value = false
  }
}

const onTabChange = (tab: string) => {
  if (tab === 'product') getProductList()
  else getOrderList()
}

onMounted(() => {
  getProductList()
})
</script>
