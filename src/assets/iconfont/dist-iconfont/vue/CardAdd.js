import { defineComponent, h } from 'vue';

export const CardAdd = defineComponent({
  name: 'CardAdd',
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
        h('path', {"d": "M7.28571 7.28571V3H8.71429V7.28571H13V8.71429H8.71429V13H7.28571V8.71429H3V7.28571H7.28571Z", "fillRule": "evenodd"})
      ]
    );
  }
});
