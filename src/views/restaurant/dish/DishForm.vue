<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="菜品分类" prop="categoryId">
        <el-select v-model="formData.categoryId" placeholder="请选择分类" clearable>
          <el-option v-for="c in categoryOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="菜品名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入菜品名称" />
      </el-form-item>
      <el-form-item label="菜品图片" prop="image">
        <el-input v-model="formData.image" placeholder="图片 URL" />
      </el-form-item>
      <el-form-item label="价格(分)" prop="price">
        <el-input-number v-model="formData.price" :min="0" :step="100" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="0">下架</el-radio>
          <el-radio :value="1">上架</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="售罄" prop="soldOut">
        <el-radio-group v-model="formData.soldOut">
          <el-radio :value="0">否</el-radio>
          <el-radio :value="1">是</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="菜品描述" />
      </el-form-item>

      <el-divider content-position="left">规格选项（单选，叠加到基础价）</el-divider>
      <div v-for="(s, i) in formData.specs" :key="'spec' + i" class="opt-row">
        <el-input v-model="s.groupName" placeholder="组名(如:辣度)" style="width: 140px" />
        <el-input v-model="s.optionName" placeholder="选项(如:微辣)" style="width: 140px" />
        <el-input-number v-model="s.priceDelta" :min="0" :step="100" placeholder="加价(分)" />
        <el-input-number v-model="s.sort" :min="0" placeholder="排序" />
        <el-button type="danger" link @click="formData.specs.splice(i, 1)">删除</el-button>
      </div>
      <el-button @click="formData.specs.push({ groupName: '', optionName: '', priceDelta: 0, sort: 0 })">
        + 添加规格
      </el-button>

      <el-divider content-position="left">加料选项（可多选，叠加到订单行）</el-divider>
      <div v-for="(a, i) in formData.addons" :key="'addon' + i" class="opt-row">
        <el-input v-model="a.groupName" placeholder="组名(如:加料)" style="width: 140px" />
        <el-input v-model="a.optionName" placeholder="选项(如:加蛋)" style="width: 140px" />
        <el-input-number v-model="a.priceDelta" :min="0" :step="100" placeholder="加价(分)" />
        <el-radio-group v-model="a.multi">
          <el-radio :value="1">可多选</el-radio>
          <el-radio :value="0">单选</el-radio>
        </el-radio-group>
        <el-input-number v-model="a.sort" :min="0" placeholder="排序" />
        <el-button type="danger" link @click="formData.addons.splice(i, 1)">删除</el-button>
      </div>
      <el-button @click="formData.addons.push({ groupName: '', optionName: '', priceDelta: 0, multi: 1, sort: 0 })">
        + 添加加料
      </el-button>
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

/** 菜品 表单 */
defineOptions({ name: 'RestaurantDishForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const categoryOptions = ref<any[]>([])
const formData = ref({
  id: undefined,
  categoryId: undefined,
  name: '',
  image: '',
  price: 0,
  sort: 0,
  status: 1,
  soldOut: 0,
  description: '',
  specs: [],
  addons: []
})
const formRules = reactive({
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  name: [{ required: true, message: '菜品名称不能为空', trigger: 'blur' }],
  price: [{ required: true, message: '价格不能为空', trigger: 'blur' }]
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
      formData.value = await RestaurantApi.getDish(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const resetForm = () => {
  formData.value = {
    id: undefined, categoryId: undefined, name: '', image: '', price: 0,
    sort: 0, status: 1, soldOut: 0, description: '', specs: [], addons: []
  }
  formRef.value?.resetFields()
}

onMounted(async () => {
  categoryOptions.value = await RestaurantApi.getDishCategorySimpleList()
})

const emit = defineEmits(['success'])
const submitForm = async () => {
  await formRef.value.validate()
  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await RestaurantApi.createDish(formData.value)
      message.success(t('common.createSuccess'))
    } else {
      await RestaurantApi.updateDish(formData.value)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.opt-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
</style>
