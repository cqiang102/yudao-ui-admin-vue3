<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="110px"
      v-loading="formLoading"
    >
      <el-form-item label="后台账号编号" prop="adminUserId">
        <el-input-number v-model="formData.adminUserId" :min="1" class="!w-240px" placeholder="请输入后台账号编号" />
      </el-form-item>
      <el-form-item label="门店" prop="storeId">
        <el-select v-model="formData.storeId" class="!w-240px" clearable placeholder="请选择门店">
          <el-option v-for="item in storeOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
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

/** 门店店员 表单 */
defineOptions({ name: 'RestaurantStoreStaffForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const storeOptions = ref<any[]>([])
const formData = ref({
  id: undefined as number | undefined,
  adminUserId: undefined as number | undefined,
  storeId: undefined as number | undefined
})
const formRules = reactive({
  adminUserId: [{ required: true, message: '后台账号编号不能为空', trigger: 'blur' }],
  storeId: [{ required: true, message: '门店不能为空', trigger: 'change' }]
})
const formRef = ref()

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 拉取门店下拉（getStoreSimpleList 返回 {id, name}）
  try {
    storeOptions.value = await RestaurantApi.getStoreSimpleList()
  } catch (e) {
    storeOptions.value = []
  }
  if (id) {
    formLoading.value = true
    try {
      formData.value = await RestaurantApi.getStoreStaff(id)
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
    adminUserId: undefined,
    storeId: undefined
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
      await RestaurantApi.createStoreStaff(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updateStoreStaff(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
