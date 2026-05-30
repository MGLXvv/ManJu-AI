import { defineComponent, h } from 'vue';

export const CardUpload = defineComponent({
  name: 'CardUpload',
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
        h('path', {"d": "M3.33341 12.0833H12.6667V8H13.8334V12.6667C13.8334 12.9888 13.5723 13.25 13.2501 13.25H2.75008C2.42792 13.25 2.16675 12.9888 2.16675 12.6667V8H3.33341V12.0833ZM8.58342 6.25V10.3333H7.41675V6.25H4.50008L8.00008 2.75L11.5001 6.25H8.58342Z", "fillRule": "evenodd"})
      ]
    );
  }
});
