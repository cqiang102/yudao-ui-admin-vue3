<template>
  <ContentWrap title="会员营销配置">
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-width="160px"
      style="max-width: 640px"
    >
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="本配置按当前租户生效，保存后即时应用。"
        style="margin-bottom: 18px"
      />
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="0">停用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="每消费1元得积分" prop="earnPerYuan">
        <el-input-number v-model="formData.earnPerYuan" :min="0" :max="999" :step="1" />
      </el-form-item>
      <el-form-item label="每积分抵现(分)" prop="deductPerPoint">
        <el-input-number v-model="formData.deductPerPoint" :min="0" :max="9999" :step="1" />
        <span class="tip">单位：分。例：10 表示 1 积分抵 0.1 元</span>
      </el-form-item>
      <el-form-item label="最低抵现订单金额(分)" prop="minDeductAmount">
        <el-input-number v-model="formData.minDeductAmount" :min="0" :max="999999" :step="1" />
        <span class="tip">单位：分。低于该金额的订单不可使用积分抵现</span>
      </el-form-item>
      <el-form-item label="抵现上限比例(%)" prop="maxDeductRate">
        <el-input-number v-model="formData.maxDeductRate" :min="0" :max="100" :step="1" />
        <span class="tip">积分抵现占订单金额的最大比例，如 50 表示最多抵 50%</span>
      </el-form-item>
      <el-form-item label="升级方式" prop="levelUpMode">
        <el-radio-group v-model="formData.levelUpMode">
          <el-radio :label="0">按成长值</el-radio>
          <el-radio :label="1">按累计消费(分)</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button v-hasPermi="['restaurant:member-config:save']" type="primary" :loading="saving" @click="submit">保存</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue'
import { getMemberConfig, saveMemberConfig } from '@/api/restaurant'
import type { FormInstance, FormRules } from 'element-plus'

const message = useMessage()

const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  status: 1,
  earnPerYuan: 1,
  deductPerPoint: 10,
  minDeductAmount: 0,
  maxDeductRate: 50,
  levelUpMode: 0
})

const rules: FormRules = {
  earnPerYuan: [{ required: true, message: '不能为空', trigger: 'blur' }],
  deductPerPoint: [{ required: true, message: '不能为空', trigger: 'blur' }],
  maxDeductRate: [{ required: true, message: '不能为空', trigger: 'blur' }]
}

async function loadConfig() {
  loading.value = true
  try {
    const data = await getMemberConfig()
    if (data) {
      Object.assign(formData, data)
    }
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    await saveMemberConfig({ ...formData })
    message.success('保存成功')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.tip {
  margin-left: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
