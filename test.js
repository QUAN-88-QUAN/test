<template>
  <div>
    <el-form ref="form" :model="form" :rules="formRules" inline>
      <el-form-item label="" prop="siteIdList">
        <erp-selection
          v-model="form.siteIdList"
          placeholder="请选择站点"
          :params="{ platformId: [1] }"
          api-key="siteAlone"
          multiple
          @change="
            form.shopIdList=[]
            form.styleIdList=[]
            form.colorList=[]
            form.sizeList=[]
          "
        />
      </el-form-item>
      <el-form-item label="" prop="shopIdList">
        <erp-selection
          v-model="form.shopIdList"
          ganged
          :params="{ platformId: [1],siteId:form.siteIdList }"
          placeholder="请选择店铺"
          multiple
          api-key="shopAlone"
          not-required-params
          @change="
            form.styleIdList=[]
            form.colorList=[]
            form.sizeList=[]
          "
        />
      </el-form-item>
      <el-form-item label="" prop="buUser">
        <CascadeSelector
          v-model="form.buUser"
          collapse-tags
          api-key="BUTree"
          :permission="false"
          placeholder="请选择BU"
          @change="
            form.styleIdList=[]
            form.colorList=[]
            form.sizeList=[]
          "
        />
      </el-form-item>
      <el-form-item label="" prop="styleIdList">
        <virtualized-select
          v-model="form.styleIdList"
          :options="styleList"
          :props="{
            label: 'style',
            value: 'styleId',
          }"
          collapse-tags
          multiple
          placeholder="请选择Style"
          @input="
            form.colorList=[]
            form.sizeList=[]
          "
        />
      </el-form-item>

      <el-form-item label="" prop="colorList">
        <ErpSelection
          v-model="form.colorList"
          multiple
          ganged
          not-required-params
          api-key="colorByStyleIdRefactor"
          :params="{ styleIdList : form.styleIdList }"
          placeholder="请选择Color"
        />
      </el-form-item>
      <el-form-item label="" prop="sizeList">
        <ErpSelection
          v-model="form.sizeList"
          multiple
          ganged
          not-required-params
          api-key="sizeByStyleIdRefactor"
          :params="{ styleIdList : form.styleIdList }"
          placeholder="请选择Size"
        />
      </el-form-item>
      <el-form-item label="" prop="categoryIdList">
        <CascadeSelector
          v-model="form.categoryIdList"
          collapse-tags
          :permission="false"
          api-key="categoryTreeRefactor"
          :props="{emitPath:false,multiple:true}"
          placeholder="请选择类目"
        />
      </el-form-item>
      <el-form-item label="" prop="operatorNameList">
        <ErpSelection
          v-model="form.operatorNameList"
          api-key="operationsUser"
          multiple
          placeholder="请选择运营负责人"
        />
      </el-form-item>

      <el-form-item label="" prop="stylePositionIdList">
        <ErpSelection
          v-model="form.stylePositionIdList"
          placeholder="请选择Style定位"
          api-key="stylePosition"
          multiple
        />
      </el-form-item>
      <el-form-item label="" prop="soldOut">
        <el-select v-model="form.soldOut" filterable clearable placeholder="是否能卖完">
          <el-option label="基于销售预测-能" :value="1" />
          <el-option label="基于销售预测-不能" :value="2" />
          <el-option label="基于去年同期-能" :value="3" />
          <el-option label="基于去年同期-不能" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="" prop="seasonIdList">
        <ErpSelection
          v-model="form.seasonIdList"
          multiple
          placeholder="请选择季节"
          api-key="season"
        />
      </el-form-item>
      <el-form-item label="" prop="msku">
        <el-input v-model="form.msku" placeholder="请输入MSKU" style="width: 199px;" />
      </el-form-item>
      <el-form-item label="" prop="startWeek">
        <el-date-picker
          v-model="form.startWeek"
          type="week"
          :format="'yyyy 第 WW 周'"
          :value-format="'yyyy-MM-dd'"
          :picker-options="pickerOptions()"
          placeholder="请选择开始日期"
        />
      </el-form-item>
      <div style="margin: 0px 0px 18px 0px; display: inline-block">
        <el-button type="primary" :loading="searchLoading" @click="handleQuery()">查询</el-button>
        <el-button @click="handleReset()">重置</el-button>
      </div>
    </el-form>
    <vxe-toolbar>
      <template #buttons>
        <span>最近更新日期：{{ lastTime }}</span>
      </template>
      <template v-slot:tools>
        <i class="el-icon-download" style="margin-right: 3px;font-size: 20px;" @click="handleExport" />
        <VxeColumnSettings
          v-if="xTableRef"
          ref="VxeColumnSettings"
          :container-ref="xTableRef"
          ref-name="xTable"
          local-key="fba-redundant-inventory-msku"
        >
          <i class="icon-button mx-1 el-icon-s-fold" @click="$refs['VxeColumnSettings'].visibleShow()" />
        </VxeColumnSettings>
      </template>
    </vxe-toolbar>
    <vxe-table
      ref="table"
      v-loading="searchLoading"
      :max-height="maxHeight"
      class="xTable"
      align="center"
      :data="tableData"
      show-overflow
      :scroll-x="{ enabled: false }"
      :scroll-y="{ enabled: false }"
      :row-config="{ isHover: true,height: 60 }"
      :column-config="{ resizable: true }"
      :show-header-overflow="false"
      :sort-config="{remote:true}"
      @sort-change="sortChange"
    >
      <vxe-table-column field="imageUrl" title="图片" min-width="100" fixed="left">
        <template #default="{ row }">
          <el-image
            style="width: 50px; height: 50px"
            :src="row.imageUrl"
            fit="contain"
            :preview-src-list="[row.imageUrl]"
          />
        </template>
      </vxe-table-column>
      <vxe-table-column field="msku" title="MSKU" min-width="100" fixed="left" />
      <vxe-table-column field="platformSiteShop" title="站点/店铺" min-width="120" />
      <vxe-table-column field="asin" title="ASIN" min-width="120" />
      <vxe-table-column field="sku" title="SKU" min-width="150" />
      <vxe-table-column field="color" title="Color" min-width="100" />
      <vxe-table-column field="size" title="Size" min-width="80" />
      <vxe-table-column field="style" title="Style" min-width="100" />
      <vxe-table-column field="bu" title="BU" min-width="100" />
      <vxe-table-column field="operation" title="运营" min-width="100" />
      <vxe-table-column field="stylePosition" title="Style定位" min-width="100" />
      <vxe-table-column field="skuPosition" title="SKU定位" min-width="100" />
      <vxe-table-column field="season" title="季节" min-width="80" />
      <vxe-table-column field="category" title="类目" min-width="150" />
      <vxe-table-column field="year" title="上架年份" min-width="100" />
      <vxe-table-column field="lastWeekChange180" title="最近一周180天+冗余" min-width="100" sortable>
        <template #default="{ row }">
          <span :style="{ color: row.lastWeekChange180>0 ? '#F56C6C' : '' }">{{ row.lastWeekChange180 }}</span>
        </template>
      </vxe-table-column>>
      <vxe-table-column field="lastWeekChange270" title="最近一周270天+冗余" min-width="100" sortable>
        <template #default="{ row }">
          <span :style="{ color: row.lastWeekChange270>0 ? '#F56C6C' : '' }">{{ row.lastWeekChange270 }}</span>
        </template>
      </vxe-table-column>>
      <vxe-table-column field="twoWeekChange180" title="180天+冗余近2周变化" min-width="100" sortable>
        <template #default="{ row }">
          <span :style="{ color: row.twoWeekChange180>0 ? '#F56C6C' : '' }">{{ row.twoWeekChange180 }}</span>
        </template>
      </vxe-table-column>>
      <vxe-table-column field="twoWeekChange270" title="270天+冗余近2周变化" min-width="100" sortable>
        <template #default="{ row }">
          <span :style="{ color: row.twoWeekChange270>0 ? '#F56C6C' : '' }">{{ row.twoWeekChange270 }}</span>
        </template>
      </vxe-table-column>>
      <vxe-table-column field="twoWeekChangeFbaAvailableReserved" title="FBA available+ reserved 近2周变化" min-width="140" sortable>
        <template #default="{ row }">
          <span :style="{ color: row.twoWeekChangeFbaAvailableReserved>0 ? '#F56C6C' : '' }">{{ row.twoWeekChangeFbaAvailableReserved }}</span>
        </template>
      </vxe-table-column>
      <vxe-table-column field="sellForecastStatus" title="180天+当季度能否卖完（基于销量预测）" min-width="150" />
      <vxe-table-column field="sellSalesStatus" title="180天+当季度能否卖完（基于去年同期）" min-width="150" />
      <vxe-colgroup title="月销售预测 / 去年同期月销" min-width="100">
        <vxe-table-column v-for="i in tableHeader" :key="i" :field="`salesDataList.${i}`" :title="i" min-width="100" />
      </vxe-colgroup>
      <vxe-table-column field="salesLastYear" title="去年年销" min-width="100" sortable />
      <vxe-table-column field="salesLastMonth" title="上月销量" min-width="100" sortable />
      <vxe-table-column field="salesAvg30" title="近30天日均销量" min-width="100" sortable />
      <vxe-table-column field="salesTotal30" title="近30天总销量" min-width="100" sortable />
      <vxe-table-column field="fbaInbound" title="FBA inbound" min-width="100" sortable />
      <vxe-table-column field="fbaAvailableReserved" title="FBA available+ reserved" min-width="110" sortable />
      <vxe-colgroup v-for="item in subTableHeader" :key="item" :title="item">
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays181`" title="181-270 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays271`" title="271-365 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays365`" title="365+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays180`" title="180+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays270`" title="270+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays270`" title="270+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.lastWeekSales`" title="上周销量" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.fbaAvailableReserved`" title="FBA available+ reserved" min-width="100" />
      </vxe-colgroup>
    </vxe-table>
    <Paging ref="pager" :pager="pager" :config="pagerConfig" end @update="pagerUpdate" />
  </div>
</template>
<script>
