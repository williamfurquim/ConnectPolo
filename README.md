## 🏭 ConnectPolo

> Plataforma Fullstack PWA para gestão de treinamento industrial e controle de presença auditável de jovens aprendizes.

🚀 **[CLIQUE AQUI PARA ACESSAR A APLICAÇÃO](https://williamfurquim.github.io/ConnectPolo/)**

Contas para visitantes:

Líder: lider@marcopolo.com / Senha: 123456

Aluno: aluno@aluno.com / Senha: 123456

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=progressive-web-apps&logoColor=white)](https://web.dev/progressive-web-apps/)

O **ConnectPolo** foi desenvolvido para substituir processos informais e descentralizados (planilhas e WhatsApp) por uma solução corporativa 
robusta, centralizada e auditável. A plataforma foca em rastreabilidade, comunicação e controle de presença em tempo real.

---

## 📸 Demonstração da Interface

Visão do Líder 

Dashboard Operacional | Métricas de Absenteísmo | Exportação de Relatórios
<img width="1919" height="972" alt="Captura de tela 2026-05-23 160851" src="https://github.com/user-attachments/assets/b35f8e12-9606-4655-9156-b9808ef47ed3" />


Visão do Aluno

Registro de Ponto | Histórico de Frequência | Justificativas & Avisos
<img width="1919" height="970" alt="Captura de tela 2026-05-24 163645" src="https://github.com/user-attachments/assets/4470a0fe-e5dc-403e-bf14-074f9343fd21" />

---

## 🏗️ Arquitetura e Controle de Acesso (RBAC)

O sistema foi desenhado utilizando **Role-Based Access Control (RBAC)** integrado diretamente às **Firebase Security Rules**, garantindo o isolamento estrito de dados sensíveis entre os perfis.

---

## ⚡ Engenharia e Soluções para os Desafios Técnicos

Como este projeto simula um ambiente de missão crítica industrial, tomamos decisões de engenharia focadas em performance e segurança:

### 1. Sincronização em Tempo Real e Consistência (Firestore)
Para evitar requisições desnecessárias (HTTP Polling) e garantir que o Líder veja quem faltou sem atrasos, implementamos ouvintes ativos (`onSnapshot`) no Firestore. Os dados de presença e os dashboards analíticos de absenteísmo são atualizados para a tela do gestor.

### 2. Segurança no Client-Side (Firebase Security Rules)
Como não há um back-end tradicional intermediando as requisições, a segurança foi movida para a camada de infraestrutura. Escrevemos regras granulares onde:
*   Alunos possuem permissão estrita de **leitura e escrita apenas** nos seus próprios documentos (`request.auth.uid == resource.data.studentId`).
*   Apenas usuários com a flag `role == 'leader'` mapeada no Custom Claims/Firestore conseguem realizar mutações (CRUD) em múltiplos registros.

### 3. PWA para o Chão de Fábrica
Ambientes industriais muitas vezes sofrem com oscilação de conectividade. A escolha por **PWA** garante que o aplicativo possa ser instalado no celular dos aprendizes sem o overhead das lojas (App Store/Play Store).

---

## 🚀 Principais Funcionalidades

### 📊 Módulo de Gestão (Líder)
*   **Análise em tempo real:** Gráfico de comparação de presença, justificativa e falta diária.
*   **Gestão de Contingência:** CRUD completo de alunos e auditoria de justificativas enviadas.
*   **Exportação de Dados:** Geração de relatórios operacionais para integração com RH.

### 📱 Portal do Aluno
*   **Ponto Digital:** Registro de presença simplificado com trava de horário.
*   **Mural Industrial:** Canal centralizado para avisos e comunicados importantes da liderança.
*   **Calendário de Frequência:** Registro de presenças, faltas e justificativas do aluno.

---

## 🛠️ Stack Tecnológica

*   **Core:** JavaScript, HTML5, CSS3.
*   **Database & Auth:** Firebase Firestore (NoSQL) & Firebase Authentication.
*   **Distribuição:** PWA (Progressive Web App).

---

👥 Desenvolvedores

*   [William Furquim](https://github.com/williamfurquim)

*   [Amanda Jaguella](https://github.com/AmandaJaguella)

*   [Gustavo Chimello](https://github.com/LegendaryRocketRaccoon)

*   [Olavo Xavier](https://github.com/TheAppleJuicer)

*   [Lucas Miyaki](https://github.com/Lucas-Miyaki)

*   [Bruno Bone](#)
