<template>
  <div class="upload-local-img">
    <input type="file" accept="image/*" @change="onFileChange" />
    <div v-if="previewUrl" class="preview">
      <img :src="previewUrl" alt="preview" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { makeDataUrl } from './uploadImgUtil'
export default defineComponent({
  name: 'UploadLocalImg',
  props: {
    modelValue: {
      type: [Blob, String] as PropType<Blob | string | null>,
      default: null
    }
  },
  emits: ['update:modelValue'],

  setup(props, { emit }) {
    const previewUrl = ref<string | null>(null)

    watch(
      () => props.modelValue,
      (val) => {
        // 释放之前的 URL（如果有的话）
        if (previewUrl.value) {
          URL.revokeObjectURL(previewUrl.value)
          previewUrl.value = null
        }

        if (val instanceof Blob) {
          // 1) 真实的 File/Blob，才 createObjectURL
          previewUrl.value = URL.createObjectURL(val)
        } else if (typeof val === 'string') {
          // 2) 如果传过来就是一个 URL 或 base64 字符串
          previewUrl.value = makeDataUrl(val)
        }
        // 3) 其它情况（null、number[]、undefined…）都不显示预览
      },
      { immediate: true }
    )

    const onFileChange = (e: Event) => {
      const input = e.target as HTMLInputElement
      if (input.files && input.files[0]) {
        const file = input.files[0]
        // 触发 v-model 更新
        emit('update:modelValue', file)
        // 生成预览 URL
        previewUrl.value = URL.createObjectURL(file)
      }
    }

    return { previewUrl, onFileChange }
  }
})
</script>

<style scoped>
.upload-local-img input[type='file'] {
  display: block;
}
.preview img {
  max-width: 100%;
  height: auto;
  margin-top: 8px;
}
</style>
