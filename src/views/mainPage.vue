<template>
  <div v-if="isFontLoaded" class="main">
    <!--    <div>abcdefghijklmnopqrstuvwxyz</div>-->
    <!--    <div>ABCDEFGHIJKLMNOPQRSTUVWXYZ</div>-->
    <!--    <div>~!@#$%^&*()`_+-={}|[]\:";'<>?,./</div>-->
    <!--    <div>~！@#￥%……&*（）·、：“；‘《》？，。、</div>-->
    <!--    <div>中文字体预览内容</div>-->
    <div style="position: relative;margin:10px;padding:5px 0;background-color: white;border-radius: 10px;pointer-events: none">
      <div style="width: 100%;position: relative;overflow: hidden;padding:10px 0;display: flex;justify-content: center">
        <div ref="messageRef" style="position: relative;background-color: white;">
          <div ref="contentTextRef" class="content-text" :style="{fontSize:options.fontSize+'px',maxWidth:options.maxWidth+'px'}">{{ options.text }}</div>
          <RoughPanel
            ref="roughPanelRef"
            class="rough-panel"
            :class="{
              'rough-panel--tr':options.cornerPlace===CornerPlace.TopRight,
              'rough-panel--br':options.cornerPlace===CornerPlace.BottomRight,
              'rough-panel--bl':options.cornerPlace===CornerPlace.BottomLeft,
            }"
            :w="Math.max(options.fontSize,panelSize.w)"
            :h="Math.max(options.fontSize,panelSize.h)"
            :rx="options.fontSize"
            :ry="options.fontSize"
          />
        </div>
      </div>
    </div>
    <div style="height: 10px" />
    <van-cell-group inset>
      <van-cell>
        <div style="text-align: left">内容</div>
        <van-field
          v-model="options.text"
          rows="2"
          autosize
          type="textarea"
          maxlength="100"
          placeholder="输入内容"
          show-word-limit
        />
      </van-cell>
      <van-cell>
        <div style="text-align: left">字号</div>
        <div style="position: relative;padding:20px 15px">
          <van-slider v-model="options.fontSize" :min="12" :max="40">
            <template #button>
              <div class="custom-button">{{ options.fontSize }}</div>
            </template>
          </van-slider>
        </div>
      </van-cell>
      <van-cell>
        <div style="text-align: left">最大宽度</div>
        <div style="position: relative;padding:20px 15px">
          <van-slider v-model="options.maxWidth" :min="minWidth" :max="300">
            <template #button>
              <div class="custom-button">{{ options.maxWidth }}</div>
            </template>
          </van-slider>
        </div>
      </van-cell>
      <van-cell>
        <div style="text-align: left">引脚位置</div>
        <van-radio-group v-model="options.cornerPlace" direction="horizontal">
          <div style="display: flex;justify-content: space-around;width: 100%">
            <van-radio :name="CornerPlace.TopLeft">↖</van-radio>
            <van-radio :name="CornerPlace.TopRight">↗</van-radio>
            <van-radio :name="CornerPlace.BottomRight">↙</van-radio>
            <van-radio :name="CornerPlace.BottomLeft">↘</van-radio>
          </div>
        </van-radio-group>
      </van-cell>
      <van-cell>
        <div style="text-align: center">
          <div class="btn" @click="exportGif">GIF</div>
        </div>
      </van-cell>
    </van-cell-group>
  </div>
  <div style="position: fixed;inset:0;display: flex;align-items: center;justify-content: center;background-color: rgba(255,255,255,0.6);z-index: 1000" v-if="isRenderLoading">
    <van-loading type="spinner" />
  </div>
</template>
<script setup lang="ts">
import * as fontLoader from '@/util/font'
import * as AssetsFont from '@/assets/font'

import RoughPanel from '@/components/roughPanel.vue'
import { computed, onMounted, onUpdated, ref, watch } from 'vue'
import GIF from 'gif.js'
import domToImage from 'dom-to-image'

const isFontLoaded = ref(false)
fontLoader.setFontSync([
  {
    fontFamily: 'FZMWFont',
    fontSrc: AssetsFont.FZMWFont,
    loaded: () => {
      isFontLoaded.value = true
    }
  }
])
const contentTextRef = ref<HTMLDivElement>()

enum CornerPlace {
  TopLeft,
  TopRight,
  BottomRight,
  BottomLeft,
}

const options = ref<{
  text: string,
  fontSize: number,
  maxWidth: number,
  cornerPlace: CornerPlace
}>({
  text: '输入一些内容',
  fontSize: 20,
  maxWidth: 200,
  cornerPlace: CornerPlace.TopLeft
})

const panelSize = ref({
  w: 20,
  h: 20
})

const updatePanel = () => {
  if (!contentTextRef.value) {
    return
  }
  const rect = contentTextRef.value.getBoundingClientRect()
  panelSize.value.w = rect.width
  panelSize.value.h = rect.height
}
onMounted(updatePanel)
onUpdated(updatePanel)

const roughPanelRef = ref()
const messageRef = ref()
const isRenderLoading = ref(false)
const exportGif = async () => {
  isRenderLoading.value = true
  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: (import.meta.env.DEV? '/comic-message':'')+ '/gif.worker.js'
  })
  gif.addFrame(await getImageData())
  gif.addFrame(await getImageData(), { delay: 200 })
  gif.addFrame(await getImageData(), { delay: 200 })
  gif.on('finished', (blob: Blob) => {
    // window.open(URL.createObjectURL(blob)) // 新页面预览
    const a = document.createElement('a')
    a.href = window.URL.createObjectURL(blob)
    a.download = 'gif-' + Date.now()
    a.click()
    a.remove()
    isRenderLoading.value = false
  })
  gif.render()

}


const minWidth = computed(() => options.value.fontSize + 7)
watch(() => options.value.fontSize, () => {
  options.value.maxWidth = Math.max(minWidth.value, options.value.maxWidth)
})

const getImageData = () => new Promise<ImageData>((resolve, reject) => {
  const img = new Image()
  domToImage.toPng(messageRef.value).then((val: string) => {
    img.src = val
    // document.body.appendChild(img)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject('no ctx')
      } else {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
      }
    }
  }).catch((e: any) => {
    reject(e)
  })
})
</script>
<style scoped lang="less">
.main {
  margin: auto;
  width: 375px;
  height: 100%;
  background-color: #f0f0f0;
  font-size: 20px;
  text-align: center;
  font-family: FZMWFont, sans-serif;
  user-select: none;
  padding: 10px;

  .custom-button {
    width: 26px;
    color: #fff;
    font-size: 16px;
    text-align: center;
    background-color: var(--van-primary-color);
    border-radius: 100px;
  }

  .content-text {
    position: absolute;
    padding: 5px 3px 0 5px;
    border-radius: 50%;
    text-align: center;
    white-space: pre-wrap;
    word-break: break-all;
    z-index: 2;
    color: #666
  }

  .rough-panel {
    vertical-align: top;
    z-index: 1;

    &--tr {
      transform: rotateY(180deg);
    }

    &--br {
      transform: rotateX(180deg);
    }

    &--bl {
      transform: rotateY(180deg) rotateX(180deg);
    }
  }

  .btn {
    cursor: pointer;
    display: inline-block;
    padding: 5px 10px;
    font-size: 20px;
    border-radius: 20px;
    border: 1px solid #aaa;

    &:active, &:hover {
      opacity: 0.8;
    }
  }
}
</style>
<style lang="less">
@font-face {
  font-family: FZMWFont;
  src: url('@/assets/font/FZMWFont.woff2');
}
</style>
