
const CHAVE_PRODUTOS = "hospital_almox_produtos";
const CHAVE_MOVIMENTOS = "hospital_almox_movimentos";

let produtos = JSON.parse(localStorage.getItem(CHAVE_PRODUTOS) || "[]");
let movimentacoes = JSON.parse(localStorage.getItem(CHAVE_MOVIMENTOS) || "[]");

const formProduto = document.getElementById("formProduto");
const formMovimentacao = document.getElementById("formMovimentacao");

function salvarDados() {
    localStorage.setItem(CHAVE_PRODUTOS, JSON.stringify(produtos));
    localStorage.setItem(CHAVE_MOVIMENTOS, JSON.stringify(movimentacoes));
}

function atualizarDashboard() {
    document.getElementById("totalProdutos").textContent = produtos.length;

    document.getElementById("totalItens").textContent =
        produtos.reduce((total, produto) => total + produto.quantidade, 0);

    document.getElementById("estoqueBaixo").textContent =
        produtos.filter(produto =>
            produto.quantidade <= produto.minimo
        ).length;

    document.getElementById("totalMovimentacoes").textContent =
        movimentacoes.length;
}

function renderizarProdutos() {
    const lista = document.getElementById("listaProdutos");
    const pesquisa = document.getElementById("pesquisa").value.toLowerCase();

    lista.innerHTML = "";

    produtos
        .filter(produto =>
            produto.nome.toLowerCase().includes(pesquisa) ||
            produto.codigo.toLowerCase().includes(pesquisa) ||
            produto.categoria.toLowerCase().includes(pesquisa)
        )
        .forEach(produto => {

            let status = "Em estoque";
            let classe = "status-ok";

            if (produto.quantidade === 0) {
                status = "Sem estoque";
                classe = "status-zero";
            } else if (produto.quantidade <= produto.minimo) {
                status = "Estoque baixo";
                classe = "status-baixo";
            }

            const linha = document.createElement("tr");

            const valores = [
                produto.nome,
                produto.codigo,
                produto.categoria,
                `${produto.quantidade} ${produto.unidade}`,
                produto.minimo,
                status
            ];

            valores.forEach((valor, indice) => {
                const td = document.createElement("td");

                if (indice === 5) {
                    const span = document.createElement("span");
                    span.className = classe;
                    span.textContent = valor;
                    td.appendChild(span);
                } else {
                    td.textContent = valor;
                }

                linha.appendChild(td);
            });

            const acoes = document.createElement("td");
            acoes.className = "acoes";

            const editar = document.createElement("button");
            editar.textContent = "Editar";
            editar.className = "btn-editar";
            editar.type = "button";
            editar.addEventListener("click", () => editarProduto(produto.id));

            const excluir = document.createElement("button");
            excluir.textContent = "Excluir";
            excluir.className = "btn-excluir";
            excluir.type = "button";
            excluir.addEventListener("click", () => excluirProduto(produto.id));

            acoes.append(editar, excluir);
            linha.appendChild(acoes);

            lista.appendChild(linha);
        });

    atualizarSelectProdutos();
    atualizarDashboard();
}

function atualizarSelectProdutos() {
    const select = document.getElementById("produtoMovimento");
    const selecionado = select.value;

    select.innerHTML = '<option value="">Selecione um produto</option>';

    produtos.forEach(produto => {
        const option = document.createElement("option");
        option.value = produto.id;
        option.textContent = `${produto.nome} (${produto.quantidade} ${produto.unidade})`;
        select.appendChild(option);
    });

    if (produtos.some(p => p.id === selecionado)) {
        select.value = selecionado;
    }
}

formProduto.addEventListener("submit", function(event) {
    event.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const codigo = document.getElementById("codigo").value.trim();
    const categoria = document.getElementById("categoria").value;
    const unidade = document.getElementById("unidade").value.trim();
    const quantidade = Number(document.getElementById("quantidade").value);
    const minimo = Number(document.getElementById("minimo").value);

    if (!nome || !codigo || !categoria || !unidade ||
        !Number.isInteger(quantidade) || quantidade < 0 ||
        !Number.isInteger(minimo) || minimo < 0) {
        alert("Preencha os campos corretamente.");
        return;
    }

    if (produtos.some(p => p.codigo.toLowerCase() === codigo.toLowerCase())) {
        alert("Já existe um produto com esse código.");
        return;
    }

    const produto = {
        id: String(Date.now()) + Math.random().toString(16).slice(2),
        nome,
        codigo,
        categoria,
        unidade,
        quantidade,
        minimo
    };

    produtos.push(produto);

    if (quantidade > 0) {
        movimentacoes.unshift({
            data: new Date().toLocaleString("pt-BR"),
            produto: nome,
            tipo: "Entrada inicial",
            quantidade,
            responsavel: "Cadastro inicial",
            observacao: "Estoque inicial cadastrado"
        });
    }

    salvarDados();
    renderizarProdutos();
    renderizarHistorico();

    formProduto.reset();

    alert("Material cadastrado com sucesso!");
});

formMovimentacao.addEventListener("submit", function(event) {
    event.preventDefault();

    const id = document.getElementById("produtoMovimento").value;
    const tipo = document.getElementById("tipoMovimento").value;
    const quantidade = Number(document.getElementById("quantidadeMovimento").value);
    const responsavel = document.getElementById("responsavel").value.trim();
    const observacao = document.getElementById("observacao").value.trim();

    const produto = produtos.find(p => p.id === id);

    if (!produto || !Number.isInteger(quantidade) ||
        quantidade <= 0 || !responsavel) {
        alert("Preencha os dados da movimentação corretamente.");
        return;
    }

    if (tipo === "Saída" && quantidade > produto.quantidade) {
        alert("Estoque insuficiente para realizar essa saída.");
        return;
    }

    if (tipo === "Entrada") {
        produto.quantidade += quantidade;
    } else if (tipo === "Saída") {
        produto.quantidade -= quantidade;
    } else {
        alert("Selecione o tipo de movimentação.");
        return;
    }

    movimentacoes.unshift({
        data: new Date().toLocaleString("pt-BR"),
        produto: produto.nome,
        tipo,
        quantidade,
        responsavel,
        observacao
    });

    salvarDados();
    renderizarProdutos();
    renderizarHistorico();

    formMovimentacao.reset();

    alert("Movimentação registrada com sucesso!");
});

function editarProduto(id) {
    const produto = produtos.find(p => p.id === id);

    if (!produto) return;

    const novoNome = prompt("Nome do produto:", produto.nome);
    if (novoNome === null) return;

    const novoCodigo = prompt("Código:", produto.codigo);
    if (novoCodigo === null) return;

    const novaCategoria = prompt("Categoria:", produto.categoria);
    if (novaCategoria === null) return;

    const novaUnidade = prompt("Unidade:", produto.unidade);
    if (novaUnidade === null) return;

    const novoMinimo = prompt("Estoque mínimo:", produto.minimo);
    if (novoMinimo === null) return;

    const minimo = Number(novoMinimo);

    if (!novoNome.trim() || !novoCodigo.trim() ||
        !novaCategoria.trim() || !novaUnidade.trim() ||
        !Number.isInteger(minimo) || minimo < 0) {
        alert("Dados inválidos.");
        return;
    }

    const codigoDuplicado = produtos.some(p =>
        p.id !== id && p.codigo.toLowerCase() === novoCodigo.trim().toLowerCase()
    );

    if (codigoDuplicado) {
        alert("Já existe outro produto com esse código.");
        return;
    }

    produto.nome = novoNome.trim();
    produto.codigo = novoCodigo.trim();
    produto.categoria = novaCategoria.trim();
    produto.unidade = novaUnidade.trim();
    produto.minimo = minimo;

    salvarDados();
    renderizarProdutos();

    alert("Produto atualizado!");
}

function excluirProduto(id) {
    const produto = produtos.find(p => p.id === id);

    if (!produto) return;

    if (produto.quantidade > 0) {
        alert("Não é possível excluir um produto com estoque disponível. Registre a saída ou ajuste o estoque primeiro.");
        return;
    }

    if (!confirm(`Deseja excluir o produto ${produto.nome}?`)) return;

    produtos = produtos.filter(p => p.id !== id);

    salvarDados();
    renderizarProdutos();

    alert("Produto excluído!");
}

function renderizarHistorico() {
    const tabela = document.getElementById("historico");

    tabela.innerHTML = "";

    movimentacoes.forEach(movimento => {
        const linha = document.createElement("tr");

        [
            movimento.data,
            movimento.produto,
            movimento.tipo,
            movimento.quantidade,
            movimento.responsavel,
            movimento.observacao || "-"
        ].forEach(valor => {
            const td = document.createElement("td");
            td.textContent = valor;
            linha.appendChild(td);
        });

        tabela.appendChild(linha);
    });
}

document.getElementById("pesquisa").addEventListener("input", renderizarProdutos);

renderizarProdutos();
renderizarHistorico();
