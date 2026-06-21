const precoInput = document.getElementById('preco');

let produtos = [];      // todos os produtos carregados do servidor
let editandoId = null;  // id do produto em edição (null = cadastrando novo)

precoInput.addEventListener('input', function (e) {
  let v = e.target.value.replace(/\D/g, '');
  if (!v) { e.target.value = ''; return; }
  let num = parseInt(v, 10) / 100;
  e.target.value = 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

function getPrecoValue() {
  let v = precoInput.value.replace(/[^\d,]/g, '').replace(',', '.');
  return parseFloat(v) || 0;
}

function setPrecoValue(valor) {
  const num = parseFloat(valor) || 0;
  precoInput.value = num ? 'R$ ' + num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

function limparForm() {
  ['nome', 'preco', 'url_image', 'link'].forEach(id => {
    document.getElementById(id).value = '';
  });
  editandoId = null;
  document.getElementById('btn-cadastrar-label').textContent = 'Cadastrar produto';
}

function editarProduto(id) {
  const p = produtos.find(x => x.id === id);
  if (!p) return;
  document.getElementById('nome').value = p.nome || '';
  setPrecoValue(p.preco);
  document.getElementById('url_image').value = p.url_image || '';
  document.getElementById('link').value = p.linkvenda || '';
  editandoId = id;
  document.getElementById('btn-cadastrar-label').textContent = 'Salvar alterações';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function cadastrarProduto() {
  const nome = document.getElementById('nome').value.trim();
  const preco = getPrecoValue();
  const url_image = document.getElementById('url_image').value.trim();
  const link = document.getElementById('link').value.trim();

  if (!nome || !preco || !link) {
    showToast('Preencha nome, preço e link.', 'error');
    return;
  }

  const loading = document.getElementById('loading-cadastrar');
  loading.classList.add('show');

  const editando = editandoId !== null;
  const url = editando ? `/produtos/${editandoId}` : '/produtos';
  const method = editando ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, url_image, linkvenda: link })
    });

    const data = await res.json();

    if (res.ok) {
      const msg = editando
        ? `"${data.nome || nome}" atualizado com sucesso!`
        : `"${data.nome || nome}" cadastrado com sucesso!`;
      showToast(msg, 'success');
      limparForm();
      buscarProdutos();
    } else {
      showToast(data.error || 'Erro ao salvar produto.', 'error');
    }
  } catch (e) {
    showToast('Erro de conexão com o servidor.', 'error');
  } finally {
    loading.classList.remove('show');
  }
}

function renderProdutos(lista) {
  const el = document.getElementById('lista-produtos');

  if (!lista.length) {
    el.innerHTML = '<div class="empty">Nenhum produto encontrado.</div>';
    return;
  }

  el.innerHTML = lista.map(p => {
    const preco = parseFloat(p.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const imgHtml = p.url_image
      ? `<img class="product-img" src="${p.url_image}" alt="${p.nome}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
      : '';
    const placeholderStyle = p.url_image ? 'style="display:none"' : '';
    return `
      <div class="product-item">
        ${imgHtml}
        <div class="product-img-placeholder" ${placeholderStyle}>
          <i class="ti ti-photo" aria-hidden="true"></i>
        </div>
        <div style="min-width:0">
          <p class="product-name">${p.nome}</p>
          <span class="product-price">${preco}</span>
        </div>
        <div class="product-actions">
          <button class="icon-btn" onclick="editarProduto(${p.id})" title="Editar">
            <i class="ti ti-pencil" aria-hidden="true"></i>
          </button>
          <a class="product-link" href="${p.linkvenda}" target="_blank" title="Abrir link">
            <i class="ti ti-external-link" aria-hidden="true"></i>
          </a>
        </div>
      </div>`;
  }).join('');
}

function filtrarProdutos() {
  const termo = document.getElementById('busca').value.trim().toLowerCase();
  const lista = termo
    ? produtos.filter(p => (p.nome || '').toLowerCase().includes(termo))
    : produtos;
  renderProdutos(lista);
}

async function buscarProdutos() {
  try {
    const res = await fetch('/produtos');
    const data = await res.json();
    produtos = Array.isArray(data) ? data : [];

    const badge = document.getElementById('count-badge');
    badge.textContent = produtos.length + ' produto' + (produtos.length !== 1 ? 's' : '');

    filtrarProdutos();
  } catch (e) {
    showToast('Erro ao buscar produtos.', 'error');
  }
}

buscarProdutos();
