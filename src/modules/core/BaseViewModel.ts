export class BaseViewModel {
  #name?: string;
  #id: string = Math.random().toString();

  get name() {
    return this.#name;
  }

  get id() {
    return this.#id;
  }

  constructor(name: string | undefined = undefined) {
    this.#name = name;
  }

  renderCallback?: () => void;

  rerender() {
    this.renderCallback?.();
  }

  onMount() {}
  onUnmount() {}
}
