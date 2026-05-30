import { defineComponent, h } from 'vue';

export const ProjectImport = defineComponent({
  name: 'ProjectImport',
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
        h('path', {"d": "M8.42593 16.1H9.85185V19.6H18.4074V8.4H9.85185V11.9H8.42593V7.7C8.42593 7.3134 8.74513 7 9.13889 7H19.1204C19.5141 7 19.8333 7.3134 19.8333 7.7V20.3C19.8333 20.6866 19.5141 21 19.1204 21H9.13889C8.74513 21 8.42593 20.6866 8.42593 20.3V16.1ZM12.7037 13.3V11.2L16.2685 14L12.7037 16.8V14.7H7V13.3H12.7037Z", "fillRule": "evenodd"})
      ]
    );
  }
});
