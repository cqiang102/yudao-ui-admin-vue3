<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="套餐名称" prop="name">
        <el-input v-model="formData.name" placeholder="如 基础版/旗舰版" />
      </el-form-item>
      <el-form-item label="价格(分)" prop="price">
        <el-input-number v-model="formData.price" :min="0" :step="100" />
      </el-form-item>
      <el-form-item label="时长(月)" prop="durationMonths">
        <el-input-number v-model="formData.durationMonths" :min="1" />
      </el-form-item>
      <el-form-item label="门店上限" prop="maxStores">
        <el-input-number v-model="formData.maxStores" :min="1" />
      </el-form-item>
      <el-form-item label="功能特性" prop="features">
        <el-input v-model="formData.features" type="textarea" :rows="3" placeholder="JSON 或逗号分隔的功能点" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">下架</el-radio>
          <el-radio :value="1">上架</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" />
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

/** 套餐 表单 */
defineOptions({ name: 'RestaurantPackageForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  name: '',
  price: 0,
  durationMonths: 1,
  maxStores: 1,
  features: '',
  status: 1,
  remark: ''
})
const formRules = reactive({
  name: [{ required: true, message: '套餐名称不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '价格不能为空', trigger: 'blur' }],
  durationMonths: [{ required: true, message: '时长不能为空', trigger: 'blur' }],
  maxStores: [{ required: true, message: '门店上限不能为空', trigger: 'blur' }]
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
      formData.value = await RestaurantApi.getPackage(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const resetForm = () => {
  formData.value = {
    id: undefined, name: '', price: 0, durationMonths: 1, maxStores: 1,
    features: '', status: 1, remark: ''
  }
  formRef.value?.resetFields()
}

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await RestaurantApi.createPackage(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updatePackage(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
