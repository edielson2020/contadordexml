let notasHTML = '', cfopHTML = '';
let totalNotas = 0, totalImpostos = 0;

//Função global para impressão (sem nova janela, mantendo layout)
function gerarImpressao() {
  const dataHora = new Date().toLocaleString();
  const conteudo = `
    <html>
    <head>
      <title>Relatório de Notas</title>
      <style>
        @page {
          margin: 1cm;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: #000;
          margin: 0;
          padding: 0;
        }
        .header {
          margin-bottom: 5px;
        }
        .logo {
          width: 120px;
          margin-bottom: 5px;
        }
        h2, h4 {
          margin: 6px 0;
          font-weight: bold;
        }
        .section {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          page-break-inside: auto;
          font-size: 9px;
        }
        thead {
          display: table-header-group;
        }
        tfoot {
          display: table-footer-group;
        }
        tr {
          page-break-after: auto;
        }
        th, td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: left;
          vertical-align: top;
        }
        .assinatura {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .assinatura div {
          width: 45%;
          border-top: 1px solid #000;
          text-align: center;
          font-size: 9px;
          padding-top: 5px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 8px;
          color: #555;
          page-break-inside: avoid;
        }
      </style>
    </head>
    <body>
      <div class="header text-center">
        <img src="img/logo.png" class="logo" alt="Logo">
        <h2>Relatório de Notas Fiscais</h2>
        <p><em>Gerado em: ${dataHora}</em></p>
      </div>

      <div class="section">
        <h4>Notas Fiscais</h4>
        <table>
          <thead>
            <tr>
              <th>Nº NOTA</th>
              <th>EMISSÃO</th>
              <th>NOME CLIENTE</th>
              <th>CPF/CNPJ</th>
              <th>VL. TOTAL</th>
              <th>VL. ICMS</th>
              <th>NAT OP</th>
              <th>SITUAÇÃO</th>
            </tr>
          </thead>
          <tbody>${notasHTML}</tbody>
          <tfoot>
            <tr>
              <td colspan="4"><strong>Total Geral</strong></td>
              <td><strong>R$ ${totalNotas.toFixed(2)}</strong></td>
              <td><strong>R$ ${totalImpostos.toFixed(2)}</strong></td>
              <td colspan="2">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="section">
        <h4>Totais por CFOP</h4>
        <table>
          <thead>
            <tr>
              <th>CFOP</th>
              <th>Total de Notas</th>
              <th>Total de ICMS</th>
            </tr>
          </thead>
          <tbody>${cfopHTML}</tbody>
        </table>
      </div>

      <div class="assinatura">
        <div>Assinatura do Responsável</div>
        <div>Assinatura da Conferência</div>
      </div>

      <div class="footer">
        Sistema Gerador de Relatórios | Emitido automaticamente em ${dataHora}
      </div>
    </body>
    </html>
  `;

  const janela = window.open('', '', 'width=800,height=600');
  janela.document.write(conteudo);
  janela.document.close();
  janela.focus();
  setTimeout(() => {
    janela.print();
    janela.close();
  }, 500);
}


document.addEventListener('DOMContentLoaded', function () {
  const inputXML = document.getElementById('inputXML');
  const tabelaNotas = document.getElementById('tabelaNotas');
  const tabelaCFOP = document.getElementById('tabelaCFOP');
  const botaoImprimir = document.getElementById('btnImprimir');

  botaoImprimir.disabled = true;

  inputXML.addEventListener('change', async function(event) {
    const arquivos = event.target.files;

    // Limpa dados anteriores
    tabelaNotas.innerHTML = '';
    tabelaCFOP.innerHTML = '';
    notasHTML = '';
    cfopHTML = '';
    totalNotas = 0;
    totalImpostos = 0;

    if (!arquivos.length) {
      botaoImprimir.disabled = true;
      return;
    } else {
      botaoImprimir.disabled = false;
    }

    const cfopMap = {};

    for (const arquivo of arquivos) {
      try {
        const texto = await arquivo.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(texto, 'text/xml');

        const valorTotal = parseFloat(xml.querySelector('ICMSTot > vNF')?.textContent || '0.00');
        const cfop = xml.querySelector('det > prod > CFOP')?.textContent || '';
        const icms = parseFloat(xml.querySelector('ICMSTot > vICMS')?.textContent || '0.00');
        const numeroNota = xml.querySelector('ide > nNF')?.textContent || '';
        const dataEmissao = xml.querySelector('ide > dhEmi')?.textContent || '';
        const nomeCliente = xml.querySelector('dest > xNome')?.textContent || 'Consumidor';
        const cpfCnpj = xml.querySelector('dest > CNPJ')?.textContent || xml.querySelector('dest > CPF')?.textContent || 'Sem CPF';
        const natOp = xml.querySelector('ide > natOp')?.textContent || '';
        const situacao = xml.querySelector('ide > tpNF')?.textContent === '0' ? 'Entrada' : 'Saída';

        totalNotas += valorTotal;
        totalImpostos += icms;

        const linhaNota = `
          <tr>
            <td>${numeroNota}</td>
            <td>${new Date(dataEmissao).toLocaleDateString()}</td>
            <td>${nomeCliente}</td>
            <td>${cpfCnpj}</td>
            <td>R$ ${valorTotal.toFixed(2)}</td>
            <td>R$ ${icms.toFixed(2)}</td>
            <td>${natOp}</td>
            <td>${situacao}</td>
          </tr>`;
        tabelaNotas.innerHTML += linhaNota;
        notasHTML += linhaNota;

        if (!cfopMap[cfop]) {
          cfopMap[cfop] = { valor: 0, icms: 0 };
        }
        cfopMap[cfop].valor += valorTotal;
        cfopMap[cfop].icms += icms;
      } catch (e) {
        console.error(`Erro ao processar o arquivo ${arquivo.name}:`, e);
      }
    }

    document.getElementById('totalValor').textContent = `R$ ${totalNotas.toFixed(2)}`;
    document.getElementById('totalICMS').textContent = `R$ ${totalImpostos.toFixed(2)}`;

    for (const cfop in cfopMap) {
      const linhaCFOP = `
        <tr>
          <td>${cfop}</td>
          <td>R$ ${cfopMap[cfop].valor.toFixed(2)}</td>
          <td>R$ ${cfopMap[cfop].icms.toFixed(2)}</td>
        </tr>`;
      tabelaCFOP.innerHTML += linhaCFOP;
      cfopHTML += linhaCFOP;
    }
  });
});
