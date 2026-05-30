import { defineComponent, h } from 'vue';

export const TopbarTeam = defineComponent({
  name: 'TopbarTeam',
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
        h('path', {"d": "M22 11H12V27H26V15H22V11ZM10 9.9918C10 9.44405 10.4475 9 10.9985 9H23L27.9997 14L28 27.9925C28 28.5489 27.5551 29 27.0066 29H10.9934C10.4448 29 10 28.5447 10 28.0082V9.9918ZM19 18.5C17.6193 18.5 16.5 17.3807 16.5 16C16.5 14.6193 17.6193 13.5 19 13.5C20.3807 13.5 21.5 14.6193 21.5 16C21.5 17.3807 20.3807 18.5 19 18.5ZM14.5275 24C14.7762 21.75 16.6837 20 19 20C21.3163 20 23.2238 21.75 23.4725 24H14.5275Z", "fillRule": "evenodd"})
      ]
    );
  }
});
