<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="所属门店" prop="storeId">
        <el-select v-model="formData.storeId" placeholder="请选择门店" clearable>
          <el-option v-for="s in storeOptions" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="桌台号" prop="tableNo">
        <el-input v-model="formData.tableNo" placeholder="如 A01" />
      </el-form-item>
      <el-form-item label="桌台类别" prop="category">
        <el-input v-model="formData.category" placeholder="如 大厅/包间" />
      </el-form-item>
      <el-form-item label="座位数" prop="seats">
        <el-input-number v-model="formData.seats" :min="1" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">空闲</el-radio>
          <el-radio :value="1">占用</el-radio>
          <el-radio :value="2">预定</el-radio>
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
import { ref, onMounted } from 'vue'
import RestaurantApi from '@/api/restaurant'

/** 桌台 表单 */
defineOptions({ name: 'RestaurantTableForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const storeOptions = ref<any[]>([])
const formData = ref({
  id: undefined,
  storeId: undefined,
  tableNo: '',
  category: '',
  seats: 1,
  status: 0
})
const formRules = reactive({
  storeId: [{ required: true, message: '请选择门店', trigger: 'change' }],
  tableNo: [{ required: true, message: '桌台号不能为空', trigger: 'blur' }]
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
      formData.value = await RestaurantApi.getTable(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const resetForm = () => {
  formData.value = { id: undefined, storeId: undefined, tableNo: '', category: '', seats: 1, status: 0 }
  formRef.value?.resetFields()
}

onMounted(async () => {
  storeOptions.value = await RestaurantApi.getStoreSimpleList()
})

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await RestaurantApi.createTable(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updateTable(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>
