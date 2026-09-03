<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="门店名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入门店名称" />
      </el-form-item>
      <el-form-item label="联系人" prop="contact">
        <el-input v-model="formData.contact" placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="formData.phone" placeholder="请输入联系电话" />
      </el-form-item>
      <el-form-item label="地址" prop="address">
        <el-input v-model="formData.address" placeholder="请输入地址" />
      </el-form-item>
      <el-form-item label="营业开始" prop="businessStart">
        <el-time-picker v-model="formData.businessStart" value-format="HH:mm:ss" placeholder="营业开始时间" />
      </el-form-item>
      <el-form-item label="营业结束" prop="businessEnd">
        <el-time-picker v-model="formData.businessEnd" value-format="HH:mm:ss" placeholder="营业结束时间" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">营业中</el-radio>
          <el-radio :value="0">已打烊</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="配送费(分)" prop="deliveryFee">
        <el-input-number v-model="formData.deliveryFee" :min="0" :step="100" />
      </el-form-item>
      <el-form-item label="起送金额(分)" prop="minOrderAmount">
        <el-input-number v-model="formData.minOrderAmount" :min="0" :step="100" />
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

/** 门店 表单 */
defineOptions({ name: 'RestaurantStoreForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  name: '',
  contact: '',
  phone: '',
  address: '',
  businessStart: '',
  businessEnd: '',
  status: 1,
  deliveryFee: 0,
  minOrderAmount: 0
})
const formRules = reactive({
  name: [{ required: true, message: '门店名称不能为空', trigger: 'blur' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await RestaurantApi.getStore(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    id: undefined,
    name: '',
    contact: '',
    phone: '',
    address: '',
    businessStart: '',
    businessEnd: '',
    status: 1,
    deliveryFee: 0,
    minOrderAmount: 0
  }
  formRef.value?.resetFields()
}

/** 提交表单 */
const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await RestaurantApi.createStore(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updateStore(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
