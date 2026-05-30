import { defineComponent, h } from 'vue';

export const ToolZoomOut = defineComponent({
  name: 'ToolZoomOut',
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
        h('path', {"d": "M25.031 23.6168L29.3137 27.8995L27.8995 29.3137L23.6168 25.031C22.0769 26.263 20.124 27 18 27C13.032 27 9 22.968 9 18C9 13.032 13.032 9 18 9C22.968 9 27 13.032 27 18C27 20.124 26.263 22.0769 25.031 23.6168ZM14 17V19H22V17H14Z", "fillRule": "evenodd"})
      ]
    );
  }
});
