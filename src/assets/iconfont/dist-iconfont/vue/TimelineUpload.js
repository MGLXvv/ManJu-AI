import { defineComponent, h } from 'vue';

export const TimelineUpload = defineComponent({
  name: 'TimelineUpload',
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
        h('path', {"d": "M2.66659 12.6667H13.3333V8H14.6666V13.3333C14.6666 13.7015 14.3681 14 13.9999 14H1.99992C1.63173 14 1.33325 13.7015 1.33325 13.3333V8H2.66659V12.6667ZM8.66659 6V10.6667H7.33325V6H3.99992L7.99992 2L11.9999 6H8.66659Z", "fillRule": "evenodd"})
      ]
    );
  }
});
