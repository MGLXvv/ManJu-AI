import { defineComponent, h } from 'vue';

export const ReferenceRailHandle = defineComponent({
  name: 'ReferenceRailHandle',
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
