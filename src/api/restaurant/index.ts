// 餐饮门店端（admin 账号，走 /admin-api）
// 对应后端 controller.admin 包：
//   /store-auth, /store/info, /store/table, /store/dish, /store/order,
//   /store/member, /store/member-config, /store/member-level,
//   /store/coupon-template, /platform/package, /platform/subscription
import request from '@/config/axios'

// ========== 门店登录 / 绑定 ==========
export const storeAuthWeixinMiniAppLogin = async (data: any) => {
  return await request.post({ url: `/store-auth/weixin-mini-app-login`, data })
}
export const storeAuthBind = async (data: any) => {
  return await request.post({ url: `/store-auth/bind`, data })
}

// ========== 门店 ==========
export const getStorePage = async (params: any) => {
  return await request.get({ url: `/store/info/page`, params })
}
export const getStore = async (id: number) => {
  return await request.get({ url: `/store/info/get?id=` + id })
}
export const getStoreSimpleList = async () => {
  return await request.get({ url: `/store/info/simple-list` })
}
export const createStore = async (data: any) => {
  return await request.post({ url: `/store/info/create`, data })
}
export const updateStore = async (data: any) => {
  return await request.put({ url: `/store/info/update`, data })
}
export const deleteStore = async (id: number) => {
  return await request.delete({ url: `/store/info/delete?id=` + id })
}

// ========== 桌台 ==========
export const getTablePage = async (params: any) => {
  return await request.get({ url: `/store/table/page`, params })
}
export const getTableSimpleList = async (storeId: number) => {
  return await request.get({ url: `/store/table/simple-list`, params: { storeId } })
}
export const createTable = async (data: any) => {
  return await request.post({ url: `/store/table/create`, data })
}
export const updateTable = async (data: any) => {
  return await request.put({ url: `/store/table/update`, data })
}
export const deleteTable = async (id: number) => {
  return await request.delete({ url: `/store/table/delete?id=` + id })
}
export const generateTables = async (data: any) => {
  return await request.post({ url: `/store/table/generate`, data })
}
export const getTable = async (id: number) => {
  return await request.get({ url: `/store/table/get?id=` + id })
}
export const regenerateTableQrcode = async (id: number, baseUrl?: string) => {
  return await request.post({ url: `/store/table/regenerate-qrcode`, params: { id, baseUrl } })
}

// ========== 菜品 ==========
export const getDishPage = async (params: any) => {
  return await request.get({ url: `/store/dish/page`, params })
}
export const getDish = async (id: number) => {
  return await request.get({ url: `/store/dish/get?id=` + id })
}
export const createDish = async (data: any) => {
  return await request.post({ url: `/store/dish/create`, data })
}
export const updateDish = async (data: any) => {
  return await request.put({ url: `/store/dish/update`, data })
}
export const deleteDish = async (id: number) => {
  return await request.delete({ url: `/store/dish/delete?id=` + id })
}

// ========== 菜品分类 ==========
export const getDishCategoryPage = async (params: any) => {
  return await request.get({ url: `/store/dish-category/page`, params })
}
export const createDishCategory = async (data: any) => {
  return await request.post({ url: `/store/dish-category/create`, data })
}
export const updateDishCategory = async (data: any) => {
  return await request.put({ url: `/store/dish-category/update`, data })
}
export const deleteDishCategory = async (id: number) => {
  return await request.delete({ url: `/store/dish-category/delete?id=` + id })
}
export const getDishCategory = async (id: number) => {
  return await request.get({ url: `/store/dish-category/get?id=` + id })
}
export const getDishCategorySimpleList = async () => {
  return await request.get({ url: `/store/dish-category/simple-list` })
}

// ========== 订单 ==========
export const getOrderPage = async (params: any) => {
  return await request.get({ url: `/store/order/page`, params })
}
export const getOrder = async (id: number) => {
  return await request.get({ url: `/store/order/get?id=` + id })
}
export const createOrder = async (data: any) => {
  return await request.post({ url: `/store/order/create`, data })
}
export const addOrderItems = async (orderId: number, items: any[]) => {
  return await request.post({ url: `/store/order/add-items`, params: { orderId }, data: items })
}
export const cancelOrder = async (id: number) => {
  return await request.put({ url: `/store/order/cancel?id=` + id })
}
export const acceptOrder = async (id: number) => {
  return await request.put({ url: `/store/order/accept?id=` + id })
}
export const completeOrder = async (id: number) => {
  return await request.put({ url: `/store/order/complete?id=` + id })
}
export const refundOrder = async (id: number, reason?: string) => {
  return await request.put({ url: `/store/order/refund?id=` + id, params: { reason } })
}
export const verifyOrder = async (verifyCode: string, storeId?: number) => {
  return await request.post({ url: `/store/order/verify`, params: { verifyCode, storeId } })
}
export const callOrder = async (id: number) => {
  return await request.post({ url: `/store/order/call?id=` + id })
}

// ========== 会员 ==========
export const getMemberPage = async (params: any) => {
  return await request.get({ url: `/store/member/page`, params })
}

// ========== 会员营销配置（单例） ==========
export const getMemberConfig = async () => {
  return await request.get({ url: `/store/member-config/get` })
}
export const saveMemberConfig = async (data: any) => {
  return await request.post({ url: `/store/member-config/save`, data })
}

// ========== 会员等级 ==========
export const getMemberLevelPage = async (params: any) => {
  return await request.get({ url: `/store/member-level/page`, params })
}
export const createMemberLevel = async (data: any) => {
  return await request.post({ url: `/store/member-level/create`, data })
}
export const updateMemberLevel = async (data: any) => {
  return await request.put({ url: `/store/member-level/update`, params: { id: data.id }, data })
}
export const deleteMemberLevel = async (id: number) => {
  return await request.delete({ url: `/store/member-level/delete?id=` + id })
}
export const getMemberLevel = async (id: number) => {
  return await request.get({ url: `/store/member-level/get?id=` + id })
}

// ========== 优惠券模板 ==========
export const getCouponTemplate = async (id: number) => {
  return await request.get({ url: `/store/coupon-template/get?id=` + id })
}
export const getCouponTemplatePage = async (params: any) => {
  return await request.get({ url: `/store/coupon-template/page`, params })
}
export const createCouponTemplate = async (data: any) => {
  return await request.post({ url: `/store/coupon-template/create`, data })
}
export const updateCouponTemplate = async (data: any) => {
  return await request.put({ url: `/store/coupon-template/update`, data })
}
export const deleteCouponTemplate = async (id: number) => {
  return await request.delete({ url: `/store/coupon-template/delete?id=` + id })
}

// ========== 套餐（平台级，仅平台管理员） ==========
export const getPackagePage = async (params: any) => {
  return await request.get({ url: `/platform/package/page`, params })
}
export const getPackage = async (id: number) => {
  return await request.get({ url: `/platform/package/get?id=` + id })
}
export const createPackage = async (data: any) => {
  return await request.post({ url: `/platform/package/create`, data })
}
export const updatePackage = async (data: any) => {
  return await request.put({ url: `/platform/package/update`, data })
}
export const deletePackage = async (id: number) => {
  return await request.delete({ url: `/platform/package/delete?id=` + id })
}
export const openSubscription = async (data: any) => {
  return await request.post({ url: `/platform/subscription/open`, data })
}
export const getSubscriptionPage = async (params: any) => {
  return await request.get({ url: `/platform/subscription/page`, params })
}

// ========== 门店店员（管理后台 admin 账号 ↔ 门店 归属映射） ==========
export const getStoreStaffPage = async (params: any) => {
  return await request.get({ url: `/store-staff/page`, params })
}
export const getStoreStaff = async (id: number) => {
  return await request.get({ url: `/store-staff/get?id=` + id })
}
export const createStoreStaff = async (data: any) => {
  return await request.post({ url: `/store-staff/create`, data })
}
export const updateStoreStaff = async (data: any) => {
  return await request.put({ url: `/store-staff/update`, data })
}
export const deleteStoreStaff = async (id: number) => {
  return await request.delete({ url: `/store-staff/delete?id=` + id })
}
