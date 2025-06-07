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

export default defineComponent({
  name: 'UploadLocalImg',
  props: {
    modelValue: {
      type: [Blob, null],
      default: null
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const previewUrl = ref<string | null>(null)

    // 当外部 modelValue 重置或修改时，更新预览
    watch(
      () => props.modelValue,
      (file) => {
        if (file) {
          previewUrl.value = URL.createObjectURL(file)
        } else {
          if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
          previewUrl.value = null
        }
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
