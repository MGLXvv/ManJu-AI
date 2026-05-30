import { defineComponent, h } from 'vue';

export const ToolFullscreen = defineComponent({
  name: 'ToolFullscreen',
  props: {
    class: {
      type: String,
      default: ''
    }
  },
  setup(props, { attrs }) {
    return () => h(
      'svg',
      {
        viewBox: '0 0 20 20',
        
        class: `manju-icons ${props.class}`,
        ...attrs
      },
      [
        h('path', {"d": "M14.6667 10.5V12.1667H11.3334V15.5H9.66675V10.5H14.6667ZM9.66675 25.5V20.5H11.3334V23.8333H14.6667V25.5H9.66675ZM26.3334 25.5H21.3334V23.8333H24.6667V20.5H26.3334V25.5ZM26.3334 15.5H24.6667V12.1667H21.3334V10.5H26.3334V15.5Z", "fillRule": "evenodd"})
      ]
    );
  }
});
