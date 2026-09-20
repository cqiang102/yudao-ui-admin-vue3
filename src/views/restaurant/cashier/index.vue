<template>
  <div class="cashier">
    <!-- 左侧：分类 + 菜品格 -->
    <el-card class="cashier-left" shadow="never">
      <el-tabs v-model="activeCategory" @tab-change="loadDishes">
        <el-tab-pane label="全部" name="all" />
        <el-tab-pane
          v-for="cat in categories"
          :key="cat.id"
          :label="cat.name"
          :name="String(cat.id)"
        />
      </el-tabs>
      <div v-loading="dishLoading" class="dish-grid">
        <div
          v-for="dish in dishes"
          :key="dish.id"
          class="dish-card"
          :class="{ 'is-sold-out': dish.soldOut === 1 || dish.status !== 1 }"
          @click="addToCart(dish)"
        >
          <el-image v-if="dish.image" :src="dish.image" fit="cover" class="dish-img" />
          <div v-else class="dish-img dish-img-placeholder">{{ dish.name?.slice(0, 1) }}</div>
          <div class="dish-name">{{ dish.name }}</div>
          <div class="dish-price">¥{{ fen2yuan(dish.price) }}</div>
          <el-tag v-if="dish.soldOut === 1" type="info" size="small" class="dish-tag">售罄</el-tag>
          <el-tag v-else-if="dish.status !== 1" type="info" size="small" class="dish-tag">下架</el-tag>
        </div>
        <el-empty v-if="!dishLoading && dishes.length === 0" description="该分类暂无菜品" />
      </div>
    </el-card>

    <!-- 右侧：购物车 + 结算 -->
    <el-card class="cashier-right" shadow="never">
      <template #header>
        <div class="cart-header">
          <span>购物车（{{ cart.length }} 项）</span>
          <div>
            <el-button size="small" @click="holdOrder" :disabled="cart.length === 0">挂单</el-button>
            <el-button size="small" @click="pendingVisible = true">
              取单（{{ pendingOrders.length }}）
            </el-button>
            <el-button size="small" type="danger" plain @click="clearCart" :disabled="cart.length === 0">
              清空
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="cart" stripe size="small" max-height="420">
        <el-table-column label="菜品" prop="name" min-width="110" />
        <el-table-column label="规格/加料" min-width="150">
          <template #default="{ row }">
            <span v-if="row.specDesc || row.addonDesc">
              {{ [row.specDesc, row.addonDesc].filter(Boolean).join('；') }}
            </span>
            <span v-else class="opt-none">-</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" width="80">
          <template #default="{ row }">¥{{ fen2yuan(row.price) }}</template>
        </el-table-column>
        <el-table-column label="数量" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.quantity"
              :min="1"
              :max="999"
              size="small"
              controls-position="right"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="90">
          <template #default="{ row }">¥{{ fen2yuan(row.price * row.quantity) }}</template>
        </el-table-column>
        <el-table-column label="" width="60">
          <template #default="{ row }">
            <el-button link type="danger" @click="removeFromCart(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="cart.length === 0" description="点击左侧菜品加入购物车" :image-size="60" />

      <el-divider />
      <el-form label-width="60px">
        <el-form-item label="备注">
          <el-input v-model="remark" placeholder="口味/打包等备注（可选）" maxlength="100" />
        </el-form-item>
      </el-form>

      <div class="cart-footer">
        <div class="cart-total">
          合计：<span class="total-price">¥{{ fen2yuan(totalPrice) }}</span>
        </div>
        <el-button
          v-hasPermi="['restaurant:order:create']"
          type="primary"
          size="large"
          :loading="submitting"
          :disabled="cart.length === 0"
          @click="checkout"
        >
          现金结算
        </el-button>
      </div>
      <div class="mvp-note">
        规格/加料在下单前选择，加料按份计费；单型为「自取」，堂食桌台与微信扫码/余额代收后续版本接入。
      </div>
    </el-card>

    <!-- 规格/加料选择（菜品配了规格或加料时弹出） -->
    <el-dialog v-model="specVisible" :title="`选择规格/加料：${specDish?.name || ''}`" width="560px">
      <div v-for="(grp, gi) in specGroups" :key="gi" class="spec-block">
        <div class="spec-group-name">{{ grp.groupName }}（单选）</div>
        <el-radio-group v-model="pickedSpecId">
          <el-radio v-for="s in grp.options" :key="s.id" :value="s.id">
            {{ s.optionName }}
            <span class="spec-delta">{{ (s.priceDelta ?? 0) === 0 ? '' : `（${(s.priceDelta ?? 0) > 0 ? '+' : ''}¥${fen2yuan(s.priceDelta)}）` }}</span>
          </el-radio>
        </el-radio-group>
      </div>
      <div v-if="specDish?.addons?.length" class="spec-block">
        <div class="spec-group-name">加料（可多选，按份计费）</div>
        <el-checkbox-group v-model="pickedAddonIds">
          <el-checkbox v-for="a in specDish.addons" :key="a.id" :value="a.id">
            {{ a.optionName }}
            <span class="spec-delta">{{ (a.priceDelta ?? 0) === 0 ? '' : `（+¥${fen2yuan(a.priceDelta)}）` }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <el-empty
        v-if="!specGroups.length && !specDish?.addons?.length"
        description="该菜品未配置规格/加料"
        :image-size="60"
      />
      <template #footer>
        <el-button @click="specVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSpec">
          加入购物车（每份 ¥{{ fen2yuan(specLinePrice) }}）
        </el-button>
      </template>
    </el-dialog>

    <!-- 挂单列表 -->
    <el-dialog v-model="pendingVisible" title="挂单列表（取单）" width="560px">
      <el-table :data="pendingOrders" stripe size="small">
        <el-table-column label="时间" prop="timeText" width="160" />
        <el-table-column label="内容" min-width="200">
          <template #default="{ row }">
            {{ row.items.map((it: any) => `${it.name}×${it.quantity}`).join('、') }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }">¥{{ fen2yuan(row.total) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">
            <el-button link type="primary" @click="resumeOrder(row)">取回</el-button>
            <el-button link type="danger" @click="removePending(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="pendingOrders.length === 0" description="暂无挂单" :image-size="60" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'RestaurantCashier' })

import { computed, onMounted, ref } from 'vue'
import {
  getDishCategorySimpleList,
  getDishSimpleList,
  createOrder,
  payOrderCash
} from '@/api/restaurant'

const message = useMessage()

// ---------- 基础工具 ----------
const fen2yuan = (fen: number | undefined) => ((fen ?? 0) / 100).toFixed(2)

// ---------- 分类与菜品 ----------
const categories = ref<any[]>([])
const activeCategory = ref('all')
const dishes = ref<any[]>([])
const dishLoading = ref(false)

const loadCategories = async () => {
  try {
    categories.value = (await getDishCategorySimpleList()) || []
  } catch (e) {
    categories.value = []
  }
}

const loadDishes = async () => {
  dishLoading.value = true
  try {
    const categoryId = activeCategory.value === 'all' ? undefined : Number(activeCategory.value)
    dishes.value = (await getDishSimpleList(categoryId)) || []
  } catch (e) {
    dishes.value = []
  } finally {
    dishLoading.value = false
  }
}

// ---------- 购物车 ----------
interface CartItem {
  key: string // 菜品+规格+加料 组合键：同菜品不同规格分行显示
  dishId: number
  name: string
  price: number // 每份合计（分）：基础价 + 规格加价 + 加料加价（加料按份计费）
  quantity: number
  specId: number | null
  addonIds: number[]
  specDesc: string
  addonDesc: string
}
const cart = ref<CartItem[]>([])
const remark = ref('')
const submitting = ref(false)

const totalPrice = computed(() =>
  cart.value.reduce((sum, it) => sum + it.price * it.quantity, 0)
)

// ---------- 规格/加料选择 ----------
// 后端 2026-09-20 起：有规格的菜品必须选规格，否则下单报 2000006030
const specVisible = ref(false)
const specDish = ref<any>(null)
const pickedSpecId = ref<number | null>(null)
const pickedAddonIds = ref<number[]>([])

const specGroups = computed(() => {
  const d = specDish.value
  if (!d?.specs?.length) return []
  const map: Record<string, any> = {}
  d.specs.forEach((s: any) => {
    if (!map[s.groupName]) map[s.groupName] = { groupName: s.groupName, options: [] }
    map[s.groupName].options.push(s)
  })
  return Object.values(map)
})

const specLinePrice = computed(() => {
  const d = specDish.value
  if (!d) return 0
  let p = d.price || 0
  const spec = d.specs?.find((s: any) => s.id === pickedSpecId.value)
  if (spec) p += spec.priceDelta || 0
  pickedAddonIds.value.forEach((aid) => {
    const a = d.addons?.find((x: any) => x.id === aid)
    if (a) p += a.priceDelta || 0
  })
  return p
})

const openSpec = (dish: any) => {
  specDish.value = dish
  pickedSpecId.value = dish.specs?.length ? dish.specs[0].id : null
  pickedAddonIds.value = []
  specVisible.value = true
}

const confirmSpec = () => {
  if (specGroups.value.length && pickedSpecId.value == null) {
    message.warning('该菜品有规格选项，请先选择规格')
    return
  }
  pushCart(specDish.value, pickedSpecId.value, [...pickedAddonIds.value])
  specVisible.value = false
}

const addToCart = (dish: any) => {
  if (dish.soldOut === 1 || dish.status !== 1) {
    message.warning('该菜品已售罄或下架')
    return
  }
  // 配了规格/加料的菜品先弹选择面板（有规格的必须选，与后端口径一致）
  if (dish.specs?.length || dish.addons?.length) {
    openSpec(dish)
    return
  }
  pushCart(dish, null, [])
}

const pushCart = (dish: any, specId: number | null, addonIds: number[]) => {
  const list = addonIds || []
  const spec = specId != null ? dish.specs?.find((s: any) => s.id === specId) : null
  const addonNames = list
    .map((aid: number) => dish.addons?.find((x: any) => x.id === aid)?.optionName)
    .filter(Boolean)
  let price = dish.price || 0
  if (spec) price += spec.priceDelta || 0
  price += list.reduce((s: number, aid: number) => {
    const a = dish.addons?.find((x: any) => x.id === aid)
    return s + (a?.priceDelta || 0)
  }, 0)
  const key = `${dish.id}_${specId ?? ''}_${list.join(',')}`
  const exist = cart.value.find((it) => it.key === key)
  if (exist) {
    if (exist.quantity >= 999) {
      message.warning('数量已达上限 999')
      return
    }
    exist.quantity += 1
  } else {
    cart.value.push({
      key,
      dishId: dish.id,
      name: dish.name,
      price,
      quantity: 1,
      specId: specId ?? null,
      addonIds: list,
      specDesc: spec ? `${spec.groupName}:${spec.optionName}` : '',
      addonDesc: addonNames.length ? `加料:${addonNames.join('、')}` : ''
    })
  }
}

const removeFromCart = (row: CartItem) => {
  cart.value = cart.value.filter((it) => it.key !== row.key)
}

const clearCart = () => {
  cart.value = []
  remark.value = ''
}

// ---------- 挂单 / 取单（localStorage，本机缓存） ----------
const PENDING_KEY = 'restaurant_cashier_pending'
const pendingVisible = ref(false)
const pendingOrders = ref<any[]>([])

const loadPending = () => {
  try {
    pendingOrders.value = JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
  } catch (e) {
    pendingOrders.value = []
  }
}

const savePending = () => {
  localStorage.setItem(PENDING_KEY, JSON.stringify(pendingOrders.value))
}

const holdOrder = () => {
  pendingOrders.value.push({
    id: Date.now(),
    timeText: new Date().toLocaleString(),
    items: JSON.parse(JSON.stringify(cart.value)),
    remark: remark.value,
    total: totalPrice.value
  })
  savePending()
  clearCart()
  message.success('已挂单，可稍后在「取单」中取回')
}

const resumeOrder = (row: any) => {
  if (cart.value.length > 0) {
    message.warning('当前购物车不为空，请先挂单或清空后再取单')
    return
  }
  cart.value = row.items
  remark.value = row.remark || ''
  pendingOrders.value = pendingOrders.value.filter((it) => it.id !== row.id)
  savePending()
  pendingVisible.value = false
}

const removePending = (row: any) => {
  pendingOrders.value = pendingOrders.value.filter((it) => it.id !== row.id)
  savePending()
}

// ---------- 结算（自取单 + 现金收讫） ----------
const checkout = async () => {
  submitting.value = true
  try {
    // 1. 创建订单（type=2 自取；storeId 服务端按登录店员强制注入，无需传）
    const orderId = await createOrder({
      type: 2,
      remark: remark.value || undefined,
      items: cart.value.map((it) => ({
        dishId: it.dishId,
        quantity: it.quantity,
        specId: it.specId,
        addonIds: it.addonIds
      }))
    })
    // 2. 现金收讫：待支付 → 已支付（收银员现场收现金）
    await payOrderCash(orderId)
    message.success(`收银成功！订单 ${orderId} 已现金收讫`)
    clearCart()
  } catch (e) {
    // 失败保持购物车不动，便于修正后重试
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadDishes()
  loadPending()
})
</script>

<style lang="scss" scoped>
.cashier {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.cashier-left {
  flex: 1;
  min-width: 0;
}
.cashier-right {
  width: 420px;
  flex-shrink: 0;
}
.opt-none {
  color: var(--el-text-color-placeholder);
}
.spec-block {
  margin-bottom: 14px;
}
.spec-group-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
  margin-bottom: 6px;
}
.spec-delta {
  color: var(--el-color-danger);
  font-size: 12px;
}
.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
  min-height: 200px;
}
.dish-card {
  position: relative;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: var(--el-box-shadow-light);
  }
  &.is-sold-out {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
.dish-img {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  object-fit: cover;
}
.dish-img-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 24px;
}
.dish-name {
  margin-top: 6px;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dish-price {
  color: var(--el-color-danger);
  font-weight: 600;
  font-size: 14px;
}
.dish-tag {
  position: absolute;
  top: 12px;
  right: 12px;
}
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
.cart-total {
  font-size: 14px;
  .total-price {
    color: var(--el-color-danger);
    font-size: 22px;
    font-weight: 700;
  }
}
.mvp-note {
  margin-top: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}
</style>
