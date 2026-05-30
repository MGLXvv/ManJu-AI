import { defineComponent, h } from 'vue';

export const PagerNext = defineComponent({
  name: 'PagerNext',
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
        h('path', {"d": "M23.6316 20.0001L18.8839 11.0322L17.1163 11.968L21.3686 20.0001L17.1163 28.0322L18.8839 28.968L23.6316 20.0001Z", "fillRule": "evenodd"})
      ]
    );
  }
});
