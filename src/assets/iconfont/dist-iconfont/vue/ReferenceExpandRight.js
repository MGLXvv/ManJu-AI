import { defineComponent, h } from 'vue';

export const ReferenceExpandRight = defineComponent({
  name: 'ReferenceExpandRight',
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
        h('path', {"d": "M1.00012 1.00012L10.5685 15.4819C11.2311 16.4849 11.2311 17.7865 10.5685 18.7895L1.00012 33.2713", "fillRule": "evenodd"}),
        h('path', {"d": "M10.5085 5.61011L16.9373 15.5006C17.5835 16.4948 17.5835 17.7763 16.9373 18.7705L10.5085 28.661", "fillRule": "evenodd"})
      ]
    );
  }
});
