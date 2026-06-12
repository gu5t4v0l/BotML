let nome = document.getElementById("nome");
let preco = document.getElementById("preco");
let url_image = document.getElementById("url_image");
let link = document.getElementById("link");

function cadastrarProduto() {
  const produto = {
    nome: nome.value,
    preco: parseFloat(preco.value),
    url_image: url_image.value,
    link: link.value
  };

  // O fetch precisa estar DENTRO da função
  fetch("/produtos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(produto)
  })
    .then(response => response.json())
    .then(data => {
      Swal.fire({
        icon: 'success',
        title: 'Produto cadastrado',
        text: `O produto "${data.nome}" foi cadastrado com sucesso!`,
      });
    })
    .catch(error => {
      Swal.fire({
        icon: 'error',
        title: 'Erro ao cadastrar produto',
        text: 'Ocorreu um erro ao tentar cadastrar o produto. Por favor, tente novamente.',
      });
    });
}

function buscarProdutos(){
  fetch("/produtos")
    .then(response => response.json())
    .then(data => {
      const listaProdutos = document.getElementById("lista-produtos");
      listaProdutos.innerHTML = ""; // Limpa a lista antes de adicionar os produtos
      data.forEach(produto => {
        const item = document.createElement("div");
        item.innerHTML = `
          <h3>${produto.nome}</h3>
          <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
          <img src="${produto.url_image}" alt="${produto.nome}" style="max-width: 100px;">
          <a href="${produto.link}" target="_blank">Ver mais</a>
        `;
        listaProdutos.appendChild(item);
      });
    })
    .catch(error => {
      Swal.fire({
        icon: 'error',
        title: 'Erro ao buscar produtos',
        text: 'Ocorreu um erro ao tentar buscar os produtos. Por favor, tente novamente.',
      });
    })
}