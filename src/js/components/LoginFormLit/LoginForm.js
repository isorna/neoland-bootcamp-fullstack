import { getAPIData, API_PORT } from '../../index.shopping-list.js';
import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';
// @ ts-expect-error TS doesn't like this
import ResetCSS from '../../../css/reset.css' with { type: 'css' }
// @ ts-expect-error TS doesn't like this
import AppCSS from '../../../css/app.css' with { type: 'css' }
// @ ts-expect-error TS doesn't like this
import LoginFormCSS from '../LoginForm/LoginForm.css' with { type: 'css' }

export class LoginForm extends LitElement {
  static styles = [ResetCSS, AppCSS, LoginFormCSS];

  static properties = {
    prueba: {type: String},
    email: {type: String},
    password: {type: String}
  };

  constructor() {
    super();
  }

  render() {
    return html`
    <slot></slot>
    <form id="loginForm" @submit="${this._onFormSubmit}">
      <label>Usuario: <input type="text" id="email" placeholder="email" .value=${this.email} @input="${this._emailChanged}" /></label>
      <label>Contraseña: <input type="password" id="password" placeholder="contraseña" .value=${this.password} @input="${this._passwordChanged}" /></label>
      <button type="submit" id="loginButton" title="Login" ?disabled=${this.email === '' || this.password === ''}>Login</button>
      <slot name="error"></slot>
    </form>
    `;
  }

  _emailChanged(e) {
    this.email = e.target.value
  }

  _passwordChanged(e) {
    this.password = e.target.value
  }

  async _onFormSubmit(e) {
    e.preventDefault();
    const email = this.email;
    const password = this.password;
    const loginData = {
      email: email.value,
      password: password.value
    }
    let onFormSubmitEvent
    if (loginData.email !== '' && loginData.password !== '') {
      const payload = JSON.stringify(loginData)
      const apiData = await getAPIData(`${location.protocol}//${location.hostname}${API_PORT}/api/login`, 'POST', payload)
      onFormSubmitEvent = new CustomEvent("login-form-submit", {
        bubbles: true,
        detail: apiData
      })
    } else {
      onFormSubmitEvent = new CustomEvent("login-form-submit", {
        bubbles: true,
        detail: null
      })
    }

    this.dispatchEvent(onFormSubmitEvent);
  }
}

customElements.define('login-form', LoginForm);