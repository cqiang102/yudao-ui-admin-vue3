<script lang="ts" setup>
import { useTagsViewStore } from '@/store/modules/tagsView'
import { useAppStore } from '@/store/modules/app'
import { Footer } from '@/layout/components/Footer'
import { storeBindMissing } from '@/utils/storeBind'

defineOptions({ name: 'AppView' })

const appStore = useAppStore()

const footer = computed(() => appStore.getFooter)

const tagsViewStore = useTagsViewStore()

const getCaches = computed((): string[] => {
  return tagsViewStore.getCachedViews
})

//region 无感刷新
const routerAlive = ref(true)
// 无感刷新，防止出现页面闪烁白屏
const reload = () => {
  routerAlive.value = false
  nextTick(() => (routerAlive.value = true))
}
// 为组件后代提供刷新方法
provide('reload', reload)
//endregion

//region 门店端页面引导：账号未绑定门店时提示（由 axios 拦截器在收到 STORE_STAFF_NOT_BOUND 时置位）
const route = useRoute()
watch(
  () => route.fullPath,
  () => {
    storeBindMissing.value = false // 换页即重置，由新页面按需重新置位
  }
)
//endregion
</script>

<template>
  <section
    :class="[
      'p-[var(--app-content-padding)] w-full bg-[var(--app-content-bg-color)] dark:bg-[var(--el-bg-color)]',
      {
        '!min-h-[calc(100vh-var(--top-tool-height)-var(--tags-view-height)-var(--app-footer-height))] pb-0':
          footer
      }
    ]"
  >
    <el-alert
      v-if="storeBindMissing"
      type="warning"
      :closable="false"
      show-icon
      class="mb-3"
      title="当前账号未绑定门店，该页面属于门店端功能"
    >
      <div>
        请使用「门店店员 / 门店收银」账号登录；或到
        <b>餐饮管理 → 门店店员</b> 里把当前账号绑定到门店后再使用。
      </div>
    </el-alert>
    <router-view v-if="routerAlive">
      <template #default="{ Component, route }">
        <keep-alive :include="getCaches">
          <component :is="Component" :key="route.fullPath" />
        </keep-alive>
      </template>
    </router-view>
  </section>
  <Footer v-if="footer" />
</template>
