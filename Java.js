/* ==========================================================================
   Padaria Cravo e Canela - script.js
   --------------------------------------------------------------------------
   COMBINE ESTES NOMES COM QUEM FAZ O HTML E O CSS DO GRUPO:

   1. Menu mobile
      - Botão:  #menu-toggle
      - Lista:  #menu-nav          (recebe a classe "ativo" ao abrir)

   2. Cabeçalho que muda ao rolar
      - <header class="header">    (recebe a classe "rolagem" após 50px)

   3. Filtro do cardápio
      - Botões:  .filtro-btn  com data-categoria="todos | paes | doces | bolos | cafes"
      - Cards:   .produto-card com data-categoria="paes" (por exemplo)
      - Botão ativo recebe a classe "ativo"; card oculto recebe "oculto"

   4. Carrinho / pedido
      - Botão em cada produto: .btn-adicionar com data-nome="Pão Francês" data-preco="0.90"
      - Lista do carrinho:     #carrinho-lista   (um <ul> ou <div>)
      - Total:                 #carrinho-total
      - Contador no ícone:     #carrinho-contador
      - Botão limpar:          #carrinho-limpar
      - Botão finalizar:       #carrinho-finalizar (abre o WhatsApp com o pedido)
      - Painel do carrinho:    #carrinho-painel e botão #carrinho-abrir / #carrinho-fechar
        (o painel recebe a classe "aberto")

   5. Formulário de contato
      - <form id="form-contato"> com inputs name="nome", name="email", name="mensagem"
      - Mensagem de retorno:  #form-mensagem  (recebe "erro" ou "sucesso")

   6. Extras
      - Botão voltar ao topo:  #voltar-topo   (recebe "visivel" após 400px)
      - Animação ao rolar:     qualquer elemento com a classe .revelar (recebe "visivel")
      - Ano no rodapé:         <span id="ano"></span>
   ========================================================================== */

"use strict";

/* ---------- Configurações (ajuste aqui) ---------- */
const CONFIG = {
  // Número do WhatsApp da padaria, com DDI + DDD (somente números)
  whatsapp: "5545999999999",
  chaveCarrinho: "cravoecanela_carrinho",
};

/* ---------- Funções auxiliares ---------- */
const $ = (seletor, contexto = document) => contexto.querySelector(seletor);
const $$ = (seletor, contexto = document) => [...contexto.querySelectorAll(seletor)];

const formatarPreco = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ==========================================================================
   1. MENU MOBILE
   ========================================================================== */
function iniciarMenuMobile() {
  const botao = $("#menu-toggle");
  const menu = $("#menu-nav");
  if (!botao || !menu) return;

  const alternar = (abrir) => {
    menu.classList.toggle("ativo", abrir);
    botao.setAttribute("aria-expanded", String(abrir));
  };

  botao.setAttribute("aria-expanded", "false");
  botao.addEventListener("click", () => alternar(!menu.classList.contains("ativo")));

  // Fecha o menu ao clicar em um link
  $$("a", menu).forEach((link) =>
    link.addEventListener("click", () => alternar(false))
  );

  // Fecha com a tecla Esc
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") alternar(false);
  });
}

/* ==========================================================================
   2. CABEÇALHO AO ROLAR + 6. VOLTAR AO TOPO
   ========================================================================== */
function iniciarEventosDeRolagem() {
  const header = $(".header");
  const voltarTopo = $("#voltar-topo");

  const aoRolar = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("rolagem", y > 50);
    if (voltarTopo) voltarTopo.classList.toggle("visivel", y > 400);
  };

  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  if (voltarTopo) {
    voltarTopo.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }
}

/* ==========================================================================
   Rolagem suave para links internos (#secao)
   ========================================================================== */
function iniciarRolagemSuave() {
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (id.length < 2) return;
      const alvo = $(id);
      if (!alvo) return;
      e.preventDefault();
      alvo.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

/* ==========================================================================
   3. FILTRO DO CARDÁPIO
   ========================================================================== */
function iniciarFiltroCardapio() {
  const botoes = $$(".filtro-btn");
  const cards = $$(".produto-card");
  if (!botoes.length || !cards.length) return;

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const categoria = botao.dataset.categoria;

      botoes.forEach((b) => b.classList.toggle("ativo", b === botao));

      cards.forEach((card) => {
        const mostrar = categoria === "todos" || card.dataset.categoria === categoria;
        card.classList.toggle("oculto", !mostrar);
      });
    });
  });
}

/* ==========================================================================
   4. CARRINHO / PEDIDO
   ========================================================================== */
const carrinho = {
  itens: [], // { nome, preco, quantidade }

  carregar() {
    try {
      const salvo = localStorage.getItem(CONFIG.chaveCarrinho);
      const dados = salvo ? JSON.parse(salvo) : [];
      this.itens = Array.isArray(dados) ? dados : [];
    } catch {
      this.itens = [];
    }
  },

  salvar() {
    try {
      localStorage.setItem(CONFIG.chaveCarrinho, JSON.stringify(this.itens));
    } catch {
      /* localStorage indisponível: o carrinho funciona só durante a visita */
    }
  },

  adicionar(nome, preco) {
    const existente = this.itens.find((i) => i.nome === nome);
    if (existente) existente.quantidade += 1;
    else this.itens.push({ nome, preco, quantidade: 1 });
    this.salvar();
  },

  alterarQuantidade(nome, delta) {
    const item = this.itens.find((i) => i.nome === nome);
    if (!item) return;
    item.quantidade += delta;
    if (item.quantidade <= 0) this.itens = this.itens.filter((i) => i !== item);
    this.salvar();
  },

  limpar() {
    this.itens = [];
    this.salvar();
  },

  total() {
    return this.itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  },

  quantidadeTotal() {
    return this.itens.reduce((soma, i) => soma + i.quantidade, 0);
  },
};

function criarBotao(texto, acao, nome, rotulo) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.textContent = texto;
  botao.dataset.acao = acao;
  botao.dataset.nome = nome;
  botao.setAttribute("aria-label", rotulo);
  botao.className = "carrinho-btn-qtd";
  return botao;
}

function renderizarCarrinho() {
  const lista = $("#carrinho-lista");
  const total = $("#carrinho-total");
  const contador = $("#carrinho-contador");

  if (contador) {
    const qtd = carrinho.quantidadeTotal();
    contador.textContent = qtd;
    contador.classList.toggle("oculto", qtd === 0);
  }

  if (total) total.textContent = formatarPreco(carrinho.total());

  if (!lista) return;
  lista.replaceChildren();

  if (!carrinho.itens.length) {
    const vazio = document.createElement("li");
    vazio.className = "carrinho-vazio";
    vazio.textContent = "Seu carrinho está vazio. Que tal um pãozinho quente? 🥖";
    lista.appendChild(vazio);
    return;
  }

  carrinho.itens.forEach((item) => {
    const li = document.createElement("li");
    li.className = "carrinho-item";

    const nome = document.createElement("span");
    nome.className = "carrinho-item-nome";
    nome.textContent = item.nome;

    const controles = document.createElement("span");
    controles.className = "carrinho-item-controles";

    const qtd = document.createElement("span");
    qtd.className = "carrinho-item-qtd";
    qtd.textContent = item.quantidade;

    controles.append(
      criarBotao("−", "diminuir", item.nome, `Diminuir ${item.nome}`),
      qtd,
      criarBotao("+", "aumentar", item.nome, `Aumentar ${item.nome}`)
    );

    const subtotal = document.createElement("span");
    subtotal.className = "carrinho-item-preco";
    subtotal.textContent = formatarPreco(item.preco * item.quantidade);

    li.append(nome, controles, subtotal);
    lista.appendChild(li);
  });
}

function mostrarAvisoAdicionado(botao) {
  const textoOriginal = botao.dataset.textoOriginal || botao.textContent;
  botao.dataset.textoOriginal = textoOriginal;
  botao.textContent = "Adicionado ✓";
  botao.disabled = true;
  setTimeout(() => {
    botao.textContent = textoOriginal;
    botao.disabled = false;
  }, 900);
}

function finalizarPedido() {
  if (!carrinho.itens.length) {
    alert("Seu carrinho está vazio. Adicione algum item do cardápio!");
    return;
  }

  const linhas = carrinho.itens.map(
    (i) => `• ${i.quantidade}x ${i.nome} - ${formatarPreco(i.preco * i.quantidade)}`
  );
  const mensagem =
    "Olá! Gostaria de fazer um pedido na Padaria Cravo e Canela:\n\n" +
    linhas.join("\n") +
    `\n\nTotal: ${formatarPreco(carrinho.total())}`;

  const url = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, "_blank", "noopener");
}

function iniciarCarrinho() {
  carrinho.carregar();
  renderizarCarrinho();

  // Adicionar produtos (delegação: funciona mesmo se os cards mudarem)
  document.addEventListener("click", (e) => {
    const botao = e.target.closest(".btn-adicionar");
    if (!botao) return;

    const nome = botao.dataset.nome;
    const preco = parseFloat(String(botao.dataset.preco).replace(",", "."));
    if (!nome || Number.isNaN(preco)) return;

    carrinho.adicionar(nome, preco);
    renderizarCarrinho();
    mostrarAvisoAdicionado(botao);
  });

  // + e − dentro do carrinho
  const lista = $("#carrinho-lista");
  if (lista) {
    lista.addEventListener("click", (e) => {
      const botao = e.target.closest("button[data-acao]");
      if (!botao) return;
      carrinho.alterarQuantidade(botao.dataset.nome, botao.dataset.acao === "aumentar" ? 1 : -1);
      renderizarCarrinho();
    });
  }

  const limpar = $("#carrinho-limpar");
  if (limpar) {
    limpar.addEventListener("click", () => {
      carrinho.limpar();
      renderizarCarrinho();
    });
  }

  const finalizar = $("#carrinho-finalizar");
  if (finalizar) finalizar.addEventListener("click", finalizarPedido);

  // Abrir/fechar painel
  const painel = $("#carrinho-painel");
  const abrir = $("#carrinho-abrir");
  const fechar = $("#carrinho-fechar");
  if (painel && abrir) abrir.addEventListener("click", () => painel.classList.add("aberto"));
  if (painel && fechar) fechar.addEventListener("click", () => painel.classList.remove("aberto"));
}

/* ==========================================================================
   5. FORMULÁRIO DE CONTATO
   ========================================================================== */
function iniciarFormularioContato() {
  const form = $("#form-contato");
  if (!form) return;

  const retorno = $("#form-mensagem");

  const mostrar = (texto, tipo) => {
    if (!retorno) {
      alert(texto);
      return;
    }
    retorno.textContent = texto;
    retorno.classList.remove("erro", "sucesso");
    retorno.classList.add(tipo);
  };

  const emailValido = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const nome = form.elements["nome"]?.value.trim() ?? "";
    const email = form.elements["email"]?.value.trim() ?? "";
    const mensagem = form.elements["mensagem"]?.value.trim() ?? "";

    if (nome.length < 3) {
      mostrar("Por favor, digite seu nome (mínimo 3 letras).", "erro");
      form.elements["nome"]?.focus();
      return;
    }
    if (!emailValido(email)) {
      mostrar("Digite um e-mail válido, como nome@exemplo.com.", "erro");
      form.elements["email"]?.focus();
      return;
    }
    if (mensagem.length < 10) {
      mostrar("Sua mensagem precisa ter pelo menos 10 caracteres.", "erro");
      form.elements["mensagem"]?.focus();
      return;
    }

    // Site sem back-end: apenas simulamos o envio
    mostrar(`Obrigado, ${nome}! Recebemos sua mensagem e responderemos em breve. 🥐`, "sucesso");
    form.reset();
  });
}

/* ==========================================================================
   6. ANIMAÇÃO AO ROLAR (.revelar)
   ========================================================================== */
function iniciarAnimacaoRevelar() {
  const elementos = $$(".revelar");
  if (!elementos.length) return;

  // Navegadores antigos: mostra tudo de uma vez
  if (!("IntersectionObserver" in window)) {
    elementos.forEach((el) => el.classList.add("visivel"));
    return;
  }

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  elementos.forEach((el) => observador.observe(el));
}

/* ==========================================================================
   Ano automático no rodapé
   ========================================================================== */
function iniciarAnoRodape() {
  const ano = $("#ano");
  if (ano) ano.textContent = new Date().getFullYear();
}

/* ==========================================================================
   INICIALIZAÇÃO
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  iniciarMenuMobile();
  iniciarEventosDeRolagem();
  iniciarRolagemSuave();
  iniciarFiltroCardapio();
  iniciarCarrinho();
  iniciarFormularioContato();
  iniciarAnimacaoRevelar();
  iniciarAnoRodape();
});