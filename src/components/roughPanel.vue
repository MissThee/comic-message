<template>
  <canvas ref="canvasRef" :width="props.w+margin*2" :height="props.h+margin*2" />
</template>
<script setup lang="ts">
import { onMounted, ref, defineProps, withDefaults, onUnmounted } from 'vue'
import rough from 'roughjs'
import type { Options } from 'roughjs/bundled/core'

const props = withDefaults(defineProps<{
  w: number
  h: number
  rx?: number
  ry?: number
  roughOpt?: Options
}>(), {
  w: 50,
  h: 50,
  rx: 25,
  ry: 25
})

const roughOptDefault: Options = {
  stroke: '#999',
  roughness: 0.5,
  bowing: 2
}

const margin = 2

const canvasRef = ref<HTMLCanvasElement>()
const pathShow = ref('')

let looper: number | null = null
const startLooper = () => {
  stopLooper()
  looper = setInterval(() => {
    drawPanel({
      w: props.w,
      h: props.h,
      rx: props.rx,
      ry: props.ry
    })
  }, 200)
}
const stopLooper = () => {
  if (looper) {
    clearInterval(looper)
    looper = null
  }
}
onMounted(startLooper)
onUnmounted(stopLooper)
const drawPanel = (params: {
  w: number,
  h: number,
  rx?: number,
  ry?: number,
  roughOpt?: Options
}) => {
  if (!canvasRef.value) {
    return
  }
  const context = canvasRef.value?.getContext('2d')
  context?.clearRect(0, 0, canvasRef.value?.width || 0, canvasRef.value?.height || 0)
  const panelOption = {
    leftTopPoint: { x: margin, y: margin },
    rightBottomPoint: { x: 0, y: 0 },
    rx: 0,
    ry: 0
  }
  panelOption.rightBottomPoint.x = panelOption.leftTopPoint.x + params.w
  panelOption.rightBottomPoint.y = panelOption.leftTopPoint.y + params.h
  const maxRx = (panelOption.rightBottomPoint.x - panelOption.leftTopPoint.x) / 2
  const maxRy = (panelOption.rightBottomPoint.y - panelOption.leftTopPoint.y) / 2
  if (params.rx === undefined) {
    params.rx = Math.min(maxRx, maxRy)
  }
  if (params.ry === undefined) {
    params.ry = Math.min(maxRx, maxRy)
  }
  panelOption.rx = Math.max(Math.min(maxRx, params.rx), 0)
  panelOption.ry = Math.max(Math.min(maxRy, params.ry), 0)

  const panelPoints = [
    [ // 上
      { x: panelOption.leftTopPoint.x + panelOption.rx, y: panelOption.leftTopPoint.y },
      { x: panelOption.rightBottomPoint.x - panelOption.rx, y: panelOption.leftTopPoint.y }
    ],
    [ // 右
      { x: panelOption.rightBottomPoint.x, y: panelOption.leftTopPoint.y + panelOption.ry },
      { x: panelOption.rightBottomPoint.x, y: panelOption.rightBottomPoint.y - panelOption.ry }
    ],
    [ // 下
      { x: panelOption.rightBottomPoint.x - panelOption.rx, y: panelOption.rightBottomPoint.y },
      { x: panelOption.leftTopPoint.x + panelOption.rx, y: panelOption.rightBottomPoint.y }
    ],
    [ // 左
      { x: panelOption.leftTopPoint.x, y: panelOption.rightBottomPoint.y - panelOption.ry },
      { x: panelOption.leftTopPoint.x, y: panelOption.leftTopPoint.y + panelOption.ry }
    ]
  ]
  let path = ``
  panelPoints.forEach((_, index) => {
    const line = panelPoints[index]
    if (index === 0) {
      path += `M${line[0].x} ${line[0].y} `
    }
    path += `A ${panelOption.rx} ${panelOption.ry},0,0,1,${line[0].x} ${line[0].y} `
    path += `L ${line[1].x} ${line[1].y} `

    if (index === panelPoints.length - 1) {
      path += `A ${panelOption.rx * 4} ${panelOption.ry * 4},0,0,0,${panelOption.leftTopPoint.x / 2} ${panelOption.leftTopPoint.y} Z`
    }
  })

  const rc = rough.canvas(canvasRef.value)
  pathShow.value = path
  rc.path(path, {
    ...roughOptDefault,
    ...params?.roughOpt
  })
}
const getCanvas = () => canvasRef.value

defineExpose({ getCanvas })
</script>

<style scoped lang="less">

</style>
