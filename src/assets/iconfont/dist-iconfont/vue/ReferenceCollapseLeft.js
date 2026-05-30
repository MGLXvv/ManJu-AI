import { defineComponent, h } from 'vue';

export const ReferenceCollapseLeft = defineComponent({
  name: 'ReferenceCollapseLeft',
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
        h('path', {"d": "M17.4218 1.00012L7.85341 15.4819C7.19075 16.4849 7.19075 17.7865 7.85341 18.7895L17.4218 33.2713", "fillRule": "evenodd"}),
        h('path', {"d": "M7.9134 5.61011L1.4846 15.5006C0.838376 16.4948 0.838377 17.7763 1.4846 18.7705L7.9134 28.661", "fillRule": "evenodd"})
      ]
    );
  }
});
