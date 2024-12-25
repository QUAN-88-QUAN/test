<template>
  <div>
    <el-form ref="form" :model="form" :rules="formRules" inline>
      <el-form-item label="" prop="siteId">
        <erp-selection
          v-model="form.siteId"
          :clearable="false"
          placeholder="站点"
          :params="siteParams"
          api-key="siteAlone"
          :need-list="needSiteList"
          @responseData="responseDataSite"
        />
      </el-form-item>
      <el-form-item label="" prop="time">
        <date-type-picker
          ref="dateTypePicker"
          v-model="form.time"
          :week-range="60"
          :type-config="['week', 'month', 'quarter']"
          :type.sync="form.type"
          :week-picker-options="{
            startPickerOptions:{
              'firstDayOfWeek':7,
              'format':'yyyy-MM-dd'
            },
            endPickerOptions:{
              'firstDayOfWeek':7,
              'format':'yyyy-MM-dd'
            }
          }"
          style="white-space: nowrap"
          value-format="yyyy-MM-dd"
          @timeTypeChange="handleTimeTypeChange"
        />
      </el-form-item>
      <el-form-item label="" prop="keyword">
        <el-input v-model="form.keyword" placeholder="请输入搜索词">
          <template #prepend>
            <el-select v-model="form.keywordMatch" style="width: 100px">
              <el-option label="模糊匹配" :value="1" />
              <el-option label="精确匹配" :value="2" />
            </el-select>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="" prop="levelId">
        <ErpSelection
          v-model="form.levelId"
          placeholder="等级"
          multiple
          api-key="gradeList"
        />
      </el-form-item>
      <el-form-item label="" prop="categoryId">
        <CascadeSelector
          v-model="form.categoryId"
          collapse-tags
          :permission="false"
          api-key="categoryTreeRefactor"
          :props="{emitPath:false,multiple:true}"
          placeholder="类目"
        />
      </el-form-item>
      <el-form-item label="" prop="brandId">
        <ErpSelection
          v-model="form.brandId"
          api-key="brandList"
          multiple
          placeholder="品牌"
        />
      </el-form-item>
      <div style="margin: 0px 0px 18px 0px; display: inline-block">
        <el-button type="primary" :loading="searchLoading" @click="handleQuery()">查询</el-button>
        <el-button @click="handleReset()">重置</el-button>
      </div>
    </el-form>
    <vxe-toolbar custom>
      <template #buttons>
        <el-button type="primary" @click="handleImport">导入新增</el-button>
        <el-button type="primary" :disabled="!selectionList.length" @click="handleEdit({})">批量修改</el-button>
        <el-button :disabled="!selectionList.length" @click="handleUnfollow">取消关注</el-button>
      </template>
      <template v-slot:tools>
        <i class="el-icon-download" style="margin-right: 3px;font-size: 20px;" @click="handleExport" />
      </template>
    </vxe-toolbar>
    <vxe-table
      id="aba-top-search-terms-follow-word"
      ref="table"
      v-loading="searchLoading"
      :max-height="maxHeight"
      :min-height="300"
      :custom-config="{storage: true}"
      class="xTable"
      align="center"
      :data="tableData"
      show-overflow
      :scroll-x="{ enabled: true }"
      :scroll-y="{ enabled: true }"
      :row-config="{ isHover: true,height: 120 }"
      :column-config="{ resizable: true,maxFixedSize:20 }"
      :sort-config="{ remote: true }"
      @checkbox-all="selectChangeEvent"
      @checkbox-change="selectChangeEvent"
      @sort-change="handleSort"
      @resizable-change="handleResize"
      @custom="handleCustom"
    >
      <vxe-table-column type="checkbox" width="60" fixed="left" />
      <vxe-table-column field="word" title="关键词" min-width="120" fixed="left">
        <template #header>
          <el-tooltip effect="dark" content="亚马逊顾客搜索的关键词。" placement="top">
            <i class="el-icon-question" />
          </el-tooltip>
          <span>关键词</span>
        </template>
        <template #default="{ row }">
          <span style="color: #409eff; cursor: pointer" @click="handleJumpToAmazonKeyword(row)">{{ row.word }}</span>
        </template>
      </vxe-table-column>
      <vxe-table-column field="categoryName" title="类目" min-width="120" />
      <vxe-table-column field="categoryName" title="等级" min-width="80" />
      <vxe-table-column field="brandName" title="品牌" min-width="100" />
      <vxe-table-column field="rankTrend" title="排名趋势" min-width="180" :show-overflow="false">
        <template #default="{ row, rowIndex }">
          <TableChart :ref="`${TABLE_CHART}${rowIndex}`" :row-data="row" />
        </template>
      </vxe-table-column>
      <vxe-table-column field="latelyRank" title="最近排名" min-width="110" sortable>
        <template #header>
          <el-tooltip effect="dark" content="亚马逊根据搜索频率进行的排名，排名越前表示搜索量越大。" placement="top">
            <i class="el-icon-question" />
          </el-tooltip>
          <span>最近排名</span>
        </template>
      </vxe-table-column>
      <vxe-table-column field="rankChange" title="排名变化" min-width="110">
        <template #header>
          <el-tooltip effect="dark" content="对比当前周期与上一个周期的排名变化情况。" placement="top">
            <i class="el-icon-question" />
          </el-tooltip>
          <span>排名变化</span>
        </template>
        <template #default="{ row }">
          <div v-if="+row.rankType===1" class="arrow-green">
            <span class="el-icon-top" />
            <span>{{ +row.rankChange }}</span>
          </div>
          <div v-if="+row.rankType===2" class="arrow-red">
            <span class="el-icon-top" />
            <span>{{ +row.rankChange }}</span>
          </div>
        </template>
      </vxe-table-column>
      <vxe-table-column field="clickShareTotal" title="最近前三ASIN点击份额" min-width="150" :formatter="formatter">
        <template #header>
          <el-tooltip effect="dark" content="根据搜索结果，选定周期内前三商品的点击率与总点击率之比。" placement="top">
            <i class="el-icon-question" />
          </el-tooltip>
          <span>最近前三ASIN点击份额</span>
        </template>
      </vxe-table-column>
      <vxe-table-column field="conversionShareTotal" title="最近前三ASIN转化份额" min-width="150" :formatter="formatter">
        <template #header>
          <el-tooltip effect="dark" content="根据搜索结果，选定周期内前三商品实现转化的百分比与总转化之比。" placement="top">
            <i class="el-icon-question" />
          </el-tooltip>
          <span>最近前三ASIN转化份额</span>
        </template>
      </vxe-table-column>
      <vxe-table-column field="lastWeekTopAsinClickShare" title="最近前三ASIN/点击份额/转化份额" min-width="180">
        <template #header>
          <el-tooltip effect="dark" content="根据搜索结果，选定周期内点击量排名前三的ASIN及对应的点击份额占比。" placement="top">
            <i class="el-icon-question" />
          </el-tooltip>
          <span>最近前三ASIN/点击份额/转化份额</span>
        </template>
        <template #default="{ row }">
          <div v-for="item in row.lastWeekTopAsinClickShare" :key="item.asin" style="margin-bottom: 5px">
            <span style="color: #409eff; cursor: pointer;margin-right: 5px" @click="handleJumpToAmazon(item)">{{ item.asin }}</span>
            <span style="margin-right: 5px">{{ item.clickShare }}%</span>
            <span>{{ item.conversionShare }}%</span>
          </div>
        </template>
      </vxe-table-column>
      <vxe-table-column v-for="item in headerList" :key="item" :field="item" :title="item" min-width="120" />
      <vxe-table-column field="operate" title="操作" width="80" fixed="right">
        <template #default="{ row }">
          <div>
            <el-button type="text" @click="handlShowDetail(row)">趋势</el-button>
          </div>
          <div>
            <el-button type="text" @click="handleUnfollow(row)">取消关注</el-button>
          </div>
          <div>
            <el-button type="text" @click="handleEdit(row)">编辑</el-button>
          </div>
        </template>
      </vxe-table-column>
    </vxe-table>

    <Paging ref="pager" :pager="pager" :config="pagerConfig" end @update="pagerUpdate" />

    <DialogDetail :visible.sync="dialogDetailVisible" :current-row="currentRow" :save-form="saveForm" />
    <DialogEdit
      :visible.sync="dialogEditVisible"
      :current-row="currentRow"
      :edit-type="editType"
      :selection-list="selectionList"
      @refresh="handleQuery"
    />
    <DialogImport
      :visible.sync="dialogImportVisible"
      :save-form="saveForm"
      :site-name="siteName"
      @refresh="handleQuery"
    />
  </div>
</template>
<script>
import ErpSelection from '@/components/ErpSelection'
import CascadeSelector from '@/components/CascadeSelector'
import Paging from '@/components/Paging'
import DateTypePicker from '@/components/DateTypePicker'
import { dateTypeMap } from '@/components/DateTypePicker/const.js'
import { debounceGetTableMaxHeight, jumpToDownloadMessage } from '@/utils'
import { cloneDeep } from 'lodash'
import DialogDetail from './DialogDetail.vue'
import DialogEdit from './DialogEdit.vue'
import TableChart from './TableChart.vue'
import DialogImport from './DialogImport.vue'
import {
  followWord, cancelFollowWord, followWordDown,
} from '@/api/erp/amazon-advertise'

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'
import updateLocale from 'dayjs/plugin/updateLocale'
dayjs.extend(quarterOfYear)
dayjs.extend(updateLocale)

export default {
  components: {
    ErpSelection, CascadeSelector, Paging, DateTypePicker,
    DialogDetail, DialogEdit, TableChart, DialogImport,
  },
  data() {
    return {
      /**
       * @description 默认站点ID US
       */
      US_ID: 1,
      /**
       * @description 默认平台ID Amazon
       */
      AMAZON_ID: 1,
      /**
       * @description 默认排序字段 latelyRank
       */
      SORT_FIELD: 'latelyRank',
      /**
       * @description 默认排序类型 asc
       */
      SORT_TYPE: 'asc',
      /**
       * @description 获取table图表的实例
       */
      TABLE_CHART: 'TABLE_CHART',

      form: {
        siteId: undefined,
        type: undefined,
        time: [],
        /**
         * @description 默认模糊匹配
         * - 1:模糊匹配
         * - 2:精确匹配
         */
        keywordMatch: 1,
        keyword: undefined,
        levelId: [],
        categoryId: [],
        brandId: [],
        orderByFiled: undefined,
        orderByType: undefined,
      },
      formRules: {},
      searchLoading: false,
      pager: { current: 1, size: 20, total: 0 },
      pagerConfig: ['current', 'size', 'total'],
      tableData: [],
      maxHeight: 500,
      xTableRef: null,
      queryChange: false,
      saveForm: {},
      selectionList: [],
      currentRow: {},
      siteList: [],
      headerList: [],

      dialogDetailVisible: false,

      dialogImportVisible: false,

      dialogEditVisible: false,
      /**
       * @description 编辑类型
       * - batchEdit: 批量编辑
       * - edit: 编辑
       */
      editType: 'edit',
    }
  },
  computed: {
    siteParams() {
      return {
        platformId: [this.AMAZON_ID],
      }
    },
    // US,CA,GB,DE,FR,IT,ES,MX,NL,SE,PL,TR,BE
    needSiteList() {
      return [1, 2, 3, 4, 5, 6, 7, 9, 118, 127, 128, 141, 145]
    },
    siteName() {
      return this.siteList.find(item => item.id === this.saveForm.siteId)?.siteName || ''
    },
    queryParams() {
      /**
       * - 1:周---DateTypePicker:2
       * - 2:月---DateTypePicker:3
       * - 3:季度---DateTypePicker:5
       */
      const dateTypeMap = {
        2: 1,
        3: 2,
        5: 3,
      }
      const [startDate, rawEndDate] = this.form.time || []
      const endDate = rawEndDate && this.form.type === dateTypeMap['month']
        ? dayjs(rawEndDate).endOf('month').format('YYYY-MM-DD')
        : rawEndDate
      return {
        ...this.form, ...this.pager,
        startDate, endDate,
        dateType: dateTypeMap[this.form.type],
      }
    },
  },
  watch: {
    form: {
      handler() {
        this.queryChange = true
      },
      deep: true,
    },
    'styleParams': {
      handler() {
        this.getStyleList()
      },
    },
  },
  created() {
    dayjs.updateLocale('zh-cn', { weekStart: 0 })
    this.initForm()
  },
  mounted() {
    this.$nextTick(() => {
      this.xTableRef = this.$refs.table

      setTimeout(() => {
        this.xTableRef.sort(this.form.orderByFiled, this.form.orderByType)
      })
    })

    this.handleQuery()

    this.debounceGetTableMaxHeight = debounceGetTableMaxHeight.bind(this)
    this.debounceGetTableMaxHeight()
    window.addEventListener('resize', this.debounceGetTableMaxHeight)
  },
  methods: {
    handleEdit(row) {
      /**
       * @description 编辑类型
       * - batchEdit: 批量编辑
       * - edit: 编辑
       */
      this.editType = Object.keys(row).length ? 'edit' : 'batchEdit'
      this.currentRow = row
      this.dialogEditVisible = true
    },
    handleUnfollow(row) {
      const followWordId = row ? [row.id] : this.selectionList.map(item => item.id)
      this.$confirm('请确认是否需要取消关注？', '取消关注', {
        type: 'warning',
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        beforeClose: async(action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true
            instance.cancelButtonLoading = true
            const { success, msg } = await cancelFollowWord({ followWordId }).finally(() => {
              instance.confirmButtonLoading = false
              instance.cancelButtonLoading = false
            })
            if (success) {
              this.$message.success(msg || '操作成功')
              this.handleQuery()
            } else {
              this.$message.error(msg || '操作失败')
            }
            done()
          } else {
            done()
          }
        },
      }).catch(() => {
        // nothing
      })
    },
    handleImport() {
      this.dialogImportVisible = true
    },
    handlShowDetail(row) {
      this.currentRow = row
      this.dialogDetailVisible = true
    },
    async handleExport() {
      const { success, message } = await followWordDown(this.saveForm).finally(() => {
      })
      if (success) {
        jumpToDownloadMessage(message)
      } else {
        this.$message.error(message || '导出失败')
      }
    },
    async getTableData() {
      this.searchLoading = true
      const { datas: { records = [], pager = {}}} = await followWord(this.queryParams).finally(() => {
        this.searchLoading = false
        this.queryChange = false
      })
      this.tableData = records.map(item => {
        let dynamicData = {}
        try {
          dynamicData = JSON.parse(item.ext?.replace(/(\w+):/g, '"$1":'))
        } catch (error) {
          this.$message.error('数据解析失败')
        }
        return {
          ...item,
          ...dynamicData,
        }
      })
      this.pager.total = pager?.total || 0
      this.headerList = this.tableData?.[0]?.rankingDate
    },
    handleReset() {
      this.$refs?.form?.resetFields()
      this.xTableRef?.clearSort()
      this.initForm()
      this.xTableRef?.sort(this.form.orderByFiled, this.form.orderByType)
    },
    handleQuery() {
      this.$refs?.form?.validate(async(valid) => {
        if (!valid) return
        this.saveForm = cloneDeep(this.queryParams)
        if (this.queryChange) {
          this.pager.current = 1
        }
        await this.getTableData()
      })
    },
    pagerUpdate(val) {
      this.pager = val
      this.getTableData()
    },
    initForm() {
      this.form = {
        ...this.form,
        siteId: this.US_ID,
        type: dateTypeMap['week'],
        time: [
          dayjs().subtract(11, 'week').startOf('week').format('YYYY-MM-DD'),
          dayjs().endOf('week').format('YYYY-MM-DD'),
        ],
        orderByFiled: this.SORT_FIELD,
        orderByType: this.SORT_TYPE,
      }
    },
    handleTimeTypeChange(val) {
      // 默认近12周
      if (val === 'week') {
        this.form.time = [
          dayjs().subtract(11, 'week').startOf('week').format('YYYY-MM-DD'),
          dayjs().endOf('week').format('YYYY-MM-DD'),
        ]
      }
      // 默认近12个月
      if (val === 'month') {
        this.form.time = [
          dayjs().subtract(11, 'month').startOf('month').format('YYYY-MM-DD'),
          dayjs().endOf('month').format('YYYY-MM-DD'),
        ]
      }
      // 默认近12个季度
      if (val === 'quarter') {
        this.form.time = [
          dayjs().subtract(11, 'quarter').startOf('quarter').format('YYYY-MM-DD'),
          dayjs().endOf('quarter').format('YYYY-MM-DD'),
        ]
      }
    },
    responseDataSite(val) {
      this.siteList = val
    },
    handleJumpToAmazon(row) {
      window.open(row.asinUrl, '_blank')
    },
    handleJumpToAmazonKeyword(row) {
      window.open(row.wordUrl, '_blank')
    },
    handleSort({ field, order }) {
      this.form.orderByFiled = field
      this.form.orderByType = order
      this.handleQuery()
    },
    selectChangeEvent({ records }) {
      this.selectionList = records
      console.log('selectChangeEvent', this.selectionList)
    },
    formatter({ cellValue, column }) {
      const precentField = ['clickShareTotal', 'conversionShareTotal']
      const cellValueNumber = +cellValue
      const cellValueNumberToLocaleString = cellValueNumber?.toLocaleString()
      if (cellValueNumber && precentField.includes(column.property)) {
        return `${cellValueNumberToLocaleString * 100} %`
      } else if (cellValueNumber) {
        return cellValueNumberToLocaleString
      } else {
        return cellValue
      }
    },

    // 表格自适应宽度，在使用配置列重置的时候宽度没变
    handleResize(val) {
      this.resizeChart()
    },
    handleCustom(val) {
      this.resizeChart()
    },
    resizeChart() {
      // Object.keys(this.$refs).forEach((key) => {
      //   if (key.includes(this.TABLE_CHART)) {
      //     this.$nextTick(() => {
      //       this.$refs[key]?.chartResize()
      //     })
      //   }
      // })
    },
  },
}
</script>
<style lang="scss" scoped>
::v-deep .el-dialog__body {
  padding: 5px 20px;
}
.arrow-red{
  font-size: 14px;vertical-align: text-bottom;color: red;
}
.arrow-green{
  font-size: 14px;vertical-align: text-bottom;color: green;
}
</style>
