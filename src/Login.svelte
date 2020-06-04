<script>
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  function sayHello() {
    dispatch("message", {
      text: "Hello!"
    });
  }

  let username = "";
  let password = "";
  let logResponse = "";

  function handleSubmit(e) {
    e.preventDefault();
    let responseJson = AuthenticateUser();
  }

  async function AuthenticateUser() {
    let response = await fetch("http://127.0.0.1:5000/login/", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({ username: username, password: password })
    });

    let result = await response.json();
    if (response.status === 200) {
      dispatch("userAuthenticated");
    } else {
      logResponse = result.message;
    }
  }
</script>

<style>
  .box {
    width: 300px;
    border: 1px solid #aaa;
    border-radius: 2px;
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
    padding: 1em;
    margin: 0 0 1em 0;
  }
</style>

<div class="box">
  <form on:submit|preventDefault={handleSubmit}>

    <label>
      <input bind:value={username} placeholder="enter your name" />
    </label>
    <label>
      <input
        type="password"
        bind:value={password}
        placeholder="enter password" />
    </label>
    <label>{logResponse}</label>
    <button disabled={!username || !username} type="submit">Login</button>
  </form>
</div>
