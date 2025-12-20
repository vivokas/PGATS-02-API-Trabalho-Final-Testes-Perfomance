import http from "k6/http";
import { check, sleep, group } from "k6";
import { getBaseUrl } from "./helpers/getBaseUrl.js";
import { SharedArray } from "k6/data";

const users = new SharedArray("users", function () {
  return JSON.parse(open("../data/login.data.json"));
});

export let options = {
  thresholds: {
    http_req_duration: ["p(95)<600"],
  },
  stages: [
    { duration: "3s", target: 2 },
    { duration: "10s", target: 4 },
    { duration: "15s", target: 6 },
  ],
};

export default function () {
  const url = getBaseUrl();

  const user = users[(__VU - 1) % users.length];
  const username = user.username;
  const password = user.password;

  //console.log(
  //`[VU ${__VU}] Usando dados do arquivo → username: ${username}, password: ${password}`
  //);

  // Registrar usuario
  group("Registrar usuários", () => {
    function registrarUsuario(username, password) {
      return http.post(
        `${url}/users/register`,
        JSON.stringify({
          username,
          password,
          favorecidos: [],
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    const regRes = registrarUsuario(username, password);

    check(regRes, {
      "registro ok ou usuário já existente": (r) =>
        r.status === 201 || r.status === 400,
    });
  });

  // login usuario
  group("Login usuario", () => {
    const res = http.post(
      `${url}/users/login`,
      JSON.stringify({ username, password }),
      { headers: { "Content-Type": "application/json" } }
    );

    const ok = check(res, {
      "login status 200": (r) => r.status === 200,
      "token recebido": (r) => !!r.json("token"),
    });
  });

  sleep(1);
}
