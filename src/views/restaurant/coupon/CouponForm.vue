<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="券名称" prop="name">
        <el-input v-model="formData.name" placeholder="如 新客立减5元 / 周末8折" />
      </el-form-item>
      <el-form-item label="券类型" prop="type">
        <el-radio-group v-model="formData.type">
          <el-radio :value="1">满减</el-radio>
          <el-radio :value="2">折扣</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="使用门槛(分)" prop="thresholdAmount">
        <el-input-number v-model="formData.thresholdAmount" :min="0" :step="100" />
        <span class="ml-2 text-gray-400">0 表示无门槛</span>
      </el-form-item>
      <el-form-item
        :label="formData.type === 2 ? '折扣率(95=95折)' : '优惠金额(分)'"
        prop="discountValue"
      >
        <el-input-number
          v-model="formData.discountValue"
          :min="formData.type === 2 ? 1 : 0"
          :max="formData.type === 2 ? 99 : undefined"
          :step="formData.type === 2 ? 1 : 100"
        />
      </el-form-item>
      <el-form-item label="发放总量" prop="total">
        <el-input-number v-model="formData.total" :min="1" />
      </el-form-item>
      <el-form-item label="每人限领" prop="perLimit">
        <el-input-number v-model="formData.perLimit" :min="1" />
      </el-form-item>
      <el-form-item label="有效天数" prop="validDays">
        <el-input-number v-model="formData.validDays" :min="1" />
        <span class="ml-2 text-gray-400">领取后 N 天有效</span>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">停用</el-radio>
          <el-radio :value="1">启用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import RestaurantApi from '@/api/restaurant'

/** 优惠券模板 表单 */
defineOptions({ name: 'RestaurantCouponForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  name: '',
  type: 1,
  thresholdAmount: 0,
  discountValue: 0,
  total: 100,
  perLimit: 1,
  validDays: 30,
  status: 1
})
const formRules = reactive({
  name: [{ required: true, message: '券名称不能为空', trigger: 'blur' }],
  type: [{ required: true, message: '券类型不能为空', trigger: 'blur' }],
  discountValue: [{ required: true, message: '优惠值不能为空', trigger: 'blur' }],
  total: [{ required: true, message: '发放总量不能为空', trigger: 'blur' }],
  perLimit: [{ required: true, message: '每人限领不能为空', trigger: 'blur' }],
  validDays: [{ required: true, message: '有效天数不能为空', trigger: 'blur' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await RestaurantApi.getCouponTemplate(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const resetForm = () => {
  formData.value = {
    id: undefined, name: '', type: 1, thresholdAmount: 0, discountValue: 0,
    total: 100, perLimit: 1, validDays: 30, status: 1
  }
  formRef.value?.resetFields()
}

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await RestaurantApi.createCouponTemplate(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updateCouponTemplate(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
