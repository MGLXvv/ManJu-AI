import { defineComponent, h } from 'vue';

export const ActionSave = defineComponent({
  name: 'ActionSave',
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
        h('path', {"d": "M15 17.5V10.8333H5V17.5H3.33333C2.8731 17.5 2.5 17.1269 2.5 16.6667V3.33333C2.5 2.8731 2.8731 2.5 3.33333 2.5H14.1667L17.5 5.83333V16.6667C17.5 17.1269 17.1269 17.5 16.6667 17.5H15ZM13.3333 17.5H6.66667V12.5H13.3333V17.5Z", "fillRule": "evenodd"})
      ]
    );
  }
});
