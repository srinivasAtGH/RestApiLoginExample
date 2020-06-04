<script>
  let name = "";
  let username = "";
  let password = "";
  let email = "";
  let registerresponse = "";
  let termsconditionsok = false;
  let mentor = false;
  let mentee = false;
  let userregistered = false;

  function handleSubmit(e) {
    e.preventDefault();
    let responseJson = AuthenticateUser();
  }

  async function AuthenticateUser() {
    registerresponse = "";
    let response = await fetch("http://127.0.0.1:5000/register/", {
      method: "POST",

      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: name,
        username: username,
        password: password,
        email: email,
        terms_and_conditions_checked: termsconditionsok,
        need_mentoring: mentee,
        available_to_mentor: mentor
      })
    });

    let result = await response.json();
    if (response.status !== 200) {
      userregistered = false;
      registerresponse = result.message;
    } else {
      userregistered = true;
      registerresponse =
        "User was created successfully.A confirmation email has been sent via email. After confirming your email you can login";
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

  .error {
    color: red;
  }

  .success {
    color: green;
  }
</style>

<div class="box">
  <form on:submit|preventDefault={handleSubmit}>
    <h1>Register</h1>
    <label>
      <input bind:value={name} placeholder="enter name" />
    </label>

    <label>
      <input bind:value={username} placeholder="enter user name" />
    </label>

    <label>
      <input
        type="password"
        bind:value={password}
        placeholder="enter password" />
    </label>
    <label>
      <input bind:value={email} placeholder="enter email" />
    </label>
    <label>
      <input type="checkbox" bind:checked={mentee} />
      Want a mentor
    </label>

    <label>
      <input type="checkbox" bind:checked={mentor} />
      Want to be a mentor
    </label>

    <label>
      <input type="checkbox" bind:checked={termsconditionsok} />
      Terms and conditions are ok.
    </label>

    {#if userregistered}
      <label class="success">{registerresponse}</label>
    {:else}
      <label class="error">{registerresponse}</label>
    {/if}
    <button disabled={!username || !username || !email} type="submit">
      Register
    </button>
  </form>
</div>
