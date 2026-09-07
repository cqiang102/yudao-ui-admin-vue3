<template>
  <ContentWrap>
    <el-form ref="queryFormRef" :inline="true" :model="queryParams" class="-mb-15px" label-width="68px">
      <el-form-item label="会员ID" prop="id">
        <el-input v-model="queryParams.id" class="!w-200px" clearable placeholder="会员ID" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery"><Icon icon="ep:search" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" /> 重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list">
      <el-table-column align="center" label="会员ID" prop="id" min-width="90" />
      <el-table-column align="center" label="用户ID" prop="userId" min-width="90" />
      <el-table-column align="center" label="等级" prop="levelName" min-width="80" />
      <el-table-column align="center" label="积分" prop="pointBalance" min-width="90" />
      <el-table-column align="center" label="成长值" prop="growthValue" min-width="90" />
      <el-table-column align="center" label="标签（M-22）" min-width="180">
        <template #default="{ row }">
          <template v-if="parseTags(row.tags).length">
            <el-tag
              v-for="t in parseTags(row.tags)"
              :key="t"
              size="small"
              class="mr-4px"
              type="warning"
            >
              {{ t }}
            </el-tag>
          </template>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column align="center" label="创建时间" prop="createTime" min-width="160" />
      <el-table-column align="center" label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button
            v-hasPermi="['restaurant:member:update-tag']"
            link
            type="primary"
            @click="openTagForm(row)"
          >
            编辑标签
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      v-model:limit="queryParams.pageSize"
      v-model:page="queryParams.pageNo"
      :total="total"
      @pagination="getList"
    />

    <!-- 标签编辑 -->
    <Dialog v-model="tagDialogVisible" title="编辑会员标签" width="480px">
      <el-form label-width="80px" @submit.prevent>
        <el-form-item label="会员ID">
          <span>{{ tagForm.id }}</span>
        </el-form-item>
        <el-form-item label="标签">
          <el-input
            v-model="tagForm.input"
            placeholder="多个标签用逗号分隔，如：高频,企业客户（留空清空）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saving" @click="saveTags">确 定</el-button>
      </template>
    </Dialog>
  </ContentWrap>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getMemberPage, updateMemberTags } from '@/api/restaurant'

defineOptions({ name: 'RestaurantMember' })

const message = useMessage()
const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const queryParams = ref({ pageNo: 1, pageSize: 10, id: undefined })

const tagDialogVisible = ref(false)
const saving = ref(false)
const tagForm = ref({ id: 0, input: '' })

/** tags JSON 字符串 → 数组 */
function parseTags(tags?: string | null): string[] {
  if (!tags) return []
  try {
    const arr = JSON.parse(tags)
    return Array.isArray(arr) ? arr.filter((t) => typeof t === 'string' && t.trim()) : []
  } catch {
    return []
  }
}

function openTagForm(row: any) {
  tagForm.value = { id: row.id, input: parseTags(row.tags).join(',') }
  tagDialogVisible.value = true
}

async function saveTags() {
  saving.value = true
  try {
    const tags = tagForm.value.input
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean)
    await updateMemberTags({ id: tagForm.value.id, tags: JSON.stringify(tags) })
    message.success('标签已更新')
    tagDialogVisible.value = false
    getList()
  } finally {
    saving.value = false
  }
}

async function getList() {
  loading.value = true
  try {
    const res = await getMemberPage(queryParams.value)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}
function handleQuery() {
  queryParams.value.pageNo = 1
  getList()
}
function resetQuery() {
  queryParams.value.id = undefined
  handleQuery()
}
getList()
</script>
