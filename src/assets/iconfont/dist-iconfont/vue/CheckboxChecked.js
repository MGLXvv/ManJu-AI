import { defineComponent, h } from 'vue';

export const CheckboxChecked = defineComponent({
  name: 'CheckboxChecked',
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
        h('path', {"d": "M9.16883 13.3333L15.0614 7.44077L13.8829 6.26227L9.16883 10.9763L6.81184 8.61925L5.63333 9.79783L9.16883 13.3333Z", "fillRule": "evenodd"})
      ]
    );
  }
});
