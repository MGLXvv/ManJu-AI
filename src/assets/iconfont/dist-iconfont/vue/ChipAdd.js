import { defineComponent, h } from 'vue';

export const ChipAdd = defineComponent({
  name: 'ChipAdd',
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
        
      ]
    );
  }
});
