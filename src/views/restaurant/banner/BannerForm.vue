<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle">
    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-width="100px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入轮播图标题" />
      </el-form-item>
      <el-form-item label="图片" prop="image">
        <el-input v-model="formData.image" placeholder="图片 URL" />
      </el-form-item>
      <el-form-item v-if="formData.image" label="预览">
        <el-image
          :src="formData.image"
          fit="cover"
          style="width: 200px; height: 112px; border-radius: 4px"
        />
      </el-form-item>
      <el-form-item label="跳转类型" prop="linkType">
        <el-radio-group v-model="formData.linkType">
          <el-radio :label="0">不跳转</el-radio>
          <el-radio :label="1">菜品</el-radio>
          <el-radio :label="2">门店</el-radio>
          <el-radio :label="3">外链</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.linkType !== 0" label="跳转目标" prop="linkValue">
        <el-input v-model="formData.linkValue" :placeholder="linkValuePlaceholder" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :max="9999" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :label="1">启用</el-radio>
          <el-radio :label="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="loading" @click="submit">确定</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getBanner, createBanner, updateBanner } from '@/api/restaurant'
import type { FormInstance, FormRules } from 'element-plus'

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const loading = ref(false)
const formRef = ref<FormInstance>()

const formData = reactive({
  id: undefined as number | undefined,
  title: '',
  image: '',
  linkType: 0,
  linkValue: '',
  status: 1,
  sort: 1
})

const rules: FormRules = {
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  image: [{ required: true, message: '图片不能为空', trigger: 'blur' }],
  linkType: [{ required: true, message: '跳转类型不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }]
}

const linkValuePlaceholder = computed(() => {
  switch (formData.linkType) {
    case 1:
      return '请输入菜品编号'
    case 2:
      return '请输入门店编号'
    case 3:
      return '请输入外链 URL（需以 http/https 开头）'
    default:
      return ''
  }
})

async function open(type: 'create' | 'update', id?: number) {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '新增轮播图' : '编辑轮播图'
  formRef.value?.resetFields()
  formData.id = undefined
  formData.title = ''
  formData.image = ''
  formData.linkType = 0
  formData.linkValue = ''
  formData.status = 1
  formData.sort = 1
  if (type === 'update' && id) {
    loading.value = true
    try {
      const data = await getBanner(id)
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
    await createBanner(payload)
    message.success('创建成功')
  } else {
    await updateBanner(payload)
    message.success('更新成功')
  }
  dialogVisible.value = false
  emit('success')
}

defineExpose({ open })
const emit = defineEmits(['success'])
</script>
