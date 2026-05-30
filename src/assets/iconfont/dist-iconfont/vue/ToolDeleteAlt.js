import { defineComponent, h } from 'vue';

export const ToolDeleteAlt = defineComponent({
  name: 'ToolDeleteAlt',
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
        h('path', {"d": "M24 11H29V13H27V28C27 28.5523 26.5523 29 26 29H12C11.4477 29 11 28.5523 11 28V13H9V11H14V9H24V11ZM16 16V24H18V16H16ZM20 16V24H22V16H20Z", "fillRule": "evenodd"})
      ]
    );
  }
});
