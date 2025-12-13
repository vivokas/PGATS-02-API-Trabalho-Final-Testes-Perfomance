import http from "k6/http";
import { getBaseUrl } from "./helpers/getBaseUrl.js";
import faker from "k6/x/faker";
import { check, sleep, group, fail } from "k6";
import { Trend } from "k6/metrics";

export const options = {
  thresholds: {
    http_req_duration: ["p(90)<=150"],
  },
  stages: [
    { duration: "3s", target: 5 },
    { duration: "10s", target: 10 },
    { duration: "15s", target: 20 },
  ],
};

const transferTrend = new Trend("transfer_duration");

export default function () {
  const url = getBaseUrl();

  const uniqueId = `${__VU}_${__ITER}_${Date.now()}`;

  const remetente = `rem_${faker.person.firstName()}_${uniqueId}`;
  const destinatario = `dest_${faker.person.firstName()}_${uniqueId}`;

  const senha = faker.internet.password();

  let token;

  // Registrar usuario
  group("Registrar usuário", () => {
    function registrarUsuario(nome) {
      const res = http.post(
        `${url}/users/register`,
        JSON.stringify({
          username: nome,
          password: senha,
          favorecidos: [],
        }),
        { headers: { "Content-Type": "application/json" } }
      );
      return res;
    }

    const regRem = registrarUsuario(remetente);
    const regDest = registrarUsuario(destinatario);

    const okRem = check(regRem, {
      "remetente criado (201)": (r) => r.status === 201,
    });

    const okDest = check(regDest, {
      "destinatário criado (201)": (r) => r.status === 201,
    });
  });

  // login usuario
  group("Login usuário", () => {
    const res = http.post(
      `${url}/users/login`,
      JSON.stringify({
        username: remetente,
        password: senha,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

    const ok = check(res, {
      "login OK (200)": (r) => r.status === 200,
      "token recebido": (r) => !!r.json("token"),
    });

    token = res.json("token");
  });

  //transferencia usuario
  group("Transferência entre usuários", () => {
    const start = Date.now();

    const res = http.post(
      `${url}/transfers`,
      JSON.stringify({
        from: remetente,
        to: destinatario,
        value: 50,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    transferTrend.add(Date.now() - start);

    check(res, {
      "transferência OK (201)": (r) => r.status === 201 || r.status === 200,
    });
  });

  sleep(1);
}
