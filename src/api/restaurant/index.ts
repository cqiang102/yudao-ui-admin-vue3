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
// 菜品精简列表（含规格/加料，收银台点餐用）
export const getDishSimpleList = async (categoryId?: number) => {
  return await request.get({ url: `/store/dish/simple-list`, params: { categoryId } })
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
// 现金收讫（收银台 M-04：待支付 → 已支付，无支付单）
export const payOrderCash = async (id: number) => {
  return await request.put({ url: `/store/order/pay-cash?id=` + id })
}

// ========== 云打印机（M-10 易联云） ==========
export const getPrinterPage = async (params: any) => {
  return await request.get({ url: `/store/printer/page`, params })
}
export const createPrinter = async (data: any) => {
  return await request.post({ url: `/store/printer/create`, data })
}
export const updatePrinter = async (data: any) => {
  return await request.put({ url: `/store/printer/update`, data })
}
export const deletePrinter = async (id: number) => {
  return await request.delete({ url: `/store/printer/delete?id=` + id })
}
export const getPrintTaskPage = async (params: any) => {
  return await request.get({ url: `/store/printer/task-page`, params })
}
export const retryPrintTask = async (id: number) => {
  return await request.put({ url: `/store/printer/task/retry?id=` + id })
}

// ========== 达达配送（M-11） ==========
// 获取门店配送配置
export const getDeliveryConfig = async () => {
  return await request.get({ url: `/store/delivery/config` })
}
// 保存门店配送配置
export const saveDeliveryConfig = async (data: any) => {
  return await request.put({ url: `/store/delivery/config`, data })
}
// 运单分页（本店）
export const getDeliveryPage = async (params: any) => {
  return await request.get({ url: `/store/delivery/page`, params })
}
// 发单（外卖订单 → 达达快送）
export const sendDelivery = async (orderId: number) => {
  return await request.post({ url: `/store/delivery/send?orderId=` + orderId })
}
// 商家取消运单
export const cancelDelivery = async (orderId: number) => {
  return await request.put({ url: `/store/delivery/cancel?orderId=` + orderId })
}

// ========== 微信订阅消息（M-12） ==========
// 订阅消息模板分页
export const getNotifyTemplatePage = async (params: any) => {
  return await request.get({ url: `/store/notify/template-page`, params })
}
// 创建订阅消息模板
export const createNotifyTemplate = async (data: any) => {
  return await request.post({ url: `/store/notify/template/create`, data })
}
// 更新订阅消息模板
export const updateNotifyTemplate = async (data: any) => {
  return await request.put({ url: `/store/notify/template/update`, data })
}
// 删除订阅消息模板
export const deleteNotifyTemplate = async (id: number) => {
  return await request.delete({ url: `/store/notify/template/delete?id=` + id })
}
// 发送记录分页
export const getNotifyRecordPage = async (params: any) => {
  return await request.get({ url: `/store/notify/record-page`, params })
}

// ========== 数据看板（M-28） ==========
// 看板聚合数据（概览 + 趋势 + 类型分布 + 菜品 TOP）
export const getStatisticsDashboard = async () => {
  return await request.get({ url: `/store/statistics/dashboard` })
}

// ========== 积分商城（M-27） ==========
// 积分商品分页
export const getPointProductPage = async (params: any) => {
  return await request.get({ url: `/store/point-shop/product-page`, params })
}
// 创建积分商品
export const createPointProduct = async (data: any) => {
  return await request.post({ url: `/store/point-shop/product/create`, data })
}
// 更新积分商品
export const updatePointProduct = async (data: any) => {
  return await request.put({ url: `/store/point-shop/product/update`, data })
}
// 删除积分商品
export const deletePointProduct = async (id: number) => {
  return await request.delete({ url: `/store/point-shop/product/delete?id=` + id })
}
// 兑换记录分页
export const getPointOrderPage = async (params: any) => {
  return await request.get({ url: `/store/point-shop/order-page`, params })
}
// 店员核销
export const verifyPointOrder = async (verifyCode: string) => {
  return await request.post({ url: `/store/point-shop/verify?verifyCode=` + verifyCode })
}

// ========== 会员标签（M-22） ==========
// 更新会员标签（tags 为 JSON 数组字符串，空数组清空）
export const updateMemberTags = async (data: { id: number; tags: string }) => {
  return await request.put({ url: `/store/member/update-tags`, data })
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

// ========== 轮播图（M-29；后端 BannerController，路径 /store/banner） ==========
export const getBannerPage = async (params: any) => {
  return await request.get({ url: `/store/banner/page`, params })
}
export const getBanner = async (id: number) => {
  return await request.get({ url: `/store/banner/get?id=` + id })
}
export const createBanner = async (data: any) => {
  return await request.post({ url: `/store/banner/create`, data })
}
export const updateBanner = async (data: any) => {
  return await request.put({ url: `/store/banner/update`, data })
}
export const deleteBanner = async (id: number) => {
  return await request.delete({ url: `/store/banner/delete?id=` + id })
}

// ========== 会员收货地址（M-23；后端 MemberAddressController，路径 /store/member-address） ==========
export const getMemberAddressPage = async (params: any) => {
  return await request.get({ url: `/store/member-address/page`, params })
}
export const deleteMemberAddress = async (id: number) => {
  return await request.delete({ url: `/store/member-address/delete?id=` + id })
}

// ========== 会员卡（M-26；后端 MemberCardController，路径 /store/card） ==========
export const getMemberCardPage = async (params: any) => {
  return await request.get({ url: `/store/card/page`, params })
}
export const createMemberCard = async (data: any) => {
  return await request.post({ url: `/store/card/create`, data })
}
export const updateMemberCard = async (data: any) => {
  return await request.put({ url: `/store/card/update`, data })
}
export const deleteMemberCard = async (id: number) => {
  return await request.delete({ url: `/store/card/delete?id=` + id })
}
export const getCardOrderPage = async (params: any) => {
  return await request.get({ url: `/store/card/order-page`, params })
}

// ========== 我的服务菜单（M-24；后端 PortalMenuController，路径 /store/portal-menu） ==========
export const getPortalMenuList = async () => {
  return await request.get({ url: `/store/portal-menu/list` })
}
export const createPortalMenu = async (data: any) => {
  return await request.post({ url: `/store/portal-menu/create`, data })
}
export const updatePortalMenu = async (data: any) => {
  return await request.put({ url: `/store/portal-menu/update`, data })
}
export const deletePortalMenu = async (id: number) => {
  return await request.delete({ url: `/store/portal-menu/delete?id=` + id })
}

// ========== 预约规则（M-09；后端 ReserveRuleController，路径 /store/reserve-rule） ==========
export const getReserveRuleList = async (storeId: number) => {
  return await request.get({ url: `/store/reserve-rule/list?storeId=` + storeId })
}
export const createReserveRule = async (data: any) => {
  return await request.post({ url: `/store/reserve-rule/create`, data })
}
export const updateReserveRule = async (data: any) => {
  return await request.put({ url: `/store/reserve-rule/update`, data })
}
export const deleteReserveRule = async (id: number) => {
  return await request.delete({ url: `/store/reserve-rule/delete?id=` + id })
}
// 预览某天可用时段（含余量）
export const getReserveSlots = async (storeId: number, date: string) => {
  return await request.get({ url: `/store/reserve-rule/slots?storeId=` + storeId + `&date=` + date })
}

// ========== 帮助文档（C-12；后端 HelpDocController，路径 /store/help-doc） ==========
export const getHelpDocList = async (type?: number) => {
  return await request.get({ url: `/store/help-doc/list`, params: { type } })
}
export const createHelpDoc = async (data: any) => {
  return await request.post({ url: `/store/help-doc/create`, data })
}
export const updateHelpDoc = async (data: any) => {
  return await request.put({ url: `/store/help-doc/update`, data })
}
export const deleteHelpDoc = async (id: number) => {
  return await request.delete({ url: `/store/help-doc/delete?id=` + id })
}

// ========== 全局统计（P-06；后端 GlobalStatisticsController，路径 /platform/statistics） ==========
export const getGlobalOverview = async () => {
  return await request.get({ url: `/platform/statistics/overview` })
}
export const getGlobalTrend = async () => {
  return await request.get({ url: `/platform/statistics/trend` })
}
export const getGlobalStoreTop = async () => {
  return await request.get({ url: `/platform/statistics/store-top` })
}

// ========== 财务提现（M-30；后端 WithdrawController，路径 /store/withdraw） ==========
export const getWithdrawAccountList = async (storeId: number) => {
  return await request.get({ url: `/store/withdraw/account/list?storeId=` + storeId })
}
export const createWithdrawAccount = async (data: any) => {
  return await request.post({ url: `/store/withdraw/account/create`, data })
}
export const updateWithdrawAccount = async (data: any) => {
  return await request.put({ url: `/store/withdraw/account/update`, data })
}
export const deleteWithdrawAccount = async (id: number) => {
  return await request.delete({ url: `/store/withdraw/account/delete?id=` + id })
}
export const applyWithdraw = async (data: any) => {
  return await request.post({ url: `/store/withdraw/apply`, data })
}
export const auditWithdraw = async (data: any) => {
  return await request.post({ url: `/store/withdraw/audit`, data })
}
export const getWithdrawPage = async (params: any) => {
  return await request.get({ url: `/store/withdraw/page`, params })
}
export const getIncomeSummary = async (storeId: number) => {
  return await request.get({ url: `/store/withdraw/income-summary?storeId=` + storeId })
}
