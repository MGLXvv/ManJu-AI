import { defineComponent, h } from 'vue';

export const TopbarHome = defineComponent({
  name: 'TopbarHome',
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
        h('path', {"d": "M26 28H12C11.4477 28 11 27.5523 11 27V18H8L18.3273 8.6115C18.7087 8.26475 19.2913 8.26475 19.6727 8.6115L30 18H27V27C27 27.5523 26.5523 28 26 28ZM13 26H25V16.1575L19 10.7029L13 16.1575V26ZM19 22C17.6193 22 16.5 20.8807 16.5 19.5C16.5 18.1193 17.6193 17 19 17C20.3807 17 21.5 18.1193 21.5 19.5C21.5 20.8807 20.3807 22 19 22Z", "fillRule": "evenodd"})
      ]
    );
  }
});
