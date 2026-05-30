import { defineComponent, h } from 'vue';

export const TimelineDeleteActive = defineComponent({
  name: 'TimelineDeleteActive',
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
        h('path', {"d": "M11.3333 3.99992H14.6666V5.33325H13.3333V13.9999C13.3333 14.3681 13.0348 14.6666 12.6666 14.6666H3.33325C2.96507 14.6666 2.66659 14.3681 2.66659 13.9999V5.33325H1.33325V3.99992H4.66659V1.99992C4.66659 1.63173 4.96507 1.33325 5.33325 1.33325H10.6666C11.0348 1.33325 11.3333 1.63173 11.3333 1.99992V3.99992ZM11.9999 5.33325H3.99992V13.3333H11.9999V5.33325ZM5.99992 7.33325H7.33325V11.3333H5.99992V7.33325ZM8.66659 7.33325H9.99992V11.3333H8.66659V7.33325ZM5.99992 2.66659V3.99992H9.99992V2.66659H5.99992Z", "fillRule": "evenodd"})
      ]
    );
  }
});
