import { defineComponent, h } from 'vue';

export const CardEdit = defineComponent({
  name: 'CardEdit',
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
        h('path', {"d": "M3.91667 12.0192H4.74162L10.1746 6.58617L9.34966 5.76121L3.91667 11.1942V12.0192ZM13.25 13.1858H2.75V10.7109L10.5871 2.87386C10.8149 2.64605 11.1842 2.64605 11.412 2.87386L13.062 4.52377C13.2898 4.75158 13.2898 5.12093 13.062 5.34873L6.39154 12.0192H13.25V13.1858ZM10.1746 4.93625L10.9996 5.76121L11.8245 4.93625L10.9996 4.11129L10.1746 4.93625Z", "fillRule": "evenodd"})
      ]
    );
  }
});
