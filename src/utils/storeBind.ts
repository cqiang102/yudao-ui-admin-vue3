import { ref } from 'vue'

/** 门店端接口「当前账号未绑定门店」的业务错误码（后端 ErrorCodeConstants.STORE_STAFF_NOT_BOUND = 2_000_004_001） */
export const STORE_STAFF_NOT_BOUND_CODE = 2000004001

/**
 * 当前登录账号是否缺少门店绑定。
 *
 * 背景：餐饮模块里有 7 个「门店端」页面（订单/打印/配送/订阅消息/数据看板/积分商城/发票），
 * 它们的接口都走 StoreAuthService.getLoginUserStoreId()，账号未绑定时返回
 * STORE_STAFF_NOT_BOUND。此前页面上只弹一句 toast 然后整页留白，观感像是坏了
 * （2026-09-22 逐页实测确认）。
 *
 * 现在由 axios 响应拦截器在收到该错误码时置为 true，布局层（AppView）据此在内容区
 * 顶部展示一条引导提示；切换路由时重置，由新页面按需重新置位。
 */
export const storeBindMissing = ref(false)
