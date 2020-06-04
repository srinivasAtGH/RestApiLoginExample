<script>
  import Login from "./Login.svelte";
  import Home from "./Home.svelte";
  import Registetr from "./Register.svelte";
  let showLoginPage = true;
  let showHomePage = false;
  let showRegisterPage = false;

  let userAuthenticated = false;

  function logout() {
    userAuthenticated = false;
    showLoginPage = true;
  }

  function login() {
    showLoginPage = true;
    showRegisterPage = false;
  }

  function register() {
    showLoginPage = false;
    showRegisterPage = true;
  }

  function onUserAuthenticated(event) {
    userAuthenticated = true;
    showLoginPage = false;
  }
</script>

<style>
  main {
    text-align: left;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  .badge {
    text-align: center;
    padding: 1em;
    max-width: 440px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  .topcorner {
    position: absolute;
    top: 0;
    right: 0;
  }

  .linkbutton {
    background: none !important;
    border: none;
    padding: 10 !important;
    /*optional*/
    font-family: arial, sans-serif;
    /*input has OS specific font-family*/
    color: #069;
    text-decoration: underline;
    cursor: pointer;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>

<main>
  <h1 class="badge">Learning web</h1>
  <div hidden={!showLoginPage}>
    <Login on:userAuthenticated={onUserAuthenticated} />
  </div>
  <div hidden={!userAuthenticated}>
    <Home />
  </div>

  <div hidden={!showRegisterPage}>
    <Registetr />
  </div>

  <div class="topcorner">
    <button hidden={userAuthenticated} class="linkbutton" on:click={register}>
      Register
    </button>

    <button hidden={userAuthenticated} class="linkbutton" on:click={login}>
      Login
    </button>

    <button hidden={!userAuthenticated} class="linkbutton" on:click={logout}>
      Log out
    </button>

  </div>
</main>
