<template>
  <ContentWrap>
    <!-- 概览卡片 -->
    <el-row :gutter="16" v-loading="loading">
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">今日营业额</div>
          <div class="stat-value">¥{{ fen2yuan(dashboard?.overview?.todayPayTotal) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value">{{ dashboard?.overview?.todayOrderCount ?? 0 }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">本月营业额</div>
          <div class="stat-value">¥{{ fen2yuan(dashboard?.overview?.monthPayTotal) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never">
          <div class="stat-label">本月客单价</div>
          <div class="stat-value">¥{{ fen2yuan(dashboard?.overview?.monthAvgPrice) }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 近 30 天趋势 -->
    <el-card shadow="never" class="mt-15px">
      <template #header>近 30 天营业额与订单趋势</template>
      <Echart v-if="trendOption" :options="trendOption" :height="320" />
      <el-empty v-else description="暂无数据" />
    </el-card>

    <el-row :gutter="16" class="mt-15px">
      <!-- 订单类型分布 -->
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>近 30 天订单类型分布</template>
          <Echart v-if="typeOption" :options="typeOption" :height="300" />
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
      <!-- 菜品销量 TOP10 -->
      <el-col :span="14">
        <el-card shadow="never">
          <template #header>近 30 天菜品销量 TOP10</template>
          <Echart v-if="dishOption" :options="dishOption" :height="300" />
          <el-empty v-else description="暂无数据" />
        </el-card>
      </el-col>
    </el-row>
  </ContentWrap>
</template>

<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import * as StatisticsApi from '@/api/restaurant'

defineOptions({ name: 'RestaurantStatistics' })

const loading = ref(false)
const dashboard = ref<any>(null)

/** 分转元（保留 2 位） */
const fen2yuan = (fen?: number | null) =>
  fen == null ? '0.00' : (fen / 100).toFixed(2)

/** 趋势折线（双轴：营业额 + 订单数） */
const trendOption = computed<EChartsOption | null>(() => {
  const trend = dashboard.value?.trend
  if (!trend?.length) return null
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['营业额(元)', '订单数'] },
    grid: { left: 60, right: 60, bottom: 30 },
    xAxis: { type: 'category', data: trend.map((t: any) => t.statDate.slice(5)) },
    yAxis: [
      { type: 'value', name: '营业额(元)' },
      { type: 'value', name: '订单数' }
    ],
    series: [
      {
        name: '营业额(元)',
        type: 'line',
        smooth: true,
        data: trend.map((t: any) => (t.payTotal / 100).toFixed(2))
      },
      {
        name: '订单数',
        type: 'bar',
        yAxisIndex: 1,
        data: trend.map((t: any) => t.orderCount)
      }
    ]
  }
})

/** 类型分布饼图 */
const typeOption = computed<EChartsOption | null>(() => {
  const dist = dashboard.value?.typeDist
  if (!dist?.length) return null
  const nameMap: Record<number, string> = { 1: '堂食', 2: '自取', 3: '外卖' }
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 单 ({d}%)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        label: { formatter: '{b}\n{d}%' },
        data: dist.map((d: any) => ({ name: nameMap[d.orderType] || `类型${d.orderType}`, value: d.orderCount }))
      }
    ]
  }
})

/** 菜品 TOP 横向条形图 */
const dishOption = computed<EChartsOption | null>(() => {
  const top = dashboard.value?.dishTop
  if (!top?.length) return null
  const reversed = [...top].reverse() // 条形图从下往上，反转让第一名在顶部
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const idx = reversed.length - 1 - (params?.[0]?.dataIndex ?? 0)
        const d = reversed[idx]
        return d ? `${d.dishName}<br/>销量 ${d.soldQuantity} 份<br/>销售额 ¥${(d.salesAmount / 100).toFixed(2)}` : ''
      }
    },
    grid: { left: 110, right: 40, bottom: 30 },
    xAxis: { type: 'value', name: '销量(份)' },
    yAxis: { type: 'category', data: reversed.map((d: any) => d.dishName) },
    series: [{ type: 'bar', data: reversed.map((d: any) => d.soldQuantity), itemStyle: { color: '#409eff' } }]
  }
})

const getDashboard = async () => {
  loading.value = true
  try {
    dashboard.value = await StatisticsApi.getStatisticsDashboard()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getDashboard()
})
</script>

<style scoped>
.stat-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.stat-value {
  font-size: 26px;
  font-weight: 600;
  margin-top: 8px;
}
</style>
