# API de Transferências e Usuários

Esta API permite o registro, login, consulta de usuários e transferências de valores entre usuários. O objetivo é servir de base para estudos de testes e automação de APIs.

## Tecnologias

- Node.js
- Express
- Swagger (documentação)
- Banco de dados em memória (variáveis)

## Instalação

1. Clone o repositório:
   ```sh
   git clone <repo-url>
   cd pgats-02-api
   ```
2. Instale as dependências:
   ```sh
   npm install express swagger-ui-express bcryptjs
   ```

## Configuração

Antes de seguir, crie um arquivo .env na pasta raiz contendo as propriedades BASE_URL_REST E BASE_URL_GRAPHQL, com a URL desses serviços.

## Como rodar

- Para iniciar o servidor:
  ```sh
  node server.js
  ```
- A API estará disponível em `http://localhost:3001`
- A documentação Swagger estará em `http://localhost:3001/api-docs`

## Endpoints principais

### Registro de usuário

- `POST /users/register`
  - Body: `{ "username": "string", "password": "string", "favorecidos": ["string"] }`

### Login

- `POST /users/login`
  - Body: `{ "username": "string", "password": "string" }`

### Listar usuários

- `GET /users`

### Transferências

- `POST /transfers`
  - Body: `{ "from": "string", "to": "string", "value": number }`
- `GET /transfers`

### GraphQL Types, Queries e Mutations

Rode `npm run start-graphql` para executar a API do GraphQL e acesse a URL http://localhost:4000/graphql para acessá-la.

- **Types:**
  - `User`: username, favorecidos, saldo
  - `Transfer`: from, to, value, date
- **Queries:**
  - `users`: lista todos os usuários
  - `transfers`: lista todas as transferências (requer autenticação JWT)
- **Mutations:**
  - `registerUser(username, password, favorecidos)`: retorna User
  - `loginUser(username, password)`: retorna token + User
  - `createTransfer(from, to, value)`: retorna Transfer (requer autenticação JWT)

## Regras de negócio

- Não é permitido registrar usuários duplicados.
- Login exige usuário e senha.
- Transferências acima de R$ 5.000,00 só podem ser feitas para favorecidos.
- O saldo inicial de cada usuário é de R$ 10.000,00.

## Testes

- O arquivo `app.js` pode ser importado em ferramentas de teste como Supertest.
- Para testar a API GraphQL, importe `graphql/app.js` nos testes.

---

Para dúvidas, consulte a documentação Swagger, GraphQL Playground ou o código-fonte.

## Testes K6

## Comando para rodar os testes

Comando para rodar os testes de login: k6 run login.test.js
Comando para rodar os testes de transferencia: k6 run transferencia.test.js
Comando geração arquivo .HTML para o teste arquivo transferencia.test.js: K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report-transferencia.html k6 run transferencia.test.js
Comando geração arquivo .HTML para o teste arquivo login.test.js: K6_WEB_DASHBOARD=true K6_WEB_DASHBOARD_EXPORT=html-report-login.html k6 run login.test.js

## Teste 1 – Cadastro, Login e Transferência - arquivo transferencia.test.js

1 - Thresholds => Regras estabelecidas para avaliar a performance da requisição
export const options = {
thresholds: {
http_req_duration: ["p(90)<=150"],
},

2 - Stages => Simula o comportamento do sistema quando possui aumento progressivo de carga
stages: [
{ duration: "3s", target: 5 },
{ duration: "10s", target: 10 },
{ duration: "15s", target: 20 },
],

3 - Helpers => Funções reutilizáveis
import { getBaseUrl } from "./helpers/getBaseUrl.js";

4 - Faker => Geração de dados dinâmicos
import faker from "k6/x/faker";
const remetente = `rem_${faker.person.firstName()}_${uniqueId}`;
const destinatario = `dest_${faker.person.firstName()}_${uniqueId}`;
const senha = faker.internet.password();

5 - Groups => Organiza cada grupo de lógica das requisições
group("Registrar usuário", () => { ... });
group("Login usuário", () => { ... });
group("Transferência entre usuários", () => { ... });

6 - Checks => Para evitar falso positivo e validação do status esperado
check(regRem, {
"remetente criado (201)": (r) => r.status === 201,
});

check(res, {
"login OK (200)": (r) => r.status === 200,
"token recebido": (r) => !!r.json("token"),
});

7 - Reaproveitamento de Resposta => O token recuperado no login é reutilizado na transferência
token = res.json("token");

8 - Token de Autenticação => Validar a segurança e controle de acesso, Garante que apenas usuários autenticados realizem transferências
headers: {
"Content-Type": "application/json",
Authorization: `Bearer ${token}`,
}

9 - Trends => Para medir o tempo de transferência
const transferTrend = new Trend("transfer_duration");

10 - Variável de Ambiente => Permite executar o mesmo teste em vários ambientes sem alterar código
const url = getBaseUrl();

## Teste 2 – Cadastro e Login - arquivo login.test.js (Data-Driven)

11 - Data-Driven Testing => Dados con origem de arquivo externo JSON
import { SharedArray } from "k6/data";

const users = new SharedArray("users", function () {
return JSON.parse(open("../data/login.data.json"));
});

12 - Controle de Distribuição de Dados => Cada \_VU é um usuário diferente, pode evitar concorrência nos mesmos dados
const user = users[(__VU - 1) % users.length];
