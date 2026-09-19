# CampusOS — HacklabApp

Frontend Angular do CampusOS (catálogo acadêmico, jornada do aluno, acervo entre veteranos/calouros).

## Stack

- Angular 18 (standalone components, `loadComponent` lazy routes)
- TypeScript 5.5, RxJS 7
- Testes: Karma + Jasmine
- Sem UI kit/estilo definido ainda — projeto recém-scaffoldado (`ng new`)

## Comandos

```bash
npm start      # ng serve
npm run build  # ng build
npm run watch  # ng build --watch --configuration development
npm test       # ng test (Karma)
```

## Estrutura

```
src/app/
  core/
    guards/auth.guard.ts
    interceptors/auth.interceptor.ts          # injeta Bearer token
    interceptors/error-translate.interceptor.ts
    models/api.models.ts                      # tipos derivados do OpenAPI da API
    services/auth.service.ts
    services/academic-documents.service.ts
    services/journey.service.ts
    utils/post-auth-redirect.ts
  features/
    auth/login/
    auth/signup/
    auth/select-institution/
    auth/verify-email/
    documents/document-upload.component.ts    # upload de histórico/matrícula
    progress/progress.component.ts            # progresso curricular
    next-term/next-term.component.ts          # simulação/próximo período
  app.routes.ts
```

Rotas protegidas (`authGuard`): `verify-email`, `documents`, `progress`, `next-term`.
Rotas públicas: `login`, `signup`, `select-institution`.

`environment.apiUrl` aponta pro backend (`src/environments/environment.ts`).

## Documentação da API

Referência completa dos endpoints (OpenAPI/Scalar):
https://firms-picking-volleyball-apr.trycloudflare.com/docs/api#tag/autentica%C3%A7%C3%A3o

Spec bruta: https://firms-picking-volleyball-apr.trycloudflare.com/docs/api/openapi.yaml

Notas relevantes de `Autenticação`:
- `POST /api/v1/auth/login`: e-mail é único **por instituição**. Se o mesmo e-mail existir em mais de uma instituição, responde `422` com `errors.entity_id` pedindo o campo — não devolve lista de instituições candidatas.
- Instituição do usuário é resolvida sempre pelo token Bearer nas rotas autenticadas, nunca por parâmetro do cliente.
- `POST /api/v1/auth/signup`: cadastro livre, instituição resolvida pelo domínio do e-mail.

Modelos de request/response ficam em `src/app/core/models/api.models.ts` — atualizar junto se a spec mudar.
