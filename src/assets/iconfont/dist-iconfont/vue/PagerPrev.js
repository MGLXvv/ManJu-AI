import { defineComponent, h } from 'vue';

export const PagerPrev = defineComponent({
  name: 'PagerPrev',
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
        h('path', {"d": "M16.3684 20.0001L21.1161 11.0322L22.8837 11.968L18.6314 20.0001L22.8837 28.0322L21.1161 28.968L16.3684 20.0001Z", "fillRule": "evenodd"})
      ]
    );
  }
});
