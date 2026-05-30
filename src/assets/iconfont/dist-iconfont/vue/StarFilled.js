import { defineComponent, h } from 'vue';

export const StarFilled = defineComponent({
  name: 'StarFilled',
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
        h('path', {"d": "M10.0003 14.1734L5.29802 16.8055L6.34824 11.52L2.39185 7.86124L7.74321 7.22675L10.0003 2.33337L12.2574 7.22675L17.6087 7.86124L13.6524 11.52L14.7026 16.8055L10.0003 14.1734Z", "fillRule": "evenodd"})
      ]
    );
  }
});
