Component({
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '',
    },
    content: {
      type: String,
      value: '',
    },
    confirmText: {
      type: String,
      value: '确定',
    },
    cancelText: {
      type: String,
      value: '取消',
    },
    showCancel: {
      type: Boolean,
      value: true,
    },
    maskClosable: {
      type: Boolean,
      value: false,
    },
    danger: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    noop() {},

    onMaskTap() {
      if (!this.data.maskClosable) {
        return
      }
      this.triggerEvent('cancel')
    },

    onConfirmTap() {
      this.triggerEvent('confirm')
    },

    onCancelTap() {
      this.triggerEvent('cancel')
    },
  },
})
