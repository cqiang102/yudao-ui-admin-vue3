<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="等级序号" prop="level">
        <el-input-number v-model="formData.level" :min="1" :precision="0" />
        <span class="ml-2 text-gray-400">从 1 开始</span>
      </el-form-item>
      <el-form-item label="等级名称" prop="name">
        <el-input v-model="formData.name" placeholder="如：银卡会员" />
      </el-form-item>
      <el-form-item label="成长值门槛" prop="growthThreshold">
        <el-input-number v-model="formData.growthThreshold" :min="0" :precision="0" />
        <span class="ml-2 text-gray-400">达到该成长值自动升级</span>
      </el-form-item>
      <el-form-item label="折扣率" prop="discountRate">
        <el-input-number v-model="formData.discountRate" :min="10" :max="100" :precision="0" />
        <span class="ml-2 text-gray-400">100=不打折，95=95 折</span>
      </el-form-item>
      <el-form-item label="权益描述" prop="benefits">
        <el-input
          v-model="formData.benefits"
          type="textarea"
          :rows="3"
          placeholder="如：生日礼券、专属客服"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
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

/** 会员等级 表单 */
defineOptions({ name: 'RestaurantMemberLevelForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref({
  id: undefined,
  level: 1,
  name: '',
  growthThreshold: 0,
  discountRate: 100,
  benefits: '',
  status: 1
})
const formRules = reactive({
  level: [{ required: true, message: '等级序号不能为空', trigger: 'blur' }],
  name: [{ required: true, message: '等级名称不能为空', trigger: 'blur' }],
  growthThreshold: [{ required: true, message: '成长值门槛不能为空', trigger: 'blur' }],
  discountRate: [{ required: true, message: '折扣率不能为空', trigger: 'blur' }]
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
      formData.value = await RestaurantApi.getMemberLevel(id)
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
    level: 1,
    name: '',
    growthThreshold: 0,
    discountRate: 100,
    benefits: '',
    status: 1
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
      await RestaurantApi.createMemberLevel(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updateMemberLevel(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
