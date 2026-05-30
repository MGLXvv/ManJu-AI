import { defineComponent, h } from 'vue';

export const PlaySmall = defineComponent({
  name: 'PlaySmall',
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
        h('path', {"d": "M24.6383 18.3744L15.0995 24.7335C14.8927 24.8714 14.6133 24.8155 14.4755 24.6088C14.4262 24.5348 14.3999 24.4479 14.3999 24.3591V11.6408C14.3999 11.3923 14.6014 11.1908 14.8499 11.1908C14.9387 11.1908 15.0256 11.2171 15.0995 11.2664L24.6383 17.6255C24.845 17.7634 24.9009 18.0428 24.763 18.2496C24.7301 18.299 24.6877 18.3414 24.6383 18.3744Z", "fillRule": "evenodd"})
      ]
    );
  }
});
