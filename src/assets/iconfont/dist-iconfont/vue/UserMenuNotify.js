import { defineComponent, h } from 'vue';

export const UserMenuNotify = defineComponent({
  name: 'UserMenuNotify',
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
        h('path', {"d": "M3.33333 11.9999H12.6667V7.35418C12.6667 4.76529 10.5773 2.66659 8 2.66659C5.42267 2.66659 3.33333 4.76529 3.33333 7.35418V11.9999ZM8 1.33325C11.3137 1.33325 14 4.02891 14 7.35418V13.3333H2V7.35418C2 4.02891 4.68629 1.33325 8 1.33325ZM6.33333 13.9999H9.66667C9.66667 14.9204 8.92047 15.6666 8 15.6666C7.07953 15.6666 6.33333 14.9204 6.33333 13.9999Z", "fillRule": "evenodd"})
      ]
    );
  }
});
