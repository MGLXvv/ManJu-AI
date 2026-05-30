import { defineComponent, h } from 'vue';

export const ToolCopyAlt = defineComponent({
  name: 'ToolCopyAlt',
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
        h('path', {"d": "M13.9998 13V10C13.9998 9.44772 14.4475 9 14.9998 9H26.9998C27.5521 9 27.9998 9.44772 27.9998 10V24C27.9998 24.5523 27.5521 25 26.9998 25H23.9998V27.9991C23.9998 28.5519 23.5499 29 22.993 29H11.0067C10.4506 29 10 28.5554 10 27.9991L10.0026 14.0009C10.0027 13.4481 10.4526 13 11.0094 13H13.9998ZM15.9998 13H23.9998V23H25.9998V11H15.9998V13Z", "fillRule": "evenodd"})
      ]
    );
  }
});
