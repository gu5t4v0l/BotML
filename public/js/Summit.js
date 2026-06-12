const precoInput = document.getElementById('preco');

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

  try {
    const res = await fetch('/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, preco, url_image, linkvenda: link })
    });

    const data = await res.json();

    if (res.ok) {
      showToast(`"${data.nome || nome}" cadastrado com sucesso!`, 'success');
      limparForm();
      buscarProdutos();
    } else {
      showToast(data.error || 'Erro ao cadastrar produto.', 'error');
    }
  } catch (e) {
    showToast('Erro de conexão com o servidor.', 'error');
  } finally {
    loading.classList.remove('show');
  }
}

async function buscarProdutos() {
  try {
    const res = await fetch('/produtos');
    const data = await res.json();
    const lista = document.getElementById('lista-produtos');
    const badge = document.getElementById('count-badge');

    badge.textContent = data.length + ' produto' + (data.length !== 1 ? 's' : '');

    if (!data.length) {
      lista.innerHTML = '<div class="empty">Nenhum produto cadastrado ainda.</div>';
      return;
    }

    lista.innerHTML = data.map(p => {
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
          <a class="product-link" href="${p.linkvenda}" target="_blank">
            <i class="ti ti-external-link" aria-hidden="true"></i>
          </a>
        </div>`;
    }).join('');
  } catch (e) {
    showToast('Erro ao buscar produtos.', 'error');
  }
}

buscarProdutos();