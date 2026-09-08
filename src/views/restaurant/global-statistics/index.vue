<template>
  <ContentWrap>
    <!-- 概览卡片 -->
    <el-row :gutter="16" v-loading="loading">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">商户数</div>
          <div class="stat-value">{{ overview?.storeCount ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">会员数</div>
          <div class="stat-value">{{ overview?.memberCount ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">今日 GMV</div>
          <div class="stat-value">¥{{ fen2yuan(overview?.todayGmv) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value">{{ overview?.todayOrderCount ?? 0 }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-15px">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">累计 GMV</div>
          <div class="stat-value">¥{{ fen2yuan(overview?.totalGmv) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">累计订单数</div>
          <div class="stat-value">{{ overview?.totalOrderCount ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">累计客单价</div>
          <div class="stat-value">
            ¥{{
              overview?.totalOrderCount
                ? fen2yuan(overview.totalGmv / overview.totalOrderCount)
                : '0.00'
            }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 近 30 天趋势 -->
    <el-card shadow="never" class="mt-15px">
      <template #header>全平台近 30 天 GMV 与订单趋势</template>
      <Echart v-if="trendOption" :options="trendOption" :height="320" />
      <el-empty v-else description="暂无数据" />
    </el-card>

    <!-- 门店 GMV TOP -->
    <el-card shadow="never" class="mt-15px">
      <template #header>门店 GMV TOP10（近 30 天）</template>
      <Echart v-if="topOption" :options="topOption" :height="320" />
      <el-empty v-else description="暂无数据" />
    </el-card>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import * as StatisticsApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantGlobalStatistics' })

const loading = ref(false)
const overview = ref<any>(null)
const trend = ref<any[]>([])
const storeTop = ref<any[]>([])

/** 分转元（保留 2 位） */
const fen2yuan = (fen?: number | null) =>
  fen == null ? '0.00' : (Number(fen) / 100).toFixed(2)

const trendOption = computed<EChartsOption | null>(() => {
  if (!trend.value.length) return null
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['GMV(元)', '订单数'] },
    grid: { left: 60, right: 60, bottom: 30 },
    xAxis: { type: 'category', data: trend.value.map((t) => t.statDate.slice(5)) },
    yAxis: [
      { type: 'value', name: 'GMV(元)' },
      { type: 'value', name: '订单数' }
    ],
    series: [
      {
        name: 'GMV(元)',
        type: 'line',
        smooth: true,
        data: trend.value.map((t) => (Number(t.payTotal) / 100).toFixed(2))
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: trend.value.map((t) => t.orderCount)
      }
    ]
  }
})

const topOption = computed<EChartsOption | null>(() => {
  if (!storeTop.value.length) return null
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 140, right: 40, bottom: 30 },
    xAxis: { type: 'value', name: 'GMV(元)' },
    yAxis: {
      type: 'category',
      data: storeTop.value.map((s) => s.storeName || `门店#${s.storeId}`),
      inverse: true
    },
    series: [
      {
        name: 'GMV(元)',
        type: 'bar',
        data: storeTop.value.map((s) => (Number(s.payTotal) / 100).toFixed(2))
      }
    ]
  }
})

const loadAll = async () => {
  loading.value = true
  try {
    const [o, t, s] = await Promise.all([
      StatisticsApi.getGlobalOverview(),
      StatisticsApi.getGlobalTrend(),
      StatisticsApi.getGlobalStoreTop()
    ])
    overview.value = o
    trend.value = t || []
    storeTop.value = s || []
    // 趋势无订单日补 0，保折线连续
    fillTrendGaps()
  } finally {
    loading.value = false
  }
}

/** 补齐近 30 天中无订单的日期（GMV/订单数 = 0） */
function fillTrendGaps() {
  const map = new Map(trend.value.map((t) => [t.statDate, t]))
  const filled: any[] = []
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    const key = fmt(d)
    filled.push(map.get(key) || { statDate: key, payTotal: 0, orderCount: 0 })
  }
  trend.value = filled
}

onMounted(() => {
  loadAll()
})
</script>

<style lang="scss" scoped>
.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.stat-value {
  margin-top: 6px;
  font-size: 24px;
  font-weight: 600;
}
</style>
