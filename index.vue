<template>
  <div>
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
      <vxe-table-column field="salesLastYear" title="去年年销" min-width="100" sortable />
      <vxe-table-column field="salesLastMonth" title="上月销量" min-width="100" sortable />
      <vxe-table-column field="salesAvg30" title="近30天日均销量" min-width="100" sortable />
      <vxe-table-column field="salesTotal30" title="近30天总销量" min-width="100" sortable />
      <vxe-table-column field="fbaInbound" title="FBA inbound" min-width="100" sortable />
      <vxe-table-column field="fbaAvailableReserved" title="FBA available+ reserved" min-width="110" sortable />
      <vxe-colgroup v-for="item in subTableHeader" :key="item" :title="item">
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays181`" title="181-270 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays181`" title="181-270 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays181`" title="181-270 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays271`" title="271-365 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays365`" title="365+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays365`" title="365+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays180`" title="180+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.invAgeDays270`" title="270+ 天" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.lastWeekSales`" title="上周销量" min-width="100" />
        <vxe-table-column :field="`weekDataList.${item}.fbaAvailableReserved`" title="FBA available+ reserved" min-width="100" />
      </vxe-colgroup>
    </vxe-table>
    <Paging ref="pager" :pager="pager" :config="pagerConfig" end @update="pagerUpdate" />
  </div>
</template>
<script>
