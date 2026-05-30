import { defineComponent, h } from 'vue';

export const ChevronDown = defineComponent({
  name: 'ChevronDown',
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
        h('path', {"d": "M7.99993 8.78089L11.2998 5.48108L12.2426 6.42389L7.99993 10.6666L3.75732 6.42389L4.70013 5.48108L7.99993 8.78089Z", "fillRule": "evenodd"})
      ]
    );
  }
});
