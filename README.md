# ConnectPolo

Plataforma fullstack para gestão de treinamento industrial e controle de presença de jovens aprendizes em ambientes corporativos.

---

## Visão geral

O ConnectPolo foi desenvolvido para resolver problemas de rastreabilidade, comunicação e controle de presença em ambientes industriais, substituindo processos informais (como planilhas e aplicativos de mensagem) por uma solução centralizada, auditável e segura.

A aplicação organiza dados operacionais e indicadores de desempenho em tempo real, permitindo maior eficiência na gestão de equipes.

---

## Principais competências demonstradas

* Desenvolvimento fullstack com foco em aplicações em tempo real
* Modelagem de dados para ambientes corporativos
* Sincronização em tempo real com Firebase Firestore
* Implementação de regras de segurança (Firebase Security Rules)
* Controle de acesso baseado em perfis de usuário
* Desenvolvimento de Progressive Web App (PWA)
* Construção de dashboards com métricas operacionais
* Geração de relatórios e indicadores
* Aplicação de conceitos de UX para ambientes industriais

---

## Tecnologias

* Firebase (Firestore, Authentication, Security Rules)
* JavaScript / TypeScript
* HTML / CSS
* PWA (Progressive Web App)

---

## Arquitetura

A aplicação foi projetada com separação lógica entre perfis:

* **Líder**: acesso a métricas, relatórios e gestão de alunos
* **Aluno**: registro de presença, justificativas e acesso a comunicados

O uso do Firestore permite sincronização em tempo real entre os diferentes perfis, garantindo consistência e atualização imediata dos dados.

---

## Funcionalidades

### Gestão (Líder)

* Cadastro e gerenciamento de alunos (CRUD)
* Visualização de métricas de presença
* Indicadores de absenteísmo
* Exportação de relatórios

### Portal do Aluno

* Registro de presença com controle de horário
* Histórico de frequência
* Envio de justificativas
* Acesso a avisos e comunicados

### Indicadores

* Comparação de presença semanal
* Tempo médio de resposta
* Engajamento com comunicados

---

## Desafios técnicos

* Implementação de sincronização em tempo real entre diferentes perfis
* Definição de regras de segurança para isolamento de dados sensíveis
* Adaptação da interface para uso em ambiente industrial (responsividade e usabilidade)

---

## Objetivo do projeto

Demonstrar capacidade de desenvolver soluções completas para problemas reais, aplicando conceitos de arquitetura, segurança, sincronização em tempo real e experiência do usuário em contextos corporativos.

---

## Autor

William Furquim
Amanda Jaguella
Gustavo Chimello
Olavo Xavier
Lucas Miyaki
