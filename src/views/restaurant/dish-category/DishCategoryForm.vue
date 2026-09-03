<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="分类名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入分类名称" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="9999" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">上架</el-radio>
          <el-radio :label="0">下架</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="loading" @click="submit">确定</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { getDishCategory, createDishCategory, updateDishCategory } from '@/api/restaurant'
import type { FormInstance, FormRules } from 'element-plus'

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const loading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: undefined as number | undefined,
  name: '',
  sort: 1,
  status: 1,
  remark: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  sort: [{ required: true, message: '排序不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
}

async function open(type: 'create' | 'update', id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增菜品分类' : '编辑菜品分类'
  formRef.value?.resetFields()
  formData.id = undefined
  formData.name = ''
  formData.sort = 1
  formData.status = 1
  formData.remark = ''
  if (type === 'update' && id) {
    loading.value = true
    try {
      const data = await getDishCategory(id)
      if (data) Object.assign(formData, data)
    } finally {
      loading.value = false
    }
  }
}

async function submit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const payload = { ...formData }
  if (formData.id === undefined) {
    await createDishCategory(payload)
    message.success('创建成功')
  } else {
    await updateDishCategory(payload)
    message.success('更新成功')
  }
  dialogVisible.value = false
  emit('success')
}

defineExpose({ open })
const emit = defineEmits(['success'])
</script>
